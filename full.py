import os
import io
import json
import time
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, jsonify, request, send_from_directory, session
from pypdf import PdfReader
from groq import Groq
from groq import RateLimitError
from dotenv import load_dotenv
from supabase import create_client, Client
import redis
import hashlib

# --- Vector Embeddings via HuggingFace Inference API (lightweight, no heavy deps) ---
import urllib.request

HF_EMBED_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-small-en-v1.5"

def _hf_embed(texts):
    """Call HuggingFace free Inference API to embed a list of texts. Returns list of 384-dim lists."""
    payload = json.dumps({"inputs": texts, "options": {"wait_for_model": True}}).encode('utf-8')
    req = urllib.request.Request(HF_EMBED_URL, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get_embedding(text: str):
    """Return a 384-dim embedding list for a single text string."""
    try:
        result = _hf_embed([text])
        if result and isinstance(result, list) and len(result) > 0:
            return result[0]
    except Exception as e:
        print(f"[get_embedding] HF API error: {e}")
    return None

def chunk_text(text: str, chunk_size=500, overlap=50):
    """Split text into overlapping chunks of ~chunk_size characters."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return [c.strip() for c in chunks if c.strip()]

def index_book_chunks(book_id: int, content: str):
    """Chunk text, embed each chunk via HF API, and store in book_chunks table."""
    if not supabase or not content:
        return
    try:
        # Delete old chunks for this book (idempotent re-index)
        supabase.table('book_chunks').delete().eq('book_id', book_id).execute()

        chunks = chunk_text(content, chunk_size=500, overlap=50)
        if not chunks:
            return

        # Embed in batches of 20 (HF API has payload limits)
        EMBED_BATCH = 20
        all_embeddings = []
        for i in range(0, len(chunks), EMBED_BATCH):
            batch = chunks[i:i+EMBED_BATCH]
            embs = _hf_embed(batch)
            all_embeddings.extend(embs)

        rows = []
        for i, (chunk, emb) in enumerate(zip(chunks, all_embeddings)):
            rows.append({
                'book_id': book_id,
                'chunk_index': i,
                'content': chunk,
                'embedding': emb,
            })

        # Insert in batches of 50 to avoid Supabase payload limits
        DB_BATCH = 50
        for b in range(0, len(rows), DB_BATCH):
            supabase.table('book_chunks').insert(rows[b:b+DB_BATCH]).execute()

        print(f"[RAG] Indexed {len(rows)} chunks for book_id={book_id}")
    except Exception as e:
        print(f"[index_book_chunks] Error for book {book_id}: {e}")

load_dotenv()

# --- REDIS CACHING (Graceful Fallback) ---
redis_client = None
try:
    # Attempt to connect to local Redis standard port, short timeout to not hang
    redis_client = redis.Redis(host='localhost', port=6379, db=0, socket_timeout=2)
    redis_client.ping()
    print("✓ Redis cache initialized.")
except Exception as e:
    print(f"⚠ Redis not available (caching disabled): {e}")
    redis_client = None

def get_cache(key):
    if not redis_client: return None
    try:
        val = redis_client.get(key)
        if val: return json.loads(val.decode('utf-8'))
    except: pass
    return None

def set_cache(key, data, ex=3600):
    if not redis_client: return
    try:
        redis_client.setex(key, ex, json.dumps(data))
    except: pass

app = Flask(__name__, static_folder='frontend/dist', static_url_path='/')
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'super_secret_key_for_local_app')

ALLOWED_EXTENSIONS = {'pdf'}

# Initialize Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("Warning: SUPABASE_URL or SUPABASE_KEY is missing. Supabase will not work.")

# --- Groq API Key Rotation ---

GROQ_KEYS = [
    k for k in [
        os.environ.get('GROQ_API_KEY_1'),
        os.environ.get('GROQ_API_KEY_2'),
        os.environ.get('GROQ_API_KEY_3'),
        os.environ.get('GROQ_API_KEY'),  # fallback to original single key
    ] if k
]

def groq_chat_with_rotation(messages, model='llama-3.3-70b-versatile', response_format=None, temperature=0.5):
    """Try each Groq API key in sequence; rotate on rate limit."""
    last_error = None
    for key in GROQ_KEYS:
        try:
            client = Groq(api_key=key)
            kwargs = dict(messages=messages, model=model, temperature=temperature)
            if response_format:
                kwargs['response_format'] = response_format
            return client.chat.completions.create(**kwargs)
        except RateLimitError as e:
            print(f'Key ...{key[-6:]} rate limited, rotating.')
            last_error = e
            continue
        except Exception as e:
            raise e  # non-rate-limit errors bubble up
    raise last_error or Exception('All Groq API keys are exhausted.')

# --- Helper Functions ---

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_stream):
    """Extract ALL pages from a PDF — no page limit."""
    try:
        reader = PdfReader(file_stream)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def extract_pages_from_pdf(file_stream):
    """Return list of {page: N, text: str} dicts (1-indexed)."""
    try:
        reader = PdfReader(file_stream)
        pages = []
        for i, page in enumerate(reader.pages):
            extracted = page.extract_text() or ""
            pages.append({"page": i + 1, "text": extracted})
        return pages
    except Exception as e:
        print(f"Error reading PDF pages: {e}")
        return []

# --- Logging & Auth Helpers ---

def log_action(action: str, detail: str = None):
    """Write one row to activity_logs. Silently fails if Supabase is unavailable."""
    try:
        if not supabase:
            return
        supabase.table('activity_logs').insert({
            'user_id':    session.get('user_id'),
            'username':   session.get('username', 'anonymous'),
            'role':       session.get('role', 'unknown'),
            'action':     action,
            'detail':     detail,
            'ip_address': request.remote_addr,
        }).execute()
    except Exception as e:
        print(f"[log_action] Error writing log: {e}")

def require_admin(f):
    """Decorator that returns 403 unless the session role is Admin."""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        if session.get('role') != 'Admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated

# --- API Endpoints ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'Student') # Default to Student
    grade_level = data.get('grade_level')
    dob = data.get('dob')
    teacher_password = data.get('teacher_password')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    if role == 'Teacher' and teacher_password != 'u5a0qMj9xLPYwWJbG91G':
        return jsonify({'error': 'Invalid Teacher Access Code'}), 403

    if role == 'Student' and not grade_level:
         return jsonify({'error': 'Grade level required for students'}), 400
         
    if role == 'Student' and int(grade_level) < 8:
        return jsonify({'error': 'StudyCore is for Grade 8 and above.'}), 400

    # Profanity Blocker
    PROFANITY_LIST = ['admin', 'root', 'sysadmin', 'fuck', 'shit', 'bitch', 'ass', 'dick', 'cunt', 'pussy', 'whore', 'slut', 'fag', 'nigg', 'n1gg']
    lower_uname = username.lower()
    if any(p in lower_uname for p in PROFANITY_LIST):
        return jsonify({'error': 'Username violates community guidelines.'}), 400

    hashed_password = generate_password_hash(password)
    
    try:
        if not supabase: raise Exception("Supabase client not initialized")
        existing = supabase.table('users').select('*').eq('username', username).execute()
        if len(existing.data) > 0:
            return jsonify({'error': 'Username already exists'}), 409

        supabase.table('users').insert({
            'username': username,
            'password': hashed_password,
            'role': role,
            'grade_level': grade_level,
            'dob': dob
        }).execute()
        log_action('Registered', f'New {role} account created: {username}')
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        print(f"Error registering user: {e}")
        return jsonify({'error': 'An error occurred during registration'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    try:
        if not supabase: raise Exception("Supabase client not initialized")
        response = supabase.table('users').select('*').eq('username', username).execute()
        users = response.data
        if not users:
            return jsonify({'error': 'Invalid credentials'}), 401
            
        user = users[0]
        if check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            session['role'] = user['role']
            session['username'] = user['username']
            session['grade_level'] = user['grade_level']
            log_action('Logged In', 'Successful login')
            return jsonify({'message': 'Login successful', 'role': user['role'], 'username': user['username']}), 200
        else:
            log_action('Failed Login', f'Failed attempt for username: {username}')
            return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({'error': 'An error occurred during login'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'}), 200

@app.route('/api/guest', methods=['POST'])
def guest_login():
    """Create a lightweight guest session (no user_id, role=Guest)."""
    session['user_id'] = 'guest'
    session['role']    = 'Guest'
    session['username'] = 'Guest'
    session['grade_level'] = None
    log_action('Guest Session', 'Started guest session')
    return jsonify({'message': 'Guest session started', 'role': 'Guest', 'username': 'Guest'}), 200

@app.route('/api/check_auth', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        return jsonify({
            'authenticated': True,
            'role': session['role'],
            'username': session['username'],
            'grade_level': session.get('grade_level')
        }), 200
    return jsonify({'authenticated': False}), 401

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    if session['role'] != 'Teacher':
         return jsonify({'error': 'Only Teachers can upload files'}), 403

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    title       = request.form.get('title', '').strip() or None
    author      = request.form.get('author', '').strip() or None
    subject     = request.form.get('subject', 'General')
    
    try:
        min_grade = int(request.form.get('min_grade') or 8)
    except:
        min_grade = 8
        
    try:
        max_grade = int(request.form.get('max_grade') or min_grade)
    except:
        max_grade = min_grade
        
    year        = request.form.get('year', '').strip() or None
    description = request.form.get('description', '').strip() or None

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        
        try:
            if not supabase: raise Exception("Supabase client not initialized")
            
            existing = supabase.table('books').select('id').eq('filename', filename).execute()
            if len(existing.data) > 0:
                return jsonify({'error': f'A file named "{filename}" already exists. Rename the file or delete the existing entry first.'}), 409

            file_data   = file.read()
            file_stream = io.BytesIO(file_data)
            content     = extract_text_from_pdf(file_stream)
            
            try:
                supabase.storage.from_('pdfs').upload(file=file_data, path=filename, file_options={"content-type": "application/pdf"})
            except Exception as e:
                print(f"Storage upload warning: {e}")
            
            insert_result = supabase.table('books').insert({
                'filename':    filename,
                'title':       title or filename.replace('.pdf','').replace('_',' '),
                'author':      author,
                'content':     content,
                'subject':     subject,
                'min_grade':   min_grade,
                'max_grade':   max_grade,
                'year':        year,
                'description': description,
            }).execute()

            # RAG: chunk + embed the book for vector search
            new_book_id = insert_result.data[0]['id'] if insert_result.data else None
            if new_book_id and content:
                try:
                    index_book_chunks(new_book_id, content)
                except Exception as emb_err:
                    print(f"[upload] Embedding failed (non-fatal): {emb_err}")
            
            log_action('Uploaded File', f'Filename: {filename}')
            return jsonify({'message': f'"{title or filename}" uploaded and indexed successfully!'}), 201
        except Exception as e:
            print(f"Error during upload: {e}")
            return jsonify({'error': f'Upload error: {str(e)}'}), 500
            
    return jsonify({'error': 'Invalid file type. Only PDF files are accepted.'}), 400

@app.route('/api/library', methods=['GET'])
def get_library():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    cache_key = "library_books"
    cached = get_cache(cache_key)
    if cached:
        return jsonify({'books': cached}), 200

    try:
        if not supabase: raise Exception("Supabase client not initialized")
        response = supabase.table('books').select(
            'id, filename, title, author, upload_date, subject, min_grade, max_grade, year, description'
        ).execute()
        books = response.data
        set_cache(cache_key, books, ex=120)  # cache for 2 minutes
        return jsonify({'books': books}), 200
    except Exception as e:
        print(f"Error fetching library: {e}")
        return jsonify({'error': 'An error occurred fetching the library'}), 500

@app.route('/api/book/<int:book_id>/meta', methods=['PUT'])
def update_book_meta(book_id):
    """Update book metadata without re-uploading the PDF."""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    if session['role'] != 'Teacher':
        return jsonify({'error': 'Only Teachers can edit book metadata'}), 403
    data = request.json or {}
    allowed = ['title', 'author', 'subject', 'min_grade', 'max_grade', 'year', 'description']
    update  = {k: data[k] for k in allowed if k in data}
    if not update:
        return jsonify({'error': 'Nothing to update'}), 400
    try:
        if not supabase: raise Exception("Supabase client not initialized")
        supabase.table('books').update(update).eq('id', book_id).execute()
        if redis_client: redis_client.delete("library_books") # invalidate cache
        return jsonify({'message': 'Metadata updated'}), 200
    except Exception as e:
        print(f"Error updating book meta: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/book/<int:book_id>', methods=['GET'])
def get_book(book_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        if not supabase: raise Exception("Supabase client not initialized")
        response = supabase.table('books').select('*').eq('id', book_id).execute()
        if not response.data:
            return jsonify({'error': 'Book not found'}), 404
        return jsonify({'book': response.data[0]}), 200
    except Exception as e:
        print(f"Error fetching book: {e}")
        return jsonify({'error': 'An error occurred fetching the book'}), 500

@app.route('/api/book/<int:book_id>/pdf', methods=['GET'])
def get_book_pdf_url(book_id):
    """Return a short-lived signed URL so the browser can render the PDF natively."""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        if not supabase: raise Exception("Supabase client not initialized")
        row = supabase.table('books').select('filename').eq('id', book_id).execute()
        if not row.data:
            return jsonify({'error': 'Book not found'}), 404
        filename = row.data[0]['filename']
        signed = supabase.storage.from_('pdfs').create_signed_url(filename, 3600)
        return jsonify({'url': signed['signedURL']}), 200
    except Exception as e:
        print(f"Error generating signed URL: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/delete/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    if session['role'] != 'Teacher':
        return jsonify({'error': 'Only Teachers can delete files'}), 403

    try:
        if not supabase: raise Exception("Supabase client not initialized")
        
        response = supabase.table('books').select('*').eq('id', book_id).execute()
        if not response.data:
            return jsonify({'error': 'Book not found'}), 404
            
        book = response.data[0]
        
        try:
            supabase.storage.from_('pdfs').remove([book['filename']])
        except Exception as e:
            print(f"Storage deletion error (file might not exist): {e}")

        supabase.table('books').delete().eq('id', book_id).execute()
        if redis_client: redis_client.delete("library_books") # invalidate cache
        log_action('Deleted File', f"Deleted book ID {book_id}: {book['filename']}")
        return jsonify({'message': f'"{book["filename"]}" deleted successfully'}), 200
        
    except Exception as e:
        print(f"Error deleting book: {e}")
        return jsonify({'error': 'An error occurred deleting the book'}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    query = data.get('query')
    mode = data.get('mode', 'normal')
    book_id = data.get('book_id')  # optional – for per-page search

    if not query:
        return jsonify({'error': 'No query provided'}), 400

    try:
        if not supabase: raise Exception("Supabase client not initialized")

        found_page = None  # will be set if we locate an exact page

        # ── Per-book, per-page search ────────────────────────────────────────
        if book_id:
            # Fetch PDF bytes from Supabase Storage for page-level search
            try:
                row = supabase.table('books').select('filename, content').eq('id', book_id).execute()
                if row.data:
                    book_row = row.data[0]
                    signed = supabase.storage.from_('pdfs').create_signed_url(book_row['filename'], 300)
                    import urllib.request
                    pdf_bytes = urllib.request.urlopen(signed['signedURL']).read()
                    page_data = extract_pages_from_pdf(io.BytesIO(pdf_bytes))

                    # ── Smart page search: phrase match first, keyword count fallback ──
                    q_lower = query.lower()
                    keywords = [k for k in q_lower.split() if len(k) > 3]

                    # Build candidate phrases (3-word, then 2-word windows) from query
                    words = q_lower.split()
                    phrases = []
                    for n in (4, 3, 2):
                        for i in range(len(words) - n + 1):
                            phrase = ' '.join(words[i:i+n])
                            if len(phrase) > 6:
                                phrases.append(phrase)

                    best_page = None
                    best_hits = 0

                    # Pass 1: exact phrase match (prefer longer phrases)
                    for phrase in phrases:
                        for pd_item in page_data:
                            if phrase in pd_item['text'].lower():
                                best_page = pd_item['page']
                                break
                        if best_page:
                            break

                    # Pass 2: keyword frequency fallback
                    if not best_page:
                        for pd_item in page_data:
                            t = pd_item['text'].lower()
                            hits = sum(1 for k in keywords if k in t)
                            if hits > best_hits:
                                best_hits = hits
                                best_page = pd_item['page']

                    if best_page:
                        found_page = best_page

                    # Build context from this book only — capped to avoid token limit
                    full_text = "\n".join(p['text'] for p in page_data)
                    context = f"Document: {book_row['filename']}\n\n"
                    context += full_text[:8000]
            except Exception as pe:
                print(f"Per-page search failed, falling back: {pe}")
                book_id = None  # fall through to generic search

        # ── Generic multi-book search (no book_id or fallback) ──────────────
        if not book_id:
            # Try RAG vector search first
            query_emb = get_embedding(query)
            rag_used = False

            if query_emb:
                try:
                    rag_result = supabase.rpc('match_chunks', {
                        'query_embedding': query_emb,
                        'match_book_id': None,
                        'match_count': 5,
                        'match_subject': None,
                    }).execute()

                    if rag_result.data and len(rag_result.data) > 0:
                        context = "Semantically matched excerpts from the student's library:\n\n"
                        for chunk in rag_result.data:
                            sim = chunk.get('similarity', 0)
                            context += f"--- From {chunk['filename']} (relevance: {sim:.2f}) ---\n{chunk['content']}\n\n"
                        rag_used = True
                except Exception as rag_err:
                    print(f"[chat] RAG search failed, falling back to keyword: {rag_err}")

            # Fallback: keyword search if RAG unavailable or returned nothing
            if not rag_used:
                response_data = supabase.table('books').select('filename, content').execute()
                all_books = response_data.data

                if not all_books:
                    context = "The user has not uploaded any documents to their library yet."
                else:
                    file_list = ", ".join([b['filename'] for b in all_books])
                    context = f"Available Documents in Library: {file_list}\n\n"
                    keywords = query.lower().split()
                    match_found = False

                    for book in all_books:
                        text = book['content'] or ""
                        if any(k in text.lower() for k in keywords if len(k) > 3):
                            for k in keywords:
                                if len(k) <= 3: continue
                                idx = text.lower().find(k)
                                if idx != -1:
                                    start = max(0, idx - 2000)
                                    end = min(len(text), idx + 5000)
                                    context += f"--- Snippet from {book['filename']} ---\n{text[start:end]}\n\n"
                                    match_found = True
                                    break
                        if len(context) > 8000:
                            break

                    meta_keywords = ["summary", "overview", "about", "topic", "explain", "what is"]
                    is_meta_query = any(mk in query.lower() for mk in meta_keywords)
                    if not match_found or is_meta_query:
                        for book in all_books:
                            if f"Snippet from {book['filename']}" not in context:
                                text_snippet = (book['content'] or "")[:3000]
                                context += f"--- Beginning of {book['filename']} ---\n{text_snippet}\n...\n\n"
                            if len(context) > 8000: break

        # Construct Insane System Prompt Based on Mode
        if mode == 'simple':
            system_instruction = """You are StudyCore AI. Your primary goal is to explain concepts clearly as if the student is 5 years old (ELI5).
Break down deeply complex topics using fun, instantly relatable, and incredibly simple everyday analogies. 
You MUST entirely avoid academic jargon. If a technical term is absolutely required, you must define it in the simplest possible childish terms immediately.
Keep sentences very short. Keep the tone extremely warm, patient, and highly encouraging."""
        elif mode == 'advanced':
            system_instruction = """You are StudyCore AI, an expert academic scholar and rigorous university-level tutor.
Your goal is to provide comprehensive, deeply analytical explanations. You must synthesize concepts from the provided text, discuss underlying principles, and present arguments logically.
Use precise technical terminology. Your tone must be formal, scholarly, and highly detailed."""
        else:
            system_instruction = """You are StudyCore AI, a clear, balanced, and highly effective study assistant.
Your goal is to provide well-structured, easy-to-follow explanations that help the student grasp the key takeaways. Break down complex ideas into manageable points.
Maintain a friendly and supportive educational tone."""

        chat_completion = groq_chat_with_rotation(
            temperature=0.4,
            response_format={"type": "json_object"},
            messages=[
            {
                "role": "system",
                "content": f"""{system_instruction}

📚 Context from student's library:
{context}

⚠️ CRITICAL RULES:
1. Context-Based & Intuitive: Answer the student's question ONLY using the context above. If their question is brief, politely deduce what they mean.
2. Formatted for Readability: You MUST use Markdown formatting in your responses. Use **bold** for key terms, `code blocks` if relevant, and headings (##) or lists (-, 1.) to break down your answers so they are beautifully organized.
3. Provide Concrete Examples: Make concepts real by citing examples directly from the text if available.
4. Unknowns: If the topic is entirely absent from the library, state clearly that it is not covered in their documents. Do not hallucinate outside information.
5. Annotations: You MUST return your ENTIRE final output as a raw JSON object with this exact structure:
{{
  "response": "Your full beautifully formatted markdown response here...",
  "highlights": [
    {{ "page": 4, "text": "Exact text snippet you are referencing from the context", "note": "Short sticky note for the student" }}
  ]
}}
Only include highlights if you have a specific page and text you want to annotate. If no specific book_id is provided, or no exact match, leave highlights empty."""
            },
            {
                "role": "user",
                "content": query,
            }
        ])
        
        try:
            ai_data = json.loads(chat_completion.choices[0].message.content)
            result = {
                'response': ai_data.get('response', ''),
                'highlights': ai_data.get('highlights', []),
                'page': None,
            }
        except json.JSONDecodeError:
            result = {'response': chat_completion.choices[0].message.content, 'highlights': [], 'page': None}
            
        # Set page from found_page (physical PDF page from keyword search)
        if found_page:
            result['page'] = found_page
        elif result.get('highlights'):
            result['page'] = result['highlights'][0].get('page')
            
        return jsonify(result), 200
    except Exception as e:
        print(f"Error during chat: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/quiz', methods=['POST'])
def quiz():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json or {}
    difficulty   = data.get('difficulty', 'medium').lower()   # easy | medium | hard
    num_questions = int(data.get('num_questions', 5))
    num_questions = max(1, min(20, num_questions))  # clamp 1-20
    subject = data.get('subject', 'All')

    difficulty_instructions = {
        'easy': (
            "Easy difficulty: Ask straightforward recall and definition questions. "
            "Use simple vocabulary. Questions should be directly answerable from a single sentence in the text."
        ),
        'medium': (
            "Medium difficulty: Ask comprehension and application questions. "
            "Test whether the student understands concepts, not just memorises them."
        ),
        'hard': (
            "Hard difficulty: Ask analysis, evaluation, and scenario-based questions. "
            "Questions should require synthesising information from multiple parts of the text "
            "and applying critical thinking."
        ),
    }
    diff_note = difficulty_instructions.get(difficulty, difficulty_instructions['medium'])

    try:
        if not supabase: raise Exception("Supabase client not initialized")

        response = supabase.table('books').select('filename, content, subject').execute()
        all_books = response.data
        if subject and subject != 'All':
            all_books = [b for b in all_books if b.get('subject') == subject]

        if not all_books:
            return jsonify({'error': 'No books in library to generate a quiz from.'}), 400

        context = ""
        for book in all_books:
            text_snippet = (book['content'] or '')[:12000]
            context += f"--- From {book['filename']} ---\n{text_snippet}\n\n"
            if len(context) > 60000:
                break

        chat_completion = groq_chat_with_rotation(
            temperature=0.1,  # Strict grounding
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a quiz generator. Based ONLY on the provided document context, generate exactly {num_questions} multiple-choice questions.

{diff_note}

You MUST respond with ONLY a valid JSON object, no extra text before or after.
Format:
{{"questions": [{{"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "A", "explanation": "Brief explanation of why this answer is correct."}}]}}

Rules:
- Questions must be answerable from the provided context only. DO NOT use external knowledge.
- Make questions educational and test real understanding.
- Answers must be one of: A, B, C, or D.
- Every question MUST include an explanation field."""
                },
                {
                    "role": "user",
                    "content": f"Generate a {difficulty} quiz with {num_questions} questions from this content:\n\n{context}"
                }
            ],
            response_format={"type": "json_object"},
        )
        result = chat_completion.choices[0].message.content
        quiz_data = json.loads(result)
        return jsonify(quiz_data), 200
    except Exception as e:
        print(f"Error generating quiz: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/flashcards', methods=['POST'])
def flashcards():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.json or {}
    subject = data.get('subject', 'All')

    try:
        if not supabase: raise Exception("Supabase client not initialized")
        response = supabase.table('books').select('filename, content, subject').execute()
        all_books = response.data
        if subject and subject != 'All':
            all_books = [b for b in all_books if b.get('subject') == subject]
        if not all_books:
            return jsonify({'error': 'No books in library to generate flashcards from.'}), 400
        context = ""
        for book in all_books:
            context += f"--- From {book['filename']} ---\n{(book['content'] or '')[:10000]}\n\n"
            if len(context) > 50000:
                break
        chat_completion = groq_chat_with_rotation(
            temperature=0.1,
            messages=[
                {
                    "role": "system",
                    "content": """You are a flashcard generator. Based ONLY on the provided document context, generate exactly 6 flashcards.
Each flashcard has a short term/concept on the front and a clear explanation on the back.
Respond with ONLY a valid JSON object.
Format: {"flashcards": [{"front": "Term or concept", "back": "Clear explanation in 1-3 sentences."}]}
Rules: Use only content from the documents. DO NOT use external knowledge. Make fronts concise (1-7 words). Backs should be useful and educational."""
                },
                {
                    "role": "user",
                    "content": f"Generate flashcards from this content:\n\n{context}"
                }
            ],
            response_format={"type": "json_object"},
        )
        result = json.loads(chat_completion.choices[0].message.content)
        return jsonify(result), 200
    except Exception as e:
        print(f"Error generating flashcards: {e}")
        return jsonify({'error': str(e)}), 500

# ─── Saved Quizzes / Flashcards ──────────────────────────────────────────────

import string as _string, random as _random

def _gen_share_code():
    chars = _string.ascii_uppercase + _string.digits
    return ''.join(_random.choices(chars, k=6))

@app.route('/api/saved_quizzes', methods=['POST'])
def save_quiz():
    """Save a quiz or flashcard set to the database."""
    if 'user_id' not in session or session.get('user_id') == 'guest':
        return jsonify({'error': 'Account required to save quizzes.'}), 403
    data = request.json or {}
    name  = (data.get('name') or '').strip()
    qtype = data.get('type')     # 'quiz' | 'flashcard'
    qdata = data.get('data')     # list of questions or cards
    if not name or not qtype or not qdata:
        return jsonify({'error': 'name, type, and data are required.'}), 400
    try:
        result = supabase.table('saved_quizzes').insert({
            'user_id':  session['user_id'],
            'username': session.get('username', 'unknown'),
            'name':     name,
            'type':     qtype,
            'data':     qdata,
        }).execute()
        return jsonify({'saved': result.data[0]}), 201
    except Exception as e:
        print(f'[save_quiz] {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/saved_quizzes', methods=['GET'])
def list_saved_quizzes():
    """List all saved quizzes/flashcards for the logged-in user."""
    if 'user_id' not in session or session.get('user_id') == 'guest':
        return jsonify({'error': 'Account required.'}), 403
    try:
        result = supabase.table('saved_quizzes') \
            .select('id, name, type, share_code, created_at') \
            .eq('user_id', session['user_id']) \
            .order('created_at', desc=True) \
            .execute()
        return jsonify({'items': result.data}), 200
    except Exception as e:
        print(f'[list_saved_quizzes] {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/saved_quizzes/<int:item_id>', methods=['PUT'])
def rename_saved_quiz(item_id):
    """Rename a saved quiz/flashcard."""
    if 'user_id' not in session or session.get('user_id') == 'guest':
        return jsonify({'error': 'Account required.'}), 403
    data = request.json or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'name is required.'}), 400
    try:
        result = supabase.table('saved_quizzes') \
            .update({'name': name}) \
            .eq('id', item_id) \
            .eq('user_id', session['user_id']) \
            .execute()
        if not result.data:
            return jsonify({'error': 'Not found or not yours.'}), 404
        return jsonify({'updated': result.data[0]}), 200
    except Exception as e:
        print(f'[rename_saved_quiz] {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/saved_quizzes/<int:item_id>', methods=['DELETE'])
