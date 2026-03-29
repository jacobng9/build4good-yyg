"""
NotesViz — Backend API
FastAPI server with endpoints for note parsing, concept extraction, and image generation.
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
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─── Load environment variables ──────────────────────────────────────────────

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
IMAGE_API = os.getenv("IMAGE_API", "pollinations")
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY", "")

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

CONCEPT_EXTRACTION_PROMPT = """You are an expert educator. Given the following notes, extract all key concepts.
Return ONLY valid JSON in this format (no markdown code fences, just raw JSON):
{{
  "concepts": [
    {{ "id": "c1", "name": "Concept Name", "definition": "Clear 1-2 sentence definition", "related_to": ["c2"] }}
  ]
}}

Rules:
- Extract between 4 and 10 key concepts
- Each concept should have a clear, concise definition
- Use related_to to show connections between concepts (reference other concept IDs)
- IDs should be c1, c2, c3, etc.

Notes:
{raw_text}"""

IMAGE_PROMPT_GENERATION = """Convert this concept into a vivid, metaphorical image generation prompt.
The image should be illustrative and help a student intuitively understand the concept.
Avoid text, charts, or diagrams. Think editorial illustration or conceptual art.
Use vivid colors, interesting compositions, and creative metaphors.
Concept: {name} — {definition}
Return only the image prompt, nothing else."""


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
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    # Determine mime type
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
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = CONCEPT_EXTRACTION_PROMPT.format(raw_text=raw_text)

    response = model.generate_content(prompt)
    response_text = response.text.strip()

    # Strip markdown code fences if present
    if response_text.startswith("```"):
        response_text = re.sub(r"^```(?:json)?\s*\n?", "", response_text)
        response_text = re.sub(r"\n?```\s*$", "", response_text)

    data = json.loads(response_text)
    return data.get("concepts", [])


def generate_image_prompt_with_gemini(name: str, definition: str) -> str:
    """Use Gemini to create a vivid image generation prompt for a concept."""
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = IMAGE_PROMPT_GENERATION.format(name=name, definition=definition)
    response = model.generate_content(prompt)
    return response.text.strip()


def get_pollinations_url(prompt: str, width: int = 1024, height: int = 1024) -> str:
    """Generate an image URL using Pollinations.ai (no API key needed)."""
    encoded = quote(prompt)
    return f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&nologo=true"


# ─── Endpoints ───────────────────────────────────────────────────────────────


@app.get("/")
async def root():
    return {"message": "NotesViz API is running", "gemini_configured": bool(GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here")}


@app.post("/api/parse")
async def parse_notes(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
):
    """
    Accept a file upload (PDF, image, docx) or plain text paste.
    Returns the extracted raw text and a session ID.
    """
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
                # Fallback: try Gemini Vision on the PDF rendered as image
                raise HTTPException(status_code=500, detail=f"PDF parsing failed: {str(e)}")

        elif filename.lower().endswith((".png", ".jpg", ".jpeg")):
            try:
                raw_text = parse_image_with_gemini(content, filename)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Image transcription failed: {str(e)}")

        elif filename.lower().endswith(".txt"):
            raw_text = content.decode("utf-8")

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {filename}. Supported: PDF, PNG, JPG, TXT",
            )

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the input.")

    sessions[session_id] = {
        "raw_text": raw_text,
        "concepts": [],
    }

    return {"session_id": session_id, "raw_text": raw_text}


@app.post("/api/extract", response_model=ExtractResponse)
async def extract_concepts(session_id: str = Form(...)):
    """
    Send session text to Gemini, get concepts + relationships JSON.
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        raise HTTPException(status_code=500, detail="Gemini API key not configured. Set GEMINI_API_KEY in backend/.env")

    raw_text = sessions[session_id]["raw_text"]

    try:
        concept_dicts = extract_concepts_with_gemini(raw_text)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse Gemini response as JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Concept extraction failed: {str(e)}")

    concepts = [
        Concept(
            id=c.get("id", f"c{i+1}"),
            name=c.get("name", "Unknown"),
            definition=c.get("definition", ""),
            related_to=c.get("related_to", []),
        )
        for i, c in enumerate(concept_dicts)
    ]

    sessions[session_id]["concepts"] = concepts
    return ExtractResponse(session_id=session_id, concepts=concepts)


@app.post("/api/generate", response_model=GenerateResponse)
async def generate_images(session_id: str = Form(...)):
    """
    For each concept, generate an image prompt via Gemini, then get image URL from Pollinations.ai.
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    concepts: list[Concept] = sessions[session_id].get("concepts", [])
    if not concepts:
        raise HTTPException(status_code=400, detail="No concepts found. Run /api/extract first.")

    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        raise HTTPException(status_code=500, detail="Gemini API key not configured. Set GEMINI_API_KEY in backend/.env")

    updated_concepts = []
    for concept in concepts:
        try:
            concept.status = "generating"

            # Generate image prompt via Gemini
            image_prompt = generate_image_prompt_with_gemini(concept.name, concept.definition)
            concept.image_prompt = image_prompt

            # Get image URL from Pollinations.ai
            concept.image_url = get_pollinations_url(image_prompt)
            concept.status = "done"

        except Exception as e:
            concept.status = "error"
            concept.image_prompt = f"Error: {str(e)}"

        updated_concepts.append(concept)

    sessions[session_id]["concepts"] = updated_concepts
    return GenerateResponse(session_id=session_id, concepts=updated_concepts)


@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    """Poll generation progress for a given session/job."""
    if job_id not in sessions:
        raise HTTPException(status_code=404, detail="Job not found.")

    concepts = sessions[job_id].get("concepts", [])
    total = len(concepts)
    done = sum(1 for c in concepts if c.status == "done" if isinstance(c, Concept))

    return {
        "job_id": job_id,
        "total": total,
        "done": done,
        "status": "complete" if done == total and total > 0 else "in_progress",
    }


@app.post("/api/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    """Follow-up Q&A on a specific concept (stretch goal)."""
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        raise HTTPException(status_code=500, detail="Gemini API key not configured.")

    session = sessions[request.session_id]
    concepts = session.get("concepts", [])
    concept = next((c for c in concepts if c.id == request.concept_id), None)

    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found.")

    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = f"""You are a helpful tutor. A student is studying and has a question about a specific concept from their notes.

Context (original notes excerpt):
{session['raw_text'][:2000]}

Concept: {concept.name} — {concept.definition}

Student's question: {request.question}

Give a clear, helpful answer in 2-3 sentences."""

    try:
        response = model.generate_content(prompt)
        return AskResponse(answer=response.text.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Q&A failed: {str(e)}")


# ─── Run ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
