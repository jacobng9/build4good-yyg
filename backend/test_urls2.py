import urllib.request
from urllib.parse import quote

prompt = "A traveler at a crossroads, their path forward only influenced by the current choice, not the long journey behind."
encoded = quote(prompt)

urls = [
    f"https://pollinations.ai/p/{encoded}",
    f"https://pollinations.ai/p/{encoded}?width=1024&height=1024&nologo=true",
    f"https://pollinations.ai/prompt/{encoded}?width=1024&height=1024",
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req)
        print(f"SUCCESS: {url} -> {res.status}")
    except Exception as e:
        print(f"FAILED: {url} -> {e}")
