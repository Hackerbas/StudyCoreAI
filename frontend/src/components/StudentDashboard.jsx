import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Baby, GraduationCap, ChevronDown, Check, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { trackEvent } from './StatsView';
import { useLanguage } from '../contexts/LanguageContext';

const STORAGE_KEY = 'studycore_chat_history';

const AI_MODES = [
    { id: 'normal', icon: Lightbulb, name: 'Core Tutor', desc: 'Balanced, clear explanations' },
    { id: 'simple', icon: Baby, name: 'Beginner', desc: 'Simple words and analogies' },
    { id: 'advanced', icon: GraduationCap, name: 'Scholar', desc: 'Detailed academic analysis' },
];


const StudentDashboard = ({ chatMessages = [], setChatMessages, createNewChat }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [level, setLevel] = useState('normal');
    const [showModeSelect, setShowModeSelect] = useState(false);
    const { t } = useLanguage();

    const AI_MODES = [
        { id: 'normal', icon: Lightbulb, name: t('core_tutor'), desc: t('core_tutor_desc') || 'Balanced, clear explanations' },
        { id: 'simple', icon: Baby, name: t('beginner'), desc: t('beginner_desc') || 'Simple words and analogies' },
        { id: 'advanced', icon: GraduationCap, name: t('scholar'), desc: t('scholar_desc') || 'Detailed academic analysis' },
    ];
    
    // Book selection state
    const [books, setBooks] = useState([]);
    const [selectedBookId, setSelectedBookId] = useState(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        fetch('/api/library').then(r=>r.json()).then(d=>{ if(d.books) setBooks(d.books); }).catch(()=>{});
    }, []);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

    const sendMessage = async (q) => {
        const query = (q || input).trim();
        if (!query || loading) return;
        
        const newMsgList = [...chatMessages, { role: 'user', content: query }];
        setChatMessages(newMsgList);
        setInput(''); setLoading(true);
        trackEvent('question_asked');
        
        try {
            const body = { query, mode: level };
            if (selectedBookId) body.book_id = selectedBookId;
            const res = await fetch('/api/chat', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(body) 
            });
            const data = await res.json();
            setChatMessages([...newMsgList, { role: 'assistant', content: res.ok ? data.response : 'Error: ' + data.error }]);
        } catch { 
            setChatMessages([...newMsgList, { role: 'assistant', content: 'Network error.' }]); 
        } finally { 
            setLoading(false); 
        }
    };

    const isChatEmpty = chatMessages.length === 0 && !loading;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden', background: '#0b0f19' }}>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: isChatEmpty ? '24px 0 0 0' : '24px 0', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
                {isChatEmpty ? (
                    <div className="animate-fade-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '10vh' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 600, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 32 }}>{t('what_working_on')}</h1>
                        <div style={{ width: '100%', maxWidth: 900, paddingInline: 32, boxSizing: 'border-box' }}>
                            <form onSubmit={e => { e.preventDefault(); sendMessage(); }} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#1e293b', borderRadius: 24, padding: '12px 12px 12px 20px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)' }}>
                                <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={t('ask_anything')} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '1.05rem', fontFamily: 'inherit' }} />
                                <button type="submit" disabled={!input.trim() || loading} style={{ width: 42, height: 42, borderRadius: '50%', background: input.trim() ? '#e2e8f0' : '#334155', color: input.trim() ? '#0f172a' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.2s', padding: 0 }}>
                                    <Send size={18} style={{ marginLeft: 2 }} />
                                </button>
                            </form>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 24 }}>
                                <select 
                                    value={selectedBookId || ''} 
                                    onChange={e => setSelectedBookId(e.target.value || null)}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '8px 16px', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}
                                >
                                    <option value="">📚 All Knowledge</option>
                                    {books.map(b => (
                                        <option key={b.id} value={b.id}>{b.title || b.filename.replace('.pdf','')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                ) : (
                <div style={{ maxWidth: 900, width: '100%', margin: '0 auto', paddingInline: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {chatMessages.map((msg, idx) => (
                        <div key={idx} className="animate-fade-up" style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                            <div style={{ display: 'flex', gap: 14, maxWidth: msg.role === 'user' ? '75%' : '92%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: msg.role === 'user' ? '#334155' : 'transparent', border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.1)' : 'none', marginTop: 4 }}>
                                    {msg.role === 'user' ? <User size={14} color="#f8fafc" /> : <Bot size={16} color="#818cf8" />}
                                </div>
                                <div style={{ padding: msg.role === 'user' ? '10px 16px' : '6px 0', borderRadius: 14, background: msg.role === 'user' ? '#1e293b' : 'transparent' }}>
                                    {msg.role === 'user' ? (
                                        <p style={{ color: '#f8fafc', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{msg.content}</p>
                                    ) : (
                                        <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.65, wordBreak: 'break-word', margin: 0 }} className="markdown-body">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', marginTop: 4 }}><Bot size={16} color="#818cf8" /></div>
                            <div style={{ padding: '8px 0', color: 'var(--text-muted)' }}>
                                <div className="dot-flashing" style={{ display: 'flex', gap: 4, height: 16, alignItems: 'center' }}><span /><span /><span /></div>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
                )}
            </div>

            {/* Bottom zone (only shown if not empty) */}
            {!isChatEmpty && (
            <div style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
                {/* Explanation level + chips row */}
                <div style={{ maxWidth: 900, margin: '0 auto', paddingInline: 32, paddingBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    
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
                    <select 
                        value={selectedBookId || ''} 
                        onChange={e => setSelectedBookId(e.target.value || null)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 14px', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', outline: 'none', maxWidth: 200, textOverflow: 'ellipsis' }}
                    >
                        <option value="">📚 {t('all_knowledge')}</option>
                        {books.map(b => (
                            <option key={b.id} value={b.id}>{b.title || b.filename.replace('.pdf','')}</option>
                        ))}
                    </select>
                </div>

                <div style={{ padding: '12px 32px 24px', maxWidth: 900, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                    <form onSubmit={e => { e.preventDefault(); sendMessage(); }} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: '#1e293b', borderRadius: 16, padding: '8px 8px 8px 16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' }}>
                        <textarea 
                            value={input} 
                            onChange={e => setInput(e.target.value)} 
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder={t('ask_anything')} 
                            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'none', minHeight: '24px', maxHeight: '200px', padding: '6px 0', lineHeight: 1.5 }} 
                            rows={1}
                        />
                        <button type="submit" disabled={!input.trim() || loading} style={{ width: 36, height: 36, borderRadius: '50%', background: input.trim() ? '#e2e8f0' : '#334155', color: input.trim() ? '#0f172a' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.2s', padding: 0 }}>
                            <Send size={16} style={{ marginLeft: 2 }} />
                        </button>
                    </form>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6, paddingInline: 2 }}>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Sparkles size={10} />Only uses your uploaded books.
                        </p>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default StudentDashboard;