def delete_saved_quiz(item_id):
    """Delete a saved quiz/flashcard."""
    if 'user_id' not in session or session.get('user_id') == 'guest':
        return jsonify({'error': 'Account required.'}), 403
    try:
        result = supabase.table('saved_quizzes') \
            .delete() \
            .eq('id', item_id) \
            .eq('user_id', session['user_id']) \
            .execute()
        if not result.data:
            return jsonify({'error': 'Not found or not yours.'}), 404
        return jsonify({'deleted': True}), 200
    except Exception as e:
        print(f'[delete_saved_quiz] {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/saved_quizzes/<int:item_id>/data', methods=['GET'])
def get_saved_quiz_data(item_id):
    """Return the full data (questions/cards) for a saved item owned by the session user."""
    if 'user_id' not in session or session.get('user_id') == 'guest':
        return jsonify({'error': 'Account required.'}), 403
    try:
        result = supabase.table('saved_quizzes') \
            .select('id, name, type, data, share_code, created_at') \
            .eq('id', item_id) \
            .eq('user_id', session['user_id']) \
            .execute()
        if not result.data:
            return jsonify({'error': 'Not found or not yours.'}), 404
        return jsonify({'item': result.data[0]}), 200
    except Exception as e:
        print(f'[get_saved_quiz_data] {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/saved_quizzes/<int:item_id>/share', methods=['POST'])
