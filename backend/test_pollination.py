import urllib.parse
prompt = "Neon pink abstract vectors radiating from a central point, minimalist linear algebra visualization."
enhanced = f"{prompt}, dark theme, extremely beautiful abstract minimalist math visualization, highly detailed structure, 3Blue1Brown aesthetic, glowing, pitch black background"
encoded = urllib.parse.quote(enhanced)
seed = 12345
url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true&seed={seed}&model=flux"
print("Testing URL:", url)
import requests
r = requests.get(url)
print(r.status_code, len(r.content), r.headers.get("Content-Type"))
