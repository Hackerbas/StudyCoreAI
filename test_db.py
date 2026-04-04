import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

try:
    from supabase import create_client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. Test Select
    print("Testing Select...")
    response = supabase.table('users').select('*').limit(1).execute()
    print("Select Response:", response.data)
    
    # 2. Test Insert
    print("Testing Insert...")
    insert_response = supabase.table('users').insert({
        'username': 'test_user_ai',
        'password': 'hashed_password_mock',
        'role': 'Student',
        'grade_level': '8',
        'dob': '2000-01-01'
    }).execute()
    print("Insert Response:", insert_response.data)

except Exception as e:
    print("EXCEPTION CAUGHT:")
    print(str(e))