def share_saved_quiz(item_id):
    """Generate (or return existing) a 6-char share code for a saved item."""
    if 'user_id' not in session or session.get('user_id') == 'guest':
        return jsonify({'error': 'Account required.'}), 403
    try:
        # Check if already has a code
        existing = supabase.table('saved_quizzes') \
            .select('share_code') \
            .eq('id', item_id) \
            .eq('user_id', session['user_id']) \
            .execute()
        if not existing.data:
            return jsonify({'error': 'Not found or not yours.'}), 404
        code = existing.data[0].get('share_code')
        if not code:
            # Generate unique code
            for _ in range(10):
                candidate = _gen_share_code()
                clash = supabase.table('saved_quizzes') \
                    .select('id').eq('share_code', candidate).execute()
                if not clash.data:
                    code = candidate
                    break
            supabase.table('saved_quizzes') \
                .update({'share_code': code}) \
                .eq('id', item_id) \
                .execute()
        return jsonify({'share_code': code}), 200
    except Exception as e:
        print(f'[share_saved_quiz] {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/shared/<string:share_code>', methods=['GET'])
def load_shared_quiz(share_code):
    """Load a shared quiz/flashcard by 6-char code. Requires login (not guest)."""
    if 'user_id' not in session or session.get('user_id') == 'guest':
        return jsonify({'error': 'Account required to load shared quizzes.'}), 403
    try:
        result = supabase.table('saved_quizzes') \
            .select('id, name, type, data, username, created_at') \
            .eq('share_code', share_code.upper()) \
            .execute()
        if not result.data:
            return jsonify({'error': f'No item found for code "{share_code.upper()}".'}), 404
        return jsonify({'item': result.data[0]}), 200
    except Exception as e:
        print(f'[load_shared_quiz] {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/study_plan', methods=['POST'])
