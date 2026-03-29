import os
import requests

url_parse = "http://127.0.0.1:8000/api/parse"
url_extract = "http://127.0.0.1:8000/api/extract"

test_text = "Vector spaces are sets of vectors that can be added and scaled. A subspace is a vector space inside another vector space."

print("1. Parsing...")
res_parse = requests.post(url_parse, data={"text": test_text})
if res_parse.status_code != 200:
    print("Parse failed:", res_parse.text)
    exit(1)

session_id = res_parse.json().get("session_id")
print("Session ID:", session_id)

print("2. Extracting...")
res_extract = requests.post(url_extract, data={"session_id": session_id})
print("Extract Response:", res_extract.status_code)
print(res_extract.text)
