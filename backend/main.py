"""
NotesViz — Backend API
FastAPI server with endpoints for note parsing, concept extraction, and image generation.
"""

import asyncio
import json
import os
import re
import uuid
from typing import List, Optional

import requests

import fitz  # PyMuPDF
import base64
from groq import Groq
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─── Load environment variables ──────────────────────────────────────────────

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
POLLINATIONS_API_KEY = os.getenv("POLLINATIONS_API_KEY", "")



# ─── App Setup ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="NotesViz API",
    description="Visual concept learning from your own notes, powered by AI image generation",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Data Models ─────────────────────────────────────────────────────────────


class Concept(BaseModel):
    id: str
    name: str
    definition: str
    related_to: List[str] = []
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None
    status: str = "pending"  # pending | generating | done | error


class ExtractRequest(BaseModel):
    session_id: str
    raw_text: str


class ExtractResponse(BaseModel):
    session_id: str
    concepts: List[Concept]


class GenerateRequest(BaseModel):
    session_id: str
    concepts: List[Concept]


class GenerateResponse(BaseModel):
    session_id: str
    concepts: List[Concept]


class AskRequest(BaseModel):
    session_id: str
    concept_id: str
    question: str
    raw_text: str = ""
    concepts: List[Concept] = []


class AskResponse(BaseModel):
    answer: str


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

IMAGE_PROMPT_GENERATION = """Create a short image generation prompt for this concept.
The image must directly illustrate the concept itself, NOT an abstract metaphor.
For example, if the concept is "Derivative of a Vector Function", show a 3D curve with tangent vectors drawn on it.
If the concept is "Newton's Third Law", show two objects exerting equal and opposite forces on each other.
Keep it concrete, educational, and visually clear. Think textbook illustration style with clean colors.
No text or labels in the image. Keep the prompt under 80 words.
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
    client = Groq(api_key=GROQ_API_KEY)
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else "png"
    mime_map = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg"}
    mime_type = mime_map.get(ext, "image/png")
    
    base64_image = base64.b64encode(content).decode('utf-8')
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Transcribe all text visible in this image. Return just the text content, preserving the structure as much as possible."},
                    {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}}
                ]
            }
        ],
        model="llama-3.2-11b-vision-preview"
    )
    return chat_completion.choices[0].message.content


def extract_concepts_with_gemini(raw_text: str) -> list[dict]:
    """Send text to Gemini and get structured concept list."""
    client = Groq(api_key=GROQ_API_KEY)
    prompt = CONCEPT_EXTRACTION_PROMPT.format(raw_text=raw_text)

    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile"
    )
    response_text = chat_completion.choices[0].message.content.strip()

    # Strip markdown code fences if present
    if response_text.startswith("```"):
        response_text = re.sub(r"^```(?:json)?\s*\n?", "", response_text)
        response_text = re.sub(r"\n?```\s*$", "", response_text)

    # Find JSON boundaries
    start_idx = response_text.find("{")
    end_idx = response_text.rfind("}") + 1
    if start_idx == -1 or end_idx == 0:
        raise ValueError("No JSON object found in Gemini response")

    json_str = response_text[start_idx:end_idx]
    data = json.loads(json_str)
    return data.get("concepts", [])


def generate_image_prompt_with_gemini(name: str, definition: str) -> str:
    """Use Gemini to create a vivid image generation prompt for a concept."""
    client = Groq(api_key=GROQ_API_KEY)
    prompt = IMAGE_PROMPT_GENERATION.format(name=name, definition=definition)
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile"
    )
    return chat_completion.choices[0].message.content.strip()


def generate_pollinations_image(prompt: str, width: int = 512, height: int = 512) -> str:
    """Generate an image URL via Pollinations GET endpoint without downloading it."""
    clean_prompt = prompt.strip('"').strip("'")
    if len(clean_prompt) > 1200:
        clean_prompt = clean_prompt[:1200]

    encoded_prompt = requests.utils.quote(clean_prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true&model=flux"
    return url


# ─── Endpoints ───────────────────────────────────────────────────────────────


@app.get("/")
async def root():
    return {
        "message": "NotesViz API is running",
        "gemini_configured": bool(GROQ_API_KEY and GROQ_API_KEY != "your_groq_api_key_here"),
    }


@app.post("/api/parse")
async def parse_notes(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
):
    """
    Accept a file upload (PDF, image) or plain text paste.
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

    return {"session_id": session_id, "raw_text": raw_text}


@app.post("/api/extract")
async def extract_concepts(request: ExtractRequest):
    """
    Send raw text to Groq, get concepts + relationships JSON.
    """
    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        raise HTTPException(status_code=500, detail="Groq API key not configured. Set GROQ_API_KEY in backend/.env")

    try:
        concept_dicts = extract_concepts_with_gemini(request.raw_text)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse Groq response as JSON: {str(e)}")
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

    # Limit to 10
    concepts = concepts[:10]

    return {"session_id": request.session_id, "concepts": [c.dict() for c in concepts]}


@app.post("/api/generate")
async def generate_images(request: GenerateRequest):
    """
    For each concept, generate an image prompt via Groq, then get image URL from Pollinations.ai.
    """
    if not request.concepts:
        raise HTTPException(status_code=400, detail="No concepts provided.")

    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        raise HTTPException(status_code=500, detail="Groq API key not configured. Set GROQ_API_KEY in backend/.env")

    async def process_concept(concept: Concept) -> Concept:
        try:
            image_prompt = generate_image_prompt_with_gemini(concept.name, concept.definition)
            print(f"  [IMG] Generating prompt for '{concept.name}'...")
            image_url = generate_pollinations_image(image_prompt)
            print(f"  [IMG] Got image URL for '{concept.name}': {image_url[:80]}...")
            return Concept(
                id=concept.id,
                name=concept.name,
                definition=concept.definition,
                related_to=concept.related_to,
                image_prompt=image_prompt,
                image_url=image_url,
                status="done",
            )
        except Exception as e:
            return Concept(
                id=concept.id,
                name=concept.name,
                definition=concept.definition,
                related_to=concept.related_to,
                image_prompt=f"Error: {str(e)}",
                image_url=None,
                status="error",
            )

    # Process all concepts (sequentially to avoid rate limits)
    updated_concepts = []
    for concept in request.concepts:
        result = await process_concept(concept)
        updated_concepts.append(result)

    return {"session_id": request.session_id, "concepts": [c.dict() for c in updated_concepts]}


@app.post("/api/ask")
async def ask_question(request: AskRequest):
    """Follow-up Q&A on a specific concept."""
    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        raise HTTPException(status_code=500, detail="Gemini API key not configured.")

    concept = next((c for c in request.concepts if c.id == request.concept_id), None)
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found.")

    client = Groq(api_key=GROQ_API_KEY)
    prompt = f"""You are a helpful tutor. A student is studying and has a question about a specific concept from their notes.

Context (original notes excerpt):
{request.raw_text[:2000]}

Concept: {concept.name} — {concept.definition}

Student's question: {request.question}

Give a clear, helpful answer in 2-3 sentences."""

    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile"
        )
        return {"answer": chat_completion.choices[0].message.content.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Q&A failed: {str(e)}")


# ─── Run ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
