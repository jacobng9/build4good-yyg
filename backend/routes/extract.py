from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
import base64
from groq import Groq
from typing import List, Optional

router = APIRouter()

# Pydantic model for request body
class ExtractRequest(BaseModel):
    session_id: str
    raw_text: str

# Concept model matching the interface (with nullable fields for image generation step)
class Concept(BaseModel):
    id: str
    name: str
    definition: str
    related_to: List[str]
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = "pending"

@router.post("/api/extract")
async def extract_concepts(request: ExtractRequest):
    """
    Extract key concepts from raw text using Gemini 1.5 Flash.
    Returns session_id and list of concepts with placeholder fields for image generation.
    """
    # Configure Gemini API
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY environment variable not set")

    

    # Use Gemini 1.5 Flash model
    client = Groq(api_key=api_key)

    # System prompt as specified in requirements
    system_prompt = """You are an expert educator. Given the following notes, extract all key concepts. Return ONLY valid JSON with no markdown, no backticks, no explanation. Format: { concepts: [{ id: 'c1', name: '', definition: '', related_to: [] }] }. Max 8 concepts."""

    # Combine system prompt with user's raw text
    full_prompt = f"{system_prompt}\n\nNotes: {request.raw_text}"

    try:
        # Generate content from Gemini
        response = model.generate_content(full_prompt)

        # Extract text from response
        response_text = response.text.strip()

        # Parse JSON response
        try:
            # Clean response in case there's extra text (though prompt says ONLY JSON)
            # Find JSON object boundaries
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx == -1 or end_idx == 0:
                raise ValueError("No JSON object found in response")

            json_str = response_text[start_idx:end_idx]
            parsed = json.loads(json_str)

            # Extract concepts list
            concepts_data = parsed.get('concepts', [])
            if not isinstance(concepts_data, list):
                raise ValueError("'concepts' must be a list")

            # Limit to max 8 concepts as per prompt
            concepts_data = concepts_data[:8]

            # Convert to Concept models with placeholder fields
            concepts = []
            for concept_dict in concepts_data:
                # Validate required fields
                if not all(k in concept_dict for k in ['id', 'name', 'definition']):
                    continue  # Skip invalid concept

                concept = Concept(
                    id=concept_dict['id'],
                    name=concept_dict['name'],
                    definition=concept_dict['definition'],
                    related_to=concept_dict.get('related_to', []),
                    image_prompt=None,
                    image_url=None,
                    status="pending"
                )
                concepts.append(concept)

            # Return response matching expected format
            return {
                "session_id": request.session_id,
                "concepts": [c.dict() for c in concepts]
            }

        except (json.JSONDecodeError, ValueError, KeyError) as e:
            # Return 500 with raw Gemini output for debugging
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Failed to parse Gemini response as JSON",
                    "gemini_raw_output": response_text,
                    "parse_error": str(e)
                }
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini API error: {str(e)}"
        )