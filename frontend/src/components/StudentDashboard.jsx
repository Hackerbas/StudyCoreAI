import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Baby, GraduationCap, ChevronDown, Check, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { trackEvent } from './StatsView';

const STORAGE_KEY = 'studycore_chat_history';

const AI_MODES = [
    { id: 'normal', icon: Lightbulb, name: 'Core Tutor', desc: 'Balanced, clear explanations', prefix: '' },
    { id: 'simple', icon: Baby, name: 'Beginner', desc: 'Simple words and analogies', prefix: 'Explain in very simple terms, as if I am a beginner: ' },
    { id: 'advanced', icon: GraduationCap, name: 'Scholar', desc: 'Detailed academic analysis', prefix: 'Give a detailed, technical explanation of the following: ' },
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
    const [showModeSelect, setShowModeSelect] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60))); }, [messages]);

    const sendMessage = async (q) => {
        const modeDef = AI_MODES.find(l => l.id === level);
        const query = modeDef.prefix + (q || input).trim();
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
                <div style={{ maxWidth: 760, margin: '0 auto', paddingInline: 28, paddingBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    
                    {/* Model selector dropdown */}
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setShowModeSelect(!showModeSelect)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 14px', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                            {(() => {
                                const mode = AI_MODES.find(m => m.id === level);
                                const Icon = mode.icon;
                                return <><Icon size={14} color="#818cf8"/> {mode.name} <ChevronDown size={14} color="var(--text-muted)"/></>;
                            })()}
                        </button>

                        {showModeSelect && (
                            <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 8, zIndex: 100 }}>
                                <div style={{ position: 'fixed', inset: 0, zIndex: 101 }} onClick={() => setShowModeSelect(false)} />
                                <div className="animate-fade-up" style={{ position: 'relative', background: '#0f172a', border: '1px solid var(--border)', borderRadius: 12, padding: 6, display: 'flex', flexDirection: 'column', gap: 2, width: 250, boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.2)', zIndex: 102, transformOrigin: 'bottom left' }}>
                                    {AI_MODES.map(mode => {
                                        const Icon = mode.icon;
                                        const isActive = level === mode.id;
                                        return (
                                            <button key={mode.id} onClick={() => { setLevel(mode.id); setShowModeSelect(false); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', width: '100%' }}
                                            onMouseEnter={e => { if(!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                            onMouseLeave={e => { if(!isActive) e.currentTarget.style.background = 'transparent'; }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Icon size={16} color={isActive ? '#818cf8' : 'var(--text-secondary)'} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isActive ? '#ffffff' : 'var(--text-primary)' }}>{mode.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: isActive ? '#a5b4fc' : 'var(--text-muted)', marginTop: 2 }}>{mode.desc}</div>
                                                </div>
                                                {isActive && <Check size={16} color="#818cf8" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 2px', flexShrink: 0 }} />
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
