import requests

r = requests.get('https://glof-frontend.onrender.com/static/js/main.12742b97.js')
text = r.text

print("API_URL_ENV baked in:")
for chunk in text.split('"'):
    if "https://glof-" in chunk:
        print(" ->", chunk)
