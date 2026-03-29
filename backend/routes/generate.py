from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
import base64
from groq import Groq
import asyncio
from typing import List, Optional
from urllib.parse import quote

router = APIRouter()

# Concept model matching the interface
class Concept(BaseModel):
    id: str
    name: str
    definition: str
    related_to: List[str]
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None
    status: str = "pending"

class GenerateRequest(BaseModel):
    session_id: str
    concepts: List[Concept]

async def generate_image_prompt_for_concept(concept: Concept) -> tuple[str, str]:
    """
    Generate an image prompt for a single concept using Gemini.
    Returns tuple of (concept_id, image_prompt) or (concept_id, None) on failure.
    """
    try:
        # Configure Gemini API (reuse configuration)
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return concept.id, None

        
        client = Groq(api_key=api_key)

        # System prompt as specified
        system_prompt = """Convert this concept into a vivid metaphorical image generation prompt for an AI image generator. The image must be illustrative and help a student intuitively understand the concept. No text, no charts, no diagrams. Think editorial illustration or surreal conceptual art. Return only the image prompt string, nothing else."""

        # Build user prompt with concept details
        user_prompt = f"Concept: {concept.name}\nDefinition: {concept.definition}"

        full_prompt = f"{system_prompt}\n\n{user_prompt}"

        # Generate content (synchronous call, but called in parallel via asyncio.gather)
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": full_prompt}],
            model="llama-3.3-70b-versatile"
        )
        image_prompt = chat_completion.choices[0].message.content.strip()

        return concept.id, image_prompt

    except Exception as e:
        return concept.id, None

@router.post("/api/generate")
async def generate_images(request: GenerateRequest):
    """
    Generate image prompts and URLs for all concepts in a session.
    Processes concepts in parallel and returns updated concepts with image_prompt and image_url.
    """
    if not request.concepts:
        raise HTTPException(status_code=400, detail="No concepts provided")

    # Create tasks for all concepts to generate image prompts in parallel
    tasks = [generate_image_prompt_for_concept(concept) for concept in request.concepts]
    results = await asyncio.gather(*tasks)

    # Build a mapping of concept_id -> image_prompt for quick lookup
    prompt_map = {concept_id: prompt for concept_id, prompt in results}

    # Transform concepts with generated prompts and Pollinations URLs
    updated_concepts = []
    for concept in request.concepts:
        image_prompt = prompt_map.get(concept.id)

        if image_prompt:
            # Build Pollinations.ai URL with url-encoded prompt
            encoded_prompt = quote(image_prompt, safe='')
            image_url = f"https://pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true"

            updated_concept = Concept(
                id=concept.id,
                name=concept.name,
                definition=concept.definition,
                related_to=concept.related_to,
                image_prompt=image_prompt,
                image_url=image_url,
                status="done"
            )
        else:
            # Failed to generate prompt for this concept
            updated_concept = Concept(
                id=concept.id,
                name=concept.name,
                definition=concept.definition,
                related_to=concept.related_to,
                image_prompt=None,
                image_url=None,
                status="error"
            )

        updated_concepts.append(updated_concept)

    return {
        "session_id": request.session_id,
        "concepts": [c.dict() for c in updated_concepts]
    }