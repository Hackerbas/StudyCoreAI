import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { trackEvent } from './StatsView';

const STORAGE_KEY = 'studycore_chat_history';

const LEVELS = [
    { id: 'simple', label: '🧒 Simple', prefix: 'Explain in very simple terms, as if I am a child: ' },
    { id: 'normal', label: '📖 Normal', prefix: '' },
    { id: 'advanced', label: '🔬 Advanced', prefix: 'Give a detailed, technical explanation of the following: ' },
];

const CHIPS = [
    { label: '📋 What topics are covered?', query: 'What are the main topics covered in the uploaded documents?' },
    { label: '💡 Explain a key concept', query: 'Pick an important concept from the books and explain it.' },
    { label: '🧠 Give me a study tip', query: 'Give me a useful study tip based on the content in the library.' },
    { label: '📝 Make a study plan', query: 'Create a short study plan for the material in my library.' },
];

const StudentDashboard = () => {
    const [messages, setMessages] = useState(() => {
        try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : [{ role: 'assistant', content: "Hello! I'm **StudyCore AI** — your personal tutor powered by your uploaded books.\n\nAsk me anything, or use the quick buttons below to get started!" }]; }
        catch { return [{ role: 'assistant', content: "Hello! I'm StudyCore AI." }]; }
    });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [level, setLevel] = useState('normal');
    const bottomRef = useRef(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60))); }, [messages]);

    const sendMessage = async (q) => {
        const levelDef = LEVELS.find(l => l.id === level);
        const query = levelDef.prefix + (q || input).trim();
        if (!query.trim() || loading) return;
        const display = (q || input).trim();
        setMessages(p => [...p, { role: 'user', content: display }]);
        setInput(''); setLoading(true);
        trackEvent('question_asked');
        try {
            const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
            const data = await res.json();
            setMessages(p => [...p, { role: 'assistant', content: res.ok ? data.response : 'Error: ' + data.error }]);
        } catch { setMessages(p => [...p, { role: 'assistant', content: 'Network error.' }]); }
        finally { setLoading(false); }
    };

    const clearChat = () => {
        const init = [{ role: 'assistant', content: 'Chat cleared! What would you like to study?' }];
        setMessages(init); localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
            {/* Ambient glows */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
                <div style={{ position: 'absolute', top: -100, right: -100, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.05) 0%,transparent 70%)' }} />
                <div style={{ position: 'absolute', bottom: -60, left: -60, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.04) 0%,transparent 70%)' }} />
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: 760, width: '100%', margin: '0 auto', paddingInline: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className="animate-fade-up" style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                            <div style={{ display: 'flex', gap: 10, maxWidth: '80%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                                <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: msg.role === 'user' ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#0f172a,#1e293b)', border: msg.role === 'assistant' ? '1px solid rgba(99,102,241,0.25)' : 'none', boxShadow: msg.role === 'user' ? '0 4px 12px rgba(99,102,241,0.28)' : 'none' }}>
                                    {msg.role === 'user' ? <User size={12} color="white" /> : <Bot size={12} color="#818cf8" />}
                                </div>
                                <div style={{ padding: '12px 16px', borderRadius: msg.role === 'user' ? '17px 4px 17px 17px' : '4px 17px 17px 17px', background: msg.role === 'user' ? 'linear-gradient(135deg,rgba(79,70,229,0.22),rgba(124,58,237,0.17))' : 'rgba(255,255,255,0.04)', border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.25)' : 'var(--border)'}`, backdropFilter: 'blur(8px)' }}>
                                    {msg.role === 'user' ? (
                                        <p style={{ color: '#e0e7ff', fontSize: '0.91rem', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{msg.content}</p>
                                    ) : (
                                        <div style={{ color: 'var(--text-primary)', fontSize: '0.91rem', lineHeight: 1.75, wordBreak: 'break-word', margin: 0 }} className="markdown-body">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#0f172a,#1e293b)', border: '1px solid rgba(99,102,241,0.25)' }}><Bot size={12} color="#818cf8" /></div>
                            <div style={{ padding: '12px 16px', borderRadius: '4px 17px 17px 17px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                                <div className="dot-flashing" style={{ display: 'flex', gap: 4 }}><span /><span /><span /></div>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Bottom zone */}
            <div style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
                {/* Explanation level + chips row */}
                <div style={{ maxWidth: 760, margin: '0 auto', paddingInline: 28, paddingBottom: 8, display: 'flex', gap: 8, flexWrap: 'nowrap', overflowX: 'auto', alignItems: 'center' }}>
                    {/* Level selector */}
                    <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, flexShrink: 0 }}>
                        {LEVELS.map(l => (
                            <button key={l.id} onClick={() => setLevel(l.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', fontFamily: 'inherit', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', background: level === l.id ? 'rgba(99,102,241,0.2)' : 'transparent', color: level === l.id ? '#818cf8' : 'var(--text-muted)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                                {l.label}
                            </button>
                        ))}
                    </div>
                    {CHIPS.map((c, i) => (
                        <button key={i} className="chip" onClick={() => sendMessage(c.query)} style={{ whiteSpace: 'nowrap' }}>{c.label}</button>
                    ))}
                </div>

                {/* Input */}
                <div style={{ padding: '6px 28px 18px', maxWidth: 760, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                    <form onSubmit={e => { e.preventDefault(); sendMessage(); }} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 15, padding: '8px 8px 8px 18px', transition: 'border-color 0.2s' }}>
                        <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything about your library…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.91rem', fontFamily: 'inherit' }} />
                        <button type="submit" disabled={!input.trim() || loading} className="btn-gradient" style={{ padding: '9px 18px', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.84rem', borderRadius: 9, whiteSpace: 'nowrap' }}>
                            <Send size={13} /> Send
                        </button>
                    </form>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingInline: 2 }}>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Sparkles size={10} />Only uses your uploaded books.
                        </p>
                        <button onClick={clearChat} style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >Clear chat</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
