import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
try:
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    result = client.models.generate_content(
        model='gemini-2.5-flash-image',
        contents='A 3blue1brown style mathematical visualization of calculus',
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(aspect_ratio="1:1")
        )
    )
    for part in result.candidates[0].content.parts:
        if part.image:
            with open("test_output.png", "wb") as f:
                f.write(part.image.image_bytes)
            print("SUCCESS! Generated image using Gemini!")
except Exception as e:
    print("FAILED:", e)
