import os
import requests
from dotenv import load_dotenv
load_dotenv('.env.local')
app_id = os.environ['NEXT_PUBLIC_ALGOLIA_APP_ID']
key = os.environ['NEXT_PUBLIC_ALGOLIA_SEARCH_KEY']
url = f'https://{app_id}-dsn.algolia.net/1/indexes/ads/query'
headers = {
    'X-Algolia-API-Key': key,
    'X-Algolia-Application-Id': app_id,
    'Content-Type': 'application/json',
}
payload = {'params': 'query=&hitsPerPage=1'}
res = requests.post(url, headers=headers, json=payload)
print(res.status_code)
print(res.text)
