import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, BookOpen, Clock, PenTool, LayoutTemplate, ShieldCheck, CheckCircle, Zap, Upload } from 'lucide-react';

// Update this version string whenever we want the popup to show again!
const CURRENT_VERSION = 'v2.1.0';

const ChangelogPopup = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const lastSeen = localStorage.getItem('studycore_changelog_version');
        if (lastSeen !== CURRENT_VERSION) {
            // Slight delay so it doesn't pop instantly on load
            const timer = setTimeout(() => setIsOpen(true), 1200);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('studycore_changelog_version', CURRENT_VERSION);
    };

    if (!isOpen) return null;

    const changes = [
        {
            icon: <Sparkles size={18} color="#818cf8"/>,
            title: 'Full Website Translation & RTL Support',
            desc: 'Teacher Assist now natively supports English, Arabic, and Turkish! Arabic includes full Right-to-Left (RTL) layout switching.'
        },
        {
            icon: <BookOpen size={18} color="#fbbf24"/>,
            title: 'Advanced PDF Reader',
            desc: 'We completely rewrote the PDF reader. Enjoy smooth page transitions, high-quality rendering, and a much cleaner interface.'
        },
        {
            icon: <PenTool size={18} color="#4ade80"/>,
            title: 'AI Highlights & Sticky Notes',
            desc: 'The AI can now directly interact with your documents! When you ask a question, the AI will highlight exact text on the page and place sticky-note annotations.'
        },
        {
            icon: <LayoutTemplate size={18} color="#818cf8"/>,
            title: 'Auto-Generated Book Covers',
            desc: 'The Library will now automatically render high-resolution thumbnails of the first page of your PDFs instead of simple icons.'
        },
        {
            icon: <ShieldCheck size={18} color="#4ade80"/>,
            title: 'Redis Caching & Security',
            desc: 'Added robust Redis backend caching for blazing-fast performance, and a strict profanity & reserved-name blocker for new student accounts.'
        }
    ];

    return (
        <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }}>
            <div className="glass animate-fade-up" style={{ width:'100%', maxWidth:540, position:'relative', borderRadius:20, overflow:'hidden', border:'1px solid rgba(99,102,241,0.3)', boxShadow:'0 12px 40px rgba(0,0,0,0.5)' }}>
                {/* Header */}
                <div style={{ padding:'24px 28px', background:'linear-gradient(135deg,rgba(79,70,229,0.15),rgba(124,58,237,0.05))', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                        <div style={{ width:46, height:46, borderRadius:14, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(99,102,241,0.4)', flexShrink:0 }}>
                            <Sparkles size={22} color="white"/>
                        </div>
                        <div>
                            <h2 style={{ fontSize:'1.3rem', fontWeight:800, letterSpacing:'-0.03em', marginBottom:2 }}>What's New! 🎉</h2>
                            <p style={{ color:'var(--text-secondary)', fontSize:'0.85rem' }}>Update {CURRENT_VERSION} — Huge new features.</p>
                        </div>
                    </div>
                    <button onClick={handleClose} style={{ background:'rgba(255,255,255,0.06)', border:'none', width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.color='white';e.currentTarget.style.background='rgba(239,68,68,0.2)';}} onMouseLeave={e=>{e.currentTarget.style.color='var(--text-muted)';e.currentTarget.style.background='rgba(255,255,255,0.06)';}}>
                        <X size={16}/>
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:20, maxHeight:'60vh', overflowY:'auto' }}>
                    {changes.map((c, i) => (
                        <div key={i} style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                                {c.icon}
                            </div>
                            <div>
                                <h3 style={{ fontSize:'0.95rem', fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{c.title}</h3>
                                <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', lineHeight:1.5 }}>{c.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{ padding:'18px 28px', borderTop:'1px solid var(--border)', background:'rgba(0,0,0,0.2)', display:'flex', justifyContent:'flex-end' }}>
                    <button onClick={handleClose} className="btn-gradient" style={{ padding:'10px 24px', fontSize:'0.9rem', borderRadius:10, display:'flex', alignItems:'center', gap:8 }}>
                        Got it! Let's go <BookOpen size={14}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangelogPopup;
