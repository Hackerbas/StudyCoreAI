# Teacher Assist — Showcase Document

## What Is Teacher Assist?

**Teacher Assist** is an AI-powered educational platform built for students and teachers. It turns any PDF textbook or document into a personal AI tutor — letting students chat with their books, generate quizzes, create flashcards, read PDFs with AI assistance, and track their own learning progress. Teachers manage the library and control what content students have access to.

The platform is **source-locked**: the AI only ever answers from the uploaded books — it never makes things up or pulls from outside the library.

---

## Who Uses It?

| Role | What They Can Do |
|------|-----------------|
| **Student** | Chat with AI, use BookAI reader, take quizzes, make flashcards, generate study plans, track stats |
| **Teacher** | Everything a student can do + upload/manage/delete books, set grade ranges per book |
| **Admin** | Full system access — user management, activity logs, platform oversight |
| **Guest** | Explore the app without creating an account (read-only, no saving) |

Students also set a **grade level** at registration, and the library automatically filters to show only books appropriate for their grade.

---

## Features

### 1. AI Chat (Dashboard)
- Students type questions and the AI answers using only their uploaded books
- Chats are **saved automatically** and listed in the sidebar by title
- You can have **multiple separate chats** and delete any of them
- Three AI explanation modes:
  - **Core Tutor** — balanced, clear explanations
  - **Beginner** — simple words and analogies (ELI5)
  - **Scholar** — deep academic analysis
- Students can optionally **pin the chat to a specific book** or leave it as "All Knowledge" to search across all uploaded documents

### 2. BookAI (PDF Reader + Chat)
- Students open any book from the library in a built-in PDF reader
- A side panel contains a **dedicated book chat** — AI answers only from that specific book
- Book chats are **saved per book** so conversations are remembered between sessions
- When the AI finds a relevant page for the question, a **"Jump to page" button** appears — it uses phrase matching first (finds exact headings/section names), then falls back to keyword frequency
- Also has a **sticky notes panel** for personal notes per book

### 3. Quiz Generator
- Generates **multiple-choice quizzes** from the library with selectable difficulty (Easy / Medium / Hard)
- Filter by subject
- Tracks scores and quiz history in the Stats view
- Users can **save, rename, delete, and share quizzes** with a 6-character share code

### 4. Flashcard Generator
- Generates **6 flashcards** from the library content automatically
- Also saveable and shareable

### 5. Study Plan
- AI generates a **5-day (Mon–Fri) personalized study plan** based on the books in the library
- Each day has a topic, a recommended book focus, and a list of tasks

### 6. Study Stats
- Tracks:
  - **Day streak** (consecutive days active)
  - **Total questions asked** and questions asked today
  - **Quizzes taken** and quiz score history (best, average)
  - **Unique books opened**
- All stored locally in the browser (no server-side tracking)

### 7. Teacher Dashboard (Manage)
- Teachers can upload PDFs with metadata:
  - Title, Author, Subject, Year, Description
  - Min and Max grade level (used to filter per student)
- Can edit metadata without re-uploading
- Can delete books

### 8. Admin Panel
- Separate dashboard only visible to Admin accounts
- User management and activity log monitoring

### 9. Multilingual Support
- The UI supports **English, Arabic, and Turkish** — switchable in the sidebar

---

## How It Works (Technical Overview)

### Frontend
- Built with **React** (Vite)
- Dark-mode UI with CSS variables for theming
- React Router for navigation (Landing → Login/Register → Dashboard)
- PDF rendering using **react-pdf** (PDF.js worker)
- Markdown rendering in chat using **ReactMarkdown**

### Backend
- **Python / Flask** server (`full.py`)
- API endpoints for: auth, library, book management, AI chat, quiz, flashcard, study plan, saved quizzes, admin
- AI powered by **Groq API** with **Llama 3.3 70B** (multiple API keys with rotation for reliability)
- **Redis** caching for library data (cache expires every 2 minutes)

### Database & Storage
- **Supabase** (PostgreSQL) for users, books metadata, saved quizzes, activity logs
- **Supabase Storage** (S3-compatible) for PDF files — served via signed URLs that expire in 1 hour

### Deployment
- Frontend deployed on **Vercel**
- Backend deployed on Vercel serverless functions

---

## How the AI Page Search Works

When a student asks a question in BookAI:
1. The backend fetches the book PDF from storage
2. Extracts text page by page using **PyPDF2**
3. **Pass 1 — Phrase match**: Builds 2–4 word phrases from the query and checks which PDF page contains that exact phrase (great for finding section headers like "Representing Chemical Reactions")
4. **Pass 2 — Keyword frequency**: If no phrase match, finds the page with the most matching keywords
5. Returns `page` (physical PDF page number) in the API response
6. Frontend shows a **"Jump to page X"** button in the chat message — one click navigates the PDF viewer

---

## Security & Access Control

- Passwords hashed with **Werkzeug (PBKDF2)**
- Session-based auth using Flask sessions
- Role checks on every protected endpoint
- Teachers need a **secret access code** to register as Teacher
- Students must be **Grade 8 or above**
- Profanity filter on usernames
- Guest mode is fully isolated — no data is saved

---

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| Source-locked AI | Prevents hallucination; AI only uses what teachers upload |
| Chat saved to localStorage | Fast, no backend cost, private to the device |
| Book chat separate from main chat | Keeps context focused on one book at a time |
| Phrase match before keyword count | Finds exact section headings reliably |
| Grade-level filtering | Teachers upload once; system automatically shows right books per grade |
| Multilingual sidebar | Supports Arabic and Turkish-speaking students |

---

*© 2026 Teacher Assist — Source-locked learning powered by AI.*
