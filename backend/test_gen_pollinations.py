import urllib.request

url2 = "https://gen.pollinations.ai/image/cat"

try:
    req = urllib.request.Request(url2, headers={'User-Agent': 'Mozilla/5.0'})
    res = urllib.request.urlopen(req)
    print("SUCCESS gen.pollinations.ai:", res.status, res.headers.get('Content-Type'))
except Exception as e:
    print("FAILED gen.pollinations.ai:", e)
