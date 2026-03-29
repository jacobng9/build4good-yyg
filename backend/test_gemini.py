import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")
print("calling model")
try:
    response = model.generate_content("hello")
    print(response.text)
except Exception as e:
    print("Error:", e)
