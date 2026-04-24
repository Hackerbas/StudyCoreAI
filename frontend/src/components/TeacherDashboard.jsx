import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Upload, FileText, CheckCircle, AlertCircle, Trash2, BookOpen,
    Search, Filter, BarChart2, Edit3, X, Save, ChevronDown, BookMarked,
    Users, Tag, Calendar, Hash, AlignLeft, Star, Eye
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const SUBJECTS = [
    'General','Mathematics','Physics','Chemistry','Biology',
    'History','English','Turkish','Computer Science',
    'Geography','Philosophy','Art','Music','Physical Education',
];

const GRADES = [
    { value: 8,  label: 'Grade 8'    },
    { value: 9,  label: 'Grade 9'    },
    { value: 10, label: 'Grade 10'   },
    { value: 11, label: 'Grade 11'   },
    { value: 12, label: 'Grade 12'   },
    { value: 13, label: 'University' },
];

const SUBJECT_COLORS = {
    Mathematics:        '#fbbf24',
    Physics:            '#60a5fa',
    Chemistry:          '#34d399',
    Biology:            '#6ee7b7',
    History:            '#fb923c',
    English:            '#e879f9',
    Turkish:            '#ef4444',
    'Computer Science': '#818cf8',
    Geography:          '#38bdf8',
    Philosophy:         '#a78bfa',
    Art:                '#f472b6',
    Music:              '#4ade80',
    General:            '#94a3b8',
};

const getSubjectColor = (s) => SUBJECT_COLORS[s] || '#94a3b8';

// ─── Input component ──────────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {label}{required && <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>}
        </label>
        {children}
    </div>
);

const inputStyle = {
    background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '10px 13px', fontSize: '0.88rem', outline: 'none',
    fontFamily: 'inherit', width: '100%', transition: 'border-color 0.2s',
    colorScheme: 'dark',
};

