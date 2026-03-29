import os
from dotenv import load_dotenv
import requests

load_dotenv(override=True)
KEY = os.getenv("STABILITY_API_KEY")

print("Key starts with:", KEY[:5] if KEY else "None")

url = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"
headers = {
    "Authorization": f"Bearer {KEY}",
    "Accept": "application/json",
    "Content-Type": "application/json"
}
payload = {
    "text_prompts": [{"text": "A simple test", "weight": 1}],
    "cfg_scale": 7,
    "height": 1024,
    "width": 1024,
    "samples": 1,
    "steps": 10,
}

res = requests.post(url, headers=headers, json=payload)
print(res.status_code, res.text[:200])
