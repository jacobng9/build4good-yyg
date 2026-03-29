import urllib.request
import json
from urllib.parse import quote

prompt = "A 3blue1brown style mathematical visualization of calculus, dark background with glowing colored geometric curves"
url = f"https://hercai.onrender.com/v3/text2image?prompt={quote(prompt)}"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())
    print("SUCCESS:", data)
except Exception as e:
    print("FAILED:", e)