// ─── Stats Bar ────────────────────────────────────────────────────────────────
const StatsBar = ({ books }) => {
    const subjects  = new Set(books.map(b => b.subject || 'General')).size;
    const grades    = books.reduce((acc, b) => {
        for (let g = parseInt(b.min_grade || 8); g <= parseInt(b.max_grade || b.min_grade || 8); g++) acc.add(g);
        return acc;
    }, new Set());
    const stats = [
        { icon: <BookOpen size={16} color="#818cf8" />, value: books.length, label: 'Total Books' },
        { icon: <Filter size={16} color="#fbbf24" />,   value: subjects,    label: 'Subjects'     },
        { icon: <Users size={16} color="#4ade80" />,    value: grades.size, label: 'Grade Levels' },
    ];
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
            {stats.map((s, i) => (
                <div key={i} className="glass" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
                    <div>
                        <p style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─── Upload / Edit Form ───────────────────────────────────────────────────────
const BookForm = ({ initial, onSubmit, onCancel, submitting, message }) => {
    const [file,    setFile]    = useState(null);
    const [form,    setForm]    = useState({
        title: '', author: '', subject: 'General',
        min_grade: 8, max_grade: 12, year: new Date().getFullYear(),
        description: '', ...initial
    });
    const [dragging, setDragging] = useState(false);
    const isEdit = !!initial?.id;

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ file, form });
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* File drop zone — only show when not editing */}
            {!isEdit && (
                <div
                    onDragEnter={() => setDragging(true)}
                    onDragLeave={() => setDragging(false)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f?.name.endsWith('.pdf')) setFile(f); }}
                    onClick={() => document.getElementById('file-upload-main').click()}
                    style={{
                        border: `2px dashed ${dragging ? '#6366f1' : file ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 14, padding: '28px 20px', textAlign: 'center',
                        background: dragging ? 'rgba(99,102,241,0.06)' : file ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer', transition: 'all 0.2s',
                    }}
                >
                    <input id="file-upload-main" type="file" accept=".pdf" style={{ display: 'none' }}
                        onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: file ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        {file ? <CheckCircle size={24} color="#22c55e" /> : <Upload size={24} color="#818cf8" />}
                    </div>
                    {file
                        ? <><p style={{ fontWeight: 700, color: '#4ade80' }}>{file.name}</p>
                            <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 4 }}>{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p></>
                        : <><p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Drop a PDF or click to browse</p>
                            <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 4 }}>PDF only · Max 50 MB</p></>
                    }
                </div>
            )}

            {/* Row 1: Title + Author */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Book Title" required>
                    <input value={form.title} onChange={e => set('title', e.target.value)}
                        placeholder="e.g. Chemistry for Grade 10" required
                        style={inputStyle} onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
                </Field>
                <Field label="Author / Publisher">
                    <input value={form.author} onChange={e => set('author', e.target.value)}
                        placeholder="e.g. John Smith"
                        style={inputStyle} onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
                </Field>
            </div>

            {/* Row 2: Subject + Year */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Subject" required>
                    <select value={form.subject} onChange={e => set('subject', e.target.value)} required
                        style={inputStyle}>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </Field>
                <Field label="Year Published">
                    <input type="number" value={form.year} onChange={e => set('year', e.target.value)}
                        min={1900} max={2026} placeholder="2024"
                        style={inputStyle} onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
                </Field>
            </div>

            {/* Row 3: Grade Range */}
            <div>
                <Field label="Grade Range (who can access this book)" required>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 2 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Minimum Grade</span>
                            <select value={form.min_grade} onChange={e => set('min_grade', parseInt(e.target.value))} style={inputStyle}>
                                {GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Maximum Grade</span>
                            <select value={form.max_grade} onChange={e => set('max_grade', parseInt(e.target.value))} style={inputStyle}>
                                {GRADES.filter(g => g.value >= form.min_grade).map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                            </select>
                        </div>
                    </div>
                </Field>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 7 }}>
                    Students whose grade falls within this range will see this book in their library.
                </p>
            </div>

            {/* Row 4: Description */}
            <Field label="Description / Notes">
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder="Optional notes for teachers or students about this material…"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor='#6366f1'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
            </Field>

            {/* Messages */}
            {message && (
                <div style={{ padding: '11px 15px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 9,
                    background: message.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    color: message.type === 'success' ? '#4ade80' : '#f87171', fontSize: '0.86rem' }}>
                    {message.type === 'success' ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}
                    {message.text}
                </div>
            )}

            {/* Submit row */}
            <div style={{ display: 'flex', gap: 10 }}>
                {onCancel && (
                    <button type="button" onClick={onCancel}
                        style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.88rem' }}>
                        Cancel
                    </button>
                )}
                <button type="submit" disabled={(!isEdit && !file) || submitting} className="btn-gradient"
                    style={{ flex: 2, padding: '12px', fontSize: '0.9rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {submitting
                        ? <><span className="spin" style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}/> Processing…</>
                        : isEdit ? <><Save size={14}/> Save Changes</> : <><Upload size={14}/> Upload to Library</>}
                </button>
            </div>
        </form>
    );
};

// ─── Book Card in Library ─────────────────────────────────────────────────────
const BookCard = ({ book, onDelete, onEdit, deleting }) => {
    const color    = getSubjectColor(book.subject);
    const gradeStr = book.max_grade && book.max_grade !== book.min_grade
        ? `Gr ${book.min_grade}–${book.max_grade}`
        : `Gr ${book.min_grade}+`;
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', borderRadius: 14,
            background: 'var(--bg-card)', border: '1px solid var(--border)', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        >
            {/* Subject dot / icon */}
            <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookMarked size={18} color={color}/>
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                    {book.title || book.filename}
                </p>
                {book.author && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 5 }}>by {book.author}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ padding: '2px 9px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 600, background: `${color}18`, color }}>{book.subject || 'General'}</span>
                    <span style={{ padding: '2px 9px', borderRadius: 100, fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>{gradeStr}</span>
                    {book.year && <span style={{ padding: '2px 9px', borderRadius: 100, fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>{book.year}</span>}
                    <span style={{ padding: '2px 9px', borderRadius: 100, fontSize: '0.7rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }}>
                        {new Date(book.upload_date).toLocaleDateString()}
                    </span>
                </div>
                {book.description && (
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {book.description}
                    </p>
                )}
            </div>
            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => onEdit(book)} title="Edit metadata"
                    style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.08)', color: '#818cf8', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(99,102,241,0.08)'}>
                    <Edit3 size={13}/>
                </button>
                <button onClick={() => onDelete(book.id, book.title || book.filename)} disabled={deleting === book.id} title="Delete book"
                    style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#f87171', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.06)'}>
                    {deleting === book.id
                        ? <span className="spin" style={{ width: 13, height: 13, border: '2px solid rgba(239,68,68,0.3)', borderTopColor: '#f87171', borderRadius: '50%' }}/>
                        : <Trash2 size={13}/>}
                </button>
            </div>
        </div>
    );
};

// ─── Edit Modal Overlay ───────────────────────────────────────────────────────
const EditModal = ({ book, onClose, onSaved }) => {
    const [submitting, setSubmitting] = useState(false);
    const [message,    setMessage]    = useState(null);

    const handleSubmit = async ({ form }) => {
        setSubmitting(true); setMessage(null);
        try {
            const res  = await fetch(`/api/book/${book.id}/meta`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Metadata saved!' });
                setTimeout(() => { onSaved(); onClose(); }, 800);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save.' });
            }
        } catch { setMessage({ type: 'error', text: 'Network error.' }); }
        finally { setSubmitting(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
            <div className="glass animate-fade-up" style={{ width: '100%', maxWidth: 580, borderRadius: 20, border: '1px solid rgba(99,102,241,0.3)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Edit Book Metadata</h2>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14}/></button>
                </div>
                <div style={{ padding: '22px 26px', maxHeight: '70vh', overflowY: 'auto' }}>
                    <BookForm initial={book} onSubmit={handleSubmit} onCancel={onClose} submitting={submitting} message={message}/>
                </div>
            </div>
        </div>
    );
};

// ─── Main TeacherDashboard ────────────────────────────────────────────────────
const TeacherDashboard = () => {
    const [books,      setBooks]      = useState([]);
    const [uploading,  setUploading]  = useState(false);
    const [deleting,   setDeleting]   = useState(null);
    const [uploadMsg,  setUploadMsg]  = useState(null);
    const [search,     setSearch]     = useState('');
    const [filterSub,  setFilterSub]  = useState('All');
    const [editBook,   setEditBook]   = useState(null);
    const [processingBooks, setProcessingBooks] = useState([]); // [{id, title}]

    useEffect(() => { fetchLibrary(); }, []);

    const fetchLibrary = async () => {
        try {
            const res  = await fetch('/api/library');
            const data = await res.json();
            if (res.ok) setBooks(data.books || []);
        } catch {}
    };

    const startPolling = (bookId, bookTitle) => {
        setProcessingBooks(prev => [...prev, { id: bookId, title: bookTitle }]);
        const interval = setInterval(async () => {
            try {
                const r = await fetch(`/api/book/${bookId}/status`);
                if (!r.ok) return;
                const d = await r.json();
                if (d.status === 'ready' || d.status === 'error') {
                    clearInterval(interval);
                    setProcessingBooks(prev => prev.filter(b => b.id !== bookId));
                    fetchLibrary();
                    if (d.status === 'ready') {
                        setUploadMsg({ type: 'success', text: `✅ "${bookTitle}" is ready for students!` });
                    } else {
                        setUploadMsg({ type: 'error', text: `⚠ "${bookTitle}" processing failed. Try re-indexing.` });
                    }
                }
            } catch {}
        }, 3000); // poll every 3s
    };

    const handleUpload = async ({ file, form }) => {
        if (!file) return;
        setUploading(true); setUploadMsg(null);
        const fd = new FormData();
        fd.append('file',        file);
        fd.append('title',       form.title);
        fd.append('author',      form.author      || '');
        fd.append('subject',     form.subject);
        fd.append('min_grade',   form.min_grade);
        fd.append('max_grade',   form.max_grade);
        fd.append('year',        form.year        || '');
        fd.append('description', form.description || '');
        try {
            const res  = await fetch('/api/upload', { method: 'POST', body: fd });
            if (!res.ok) {
                let errText = `Upload failed (Status ${res.status}).`;
                if (res.status === 413) errText = 'File is too large for Vercel (max 4.5MB). Try compressing it.';
                else if (res.status === 504) errText = 'Upload timed out. The PDF parsing took too long.';
                try {
                    const data = await res.json();
                    if (data.error) errText = data.error;
                } catch (e) {} // Not JSON
                setUploadMsg({ type: 'error', text: errText });
                fetchLibrary();
                return;
            }
            const data = await res.json();
            const bookTitle = form.title || file.name;
            setUploadMsg({ type: 'success', text: data.message });
            // Start background polling for processing status
            if (data.book_id) startPolling(data.book_id, bookTitle);
            fetchLibrary();
        } catch { setUploadMsg({ type: 'error', text: 'Upload failed — network disconnected or blocked.' }); }
        finally { setUploading(false); }
    };

    const handleDelete = async (bookId, name) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
        setDeleting(bookId);
        try {
            const res  = await fetch(`/api/delete/${bookId}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) fetchLibrary();
            else alert(data.error || 'Delete failed');
        } catch { alert('Network error'); }
        finally { setDeleting(null); }
    };

    const uniqueSubjects = useMemo(() => ['All', ...new Set(books.map(b => b.subject || 'General'))], [books]);

    const filtered = useMemo(() => books.filter(b => {
        const matchSub  = filterSub === 'All' || (b.subject || 'General') === filterSub;
        const term = search.toLowerCase();
        const matchTxt  = !term ||
            (b.title || b.filename || '').toLowerCase().includes(term) ||
            (b.author || '').toLowerCase().includes(term) ||
            (b.subject || '').toLowerCase().includes(term) ||
            (b.description || '').toLowerCase().includes(term);
        return matchSub && matchTxt;
    }), [books, search, filterSub]);

    return (
        <div style={{ height: '100%', overflowY: 'auto' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 28px' }}>

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <h1 style={{ fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
                        Library <span style={{ color: 'var(--accent)' }}>Management</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Upload, organise and manage all educational materials for your school.
                    </p>
                </div>

                {/* Stats */}
                <StatsBar books={books} />

                {/* Processing banner */}
                {processingBooks.length > 0 && (
                    <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 14,
                        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)',
                        display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#818cf8', borderRadius: '50%', flexShrink: 0 }}/>
                        <div>
                            <p style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.88rem' }}>AI Knowledge Extraction Running</p>
                            <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                {processingBooks.map(b => b.title).join(', ')} — Students can’t see {processingBooks.length > 1 ? 'these books' : 'this book'} until processing is complete.
                            </p>
                        </div>
                    </div>
                )}
                {/* Two-column layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' }}>

                    {/* ── Upload Form ── */}
                    <div className="glass" style={{ padding: 26, position: 'sticky', top: 0 }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Upload size={17} color="#818cf8"/> Upload New Book
                        </h2>
                        <BookForm onSubmit={handleUpload} submitting={uploading} message={uploadMsg}/>
                    </div>

                    {/* ── Library Panel ── */}
                    <div>
                        {/* Search + Filter bar */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
                                <input
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search books, authors, subjects…"
                                    style={{ ...inputStyle, paddingLeft: 36 }}/>
                            </div>
                            <select value={filterSub} onChange={e => setFilterSub(e.target.value)}
                                style={{ ...inputStyle, width: 'auto', minWidth: 140 }}>
                                {uniqueSubjects.map(s => <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>)}
                            </select>
                        </div>

                        {/* Header row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <BookOpen size={17} color="#818cf8"/> Library
                                <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.84rem' }}>({filtered.length} of {books.length})</span>
                            </h2>
                        </div>

                        {/* Empty states */}
                        {books.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border)', borderRadius: 16 }}>
                                <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.15, display: 'block' }}/>
                                <p style={{ fontWeight: 600, marginBottom: 6 }}>No books uploaded yet</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Use the form on the left to add your first book.</p>
                            </div>
                        )}
                        {books.length > 0 && filtered.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.2, display: 'block' }}/>
                                <p>No books match your search.</p>
                            </div>
                        )}

                        {/* Book list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {filtered.map(book => (
                                <BookCard
                                    key={book.id}
                                    book={book}
                                    onDelete={handleDelete}
                                    onEdit={b => setEditBook(b)}
                                    deleting={deleting}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit modal */}
            {editBook && (
                <EditModal book={editBook} onClose={() => setEditBook(null)} onSaved={fetchLibrary}/>
            )}
        </div>
    );
};

export default TeacherDashboard;
