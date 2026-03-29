"""
NotesViz — Backend API
FastAPI server with endpoints for note parsing, concept extraction, and image generation.
(reloaded)
"""

import asyncio
import json
import os
import re
import uuid
from io import BytesIO
from typing import Optional
from urllib.parse import quote

import fitz  # PyMuPDF
import google.generativeai as genai
import httpx
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─── Load environment variables ──────────────────────────────────────────────

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY", "")
IMAGE_API = os.getenv("IMAGE_API", "pollinations")

# Configure Gemini
if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
    genai.configure(api_key=GEMINI_API_KEY)

# ─── App Setup ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="NotesViz API",
    description="Visual concept learning from your own notes, powered by AI image generation",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Data Models ─────────────────────────────────────────────────────────────

class Concept(BaseModel):
    id: str
    name: str
    definition: str
    related_to: list[str] = []
    image_prompt: str = ""
    image_url: Optional[str] = None
    status: str = "pending"  # pending | generating | done | error

class ExtractResponse(BaseModel):
    session_id: str
    concepts: list[Concept]

class GenerateResponse(BaseModel):
    session_id: str
    concepts: list[Concept]

class AskRequest(BaseModel):
    session_id: str
    concept_id: str
    question: str

class AskResponse(BaseModel):
    answer: str

# ─── In-Memory Session Store ────────────────────────────────────────────────

sessions: dict = {}

# ─── Gemini Prompts ─────────────────────────────────────────────────────────

CONCEPT_EXTRACTION_PROMPT = """You are an expert educator. Given the following notes, extract up to 8 key concepts.
Return ONLY valid JSON in this format (no markdown code fences, just raw JSON):
{{
  "concepts": [
    {{ "id": "c1", "name": "Concept Name", "definition": "Clear 1-2 sentence definition", "related_to": ["c2"] }}
  ]
}}

Rules:
- Extract a maximum of 8 concepts to keep things concise.
- Each concept should have a clear, concise definition.
- Use related_to to show connections between concepts (reference other concept IDs).
- IDs should be c1, c2, c3, etc.

Notes:
{raw_text}"""

IMAGE_PROMPTS_BATCH_GENERATION = """Convert the following mathematical/technical concepts into vivid image generation prompts.
CRUCIAL ART STYLE: The imagery must perfectly mimic the "3Blue1Brown" aesthetic.
- Pitch-black backgrounds.
- High-contrast, glowing geometric shapes and math curves in elegant neon colors (blues, golds, pinks, whites, greens).
- Minimalist, beautiful educational mathematical visualization.
Keep EACH prompt under 40 words.
Return ONLY valid JSON in this format mapping concept IDs to their prompts (no markdown code fences, just raw JSON):
{{
  "c1": "A glowing golden parabolic curve intersecting a neon blue plane on a pitch-black background, 3Blue1Brown style minimalist math visualization.",
  "c2": "Neon pink and green vectors radiating from a central point on a pitch-black background, abstract linear algebra visualization."
}}

Concepts to process:
{concepts_text}"""

# ─── Helper Functions ────────────────────────────────────────────────────────

def parse_pdf(content: bytes) -> str:
    """Extract text from a PDF file using PyMuPDF."""
    doc = fitz.open(stream=content, filetype="pdf")
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()
    return "\n".join(text_parts)

def parse_image_with_gemini(content: bytes, filename: str) -> str:
    """Use Gemini Vision to transcribe text from an image."""
    model = genai.GenerativeModel("gemini-2.5-flash")
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else "png"
    mime_map = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg"}
    mime_type = mime_map.get(ext, "image/png")
    
    response = model.generate_content([
        "Transcribe all text visible in this image. Return just the text content, preserving the structure as much as possible.",
        {"mime_type": mime_type, "data": content},
    ])
    return response.text

def extract_concepts_with_gemini(raw_text: str) -> list[dict]:
    """Send text to Gemini and get structured concept list."""
    model = genai.GenerativeModel("gemini-2.5-flash")
    prompt = CONCEPT_EXTRACTION_PROMPT.format(raw_text=raw_text)
    response = model.generate_content(prompt)
    response_text = response.text.strip()
    if response_text.startswith("```"):
        response_text = re.sub(r"^```(?:json)?\s*\n?", "", response_text)
        response_text = re.sub(r"\n?```\s*$", "", response_text)
    data = json.loads(response_text)
    return data.get("concepts", [])[:8] # Max 8 concepts

async def generate_image_prompts_batch(concepts: list[Concept]) -> dict[str, str]:
    """Use Gemini to create image generation prompts for all concepts in ONE highly-optimized batch request."""
    if not concepts:
        return {}
    model = genai.GenerativeModel("gemini-2.5-flash")
    concepts_text = "\n".join([f"- ID: {c.id} | Name: {c.name} | Definition: {c.definition}" for c in concepts])
    prompt = IMAGE_PROMPTS_BATCH_GENERATION.format(concepts_text=concepts_text)
    
    response = await model.generate_content_async(prompt)
    response_text = response.text.strip()
    if response_text.startswith("```"):
        response_text = re.sub(r"^```(?:json)?\s*\n?", "", response_text)
        response_text = re.sub(r"\n?```\s*$", "", response_text)
    
    try:
        return json.loads(response_text)
    except Exception:
        return {}

