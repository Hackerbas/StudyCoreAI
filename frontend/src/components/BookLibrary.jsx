import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, ArrowLeft, Bot, Send, StickyNote, Trash2, ChevronRight, Sparkles, FileText, PenTool, Eraser, Clock } from 'lucide-react';
import PdfThumbnail from './PdfThumbnail';

// ─── Thumbnail Loader ────────────────────────────────────────────────────────
const BookThumbnail = ({ bookId, sc }) => {
    const [pdfUrl, setPdfUrl] = useState(null);
    useEffect(() => {
        fetch(`/api/book/${bookId}/pdf`).then(r=>r.json()).then(d=> { if(d.url) setPdfUrl(d.url); }).catch(()=>{});
    }, [bookId]);
    
    const fallback = (
        <div style={{ width:44,height:44,borderRadius:12,background:sc.bg,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <BookOpen size={22} color={sc.color}/>
        </div>
    );
    
    if (!pdfUrl) return fallback;
    return <PdfThumbnail pdfUrl={pdfUrl} fallbackIcon={fallback} width={44} />;
};

const SUBJECT_COLORS = {
    Mathematics:        { bg: 'transparent',  color: '#fbbf24', border: 'var(--border)' },
    Physics:            { bg: 'transparent',  color: '#60a5fa', border: 'var(--border)'  },
    Chemistry:          { bg: 'transparent',  color: '#34d399', border: 'var(--border)'  },
    Biology:            { bg: 'transparent', color: '#6ee7b7', border: 'var(--border)' },
    History:            { bg: 'transparent',  color: '#fb923c', border: 'var(--border)'  },
    English:            { bg: 'transparent', color: '#e879f9', border: 'var(--border)' },
    Turkish:            { bg: 'transparent',   color: '#ef4444', border: 'var(--border)' },
    'Computer Science': { bg: 'transparent',  color: '#818cf8', border: 'var(--border)'  },
    General:            { bg: 'transparent', color: '#94a3b8', border: 'var(--border)'  },
};

// ─── Selection Popup (inside right panel only) ────────────────────────────────
const SelectionPopup = ({ position, onAskAI }) => {
    if (!position) return null;
    return (
        <div data-sel-popup="1" style={{
            position: 'fixed', top: position.y - 44, left: position.x,
            transform: 'translateX(-50%)',
            background: '#1e293b',
            borderRadius: 10, padding: '6px 14px',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 9999,
            cursor: 'pointer', userSelect: 'none',
            border: '1px solid var(--border)',
            animation: 'selPopIn 0.15s ease',
        }} onClick={onAskAI}>
            <Sparkles size={12} color="white" />
            <span style={{ color: 'white', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Ask AI</span>
            <div style={{ position:'absolute', bottom:-6, left:'50%', transform:'translateX(-50%)', width:0, height:0,
                borderLeft:'6px solid transparent', borderRight:'6px solid transparent', borderTop:'6px solid #1e293b' }} />
        </div>
    );
};

// ─── Mini AI Chat ──────────────────────────────────────────────────────────────
import AdvancedPdfReader from './AdvancedPdfReader';

const MiniChat = ({ bookName, bookId, onJumpToPage, prefilledInput, onPrefilledConsumed, onHighlights }) => {
    const [msgs,    setMsgs]    = useState([{ role:'assistant', content:`I'm ready! Ask me anything about "${bookName}".` }]);
    const [input,   setInput]   = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);
    const inputRef  = useRef(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

    // Accept pre-filled text from selection popup
    useEffect(() => {
        if (prefilledInput) {
            setInput(prefilledInput);
            inputRef.current?.focus();
            onPrefilledConsumed?.();
            // auto-send after a tiny tick so state is committed
            setTimeout(() => sendMsg(prefilledInput), 80);
        }
    }, [prefilledInput]); // eslint-disable-line

    const sendMsg = useCallback(async (override) => {
        const q = (override ?? input).trim();
        if (!q || loading) return;
        setInput('');
        setMsgs(p => [...p, { role:'user', content: q }]);
        setLoading(true);
        try {
            const body = { query: q };
            if (bookId) body.book_id = bookId;
            const res  = await fetch('/api/chat', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body) });
            const data = await res.json();
            if (res.ok) {
                setMsgs(p => [...p, { role:'assistant', content: data.response, page: data.page || null }]);
                if (data.highlights && data.highlights.length > 0) {
                    onHighlights?.(data.highlights);
                    if (data.highlights[0].page) {
                        onJumpToPage?.(data.highlights[0].page);
                    }
                }
            } else {
                setMsgs(p => [...p, { role:'assistant', content: 'Error: '+data.error }]);
            }
        } catch { setMsgs(p => [...p, { role:'assistant', content: 'Network error.' }]); }
        finally { setLoading(false); }
    }, [input, loading, bookId]);

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background: '#0b0f19' }}>
            <div style={{ flex:1, overflowY:'auto', padding:'20px 16px', display:'flex', flexDirection:'column', gap:12 }}>
                {msgs.map((m,i) => (
                    <div key={i}>
                        <div style={{ display:'flex', justifyContent: m.role==='user'?'flex-end':'flex-start' }}>
                            <div style={{ 
                                maxWidth: '90%', padding: '10px 14px', 
                                borderRadius: m.role==='user' ? '18px 18px 2px 18px' : '2px 18px 18px 18px', 
                                background: m.role==='user' ? '#1e293b' : 'transparent', 
                                border: m.role==='assistant' ? '1px solid var(--border)' : 'none', 
                                fontSize: '0.85rem', lineHeight: 1.6, color: '#f8fafc' 
                            }}>
                                {m.role === 'assistant'
                                    ? m.content.split('\n').map((line, li) => {
                                        if (line.startsWith('- ') || line.startsWith('* '))
                                            return <li key={li} style={{ marginLeft:16, marginBottom:4, color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g,'<strong style="color:white">$1</strong>') }}/>;
                                        if (line.trim() === '') return <div key={li} style={{ height:8 }}/>;
                                        return <p key={li} style={{ marginBottom:6, color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g,'<strong style="color:white">$1</strong>') }}/>;
                                    })
                                    : <span style={{ whiteSpace:'pre-wrap' }}>{m.content}</span>
                                }
                            </div>
                        </div>
                        {/* Page jump button */}
                        {m.role === 'assistant' && m.page && (
                            <div style={{ display:'flex', justifyContent:'flex-start', marginTop:8, paddingLeft:4 }}>
                                <button
                                    onClick={() => onJumpToPage?.(m.page)}
                                    style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:20, border:'1px solid var(--border)', background:'rgba(255,255,255,0.05)', color:'var(--text-secondary)', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.1s' }}
                                    onMouseEnter={e=> { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='#f1f5f9'; }}
                                    onMouseLeave={e=> { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='var(--text-secondary)'; }}
                                >
                                    <FileText size={12}/> Jump to page {m.page}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {loading && <div className="dot-flashing" style={{ display:'flex', gap:6, padding:'12px 14px' }}><span/><span/><span/></div>}
                <div ref={bottomRef}/>
            </div>
            
            {/* Input Bar */}
            <div style={{ padding:'12px 16px 20px', background: '#0b0f19' }}>
                <form onSubmit={(e) => { e.preventDefault(); sendMsg(); }} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#1e293b', borderRadius: 24, padding: '8px 10px 8px 16px', border: '1px solid var(--border)' }}>
                    <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about this book…" style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#f8fafc', fontSize:'0.85rem', fontFamily:'inherit' }}/>
                    <button type="submit" disabled={!input.trim()||loading} style={{ width: 34, height: 34, borderRadius: '50%', background: input.trim() ? '#f8fafc' : '#334155', color: input.trim() ? '#0f172a' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.2s', flexShrink: 0 }}><Send size={14} style={{ marginLeft: 2 }}/></button>
                </form>
            </div>
        </div>
    );
};

// ─── Notes Panel ──────────────────────────────────────────────────────────────
const NotesPanel = ({ bookId }) => {
    const key  = `sc_notes_${bookId}`;
    const [notes, setNotes] = useState(() => { try { return JSON.parse(localStorage.getItem(key)||'[]'); } catch { return []; } });
    const [draft, setDraft] = useState('');
    const save = () => {
        if (!draft.trim()) return;
        const updated = [{ id:Date.now(), text:draft.trim(), ts: new Date().toLocaleTimeString() }, ...notes];
        setNotes(updated); localStorage.setItem(key, JSON.stringify(updated)); setDraft('');
    };
    const del = id => { const n=notes.filter(n=>n.id!==id); setNotes(n); localStorage.setItem(key, JSON.stringify(n)); };
    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background: '#0b0f19' }}>
            <div style={{ padding:'12px 16px', display:'flex', gap:8 }}>
                <textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Type a note…" rows={2} style={{ flex:1, background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:12, color:'#f8fafc', padding:'10px 12px', fontSize:'0.85rem', fontFamily:'inherit', resize:'none', outline:'none', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}/>
                <button onClick={save} style={{ background: '#1e293b', color: 'white', border: '1px solid var(--border)', cursor: 'pointer', padding:'0 14px', borderRadius:12, fontSize:'0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', alignSelf: 'stretch', transition: 'all 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.background='#334155'} onMouseLeave={e=>e.currentTarget.style.background='#1e293b'}>Save</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
                {notes.map(n => (
                    <div key={n.id} className="animate-fade-up" style={{ background:'transparent', border: '1px solid var(--border)', borderRadius:12, padding:'14px', marginBottom:12, position:'relative' }}>
                        <p style={{ color:'#f8fafc', fontSize:'0.85rem', whiteSpace:'pre-wrap', lineHeight:1.5, marginBottom:10 }}>{n.text}</p>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{n.ts}</span>
                            <button onClick={()=>del(n.id)} style={{ background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:4, display:'flex', alignItems:'center', borderRadius:4, transition: 'all 0.2s' }}
                            onMouseEnter={e=> { e.currentTarget.style.color='#ef4444'; e.currentTarget.style.background='rgba(239,68,68,0.1)'; }} onMouseLeave={e=> { e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='transparent'; }}><Trash2 size={13}/></button>
                        </div>
                    </div>
                ))}
                {notes.length===0 && <div style={{ textAlign:'center', marginTop:40, color:'var(--text-muted)', fontSize:'0.85rem' }}>No notes for this book yet.</div>}
            </div>
        </div>
    );
};

// ─── Book Reader (PDF viewer) ─────────────────────────────────────────────────
const BookReader = ({ bookMeta, onBack, user }) => {
    const [pdfUrl,    setPdfUrl]    = useState(null);
    const [iframeSrc, setIframeSrc] = useState(null); // ← React-controlled src
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState(null);
    const [tab,       setTab]       = useState('chat');
    const [pageNum,   setPageNum]   = useState(1);
    const [aiHighlights, setAiHighlights] = useState([]);
    const sc = SUBJECT_COLORS[bookMeta.subject] || SUBJECT_COLORS.General;

    // Selection-to-ask state (works in the right panel)
    const [selPopup,     setSelPopup]     = useState(null);
    const [prefilledMsg, setPrefilledMsg] = useState('');
    const rightPanelRef = useRef(null);
    const userId = user?.id || 'anon';

    // ─── Reading Progress Tracking ───
    const progKey = `sc_prog_${userId}_${bookMeta.id}`;
    const [timeSpent, setTimeSpent] = useState(() => {
        try { return JSON.parse(localStorage.getItem(progKey))?.timeSpent || 0; } catch { return 0; }
    });
    
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeSpent(t => {
                const newT = t + 1;
                localStorage.setItem(progKey, JSON.stringify({ timeSpent: newT }));
                return newT;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [progKey]);

    const formatTime = (secs) => {
        if (secs < 60) return `${secs}s`;
        const m = Math.floor(secs / 60);
        return `${m}m ${secs % 60}s`;
    };

    // ─── Canvas Draw Overlay ───
    const [drawMode, setDrawMode] = useState(false);
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const isDrawing = useRef(false);

    useEffect(() => {
        if (!canvasRef.current) return;
        const cvs = canvasRef.current;
        // Make canvas internal resolution match display size exactly
        cvs.width = cvs.offsetWidth;
        cvs.height = cvs.offsetHeight;
        
        const ctx = cvs.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)'; // Yellow highlighter style
        ctx.lineWidth = 14;
        ctxRef.current = ctx;
        
        // Handle window resize so canvas doesn't warp
        const resize = () => {
            // Save state, resize, restore (crude but works for now)
            cvs.width = cvs.offsetWidth;
            cvs.height = cvs.offsetHeight;
            const context = cvs.getContext('2d');
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.strokeStyle = 'rgba(250, 204, 21, 0.5)';
            context.lineWidth = 14;
            ctxRef.current = context;
        };
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [drawMode]); // Re-init when mode toggles if needed

    const startDraw = (e) => {
        if (!drawMode || !ctxRef.current) return;
        isDrawing.current = true;
        const rect = canvasRef.current.getBoundingClientRect();
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };
    const draw = (e) => {
        if (!isDrawing.current || !drawMode || !ctxRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        ctxRef.current.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctxRef.current.stroke();
    };
    const stopDraw = () => {
        if (!drawMode) return;
        isDrawing.current = false;
        ctxRef.current?.closePath();
    };
    const clearDraw = () => {
        if (!canvasRef.current || !ctxRef.current) return;
        ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    useEffect(() => {
        (async () => {
            try {
                const res  = await fetch(`/api/book/${bookMeta.id}/pdf`);
                const data = await res.json();
                if (res.ok) {
                    setPdfUrl(data.url);
                    setIframeSrc(`${data.url}#toolbar=1&navpanes=0&scrollbar=1`);
                } else {
                    setError(data.error || 'Could not load PDF.');
                }
            } catch { setError('Network error loading PDF.'); }
            finally { setLoading(false); }
        })();
    }, [bookMeta.id]);

    // Jump to page
    const jumpToPage = useCallback((n) => {
        if (!n) return;
        setPageNum(n);
    }, []);

    // Selection popup in the right panel
    const handleRightPanelMouseUp = useCallback(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (text && text.length > 3) {
            const rect = sel.getRangeAt(0).getBoundingClientRect();
            setSelPopup({ x: rect.left + rect.width / 2, y: rect.top, text });
        } else {
            setSelPopup(null);
        }
    }, []);

    const handleSelAskAI = () => {
        if (!selPopup) return;
        const selected = selPopup.text;
        setSelPopup(null);
        window.getSelection()?.removeAllRanges();
        setTab('chat');
        setPrefilledMsg(selected);
    };

    useEffect(() => {
        const hide = (e) => { if (!e.target.closest('[data-sel-popup]')) setSelPopup(null); };
        document.addEventListener('mousedown', hide);
        return () => document.removeEventListener('mousedown', hide);
    }, []);

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
            {selPopup && <SelectionPopup position={selPopup} onAskAI={handleSelAskAI} />}

            {/* Topbar */}
            <div style={{ padding:'10px 20px', borderBottom:'1px solid var(--border)', background:'#0b0f19', display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
                <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, border:'1px solid var(--border)', background:'#1e293b', color:'var(--text-secondary)', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, fontFamily:'inherit', transition:'all 0.2s', whiteSpace:'nowrap' }}
                onMouseEnter={e=>e.currentTarget.style.color='white'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-secondary)'}
                ><ArrowLeft size={13}/> Back</button>
                <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:700, fontSize:'0.9rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {bookMeta.filename.replace('.pdf','').replace(/_/g,' ')}
                    </p>
                    <span style={{ fontSize:'0.7rem', color:sc.color, fontWeight:600 }}>{bookMeta.subject||'General'}</span>
                </div>
                {pageNum && (
                    <span style={{ fontSize:'0.72rem', color:'#818cf8', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.3)', padding:'4px 10px', borderRadius:8 }}>
                        Page {pageNum}
                    </span>
                )}
                {/* Reading Progress */}
                <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', background:'rgba(255,255,255,0.05)', borderRadius:20, border:'1px solid rgba(255,255,255,0.1)' }}>
                    <Clock size={12} color="var(--text-muted)"/>
                    <span style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)' }}>{formatTime(timeSpent)}</span>
                </div>
                <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', padding:'4px 10px', borderRadius:8 }}>
                    Gr{bookMeta.min_grade}+
                </span>
            </div>

            {/* Split: PDF viewer + right panel */}
            <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

                {/* PDF viewer */}
                <div style={{ flex:1, background:'#1a1a2e', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' }}>
                    {loading && (
                        <div style={{ textAlign:'center' }}>
                            <div className="spin" style={{ width:40,height:40,border:'3px solid rgba(99,102,241,0.2)',borderTopColor:'#6366f1',borderRadius:'50%',margin:'0 auto 14px' }}/>
                            <p style={{ color:'var(--text-muted)', fontSize:'0.88rem' }}>Loading PDF…</p>
                        </div>
                    )}
                    {error && (
                        <div style={{ textAlign:'center', padding:40 }}>
                            <BookOpen size={44} style={{ color:'var(--text-muted)', opacity:0.3, margin:'0 auto 16px', display:'block' }}/>
                            <p style={{ color:'#f87171', marginBottom:8 }}>{error}</p>
                            <p style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>The PDF may not have been stored in the file bucket. Try re-uploading.</p>
                        </div>
                    )}
                    {!loading && !error && pdfUrl && (
                        <AdvancedPdfReader 
                            pdfUrl={pdfUrl} 
                            initialPage={pageNum}
                            onPageChange={(p) => setPageNum(p)}
                            aiHighlights={aiHighlights}
                            onAskAI={text => {
                                setTab('chat');
                                setPrefilledMsg(text);
                            }}
                        />
                    )}
                </div>

                {/* Right panel */}
                <div ref={rightPanelRef} style={{ width: 340, flexShrink: 0, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: '#0b0f19' }} onMouseUp={handleRightPanelMouseUp}>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 8px', marginTop: 8 }}>
                        {[{id:'chat',icon:<Bot size={16}/>,label:'Ask AI'},{id:'notes',icon:<StickyNote size={16}/>,label:'My Notes'}].map(t=>(
                            <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, padding:'14px 12px', display:'flex', alignItems:'center', justifyContent:'center', gap:8, border:'none', background:'transparent', color:tab===t.id?'#f8fafc':'var(--text-secondary)', fontWeight:tab===t.id?600:500, fontSize:'0.85rem', cursor:'pointer', fontFamily:'inherit', borderBottom:tab===t.id?'2px solid #818cf8':'2px solid transparent', transition:'all 0.2s', transform: tab===t.id?'translateY(1px)':'none' }}>
                                {t.icon}{t.label}
                            </button>
                        ))}
                    </div>
                    <div style={{ flex:1, overflow:'hidden' }}>
                        {tab==='chat'
                            ? <MiniChat
                                bookName={bookMeta.filename.replace('.pdf','')}
                                bookId={bookMeta.id}
                                onJumpToPage={jumpToPage}
                                prefilledInput={prefilledMsg}
                                onPrefilledConsumed={() => setPrefilledMsg('')}
                                onHighlights={h => setAiHighlights(h)}
                              />
                            : <NotesPanel bookId={bookMeta.id}/>
                        }
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes selPopIn {
                    from { opacity:0; transform:translate(-50%,6px); }
                    to   { opacity:1; transform:translate(-50%,0);   }
                }
            `}</style>
        </div>
    );
};

// ─── BookLibrary (main BookAI view) ──────────────────────────────────────────
const BookLibrary = ({ user }) => {
    const [books,      setBooks]      = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [activeBook, setActiveBook] = useState(null);
    const [filter,     setFilter]     = useState('all');
    const gradeLevel = user?.grade_level ? parseInt(user.grade_level) : null;

    useEffect(() => {
        fetch('/api/library').then(r=>r.json()).then(d=>{ if(d.books) setBooks(d.books); }).catch(()=>{}).finally(()=>setLoading(false));
    }, []);

    if (activeBook) return <BookReader bookMeta={activeBook} onBack={()=>setActiveBook(null)} user={user}/>;

    const eligible = books.filter(b => {
        if (gradeLevel === null) return true;
        const min = parseInt(b.min_grade) || 8;
        const max = parseInt(b.max_grade) || min;
        return gradeLevel >= min && gradeLevel <= max;
    });
    const subjects  = [...new Set(eligible.map(b => b.subject || 'General'))].sort();
    const grouped   = subjects.reduce((acc, s) => { acc[s] = eligible.filter(b=>(b.subject||'General')===s); return acc; }, {});
    const filtered  = filter==='all' ? grouped : { [filter]: grouped[filter]||[] };

    return (
        <div style={{ height:'100%', overflowY:'auto' }}>
            <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 28px' }}>
                <div style={{ marginBottom:24 }}>
                    <h1 style={{ fontSize:'1.6rem', fontWeight:800, letterSpacing:'-0.03em', marginBottom:4 }}>
                        📚 Book<span style={{ color: '#818cf8' }}>AI</span>
                    </h1>
                    <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem' }}>
                        {gradeLevel
                            ? <>{eligible.length} book{eligible.length!==1?'s':''} available for <strong style={{ color:'#818cf8' }}>Grade {gradeLevel}</strong>.</>
                            : `${eligible.length} book${eligible.length!==1?'s':''} in your library.`}
                    </p>
                </div>

                {subjects.length > 1 && (
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:26 }}>
                        <button onClick={()=>setFilter('all')} className="chip" style={{ borderColor:filter==='all'?'var(--accent)':'var(--border)', color:filter==='all'?'#818cf8':'var(--text-secondary)', background:filter==='all'?'rgba(99,102,241,0.08)':'var(--bg-card)' }}>All subjects</button>
                        {subjects.map(s => { const sc=SUBJECT_COLORS[s]||SUBJECT_COLORS.General; return (
                            <button key={s} onClick={()=>setFilter(s)} className="chip" style={{ borderColor:filter===s?sc.border:'var(--border)', color:filter===s?sc.color:'var(--text-secondary)', background:filter===s?sc.bg:'var(--bg-card)' }}>{s}</button>
                        ); })}
                    </div>
                )}

                {loading && <div style={{ textAlign:'center', paddingTop:80 }}><div className="spin" style={{ width:36,height:36,border:'3px solid rgba(99,102,241,0.2)',borderTopColor:'#6366f1',borderRadius:'50%',margin:'0 auto 14px' }}/><p style={{ color:'var(--text-muted)' }}>Loading library…</p></div>}
                {!loading && eligible.length===0 && (
                    <div style={{ textAlign:'center', paddingTop:80, color:'var(--text-muted)' }}>
                        <BookOpen size={52} style={{ margin:'0 auto 16px', opacity:0.15, display:'block' }}/>
                        <p style={{ fontSize:'1rem', fontWeight:600, marginBottom:8 }}>No books available yet</p>
                        <p style={{ fontSize:'0.85rem' }}>{gradeLevel ? `No books uploaded for Grade ${gradeLevel} yet. Ask your teacher!` : 'No books uploaded yet.'}</p>
                    </div>
                )}

                {!loading && Object.entries(filtered).map(([subject, bks]) => bks.length===0 ? null : (
                    <div key={subject} style={{ marginBottom:36 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                            <div style={{ width:9,height:9,borderRadius:'50%',background:(SUBJECT_COLORS[subject]||SUBJECT_COLORS.General).color }}/>
                            <h2 style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-secondary)', letterSpacing:'0.06em', textTransform:'uppercase' }}>{subject}</h2>
                            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                            <span style={{ fontSize:'0.73rem', color:'var(--text-muted)' }}>{bks.length} book{bks.length!==1?'s':''}</span>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:14 }}>
                            {bks.map(book => {
                                const sc = SUBJECT_COLORS[book.subject]||SUBJECT_COLORS.General;
                                return (
                                    <button key={book.id} onClick={()=>setActiveBook(book)} style={{ display:'flex',flexDirection:'column',gap:12,padding:'18px 16px',borderRadius:14,border:'1px solid var(--border)',background:'#1e293b',cursor:'pointer',textAlign:'left',fontFamily:'inherit',transition:'all 0.2s',position:'relative',overflow:'hidden' }}
                                    onMouseEnter={e=>{e.currentTarget.style.borderColor='#475569';}}
                                    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';}}
                                    >
                                        <div style={{ position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${sc.color},transparent)`,borderRadius:'14px 14px 0 0' }}/>
                                        <BookThumbnail bookId={book.id} sc={sc} />
                                        <div style={{ flex:1 }}>
                                            <p style={{ fontWeight:700,fontSize:'0.88rem',color:'var(--text-primary)',lineHeight:1.4,marginBottom:4 }}>
                                                {(book.title || book.filename.replace('.pdf','').replace(/_/g,' '))}
                                            </p>
                                            {book.author && <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:4 }}>by {book.author}</p>}
                                            <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                                                <span style={{ fontSize:'0.7rem',color:sc.color,fontWeight:600 }}>{book.subject||'General'}</span>
                                                <span style={{ color:'var(--text-muted)',fontSize:'0.7rem' }}>· Gr{book.min_grade}+</span>
                                            </div>
                                        </div>
                                        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                                            <span style={{ fontSize:'0.68rem',color:'var(--text-muted)' }}>{new Date(book.upload_date).toLocaleDateString()}</span>
                                            <div style={{ display:'flex',alignItems:'center',gap:4,color:sc.color,fontSize:'0.75rem',fontWeight:600 }}>Open <ChevronRight size={13}/></div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BookLibrary;
