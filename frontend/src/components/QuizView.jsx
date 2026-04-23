import React, { useState, useEffect, useRef } from 'react';
import {
    Brain, CheckCircle, XCircle, Layers, Clock, Zap,
    ChevronRight, Trophy, RotateCcw, Save, Trash2, Pencil,
    Share2, Copy, BookmarkCheck, Lock, FolderOpen, X, Check,
    Download, Upload as UploadIcon,
} from 'lucide-react';
import { trackEvent } from './StatsView';
import { useNavigate } from 'react-router-dom';

const DIFFS = [
    { key:'easy',   label:'Easy',   emoji:'🟢', activeColor:'#4ade80', activeBg:'rgba(74,222,128,0.10)',  activeBorder:'rgba(74,222,128,0.4)'  },
    { key:'medium', label:'Medium', emoji:'🟡', activeColor:'#fbbf24', activeBg:'rgba(251,191,36,0.10)',  activeBorder:'rgba(251,191,36,0.4)'  },
    { key:'hard',   label:'Hard',   emoji:'🔴', activeColor:'#f87171', activeBg:'rgba(248,113,113,0.10)', activeBorder:'rgba(248,113,113,0.4)' },
];

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, ok }) => (
    <div style={{
        position:'fixed', bottom:24, right:24, zIndex:9999,
        padding:'12px 18px', borderRadius:12,
        background: ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
        border:`1px solid ${ok ? '#10b981' : '#ef4444'}`,
        color: ok ? '#4ade80' : '#f87171',
        display:'flex', alignItems:'center', gap:8,
        fontSize:'0.86rem', fontWeight:600,
        boxShadow:'0 8px 32px rgba(0,0,0,0.3)',
        animation:'fadeInUp 0.25s ease',
    }}>
        {ok ? <CheckCircle size={15}/> : <XCircle size={15}/>} {msg}
    </div>
);

function useToast() {
    const [toast, setToast] = useState(null);
    const show = (msg, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };
    return [toast, show];
}

// ─── Timer ring ───────────────────────────────────────────────────────────────
const TimerRing = ({ seconds, max }) => {
    const r = 18, circ = 2 * Math.PI * r, pct = Math.max(0, seconds / max);
    const color = seconds > max * 0.5 ? '#4ade80' : seconds > max * 0.25 ? '#fbbf24' : '#f87171';
    return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, width:44, height:44, position:'relative' }}>
            <svg width={44} height={44} style={{ transform:'rotate(-90deg)', position:'absolute', inset:0 }}>
                <circle cx={22} cy={22} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3}/>
                <circle cx={22} cy={22} r={r} fill="none" stroke={color} strokeWidth={3}
                    strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                    style={{ transition:'stroke-dashoffset 0.9s linear, stroke 0.5s' }}/>
            </svg>
            <span style={{ fontSize:'0.72rem', fontWeight:700, color, position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}>{seconds}</span>
        </div>
    );
};