def study_plan():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.json or {}
    subject = data.get('subject', 'All')

    try:
        if not supabase: raise Exception("Supabase client not initialized")
        response = supabase.table('books').select('filename, subject').execute()
        all_books = response.data
        if subject and subject != 'All':
            all_books = [b for b in all_books if b.get('subject') == subject]
        
        if not all_books:
            return jsonify({'error': 'No books available to create a study plan.'}), 400
            
        book_list_str = "\n".join([f"- {b['filename']} ({b.get('subject', 'General')})" for b in all_books])
        
        chat_completion = groq_chat_with_rotation(
            temperature=0.6, # A bit more creative for planning
            messages=[
                {
                    "role": "system",
                    "content": """You are StudyCore AI. Your job is to create a weekly study plan based on the student's available library.
You MUST output ONLY valid JSON.
Format:
{
  "plan": [
    {
      "day": "Monday",
      "topic": "Brief topic title",
      "book": "Name of book to focus on",
      "tasks": ["Task 1", "Task 2"]
    },
    ... (for Monday to Friday)
  ]
}"""
                },
                {
                    "role": "user",
                    "content": f"Create a 5-day study plan (Monday to Friday) using only these books:\n\n{book_list_str}"
                }
            ],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(chat_completion.choices[0].message.content)
        return jsonify(result), 200
    except Exception as e:
        print(f"Error generating study plan: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/srs_worksheet', methods=['POST'])
def srs_worksheet():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json or {}
    subject = data.get('subject', 'All')
    chat_history = data.get('chat_history', [])

    try:
        if not supabase: raise Exception("Supabase client not initialized")
        response = supabase.table('books').select('filename, content, subject').execute()
        all_books = response.data
        
        if subject and subject != 'All':
            all_books = [b for b in all_books if b.get('subject') == subject]

        if not all_books:
            return jsonify({'error': 'No books available to create a study guide.'}), 400

        # Build context from books
        context = ""
        for book in all_books:
            context += f"--- From {book['filename']} ---\n{(book['content'] or '')[:12000]}\n\n"
            if len(context) > 60000:
                break

        # Format chat history
        recent_history = chat_history[-10:] # get last 10 messages
        history_str = "\n".join([f"{msg.get('role', 'unknown').capitalize()}: {msg.get('content', '')}" for msg in recent_history])
        
        subject_prompt = f"The requested subject is {subject}." if subject != 'All' else "All subjects are included."
        system_prompt = f"""You are StudyCore AI, generating an SRS (Spaced Repetition System) targeted study guide.
{subject_prompt}
Analyze the student's recent Chat History to identify topics they are struggling with, asking questions about, or confused by.
CRITICAL RULE: ONLY identify struggles that are relevant to the requested subject. Do NOT mention or teach topics from unrelated subjects found in the chat history.
Then, using ONLY the provided Library Content, write a helpful, text-based Workseet / Mini-Study Guide focusing deliberately on those weak areas to re-teach the concepts.
Use markdown formatting (headers, bullet points). Do not make up outside information."""

        chat_completion = groq_chat_with_rotation(
            temperature=0.3,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Library Content:\n{context}\n\nStudent's Recent Chat History:\n{history_str}\n\nGenerate the SRS Worksheet now:"
                }
            ],
            response_format=None
        )
        
        result_text = chat_completion.choices[0].message.content
        return jsonify({"worksheet": result_text}), 200
    except Exception as e:
        print(f"Error generating SRS worksheet: {e}")
        return jsonify({'error': str(e)}), 500

