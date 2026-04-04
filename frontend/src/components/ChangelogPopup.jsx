import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, BookOpen, Clock, PenTool, LayoutTemplate, ShieldCheck, CheckCircle, Zap, Upload } from 'lucide-react';

// Update this version string whenever we want the popup to show again!
const CURRENT_VERSION = 'v1.5.0';

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
            title: 'Targeted Book Chat',
            desc: 'You can now select a specific book from the dropdown before chatting! The AI will strictly focus only on that book instead of searching the entire library, making responses incredibly fast and hyper-accurate.'
        },
        {
            icon: <Zap size={18} color="#fbbf24"/>,
            title: 'ELI5 Beginner Engine',
            desc: 'The "Beginner" AI mode has been completely rewritten. It now aggressively uses an ELI5 (Explain Like I\'m 5) structure with fun analogies, completely stripping out complex academic jargon.'
        },
        {
            icon: <CheckCircle size={18} color="#4ade80"/>,
            title: 'Multiple Chats & Clean UI',
            desc: 'Your chats are now explicitly saved individually in the left sidebar! You can rename or delete them. Oh, and the chat UI got a major visual cleanup—it\'s now clean, flat, and Google-like.'
        },
        {
            icon: <Upload size={18} color="#818cf8"/>,
            title: 'Admin Panel — Full Revamp',
            desc: 'Upload form now accepts Book Title, Author, Min/Max Grade Range, Year, and Description. Library has search & filter, colour-coded cards, stats bar, and an Edit button to update metadata without re-uploading.'
        },
        {
            icon: <Zap size={18} color="#4ade80"/>,
            title: 'Quiz Mode Fixed',
            desc: 'Fixed a bug that caused quiz generation to crash silently. Quizzes now generate reliably for all subjects and difficulty levels.'
        },
        {
            icon: <CheckCircle size={18} color="#4ade80"/>,
            title: 'Study Plan — Fixed Result Mixing',
            desc: 'Weekly Plans and SRS Worksheets are now strictly isolated in their own tabs. No more results bleeding into each other or requiring a scroll to find.'
        },
        {
            icon: <Zap size={18} color="#fbbf24"/>,
            title: 'Dropdown Menus Fixed',
            desc: 'All dropdowns across the app now use a proper forced dark theme — no more unreadable white text on white background.'
        },
        {
            icon: <BookOpen size={18} color="#818cf8"/>,
            title: 'BookAI Renders Better',
            desc: 'AI answers in BookAI now render with proper formatting — bold text, bullet points, and paragraph spacing instead of raw text.'
        },
        {
            icon: <ShieldCheck size={18} color="#4ade80"/>,
            title: 'Strict AI Grounding',
            desc: 'The AI is now strictly locked to your books and will refuse to use outside knowledge to answer questions.'
        },
        {
            icon: <PenTool size={18} color="#fbbf24"/>,
            title: 'PDF Drawing Overlay',
            desc: 'Click "Draw" in the BookReader to highlight and draw directly over your PDFs with a digital highlighter.'
        },
        {
            icon: <LayoutTemplate size={18} color="#818cf8"/>,
            title: 'AI Study Plan Generator',
            desc: 'A massive new Dashboard tab. Let the AI analyse your library and build a focused 5-day study curriculum.'
        },
        {
            icon: <Clock size={18} color="#a78bfa"/>,
            title: 'Reading Time Tracker',
            desc: 'We now track how many minutes you spend studying each book. Check the top bar next time you open one!'
        },
        {
            icon: <Check size={18} color="#22c55e"/>,
            title: 'Turkish Support & UI Fixes',
            desc: 'Added Turkish language to BookAI and fixed the dark dropdowns on Windows/macOS.'
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