// ─── Save Dialog ──────────────────────────────────────────────────────────────
const SaveDialog = ({ type, data, onSaved, onCancel }) => {
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const doSave = async () => {
        if (!name.trim()) { setErr('Please enter a name.'); return; }
        setSaving(true); setErr('');
        try {
            const res = await fetch('/api/saved_quizzes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), type, data }),
            });
            const d = await res.json();
            if (res.ok) { onSaved(d.saved); }
            else setErr(d.error || 'Save failed.');
        } catch { setErr('Network error.'); }
        finally { setSaving(false); }
    };

    return (
        <div style={{
            position:'fixed', inset:0, zIndex:500,
            background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)',
            display:'flex', alignItems:'center', justifyContent:'center',
        }} onClick={onCancel}>
            <div className="glass" style={{ width:380, borderRadius:18, padding:'28px 24px' }} onClick={e => e.stopPropagation()}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                    <h3 style={{ fontWeight:800, fontSize:'1rem', display:'flex', alignItems:'center', gap:8 }}>
                        <Save size={16} color="#818cf8"/> Save {type === 'quiz' ? 'Quiz' : 'Flashcard Set'}
                    </h3>
                    <button onClick={onCancel} style={{ background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><X size={16}/></button>
                </div>
                <input
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doSave()}
                    placeholder={`e.g. "Chapter 4 Quiz"`}
                    style={{ width:'100%', padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text-primary)', fontSize:'0.9rem', outline:'none', boxSizing:'border-box', marginBottom:14, fontFamily:'inherit' }}
                />
                {err && <p style={{ color:'#f87171', fontSize:'0.8rem', marginBottom:10 }}>{err}</p>}
                <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <button onClick={onCancel} style={{ padding:'8px 16px', borderRadius:9, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.84rem' }}>Cancel</button>
                    <button onClick={doSave} disabled={saving} className="btn-gradient" style={{ padding:'8px 18px', fontSize:'0.84rem', display:'flex', alignItems:'center', gap:6, borderRadius:9 }}>
                        {saving ? 'Saving…' : <><Save size={13}/> Save</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Guest Lock ───────────────────────────────────────────────────────────────
const GuestLock = () => {
    const nav = useNavigate();
    return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:40 }}>
            <div className="glass" style={{ maxWidth:420, width:'100%', borderRadius:20, padding:'44px 36px', textAlign:'center' }}>
                <div style={{ width:64, height:64, borderRadius:20, background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
                    <Lock size={28} color="#818cf8"/>
                </div>
                <h2 style={{ fontWeight:800, fontSize:'1.4rem', marginBottom:10 }}>Account Required</h2>
                <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', lineHeight:1.7, marginBottom:28 }}>
                    Quiz &amp; Flashcard mode is only available to registered users. Create a free account to generate quizzes, save your progress, and track your stats.
                </p>
                <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                    <button onClick={() => nav('/register')} className="btn-gradient" style={{ padding:'11px 24px', fontSize:'0.9rem', borderRadius:12 }}>Create Account</button>
                    <button onClick={() => nav('/login')} style={{ padding:'11px 20px', borderRadius:12, border:'1px solid var(--border)', background:'transparent', color:'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.9rem' }}>Log In</button>
                </div>
            </div>
        </div>
    );
};

// ─── Quiz Setup ───────────────────────────────────────────────────────────────
const QuizSetup = ({ diff, setDiff, count, setCount, timerOn, setTimerOn, onStart, loading, subjects, subject, setSubject }) => (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:40 }}>
        <div className="glass" style={{ width:'100%', maxWidth:520, padding:'36px 32px', borderRadius:20 }}>
            <div style={{ textAlign:'center', marginBottom:28 }}>
                <Brain size={40} color="#818cf8" style={{ margin:'0 auto 12px', display:'block' }}/>
                <h2 style={{ fontWeight:800, fontSize:'1.35rem', marginBottom:6 }}>Configure Your Quiz</h2>
                <p style={{ color:'var(--text-muted)', fontSize:'0.86rem' }}>Set your preferences, then start!</p>
            </div>
            <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:8 }}>Subject</label>
                <select value={subject} onChange={e => setSubject(e.target.value)} style={{ width:'100%', padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.05)', color:'var(--text-primary)', border:'1px solid var(--border)', fontSize:'0.88rem', outline:'none' }}>
                    {subjects.map(s => <option key={s} value={s} style={{ background:'#1e293b', color:'#f8fafc' }}>{s === 'All' ? 'All Subjects' : s}</option>)}
                </select>
            </div>
            <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:8 }}>Difficulty</label>
                <div style={{ display:'flex', gap:8 }}>
                    {DIFFS.map(d => (
                        <button key={d.key} onClick={() => setDiff(d.key)} style={{ flex:1, padding:'10px 0', border:`1px solid ${diff===d.key?d.activeBorder:'var(--border)'}`, borderRadius:10, background:diff===d.key?d.activeBg:'transparent', color:diff===d.key?d.activeColor:'var(--text-muted)', fontWeight:diff===d.key?700:500, fontSize:'0.84rem', cursor:'pointer', fontFamily:'inherit', transition:'all 0.18s' }}>{d.emoji} {d.label}</button>
                    ))}
                </div>
            </div>
            <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:8 }}>Questions: {count}</label>
                <input type="range" min={5} max={20} step={5} value={count} onChange={e => setCount(Number(e.target.value))} style={{ width:'100%', accentColor:'#6366f1' }}/>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'var(--text-muted)', marginTop:4 }}><span>5</span><span>10</span><span>15</span><span>20</span></div>
            </div>
            <div style={{ marginBottom:28, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}><Clock size={15} color="#818cf8"/><span style={{ fontSize:'0.86rem', fontWeight:600, color:'var(--text-primary)' }}>30s Timer per question</span></div>
                <button onClick={() => setTimerOn(t => !t)} style={{ width:42, height:24, borderRadius:12, border:'none', cursor:'pointer', background:timerOn?'#6366f1':'rgba(255,255,255,0.1)', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                    <div style={{ position:'absolute', top:3, left:timerOn?20:3, width:18, height:18, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }}/>
                </button>
            </div>
            <button onClick={onStart} disabled={loading} className="btn-gradient" style={{ width:'100%', padding:'13px', fontSize:'0.96rem', display:'flex', alignItems:'center', justifyContent:'center', gap:8, borderRadius:12 }}>
                {loading ? <><div className="spin" style={{ width:18,height:18,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%' }}/> Generating…</> : <><Brain size={16}/> Start Quiz</>}
            </button>
        </div>
    </div>
);

// ─── Quiz Question ────────────────────────────────────────────────────────────
const QuizQuestion = ({ q, qIndex, total, timerOn, onNext, isLast, score }) => {
    const [selected, setSelected] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const timerRef = useRef(null);
    const TIMER_SEC = 30;

    useEffect(() => {
        if (!timerOn) return;
        setTimeLeft(TIMER_SEC);
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) { clearInterval(timerRef.current); setRevealed(true); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [timerOn]);

    const handleSelect = letter => {
        if (revealed) return;
        clearInterval(timerRef.current);
        setSelected(letter);
        setRevealed(true);
    };

    const isCorrect = selected === q.answer;

    return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:'24px 20px' }}>
            <div style={{ width:'100%', maxWidth:640, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600 }}>Question {qIndex+1} of {total}</span>
                    <span style={{ fontSize:'0.75rem', color:'#818cf8', fontWeight:700 }}>Score: {score}/{qIndex}</span>
                </div>
                <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${(qIndex/total)*100}%`, background:'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius:2, transition:'width 0.4s' }}/>
                </div>
            </div>
            <div className="glass" style={{ width:'100%', maxWidth:640, borderRadius:18, padding:'28px 28px 24px', position:'relative' }}>
                {timerOn && !revealed && <div style={{ position:'absolute', top:20, right:20 }}><TimerRing seconds={timeLeft} max={TIMER_SEC}/></div>}
                <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--accent-light)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:10 }}>Q{qIndex+1}</p>
                <p style={{ fontWeight:700, fontSize:'1.05rem', lineHeight:1.6, marginBottom:22, paddingRight:timerOn&&!revealed?56:0 }}>{q.question}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {q.options.map((opt, j) => {
                        const letter=opt[0], isSel=selected===letter, isCorr=letter===q.answer;
                        let bg='rgba(255,255,255,0.04)', border='var(--border)', color='var(--text-primary)', icon=null;
                        if(revealed&&isCorr){bg='rgba(16,185,129,0.12)';border='#10b981';color='#4ade80';icon=<CheckCircle size={16} color="#4ade80" style={{flexShrink:0}}/>;}
                        else if(revealed&&isSel&&!isCorr){bg='rgba(239,68,68,0.12)';border='#ef4444';color='#f87171';icon=<XCircle size={16} color="#f87171" style={{flexShrink:0}}/>;}
                        else if(!revealed&&isSel){bg='rgba(99,102,241,0.15)';border='#818cf8';}
                        return (
                            <button key={j} onClick={() => handleSelect(letter)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12, background:bg, border:`1px solid ${border}`, color, cursor:revealed?'default':'pointer', fontFamily:'inherit', fontSize:'0.9rem', textAlign:'left', transition:'all 0.2s' }}>
                                <span style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.78rem', flexShrink:0 }}>{letter}</span>
                                <span style={{ flex:1 }}>{opt.slice(3)}</span>
                                {icon}
                            </button>
                        );
                    })}
                </div>
                {revealed && !selected && <p style={{ marginTop:14, fontSize:'0.82rem', color:'#f87171', fontWeight:600 }}>⏰ Time's up! Correct answer: <strong>{q.answer}</strong>.</p>}
                {revealed && selected && (
                    <div style={{ marginTop:16, padding:'14px 16px', borderRadius:12, background:isCorrect?'rgba(16,185,129,0.07)':'rgba(239,68,68,0.07)', border:`1px solid ${isCorrect?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)'}` }}>
                        <p style={{ fontWeight:700, fontSize:'0.88rem', color:isCorrect?'#4ade80':'#f87171', marginBottom:q.explanation?8:0 }}>{isCorrect?'✓ Correct!':`✗ Incorrect — correct answer was ${q.answer}`}</p>
                        {q.explanation && <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)', lineHeight:1.65 }}>{q.explanation}</p>}
                    </div>
                )}
                {revealed && (
                    <div style={{ display:'flex', justifyContent:'flex-end', marginTop:20 }}>
                        <button onClick={() => onNext(isCorrect && !!selected)} className="btn-gradient" style={{ padding:'10px 24px', fontSize:'0.88rem', display:'flex', alignItems:'center', gap:8, borderRadius:12 }}>
                            {isLast ? <><Trophy size={15}/> See Results</> : <>Next <ChevronRight size={15}/></>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Quiz Results ─────────────────────────────────────────────────────────────
const QuizResults = ({ score, total, questions, onRetry, onNewSetup, showToast }) => {
    const pct = Math.round((score/total)*100);
    const emoji = pct===100?'🏆':pct>=70?'🎉':pct>=50?'👍':'📖';
    const [showSave, setShowSave] = useState(false);
    const [saved, setSaved]       = useState(false);

    useEffect(() => { trackEvent('quiz_completed', { score }); }, []); // eslint-disable-line

    return (
        <>
            {showSave && <SaveDialog type="quiz" data={questions} onSaved={() => { setShowSave(false); setSaved(true); showToast('Quiz saved!'); }} onCancel={() => setShowSave(false)}/>}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:40 }}>
                <div className="glass" style={{ width:'100%', maxWidth:460, borderRadius:20, padding:'44px 36px', textAlign:'center' }}>
                    <p style={{ fontSize:'3.5rem', marginBottom:16 }}>{emoji}</p>
                    <h2 style={{ fontWeight:800, fontSize:'1.6rem', letterSpacing:'-0.03em', marginBottom:8 }}>
                        {pct===100?'Perfect!':pct>=70?'Great job!':pct>=50?'Good effort!':'Keep practicing!'}
                    </h2>
                    <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', marginBottom:28 }}>You answered {score} out of {total} correctly.</p>
                    <div style={{ position:'relative', width:120, height:120, margin:'0 auto 28px' }}>
                        <svg width={120} height={120} style={{ transform:'rotate(-90deg)' }}>
                            <circle cx={60} cy={60} r={50} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10}/>
                            <circle cx={60} cy={60} r={50} fill="none" stroke={pct>=70?'#4ade80':pct>=50?'#fbbf24':'#f87171'} strokeWidth={10} strokeDasharray={2*Math.PI*50} strokeDashoffset={2*Math.PI*50*(1-pct/100)} strokeLinecap="round" style={{ transition:'stroke-dashoffset 1s ease' }}/>
                        </svg>
                        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                            <span style={{ fontSize:'1.8rem', fontWeight:800, lineHeight:1 }}>{pct}%</span>
                            <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{score}/{total}</span>
                        </div>
                    </div>
                    <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
                        <button onClick={onRetry} style={{ padding:'11px 22px', borderRadius:12, border:'1px solid var(--border)', background:'transparent', color:'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:'0.88rem', display:'flex', alignItems:'center', gap:7 }}><RotateCcw size={14}/> Retry</button>
                        <button onClick={onNewSetup} className="btn-gradient" style={{ padding:'11px 24px', fontSize:'0.88rem', borderRadius:12, display:'flex', alignItems:'center', gap:7 }}><Brain size={14}/> New Quiz</button>
                        {saved
                            ? <button disabled style={{ padding:'11px 22px', borderRadius:12, border:'1px solid #10b981', background:'rgba(16,185,129,0.1)', color:'#4ade80', fontFamily:'inherit', fontWeight:600, fontSize:'0.88rem', display:'flex', alignItems:'center', gap:7 }}><BookmarkCheck size={14}/> Saved!</button>
                            : <button onClick={() => setShowSave(true)} style={{ padding:'11px 22px', borderRadius:12, border:'1px solid rgba(99,102,241,0.4)', background:'rgba(99,102,241,0.1)', color:'#818cf8', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:'0.88rem', display:'flex', alignItems:'center', gap:7 }}><Save size={14}/> Save Quiz</button>
                        }
                    </div>
                </div>
            </div>
        </>
    );
};

// ─── Quiz Tab ─────────────────────────────────────────────────────────────────
const QuizTab = ({ subjects, showToast, onLoadSaved }) => {
    const [phase,     setPhase]     = useState('setup');
    const [questions, setQuestions] = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState(null);
    const [qIndex,    setQIndex]    = useState(0);
    const [score,     setScore]     = useState(0);
    const [diff,      setDiff]      = useState('medium');
    const [count,     setCount]     = useState(5);
    const [timerOn,   setTimerOn]   = useState(false);
    const [subject,   setSubject]   = useState('All');

    // Expose loadSaved so SavedTab can inject questions
    useEffect(() => {
        if (onLoadSaved) onLoadSaved.current = (qs) => {
            setQuestions(qs); setQIndex(0); setScore(0); setPhase('playing');
        };
    }, [onLoadSaved]);

    const generate = async () => {
        setLoading(true); setError(null);
        try {
            const res  = await fetch('/api/quiz', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ difficulty:diff, num_questions:count, subject }) });
            const data = await res.json();
            if (res.ok) { setQuestions(data.questions||[]); setQIndex(0); setScore(0); setPhase('playing'); }
            else setError(data.error||'Failed to generate quiz.');
        } catch { setError('Network error.'); }
        finally { setLoading(false); }
    };

    const handleNext = wasCorrect => {
        const ns = score + (wasCorrect ? 1 : 0);
        setScore(ns);
        if (qIndex + 1 >= questions.length) setPhase('results');
        else setQIndex(i => i + 1);
    };

    if (phase === 'setup') return (
        <>
            {error && <div style={{ maxWidth:520, margin:'0 auto 16px', padding:'12px 16px', borderRadius:12, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', fontSize:'0.86rem' }}>{error}</div>}
            <QuizSetup diff={diff} setDiff={setDiff} count={count} setCount={setCount} timerOn={timerOn} setTimerOn={setTimerOn} onStart={generate} loading={loading} subjects={subjects} subject={subject} setSubject={setSubject}/>
        </>
    );
    if (phase === 'playing' && questions[qIndex]) return (
        <QuizQuestion key={qIndex} q={questions[qIndex]} qIndex={qIndex} total={questions.length} timerOn={timerOn} onNext={handleNext} isLast={qIndex+1>=questions.length} score={score}/>
    );
    if (phase === 'results') return (
        <QuizResults score={score} total={questions.length} questions={questions} onRetry={() => { setQIndex(0); setScore(0); setPhase('playing'); }} onNewSetup={() => { setPhase('setup'); setError(null); }} showToast={showToast}/>
    );
    return null;
};

// ─── Flashcard Tab ────────────────────────────────────────────────────────────
const FlashcardTab = ({ subjects = ['All'], showToast, onLoadSaved }) => {
    const [cards,   setCards]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);
    const [current, setCurrent] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [done,    setDone]    = useState(false);
    const [showSave, setShowSave] = useState(false);
    const [saved,    setSaved]    = useState(false);
    const [subject,  setSubject]  = useState('All');

    useEffect(() => {
        if (onLoadSaved) onLoadSaved.current = (cs) => {
            setCards(cs); setCurrent(0); setFlipped(false); setDone(false); setSaved(false);
        };
    }, [onLoadSaved]);

    const generate = async () => {
        setLoading(true); setError(null); setCards([]); setCurrent(0); setFlipped(false); setDone(false); setSaved(false);
        try {
            const res  = await fetch('/api/flashcards', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ subject }) });
            const data = await res.json();
            if (res.ok) setCards(data.flashcards||[]);
            else setError(data.error);
        } catch { setError('Failed to generate flashcards.'); }
        finally { setLoading(false); }
    };

    const next    = () => { setFlipped(false); setTimeout(() => { if (current+1>=cards.length) setDone(true); else setCurrent(c=>c+1); }, 180); };
    const prev    = () => { setFlipped(false); setTimeout(() => setCurrent(c=>Math.max(0,c-1)), 180); };
    const restart = () => { setCurrent(0); setFlipped(false); setDone(false); };

    return (
        <div style={{ display:'flex', flexDirection:'column', flex:1 }}>
            {showSave && <SaveDialog type="flashcard" data={cards} onSaved={() => { setShowSave(false); setSaved(true); showToast('Flashcard set saved!'); }} onCancel={() => setShowSave(false)}/>}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12, padding:'0 4px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    <p style={{ color:'var(--text-secondary)', fontSize:'0.86rem' }}>Flip-card study from your library. Tap the card to reveal.</p>
                    <select
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        style={{ background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', borderRadius:10, padding:'7px 13px', color:'var(--text-primary)', fontSize:'0.85rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', outline:'none' }}
                    >
                        {subjects.map(s => <option key={s} value={s} style={{ background:'#1e293b', color:'#f8fafc' }}>{s === 'All' ? '📚 All Subjects' : s}</option>)}
                    </select>
                </div>
                <button onClick={generate} className="btn-gradient" style={{ padding:'10px 22px', fontSize:'0.88rem', display:'flex', alignItems:'center', gap:7 }}><Layers size={15}/> {cards.length>0?'New Set':'Generate Cards'}</button>
            </div>
            {loading && <div style={{ textAlign:'center', padding:'60px 0' }}><div className="spin" style={{ width:40,height:40,border:'3px solid rgba(99,102,241,0.2)',borderTopColor:'#6366f1',borderRadius:'50%',margin:'0 auto 14px' }}/><p style={{ color:'var(--text-secondary)' }}>Generating flashcards…</p></div>}
            {error   && <div style={{ padding:'14px 18px', borderRadius:12, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171' }}>{error}</div>}
            {!loading && !error && cards.length===0 && (
                <div className="glass" style={{ padding:'50px 40px', textAlign:'center' }}>
                    <Layers size={48} style={{ margin:'0 auto 18px', color:'var(--text-muted)', opacity:0.35, display:'block' }}/>
                    <h2 style={{ fontWeight:700, marginBottom:10 }}>Flashcard mode</h2>
                    <p style={{ color:'var(--text-muted)', fontSize:'0.86rem', marginBottom:24 }}>6 term/definition cards generated from your library. Tap to flip!</p>
                    <button onClick={generate} className="btn-gradient" style={{ padding:'12px 32px', fontSize:'0.92rem', display:'inline-flex', alignItems:'center', gap:8 }}><Layers size={16}/> Generate Cards</button>
                </div>
            )}
            {!loading && cards.length>0 && !done && (
                <div style={{ maxWidth:560, margin:'0 auto', width:'100%' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                        <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Card {current+1} of {cards.length}</span>
                        <div style={{ display:'flex', gap:4 }}>{cards.map((_,i)=><div key={i} style={{ width:24, height:4, borderRadius:2, background:i===current?'#6366f1':i<current?'rgba(99,102,241,0.3)':'var(--border)' }}/>)}</div>
                    </div>
                    <div onClick={() => setFlipped(f=>!f)} style={{ cursor:'pointer', perspective:1200 }}>
                        <div style={{ position:'relative', height:240, transition:'transform 0.45s cubic-bezier(0.4,0,0.2,1)', transformStyle:'preserve-3d', transform:flipped?'rotateY(180deg)':'rotateY(0deg)' }}>
                            <div className="glass" style={{ position:'absolute', inset:0, borderRadius:18, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px 32px', backfaceVisibility:'hidden', textAlign:'center' }}>
                                <span style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:14 }}>TERM</span>
                                <p style={{ fontSize:'1.3rem', fontWeight:800, letterSpacing:'-0.02em', lineHeight:1.3, color:'var(--text-primary)' }}>{cards[current]?.front}</p>
                                <span style={{ marginTop:16, fontSize:'0.72rem', color:'var(--text-muted)' }}>Tap to reveal →</span>
                            </div>
                            <div className="glass" style={{ position:'absolute', inset:0, borderRadius:18, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px 32px', backfaceVisibility:'hidden', transform:'rotateY(180deg)', textAlign:'center', background:'var(--bg-card-hover)' }}>
                                <span style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-secondary)', marginBottom:14 }}>DEFINITION</span>
                                <p style={{ fontSize:'0.96rem', lineHeight:1.7, color:'var(--text-primary)' }}>{cards[current]?.back}</p>
                            </div>
                        </div>
                    </div>
                    <div style={{ display:'flex', gap:10, marginTop:18, justifyContent:'center' }}>
                        <button onClick={prev} disabled={current===0} style={{ padding:'9px 22px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-card)', color:'var(--text-secondary)', cursor:current===0?'not-allowed':'pointer', opacity:current===0?0.4:1, fontFamily:'inherit', fontWeight:600, fontSize:'0.86rem', transition:'all 0.2s' }}>← Prev</button>
                        <button onClick={next} className="btn-gradient" style={{ padding:'9px 28px', fontSize:'0.86rem' }}>{current+1===cards.length?'Finish':'Next →'}</button>
                    </div>
                </div>
            )}
            {done && (
                <div className="glass" style={{ maxWidth:440, margin:'0 auto', padding:'44px 36px', textAlign:'center' }}>
                    <p style={{ fontSize:'2.5rem', marginBottom:12 }}>🎉</p>
                    <h2 style={{ fontWeight:800, fontSize:'1.3rem', marginBottom:10 }}>All done!</h2>
                    <p style={{ color:'var(--text-muted)', fontSize:'0.86rem', marginBottom:24 }}>You reviewed all {cards.length} flashcards!</p>
                    <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
                        <button onClick={restart} style={{ padding:'10px 20px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-card)', color:'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:'0.86rem' }}>Review Again</button>
                        <button onClick={generate} className="btn-gradient" style={{ padding:'10px 20px', fontSize:'0.86rem' }}>New Set</button>
                        {saved
                            ? <button disabled style={{ padding:'10px 20px', borderRadius:10, border:'1px solid #10b981', background:'rgba(16,185,129,0.1)', color:'#4ade80', fontFamily:'inherit', fontWeight:600, fontSize:'0.86rem', display:'flex', alignItems:'center', gap:6 }}><BookmarkCheck size={14}/> Saved!</button>
                            : <button onClick={() => setShowSave(true)} style={{ padding:'10px 20px', borderRadius:10, border:'1px solid rgba(99,102,241,0.4)', background:'rgba(99,102,241,0.1)', color:'#818cf8', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:'0.86rem', display:'flex', alignItems:'center', gap:6 }}><Save size={14}/> Save Set</button>
                        }
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Saved Tab ────────────────────────────────────────────────────────────────
const SavedTab = ({ onLoadQuiz, onLoadFlashcard, showToast }) => {
    const [items,   setItems]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter,  setFilter]  = useState('all');   // 'all'|'quiz'|'flashcard'
    const [shareCode, setShareCode] = useState('');
    const [shareLoading, setShareLoading] = useState(false);
    // per-item state: rename editing + share code
    const [renaming,  setRenaming]  = useState({});   // id → draft name string
    const [shareCodes, setShareCodes] = useState({});  // id → code

    const load = async () => {
        setLoading(true);
        try {
            const res  = await fetch('/api/saved_quizzes');
            const data = await res.json();
            if (res.ok) setItems(data.items || []);
        } catch {}
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const doDelete = async (id) => {
        if (!window.confirm('Delete this saved item?')) return;
        const res = await fetch(`/api/saved_quizzes/${id}`, { method:'DELETE' });
        if (res.ok) { setItems(prev => prev.filter(i => i.id !== id)); showToast('Deleted.'); }
        else showToast('Delete failed.', false);
    };

    const doRename = async (id) => {
        const name = (renaming[id] || '').trim();
        if (!name) return;
        const res  = await fetch(`/api/saved_quizzes/${id}`, {
            method:'PUT', headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({ name }),
        });
        if (res.ok) {
            setItems(prev => prev.map(i => i.id===id ? { ...i, name } : i));
            setRenaming(prev => { const n={...prev}; delete n[id]; return n; });
            showToast('Renamed!');
        } else showToast('Rename failed.', false);
    };

    const doShare = async (id) => {
        const res  = await fetch(`/api/saved_quizzes/${id}/share`, { method:'POST' });
        const data = await res.json();
        if (res.ok) {
            setShareCodes(prev => ({ ...prev, [id]: data.share_code }));
            showToast('Share code ready — copy it!');
        } else showToast(data.error || 'Share failed.', false);
    };

    const doLoadByCode = async () => {
        if (!shareCode.trim()) return;
        setShareLoading(true);
        try {
            const res  = await fetch(`/api/shared/${shareCode.trim().toUpperCase()}`);
            const data = await res.json();
            if (res.ok) {
                if (data.item.type === 'quiz') { onLoadQuiz(data.item.data); showToast(`Loaded quiz: ${data.item.name}`); }
                else { onLoadFlashcard(data.item.data); showToast(`Loaded flashcards: ${data.item.name}`); }
                setShareCode('');
            } else showToast(data.error || 'Code not found.', false);
        } catch { showToast('Network error.', false); }
        finally { setShareLoading(false); }
    };

    const doLoad = async (id, type) => {
        const res  = await fetch(`/api/saved_quizzes/${id}/data`);
        const data = await res.json();
        if (res.ok) {
            if (type === 'quiz') onLoadQuiz(data.item.data);
            else onLoadFlashcard(data.item.data);
            showToast(`Loaded: ${data.item.name}`);
        } else showToast(data.error || 'Load failed.', false);
    };

    const displayed = items.filter(i => filter==='all' || i.type===filter);

    return (
        <div style={{ display:'flex', flexDirection:'column', flex:1, padding:'0 4px' }}>
            {/* Share code input */}
            <div style={{ marginBottom:20, padding:'16px 18px', borderRadius:14, background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.2)' }}>
                <p style={{ fontSize:'0.78rem', fontWeight:700, color:'#818cf8', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>Load a shared quiz by code</p>
                <div style={{ display:'flex', gap:8 }}>
                    <input
                        value={shareCode}
                        onChange={e => setShareCode(e.target.value.toUpperCase().slice(0,6))}
                        onKeyDown={e => e.key==='Enter' && doLoadByCode()}
                        placeholder="Enter 6-char code…"
                        maxLength={6}
                        style={{ flex:1, padding:'9px 13px', borderRadius:9, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text-primary)', fontSize:'0.88rem', outline:'none', fontFamily:'monospace', letterSpacing:'0.1em' }}
                    />
                    <button onClick={doLoadByCode} disabled={shareLoading || shareCode.length !== 6} className="btn-gradient" style={{ padding:'9px 18px', fontSize:'0.84rem', borderRadius:9, display:'flex', alignItems:'center', gap:6 }}>
                        {shareLoading ? 'Loading…' : <><UploadIcon size={13}/> Load</>}
                    </button>
                </div>
            </div>

            {/* Filter row */}
            <div style={{ display:'flex', gap:8, marginBottom:18, alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', borderRadius:10, padding:3 }}>
                    {['all','quiz','flashcard'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{ padding:'6px 14px', borderRadius:8, border:'none', background:filter===f?'var(--bg-card-hover)':'transparent', color:filter===f?'var(--text-primary)':'var(--text-muted)', fontWeight:filter===f?700:400, fontSize:'0.8rem', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s', textTransform:'capitalize' }}>{f==='all'?'All':f==='quiz'?'🧪 Quizzes':'🃏 Flashcards'}</button>
                    ))}
                </div>
                <button onClick={load} style={{ background:'transparent', border:'1px solid var(--border)', color:'var(--text-muted)', cursor:'pointer', padding:'6px 12px', borderRadius:8, fontSize:'0.78rem', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>↻ Refresh</button>
            </div>

            {loading && <div style={{ textAlign:'center', padding:'40px 0' }}><div className="spin" style={{ width:32,height:32,border:'3px solid rgba(99,102,241,0.2)',borderTopColor:'#6366f1',borderRadius:'50%',margin:'0 auto 10px' }}/></div>}
            {!loading && displayed.length === 0 && (
                <div style={{ textAlign:'center', padding:'50px 20px', color:'var(--text-muted)' }}>
                    <FolderOpen size={40} style={{ margin:'0 auto 14px', opacity:0.2, display:'block' }}/>
                    <p style={{ fontWeight:600, marginBottom:6 }}>Nothing saved yet</p>
                    <p style={{ fontSize:'0.84rem' }}>Finish a quiz or flashcard set and click 💾 Save.</p>
                </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {displayed.map(item => {
                    const isRenaming  = item.id in renaming;
                    const sharedCode  = shareCodes[item.id];
                    return (
                        <div key={item.id} className="glass" style={{ padding:'16px 18px', borderRadius:14, display:'flex', flexDirection:'column', gap:10 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                                <span style={{ fontSize:'0.72rem', fontWeight:700, padding:'3px 9px', borderRadius:20, background: item.type==='quiz'?'rgba(99,102,241,0.15)':'rgba(16,185,129,0.12)', color: item.type==='quiz'?'#818cf8':'#4ade80', border:`1px solid ${item.type==='quiz'?'rgba(99,102,241,0.3)':'rgba(16,185,129,0.25)'}` }}>
                                    {item.type==='quiz'?'🧪 Quiz':'🃏 Flashcards'}
                                </span>

                                {isRenaming ? (
                                    <div style={{ display:'flex', gap:6, flex:1, alignItems:'center' }}>
                                        <input autoFocus value={renaming[item.id]} onChange={e => setRenaming(prev => ({ ...prev, [item.id]: e.target.value }))} onKeyDown={e => { if(e.key==='Enter') doRename(item.id); if(e.key==='Escape') setRenaming(prev => { const n={...prev}; delete n[item.id]; return n; }); }} style={{ flex:1, padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid var(--border)', color:'var(--text-primary)', fontSize:'0.86rem', outline:'none', fontFamily:'inherit' }}/>
                                        <button onClick={() => doRename(item.id)} style={{ background:'rgba(16,185,129,0.15)', border:'1px solid #10b981', color:'#4ade80', borderRadius:7, padding:'5px 8px', cursor:'pointer' }}><Check size={13}/></button>
                                        <button onClick={() => setRenaming(prev => { const n={...prev}; delete n[item.id]; return n; })} style={{ background:'transparent', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:7, padding:'5px 8px', cursor:'pointer' }}><X size={13}/></button>
                                    </div>
                                ) : (
                                    <span style={{ fontWeight:700, fontSize:'0.92rem', flex:1 }}>{item.name}</span>
                                )}

                                <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            {/* Share code display */}
                            {sharedCode && (
                                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:9, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)' }}>
                                    <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Share code:</span>
                                    <code style={{ fontWeight:800, letterSpacing:'0.15em', color:'#818cf8', fontSize:'0.9rem' }}>{sharedCode}</code>
                                    <button onClick={() => { navigator.clipboard.writeText(sharedCode); showToast('Copied!'); }} style={{ background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:'0.75rem', padding:'3px 6px', borderRadius:6 }}><Copy size={12}/> Copy</button>
                                </div>
                            )}

                            {/* Action buttons */}
                            {!isRenaming && (
                                <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                                    <button onClick={() => doLoad(item.id, item.type)} style={{ padding:'6px 13px', borderRadius:8, border:'1px solid rgba(99,102,241,0.35)', background:'rgba(99,102,241,0.1)', color:'#818cf8', cursor:'pointer', fontFamily:'inherit', fontSize:'0.78rem', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                                        <Download size={12}/> Load
                                    </button>
                                    <button onClick={() => setRenaming(prev => ({ ...prev, [item.id]: item.name }))} style={{ padding:'6px 13px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.78rem', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                                        <Pencil size={12}/> Rename
                                    </button>
                                    <button onClick={() => doShare(item.id)} style={{ padding:'6px 13px', borderRadius:8, border:'1px solid rgba(251,191,36,0.3)', background:'rgba(251,191,36,0.08)', color:'#fbbf24', cursor:'pointer', fontFamily:'inherit', fontSize:'0.78rem', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                                        <Share2 size={12}/> {item.share_code||sharedCode?'Copy Code':'Share'}
                                    </button>
                                    <button onClick={() => doDelete(item.id)} style={{ padding:'6px 13px', borderRadius:8, border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.08)', color:'#f87171', cursor:'pointer', fontFamily:'inherit', fontSize:'0.78rem', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                                        <Trash2 size={12}/> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Main QuizView ─────────────────────────────────────────────────────────────
const QuizView = ({ user }) => {
    const [tab,      setTab]      = useState('quiz');
    const [subjects, setSubjects] = useState(['All']);
    const [toast,    showToast]   = useToast();

    // Refs so SavedTab can inject loaded data into quiz/flashcard tabs
    const loadQuizRef      = useRef(null);
    const loadFlashcardRef = useRef(null);

    useEffect(() => {
        fetch('/api/library').then(r=>r.json()).then(data => {
            if (data.books) setSubjects(['All', ...new Set(data.books.map(b=>b.subject||'General'))]);
        }).catch(()=>{});
    }, []);

    const isGuest = !user || user.role === 'Guest';

    const handleLoadQuiz = (data) => {
        setTab('quiz');
        setTimeout(() => { if (loadQuizRef.current) loadQuizRef.current(data); }, 50);
    };
    const handleLoadFlashcard = (data) => {
        setTab('flash');
        setTimeout(() => { if (loadFlashcardRef.current) loadFlashcardRef.current(data); }, 50);
    };

    return (
        <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {toast && <Toast msg={toast.msg} ok={toast.ok}/>}

            {/* Header */}
            <div style={{ padding:'20px 28px 0', flexShrink:0 }}>
                <h1 style={{ fontSize:'1.55rem', fontWeight:800, letterSpacing:'-0.03em', marginBottom:4, display:'flex', alignItems:'center', gap:10 }}>
                    <Brain size={22} color="var(--text-secondary)"/> Study<span style={{ color:'var(--accent)' }}>Mode</span>
                </h1>
                {/* Tab bar */}
                <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', borderRadius:12, padding:4, width:'fit-content', marginTop:16 }}>
                    {[
                        { id:'quiz',  label:'🧪 Quiz' },
                        { id:'flash', label:'🃏 Flashcards' },
                        ...(!isGuest ? [{ id:'saved', label:'📂 Saved' }] : []),
                    ].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'8px 20px', borderRadius:9, border:'none', background:tab===t.id?'var(--bg-card-hover)':'transparent', color:tab===t.id?'var(--text-primary)':'var(--text-muted)', fontWeight:tab===t.id?700:400, fontSize:'0.86rem', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>
                {isGuest
                    ? <GuestLock/>
                    : (
                        <>
                            {tab==='quiz'  && <QuizTab subjects={subjects} showToast={showToast} onLoadSaved={loadQuizRef}/>}
                            {tab==='flash' && (
                                <div style={{ maxWidth:760, margin:'0 auto', padding:'24px 28px', width:'100%', display:'flex', flexDirection:'column', flex:1 }}>
                                    <FlashcardTab subjects={subjects} showToast={showToast} onLoadSaved={loadFlashcardRef}/>
                                </div>
                            )}
                            {tab==='saved' && (
                                <div style={{ maxWidth:760, margin:'0 auto', padding:'24px 28px', width:'100%', display:'flex', flexDirection:'column', flex:1 }}>
                                    <SavedTab onLoadQuiz={handleLoadQuiz} onLoadFlashcard={handleLoadFlashcard} showToast={showToast}/>
                                </div>
                            )}
                        </>
                    )
                }
            </div>
        </div>
    );
};

export default QuizView;
