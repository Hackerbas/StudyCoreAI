import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_KEY')

if not url or not key:
    print("No Supabase credentials found")
    exit(1)

client = create_client(url, key)

try:
    res = client.table('books').delete().neq('id', 0).execute()
    print("Cleared books:", res.data)
except Exception as e:
    print("Error:", e)