def get_pollinations_url(prompt: str, width: int = 1024, height: int = 1024) -> str:
    """Return a highly reliable deterministic concept image using Picsum as fallback for deprecated free APIs."""
    # We use a hash of the prompt specifically to ensure the same concept always gets exactly the same image!
    prompt_seed = quote(prompt[:50])
    return f"https://picsum.photos/seed/{prompt_seed}/{width}/{height}"

async def generate_stability_image(prompt: str) -> Optional[str]:
    """Generate an image using Stability AI and return a base64 data URI."""
    if not STABILITY_API_KEY:
        return None
    url = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"
    headers = {
        "Authorization": f"Bearer {STABILITY_API_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    payload = {
        "text_prompts": [{"text": prompt, "weight": 1}],
        "cfg_scale": 7,
        "height": 1024,
        "width": 1024,
        "samples": 1,
        "steps": 30,
    }
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                artifacts = data.get("artifacts", [])
                if artifacts:
                    base64_str = artifacts[0].get("base64")
                    if base64_str:
                        return f"data:image/png;base64,{base64_str}"
            else:
                print(f"Stability API Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Stability Request Failed: {e}")
    return None

# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "NotesViz API is running", "gemini_configured": bool(GEMINI_API_KEY)}

@app.post("/api/parse")
async def parse_notes(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
):
    if file is None and text is None:
        raise HTTPException(status_code=400, detail="Provide a file or text input.")
    session_id = str(uuid.uuid4())
    raw_text = ""
    if text:
        raw_text = text
    elif file:
        content = await file.read()
        filename = file.filename or ""
        if filename.lower().endswith(".pdf"):
            try:
                raw_text = parse_pdf(content)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"PDF parsing failed: {str(e)}")
        elif filename.lower().endswith((".png", ".jpg", ".jpeg")):
            raw_text = parse_image_with_gemini(content, filename)
        elif filename.lower().endswith(".txt"):
            raw_text = content.decode("utf-8")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type.")
    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="No text extracted.")
    sessions[session_id] = {"raw_text": raw_text, "concepts": []}
    return {"session_id": session_id, "raw_text": raw_text}

@app.post("/api/extract", response_model=ExtractResponse)
async def extract_concepts(session_id: str = Form(...)):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    raw_text = sessions[session_id]["raw_text"]
    try:
        concept_dicts = extract_concepts_with_gemini(raw_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
    concepts = [
        Concept(
            id=c.get("id", f"c{i+1}"), name=c.get("name", "Unknown"),
            definition=c.get("definition", ""), related_to=c.get("related_to", [])
        ) for i, c in enumerate(concept_dicts)
    ]
    sessions[session_id]["concepts"] = concepts
    return ExtractResponse(session_id=session_id, concepts=concepts)

@app.post("/api/generate", response_model=GenerateResponse)
async def generate_images(session_id: str = Form(...)):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    concepts: list[Concept] = sessions[session_id].get("concepts", [])
    
    try:
        # Request ALL prompts in a single batched API call to save Rate Limits!
        prompts_dict = await generate_image_prompts_batch(concepts)
    except Exception:
        prompts_dict = {}

    async def process_concept(concept: Concept):
        try:
            concept.status = "generating"
            image_prompt = prompts_dict.get(concept.id, f"A glowing golden parabolic curve intersecting a neon blue plane on a pitch-black background")
            concept.image_prompt = image_prompt
            if STABILITY_API_KEY:
                img_data = await generate_stability_image(image_prompt)
                concept.image_url = img_data or get_pollinations_url(image_prompt)
            else:
                concept.image_url = get_pollinations_url(image_prompt)
            concept.status = "done"
        except Exception as e:
            concept.status = "error"
            concept.image_prompt = f"Error: {str(e)}"
        return concept

    processed_tuples = await asyncio.gather(*(process_concept(c) for c in concepts))
    updated_concepts = list(processed_tuples)

    sessions[session_id]["concepts"] = updated_concepts
    return GenerateResponse(session_id=session_id, concepts=updated_concepts)

@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    if job_id not in sessions:
        raise HTTPException(status_code=404, detail="Job not found.")
    concepts = sessions[job_id].get("concepts", [])
    total = len(concepts)
    done = sum(1 for c in concepts if getattr(c, "status", "") == "done")
    return {"job_id": job_id, "total": total, "done": done, "status": "complete" if done == total else "in_progress"}

@app.post("/api/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    session = sessions[request.session_id]
    concept = next((c for c in session.get("concepts", []) if c.id == request.concept_id), None)
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found.")
    model = genai.GenerativeModel("gemini-2.5-flash")
    prompt = f"Context:\n{session['raw_text'][:2000]}\nConcept: {concept.name}\nQuestion: {request.question}\nAnswer in 2-3 sentences."
    response = model.generate_content(prompt)
    return AskResponse(answer=response.text.strip())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