# --- Admin API Routes ---

@app.route('/api/admin/stats', methods=['GET'])
@require_admin
def admin_stats():
    try:
        users_res  = supabase.table('users').select('role').execute()
        books_res  = supabase.table('books').select('id', count='exact').execute()
        logs_res   = supabase.table('activity_logs').select('id', count='exact').execute()
        quizzes_res = supabase.table('saved_quizzes').select('id', count='exact').execute()
        role_breakdown = {}
        for u in (users_res.data or []):
            r = u.get('role', 'Student')
            role_breakdown[r] = role_breakdown.get(r, 0) + 1
        return jsonify({
            'users': len(users_res.data or []),
            'books': books_res.count or 0,
            'logs':  logs_res.count or 0,
            'saved_quizzes': quizzes_res.count or 0,
            'role_breakdown': role_breakdown,
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users', methods=['GET'])
@require_admin
def admin_users():
    try:
        res = supabase.table('users').select('*').execute()
        return jsonify({'users': res.data}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<string:user_id>/role', methods=['PUT'])
@require_admin
def admin_update_role(user_id):
    role = request.json.get('role')
    if role not in ['Student', 'Teacher', 'Admin']:
        return jsonify({'error': 'Invalid role'}), 400
    try:
        supabase.table('users').update({'role': role}).eq('id', user_id).execute()
        log_action('Role Changed', f'Changed user {user_id} role to {role}')
        return jsonify({'message': 'Role updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<string:user_id>/reset_password', methods=['PUT'])
@require_admin
def admin_reset_password(user_id):
    new_password = request.json.get('new_password')
    if not new_password or len(new_password) < 6:
        return jsonify({'error': 'Invalid or short password'}), 400
    try:
        hashed = generate_password_hash(new_password)
        supabase.table('users').update({'password': hashed}).eq('id', user_id).execute()
        log_action('Password Reset', f'Reset password for user {user_id}')
        return jsonify({'message': 'Password reset successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<string:user_id>', methods=['DELETE'])
@require_admin
def admin_delete_user(user_id):
    try:
        supabase.table('users').delete().eq('id', user_id).execute()
        log_action('Deleted User', f'Deleted user ID: {user_id}')
        return jsonify({'message': 'User deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/logs', methods=['GET'])
@require_admin
def admin_logs():
    filter_role = request.args.get('role')
    try:
        q = supabase.table('activity_logs').select('*').order('created_at', desc=True).limit(500)
        if filter_role and filter_role != 'All':
            q = q.eq('role', filter_role)
        res = q.execute()
        return jsonify({'logs': res.data}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/books', methods=['GET'])
@require_admin
def admin_books():
    try:
        res = supabase.table('books').select('id,filename,title,subject,author,year,description,min_grade,max_grade').order('id', desc=True).execute()
        return jsonify({'books': res.data}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/books/<int:book_id>', methods=['DELETE'])
@require_admin
def admin_delete_book(book_id):
    try:
        row = supabase.table('books').select('filename').eq('id', book_id).execute()
        if not row.data:
            return jsonify({'error': 'Book not found'}), 404
        filename = row.data[0]['filename']
        try:
            supabase.storage.from_('pdfs').remove([filename])
        except Exception:
            pass
        supabase.table('books').delete().eq('id', book_id).execute()
        log_action('Admin Deleted Book', f'Book ID {book_id}: {filename}')
        return jsonify({'message': 'Book deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<string:user_id>/grade', methods=['PUT'])
@require_admin
def admin_set_grade(user_id):
    grade = request.json.get('grade_level')
    try:
        supabase.table('users').update({'grade_level': grade}).eq('id', user_id).execute()
        log_action('Set Grade', f'Set grade_level={grade} for user {user_id}')
        return jsonify({'message': 'Grade updated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/create_admin', methods=['POST'])
@require_admin
def admin_create_admin():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Missing credentials'}), 400
    try:
        hashed = generate_password_hash(password)
        supabase.table('users').insert({
            'username': username,
            'password': hashed,
            'role': 'Admin',
        }).execute()
        log_action('Created Admin', f'Created new admin: {username}')
        return jsonify({'message': f'Admin {username} created'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/reindex', methods=['POST'])
@require_admin
def admin_reindex():
    """Re-download every PDF, re-extract text, and re-embed chunks for RAG."""
    try:
        rows = supabase.table('books').select('id, filename').execute()
        if not rows.data:
            return jsonify({'message': 'No books to re-index.', 'updated': 0}), 200

        updated = 0
        embedded = 0
        errors = []
        for book in rows.data:
            try:
                signed = supabase.storage.from_('pdfs').create_signed_url(book['filename'], 300)
                import urllib.request
                pdf_bytes = urllib.request.urlopen(signed['signedURL']).read()
                new_content = extract_text_from_pdf(io.BytesIO(pdf_bytes))
                supabase.table('books').update({'content': new_content}).eq('id', book['id']).execute()
                updated += 1

                # RAG: re-embed chunks
                try:
                    index_book_chunks(book['id'], new_content)
                    embedded += 1
                except Exception as emb_err:
                    errors.append(f"{book['filename']} (embed): {str(emb_err)}")
                    print(f"[reindex] Embedding failed for {book['filename']}: {emb_err}")
            except Exception as be:
                errors.append(f"{book['filename']}: {str(be)}")
                print(f"[reindex] Failed for {book['filename']}: {be}")

        if redis_client:
            redis_client.delete("library_books")

        log_action('Re-Indexed Library', f'Updated {updated}/{len(rows.data)} books, embedded {embedded}')
        return jsonify({
            'message': f'Re-indexed {updated}/{len(rows.data)} books. Embedded {embedded} for RAG.',
            'updated': updated,
            'embedded': embedded,
            'total': len(rows.data),
            'errors': errors,
        }), 200
    except Exception as e:
        print(f"[admin_reindex] {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/')

def home():
    if not os.path.exists(os.path.join(app.static_folder, 'index.html')):
      return "Frontend built files not found. Please run 'npm run build' in 'frontend/' directory."
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# Start app
def start_server():
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        print(f"Server accessible at: http://{ip}:5000")
    except Exception:
        print("Could not determine local IP. Try `ipconfig` or `ifconfig`.")
        
    app.run(host='0.0.0.0', port=5000, threaded=True)

if __name__ == '__main__':
    start_server()
