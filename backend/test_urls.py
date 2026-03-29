import urllib.request
urls = [
    "https://image.pollinations.ai/prompt/cat",
    "https://gen.pollinations.ai/image/cat",
    "https://pollinations.ai/p/cat",
    "https://pollinations.ai/prompt/cat"
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req)
        print(f"SUCCESS: {url} -> {res.status}")
    except Exception as e:
        print(f"FAILED: {url} -> {e}")
