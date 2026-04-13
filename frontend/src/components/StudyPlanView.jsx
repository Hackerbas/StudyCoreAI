import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Sparkles, BookOpen, CheckCircle, Target, Download } from 'lucide-react';

const PLAN_TYPE_WEEKLY = 'weekly';
const PLAN_TYPE_SRS    = 'srs';

// ─── Markdown-lite renderer for the worksheet ─────────────────────────────────
const MarkdownBlock = ({ text }) => {
    if (!text) return null;
    return (
        <div style={{ lineHeight:1.7 }}>
            {text.split('\n').map((line, i) => {
                if (line.startsWith('### '))
                    return <h3 key={i} style={{ fontSize:'1.05rem', color:'var(--text-primary)', fontWeight:700, margin:'20px 0 10px' }}>{line.slice(4)}</h3>;
                if (line.startsWith('## '))
                    return <h2 key={i} style={{ fontSize:'1.2rem', color:'var(--text-primary)', fontWeight:800, margin:'24px 0 12px', paddingBottom:8, borderBottom:'1px solid var(--border)' }}>{line.slice(3)}</h2>;
                if (line.startsWith('# '))
                    return <h1 key={i} style={{ fontSize:'1.4rem', color:'var(--text-primary)', fontWeight:800, margin:'16px 0 18px' }}>{line.slice(2)}</h1>;
                if (line.startsWith('- ') || line.startsWith('* '))
                    return <li key={i} style={{ marginLeft:22, marginBottom:7, fontSize:'0.9rem' }} dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>') }}/>;
                if (line.trim() === '')
                    return <div key={i} style={{ height:10 }}/>;
                return <p key={i} style={{ fontSize:'0.91rem', marginBottom:10 }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>') }}/>;
            })}
        </div>
    );
};

// ─── Download as text file ────────────────────────────────────────────────────
const downloadTxt = (text, filename) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

const StudyPlanView = () => {
    const [plan,     setPlan]     = useState(null);
    const [worksheet, setWorksheet] = useState(null);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState(null);
    const [subjects, setSubjects] = useState(['All']);
    const [subject,  setSubject]  = useState('All');
    const [planType, setPlanType] = useState(PLAN_TYPE_WEEKLY);
    const topRef = useRef(null);

    // ── Load cached state ────────────────────────────────────────────────────
    useEffect(() => {
        try {
            const savedPlan = localStorage.getItem('studycore_plan');
            if (savedPlan) setPlan(JSON.parse(savedPlan));
            const savedSrs = localStorage.getItem('studycore_srs');
            if (savedSrs) setWorksheet(savedSrs);
        } catch {}

        fetch('/api/library')
            .then(r => r.json())
            .then(data => {
                if (data.books?.length) {
                    const subs = ['All', ...new Set(data.books.map(b => b.subject || 'General'))];
                    setSubjects(subs);
                }
            })
            .catch(() => {});
    }, []);

    // ── Scroll to top when planType changes ──────────────────────────────────
    useEffect(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [planType]);

    // ── Generate ─────────────────────────────────────────────────────────────
    const generate = async () => {
        setLoading(true);
        setError(null);
        try {
            if (planType === PLAN_TYPE_WEEKLY) {
                const res  = await fetch('/api/study_plan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subject }),
                });
                const data = await res.json();
                if (res.ok && data.plan) {
                    setPlan(data.plan);
                    localStorage.setItem('studycore_plan', JSON.stringify(data.plan));
                } else {
                    setError(data.error || 'Failed to generate plan.');
                }
            } else {
                let chatHistory = [];
                try {
                    const saved = localStorage.getItem('studycore_chat_history');
                    if (saved) chatHistory = JSON.parse(saved);
                } catch {}

                const res  = await fetch('/api/srs_worksheet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subject, chat_history: chatHistory }),
                });
                const data = await res.json();
                if (res.ok && data.worksheet) {
                    setWorksheet(data.worksheet);
                    localStorage.setItem('studycore_srs', data.worksheet);
                } else {
                    setError(data.error || 'Failed to generate worksheet.');
                }
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const hasResult = planType === PLAN_TYPE_WEEKLY ? !!plan : !!worksheet;
    const genLabel  = loading
        ? 'Generating…'
        : planType === PLAN_TYPE_WEEKLY
            ? (plan      ? 'Regenerate Plan'      : 'Generate Plan')
            : (worksheet ? 'Regenerate Worksheet' : 'Generate Worksheet');

    return (
        <div ref={topRef} style={{ height:'100%', overflowY:'auto', background:'var(--bg-app)' }}>
            <div style={{ maxWidth:800, margin:'0 auto', padding:'32px 28px' }}>

                {/* ── Header ── */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }}>
                    <div>
                        <h1 style={{ display:'flex', alignItems:'center', gap:10, fontSize:'1.6rem', fontWeight:800, letterSpacing:'-0.03em', marginBottom:4 }}>
                            <Calendar color="var(--text-secondary)" size={26}/>
                            {planType === PLAN_TYPE_WEEKLY ? 'Weekly Study Plan' : 'Weakness Worksheet'}
                        </h1>
                        <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem' }}>
                            {planType === PLAN_TYPE_WEEKLY
                                ? `5-day schedule for ${subject === 'All' ? 'all subjects' : subject}.`
                                : `Targets your weak areas in your recent chats for ${subject === 'All' ? 'all subjects' : subject}.`}
                        </p>
                    </div>
                    <button
                        onClick={generate}
                        disabled={loading}
                        className="btn-gradient"
                        style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:24, fontSize:'0.85rem', whiteSpace:'nowrap', opacity:loading?0.7:1 }}
                    >
                        {loading
                            ? <div className="spin" style={{ width:13,height:13,border:'2px solid rgba(255,255,255,0.2)',borderTopColor:'white',borderRadius:'50%' }}/>
                            : <Sparkles size={14}/>}
                        {genLabel}
                    </button>
                </div>

                {/* ── Mode + Subject Row ── */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28, flexWrap:'wrap' }}>
                    {/* Mode toggle */}
                    <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', borderRadius:12, padding:4 }}>
                        {[
                            { id: PLAN_TYPE_WEEKLY, label: '📅 Weekly Plan' },
                            { id: PLAN_TYPE_SRS,    label: '🎯 Weakness Worksheet' },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => { setPlanType(t.id); setError(null); }}
                                style={{
                                    padding:'8px 16px', borderRadius:9, border:'none',
                                    background: planType===t.id ? 'var(--bg-card-hover)' : 'transparent',
                                    color: planType===t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                                    fontWeight: planType===t.id ? 700 : 400,
                                    fontSize:'0.85rem', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s',
                                }}
                            >{t.label}</button>
                        ))}
                    </div>

                    {/* Subject select */}
                    <select
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        style={{ padding:'9px 14px', borderRadius:10, background:'#1e293b', color:'#f1f5f9', border:'1px solid var(--border)', fontSize:'0.86rem', outline:'none', cursor:'pointer' }}
                    >
                        {subjects.map(s => <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>)}
                    </select>

                    {/* Download button – only shown when there's content */}
                    {hasResult && (
                        <button
                            onClick={() => {
                                if (planType === PLAN_TYPE_SRS) {
                                    downloadTxt(worksheet, `SRS_Worksheet_${subject}.txt`);
                                } else {
                                    const txt = plan.map(d => `${d.day} — ${d.topic}\nBook: ${d.book}\n${d.tasks?.join('\n')}`).join('\n\n');
                                    downloadTxt(txt, `StudyPlan_${subject}.txt`);
                                }
                            }}
                            style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-secondary)', fontSize:'0.83rem', cursor:'pointer', fontFamily:'inherit', marginLeft:'auto', transition:'all 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color='white'}
                            onMouseLeave={e => e.currentTarget.style.color='var(--text-secondary)'}
                        >
                            <Download size={13}/> Save as .txt
                        </button>
                    )}
                </div>

                {/* ── Error ── */}
                {error && (
                    <div style={{ padding:'12px 16px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:12, color:'#ef4444', marginBottom:24, fontSize:'0.85rem' }}>
                        {error}
                    </div>
                )}

                {/* ── Loading ── */}
                {loading && (
                    <div style={{ textAlign:'center', paddingTop:80 }}>
                        <div className="spin" style={{ width:44,height:44,border:'3px solid rgba(255,255,255,0.1)',borderTopColor:'var(--text-secondary)',borderRadius:'50%',margin:'0 auto 18px' }}/>
                        <p style={{ color:'var(--text-muted)' }}>
                            {planType === PLAN_TYPE_WEEKLY ? 'Analysing your library and building a custom schedule…' : 'Analysing your chat history and crafting a targeted worksheet…'}
                        </p>
                    </div>
                )}

                {/* ── Empty states ── */}
                {!loading && !hasResult && !error && (
                    <div style={{ textAlign:'center', padding:'70px 20px', border:'1px dashed var(--border)', borderRadius:16, background:'rgba(255,255,255,0.02)' }}>
                        {planType === PLAN_TYPE_WEEKLY
                            ? <Calendar size={52} style={{ margin:'0 auto 18px', opacity:0.18, display:'block' }}/>
                            : <Target  size={52} style={{ margin:'0 auto 18px', opacity:0.18, display:'block' }}/>}
                        <h3 style={{ fontSize:'1.1rem', marginBottom:8 }}>
                            {planType === PLAN_TYPE_WEEKLY ? 'No plan yet' : 'No worksheet yet'}
                        </h3>
                        <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', maxWidth:400, margin:'0 auto' }}>
                            {planType === PLAN_TYPE_WEEKLY
                                ? 'Hit "Generate Plan" above and Teacher Assist will build you a focused 5-day study schedule.'
                                : 'Hit "Generate Worksheet" and Teacher Assist will read your recent chats to find weak spots and write a targeted guide.'}
                        </p>
                    </div>
                )}

                {/* ── Weekly Plan results ── */}
                {!loading && planType === PLAN_TYPE_WEEKLY && plan && (
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                        {plan.map((dayPlan, idx) => (
                            <div key={idx} className="glass" style={{ display:'flex', borderRadius:16, padding:'20px 24px', gap:24 }}>
                                {/* Day badge */}
                                <div style={{ width:72, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', borderRight:'1px solid var(--border)', paddingRight:24 }}>
                                    <span style={{ fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', fontWeight:700, marginBottom:4 }}>Day {idx+1}</span>
                                    <strong style={{ fontSize:'1rem', color:'var(--text-secondary)' }}>{dayPlan.day}</strong>
                                </div>
                                {/* Content */}
                                <div style={{ flex:1 }}>
                                    <h3 style={{ fontSize:'1rem', fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>{dayPlan.topic}</h3>
                                    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.82rem', marginBottom:14 }}>
                                        <BookOpen size={13} color="var(--text-muted)"/>
                                        <span style={{ fontWeight:600, color:'var(--text-secondary)' }}>{dayPlan.book}</span>
                                    </div>
                                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                                        {dayPlan.tasks?.map((task, tIdx) => (
                                            <div key={tIdx} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                                                <div style={{ marginTop:3, color:'var(--text-muted)', flexShrink:0 }}><CheckCircle size={13}/></div>
                                                <p style={{ fontSize:'0.84rem', color:'var(--text-secondary)', lineHeight:1.55 }}>{task}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── SRS Worksheet results ── */}
                {!loading && planType === PLAN_TYPE_SRS && worksheet && (
                    <div className="glass" style={{ padding:'28px 32px', borderRadius:16 }}>
                        <MarkdownBlock text={worksheet} />
                    </div>
                )}

            </div>
        </div>
    );
};

export default StudyPlanView;
