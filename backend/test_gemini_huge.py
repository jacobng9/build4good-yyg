import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(override=True)
API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

prompt = """You are an expert university professor. Given the following mathematical/technical notes, conceptually map up to 8 core ideas.
Return ONLY valid JSON in this exact format (no markdown fences, just raw JSON):
{
  "concepts": [
    { 
      "id": "c1", 
      "name": "Concept Name", 
      "definition": "A comprehensive, highly descriptive explanation outlining the theory and application. (Must be at least 3-4 distinct sentences.)", 
      "equations": ["E = mc^2", "\\int x dx"], 
      "examples": [{"problem": "Sample problem or scenario text", "solution": "Step-by-step solution text."}],
      "related_to": ["c2"] 
    }
  ]
}

Rules:
- Deeply extract mathematical/technical context where applicable. If no explicit equations or examples exist, synthesize highly relevant generic textbook examples.
- Include up to 2 key equations formatted in clean string notation (e.g. standard mathematical syntax).
- Include 1-2 practical example problems/solutions per concept to build deeper intuitive understanding.
- Do not exceed 8 concepts. Map connections via related_to IDs.

Notes:
Vector spaces are sets of vectors that can be added and scaled. A subspace is a vector space inside another vector space.
"""

try:
    print("calling huge prompt...")
    response = model.generate_content(prompt)
    print("Success! Response size:", len(response.text))
except Exception as e:
    print("Error:", str(e))
