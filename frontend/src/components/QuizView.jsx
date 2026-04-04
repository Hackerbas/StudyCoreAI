import React, { useState, useEffect, useRef } from 'react';
import { Brain, CheckCircle, Layers, Clock, Zap } from 'lucide-react';
import { trackEvent } from './StatsView';

// ─── Module-scope constants (used by both QuizToolbar and QuizTab) ────────────
const DIFFS = [
    { key:'easy',   label:'Easy',   emoji:'🟢', activeColor:'#4ade80', activeBg:'rgba(74,222,128,0.10)', activeBorder:'rgba(74,222,128,0.4)' },
    { key:'medium', label:'Medium', emoji:'🟡', activeColor:'#fbbf24', activeBg:'rgba(251,191,36,0.10)', activeBorder:'rgba(251,191,36,0.4)' },
    { key:'hard',   label:'Hard',   emoji:'🔴', activeColor:'#f87171', activeBg:'rgba(248,113,113,0.10)',activeBorder:'rgba(248,113,113,0.4)' },
];
const DIFF = Object.fromEntries(DIFFS.map(d => [d.key, d]));

// ─── Compact Quiz Toolbar ─────────────────────────────────────────────────────
const QuizToolbar = ({ diff, setDiff, count, setCount, timer, setTimer, onStart, started }) => {
    const active = DIFFS.find(d=>d.key===diff);
    return (
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22, flexWrap:'wrap' }}>
            {/* Difficulty */}
            <div style={{ display:'flex', borderRadius:10, border:'1px solid var(--border)', overflow:'hidden', flexShrink:0 }}>
                {DIFFS.map(d => (
                    <button key={d.key} onClick={()=>setDiff(d.key)} title={d.label}
                        style={{ padding:'7px 13px', border:'none', borderRight: d.key!=='hard'?'1px solid var(--border)':'none',
                            background: diff===d.key ? d.activeBg : 'transparent',
                            color: diff===d.key ? d.activeColor : 'var(--text-muted)',
                            fontWeight: diff===d.key ? 700 : 400,
                            fontSize:'0.82rem', cursor:'pointer', fontFamily:'inherit',
                            transition:'all 0.18s', whiteSpace:'nowrap' }}>
                        {d.emoji} {d.label}
                    </button>
                ))}
            </div>
            {/* Count stepper */}
            <div style={{ display:'flex', alignItems:'center', gap:6, borderRadius:10, border:'1px solid var(--border)', padding:'4px 8px', flexShrink:0 }}>
                <button onClick={()=>setCount(c=>Math.max(5,c-5))} disabled={count<=5}
                    style={{ width:22,height:22,borderRadius:6,border:'none',background:'rgba(255,255,255,0.06)',color:'var(--text-secondary)',cursor:count<=5?'not-allowed':'pointer',fontWeight:700,fontSize:'1rem',opacity:count<=5?0.35:1,lineHeight:1 }}>−</button>
                <span style={{ fontSize:'0.82rem',color:'var(--text-primary)',fontWeight:700,minWidth:28,textAlign:'center' }}>{count}Q</span>
                <button onClick={()=>setCount(c=>Math.min(20,c+5))} disabled={count>=20}
                    style={{ width:22,height:22,borderRadius:6,border:'none',background:'rgba(255,255,255,0.06)',color:'var(--text-secondary)',cursor:count>=20?'not-allowed':'pointer',fontWeight:700,fontSize:'1rem',opacity:count>=20?0.35:1,lineHeight:1 }}>+</button>
            </div>
            {/* Timer toggle */}
            <button onClick={()=>setTimer(t=>!t)} title={timer?'Disable timer':'Enable 30s timer'}
                style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',borderRadius:10,border:`1px solid ${timer?'rgba(99,102,241,0.5)':'var(--border)'}`,background:timer?'rgba(99,102,241,0.12)':'transparent',color:timer?'#818cf8':'var(--text-muted)',fontSize:'0.8rem',fontWeight:timer?700:400,cursor:'pointer',fontFamily:'inherit',transition:'all 0.18s',flexShrink:0 }}>
                <Clock size={12}/>{timer?'Timer ON':'Timer'}
            </button>
            {/* Start button */}
            <button onClick={onStart} className="btn-gradient"
                style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 18px',fontSize:'0.86rem',marginLeft:'auto',flexShrink:0 }}>
                <Brain size={13}/>{started ? 'New Quiz' : 'Start Quiz'}
            </button>
        </div>
    );
};

// ─── Quiz Tab ─────────────────────────────────────────────────────────────────
const QuizTab = ({ subject }) => {
    const [questions, setQuestions] = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState(null);
    const [started,   setStarted]   = useState(false);
    const [selected,  setSelected]  = useState({});
    const [revealed,  setRevealed]  = useState({});

    // Settings
    const [diff,  setDiff]  = useState('medium');
    const [count, setCount] = useState(5);
    const [timer, setTimer] = useState(false);

    // Timer state per question
    const [timeLeft, setTimeLeft] = useState({});
    const timerRefs = useRef({});
    const TIMER_SEC = 30;

    const generate = async () => {
        // Clear any running timers
        Object.values(timerRefs.current).forEach(clearInterval);
        timerRefs.current = {};

        setLoading(true); setError(null); setStarted(true); setSelected({}); setRevealed({}); setTimeLeft({});
        try {
            const res  = await fetch('/api/quiz', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ difficulty: diff, num_questions: count, subject }) });
            const data = await res.json();
            if (res.ok) {
                const qs = data.questions || [];
                setQuestions(qs);
                if (timer) {
                    const tl = {};
                    qs.forEach((_,i) => { tl[i] = TIMER_SEC; });
                    setTimeLeft(tl);
                    qs.forEach((_,i) => startTimer(i));
                }
            } else { setError(data.error); }
        } catch { setError('Failed to generate quiz.'); }
        finally { setLoading(false); }
    };

    const startTimer = (i) => {
        timerRefs.current[i] = setInterval(() => {
            setTimeLeft(prev => {
                const next = (prev[i] ?? TIMER_SEC) - 1;
                if (next <= 0) {
                    clearInterval(timerRefs.current[i]);
                    setRevealed(r => ({ ...r, [i]: true }));
                    return { ...prev, [i]: 0 };
                }
                return { ...prev, [i]: next };
            });
        }, 1000);
    };

    const revealAnswer = (i) => {
        clearInterval(timerRefs.current[i]);
        setRevealed(p => {
            const next = { ...p, [i]: true };
            if (Object.keys(next).length === questions.length) {
                trackEvent('quiz_completed', { score: Object.entries(next).filter(([k]) => selected[k] === questions[k]?.answer).length });
            }
            return next;
        });
    };

    // Stop timers for revealed questions
    useEffect(() => {
        Object.keys(revealed).forEach(i => {
            if (timerRefs.current[i]) { clearInterval(timerRefs.current[i]); delete timerRefs.current[i]; }
        });
    }, [revealed]);

    const allRevealed  = questions.length > 0 && Object.keys(revealed).length === questions.length;
    const totalCorrect = Object.entries(revealed).filter(([i]) => selected[i] === questions[i]?.answer).length;
    const answered     = Object.keys(selected).length;

    // Progress bar
    const progress = questions.length > 0 ? (Object.keys(revealed).length / questions.length) * 100 : 0;

    return (
        <div>
        {/* Toolbar → always shown (before start + after finish) */}
        <QuizToolbar diff={diff} setDiff={setDiff} count={count} setCount={setCount}
            timer={timer} setTimer={setTimer} onStart={generate} started={started}/>

            {/* Score */}
            {allRevealed && questions.length > 0 && (
                <div style={{ padding:'16px 20px', borderRadius:12, marginBottom:24, display:'flex', alignItems:'center', gap:12, background:totalCorrect===questions.length?'rgba(34,197,94,0.08)':'rgba(251,191,36,0.08)', border:`1px solid ${totalCorrect===questions.length?'rgba(34,197,94,0.3)':'rgba(251,191,36,0.3)'}` }}>
                    <CheckCircle size={26} color={totalCorrect===questions.length?'#4ade80':'#fbbf24'}/>
                    <div>
                        <p style={{ fontWeight:700, fontSize:'1.05rem' }}>Score: {totalCorrect}/{questions.length} ({Math.round(totalCorrect/questions.length*100)}%)</p>
                        <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:2 }}>
                            {totalCorrect===questions.length?'🎉 Perfect!':totalCorrect>=questions.length/2?'👍 Good job — review missed ones.':'📖 Keep studying and try again!'}
                        </p>
                    </div>
                </div>
            )}

            {/* Progress bar (during quiz) */}
            {started && !allRevealed && questions.length > 0 && (
                <div style={{ marginBottom:20 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Progress</span>
                        <span style={{ fontSize:'0.75rem', color:'#818cf8', fontWeight:600 }}>{Object.keys(revealed).length}/{questions.length} revealed</span>
                    </div>
                    <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#6366f1,#a78bfa)', borderRadius:2, transition:'width 0.4s' }}/>
                    </div>
                </div>
            )}

            {!started && !loading && (
                <div className="glass" style={{ padding:'50px 40px', textAlign:'center' }}>
                    <Brain size={48} style={{ margin:'0 auto 18px', color:'#818cf8', opacity:0.4, display:'block' }}/>
                    <h2 style={{ fontWeight:700, marginBottom:10 }}>Ready to test yourself?</h2>
                    <p style={{ color:'var(--text-muted)', fontSize:'0.86rem', marginBottom:24, maxWidth:380, margin:'0 auto 24px' }}>Configure your quiz settings above, then hit Start.</p>
                </div>
            )}
            {loading && <div style={{ textAlign:'center', padding:'60px 0' }}><div className="spin" style={{ width:40,height:40,border:'3px solid rgba(99,102,241,0.2)',borderTopColor:'#6366f1',borderRadius:'50%',margin:'0 auto 14px' }}/><p style={{ color:'var(--text-secondary)' }}>Generating {count} {DIFF[diff]?.label} questions…</p></div>}
            {error && <div style={{ padding:'14px 18px', borderRadius:12, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171' }}>{error}</div>}

            {!loading && !error && questions.map((q,i) => (
                <div key={i} className="glass animate-fade-up" style={{ padding:'20px 22px', marginBottom:16 }}>
                    {/* Question header */}
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12, gap:8 }}>
                        <p style={{ fontWeight:600, lineHeight:1.6, fontSize:'0.93rem', flex:1 }}>
                            <span style={{ color:'var(--accent-light)', marginRight:8 }}>Q{i+1}.</span>{q.question}
                        </p>
                        {timer && !revealed[i] && timeLeft[i] !== undefined && (
                            <CountdownRing seconds={timeLeft[i]} max={TIMER_SEC}/>
                        )}
                    </div>

                    {/* Options */}
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {q.options.map((opt,j) => {
                            const letter=opt[0], isSel=selected[i]===letter, isRev=!!revealed[i], isCorrect=letter===q.answer;
                            let bg='rgba(255,255,255,0.03)',border='var(--border)',color='var(--text-primary)';
                            if(isRev&&isCorrect){bg='rgba(34,197,94,0.1)';border='rgba(34,197,94,0.4)';color='#4ade80';}
                            else if(isRev&&isSel&&!isCorrect){bg='rgba(239,68,68,0.1)';border='rgba(239,68,68,0.4)';color='#f87171';}
                            else if(!isRev&&isSel){bg='rgba(99,102,241,0.12)';border='rgba(99,102,241,0.4)';color='#818cf8';}
                            return (
                                <button key={j} onClick={()=>!isRev&&setSelected(p=>({...p,[i]:letter}))} style={{ display:'flex',alignItems:'center',gap:11,padding:'10px 13px',borderRadius:10,background:bg,border:`1px solid ${border}`,color,cursor:isRev?'default':'pointer',transition:'all 0.2s',textAlign:'left',fontFamily:'inherit',fontSize:'0.86rem' }}>
                                    <span style={{ width:22,height:22,borderRadius:6,background:'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.72rem',flexShrink:0 }}>{letter}</span>
                                    {opt.slice(3)}{isRev&&isCorrect&&<CheckCircle size={13} style={{ marginLeft:'auto',color:'#4ade80' }}/>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Reveal button */}
                    {selected[i]&&!revealed[i]&&(
                        <button onClick={()=>revealAnswer(i)} style={{ marginTop:8,padding:'6px 14px',borderRadius:8,border:'1px solid rgba(99,102,241,0.35)',background:'rgba(99,102,241,0.1)',color:'#818cf8',cursor:'pointer',fontSize:'0.78rem',fontWeight:600,fontFamily:'inherit' }}>
                            Reveal Answer
                        </button>
                    )}

                    {/* Result + explanation */}
                    {revealed[i] && (
                        <div style={{ marginTop:10 }}>
                            <p style={{ fontSize:'0.78rem', color:selected[i]===q.answer?'#4ade80':'#f87171', marginBottom: q.explanation ? 8 : 0 }}>
                                {selected[i]===q.answer ? '✓ Correct!' : `✗ Incorrect. Correct answer: ${q.answer}.`}
                            </p>
                            {q.explanation && (
                                <div style={{ padding:'9px 12px', borderRadius:9, background:'rgba(129,140,248,0.07)', border:'1px solid rgba(129,140,248,0.2)', display:'flex', gap:8 }}>
                                    <Zap size={12} color="#818cf8" style={{ flexShrink:0, marginTop:2 }}/>
                                    <p style={{ fontSize:'0.78rem', color:'var(--text-secondary)', lineHeight:1.6 }}>{q.explanation}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// ─── Flashcard Tab ─────────────────────────────────────────────────────────────
const FlashcardTab = ({ subject }) => {
    const [cards,    setCards]    = useState([]);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState(null);
    const [current,  setCurrent]  = useState(0);
    const [flipped,  setFlipped]  = useState(false);
    const [done,     setDone]     = useState(false);

    const generate = async () => {
        setLoading(true); setError(null); setCards([]); setCurrent(0); setFlipped(false); setDone(false);
        try {
            const res  = await fetch('/api/flashcards', { 
                method:'POST',
                headers:{ 'Content-Type':'application/json' },
                body: JSON.stringify({ subject })
            });
            const data = await res.json();
            if (res.ok) setCards(data.flashcards || []);
            else        setError(data.error);
        } catch { setError('Failed to generate flashcards.'); }
        finally { setLoading(false); }
    };

    const next = () => { setFlipped(false); setTimeout(() => { if (current+1 >= cards.length) setDone(true); else setCurrent(c=>c+1); }, 180); };
    const prev = () => { setFlipped(false); setTimeout(() => setCurrent(c=>Math.max(0,c-1)), 180); };
    const restart = () => { setCurrent(0); setFlipped(false); setDone(false); };

    return (
        <div>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12 }}>
                <p style={{ color:'var(--text-secondary)',fontSize:'0.86rem' }}>Flip-card study from your library. Tap the card to reveal.</p>
                <button onClick={generate} className="btn-gradient" style={{ padding:'10px 22px',fontSize:'0.88rem',display:'flex',alignItems:'center',gap:7 }}>
                    <Layers size={15}/> {cards.length > 0 ? 'New Set' : 'Generate Cards'}
                </button>
            </div>
            {loading && <div style={{ textAlign:'center',padding:'60px 0' }}><div className="spin" style={{ width:40,height:40,border:'3px solid rgba(99,102,241,0.2)',borderTopColor:'#6366f1',borderRadius:'50%',margin:'0 auto 14px' }}/><p style={{ color:'var(--text-secondary)' }}>Generating flashcards…</p></div>}
            {error && <div style={{ padding:'14px 18px',borderRadius:12,background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',color:'#f87171' }}>{error}</div>}
            {!loading && !error && cards.length === 0 && (
                <div className="glass" style={{ padding:'50px 40px',textAlign:'center' }}>
                    <Layers size={48} style={{ margin:'0 auto 18px',color:'#818cf8',opacity:0.35,display:'block' }}/>
                    <h2 style={{ fontWeight:700,marginBottom:10 }}>Flashcard mode</h2>
                    <p style={{ color:'var(--text-muted)',fontSize:'0.86rem',marginBottom:24 }}>6 term/definition cards generated from your library. Tap to flip!</p>
                    <button onClick={generate} className="btn-gradient" style={{ padding:'12px 32px',fontSize:'0.92rem',display:'inline-flex',alignItems:'center',gap:8 }}><Layers size={16}/>Generate Cards</button>
                </div>
            )}
            {!loading && cards.length > 0 && !done && (
                <div style={{ maxWidth:560,margin:'0 auto' }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
                        <span style={{ fontSize:'0.8rem',color:'var(--text-muted)' }}>Card {current+1} of {cards.length}</span>
                        <div style={{ display:'flex',gap:4 }}>{cards.map((_,i) => <div key={i} style={{ width:24,height:4,borderRadius:2,background:i===current?'#6366f1':i<current?'rgba(99,102,241,0.3)':'var(--border)' }}/>)}</div>
                    </div>
                    <div onClick={()=>setFlipped(f=>!f)} style={{ cursor:'pointer',perspective:1200 }}>
                        <div style={{ position:'relative',height:240,transition:'transform 0.45s cubic-bezier(0.4,0,0.2,1)',transformStyle:'preserve-3d',transform:flipped?'rotateY(180deg)':'rotateY(0deg)' }}>
                            <div className="glass" style={{ position:'absolute',inset:0,borderRadius:18,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'28px 32px',backfaceVisibility:'hidden',textAlign:'center' }}>
                                <span style={{ fontSize:'0.7rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:14 }}>TERM</span>
                                <p style={{ fontSize:'1.3rem',fontWeight:800,letterSpacing:'-0.02em',lineHeight:1.3,color:'var(--text-primary)' }}>{cards[current]?.front}</p>
                                <span style={{ marginTop:16,fontSize:'0.72rem',color:'var(--text-muted)' }}>Tap to reveal →</span>
                            </div>
                            <div className="glass" style={{ position:'absolute',inset:0,borderRadius:18,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'28px 32px',backfaceVisibility:'hidden',transform:'rotateY(180deg)',textAlign:'center',background:'rgba(99,102,241,0.07)',borderColor:'rgba(99,102,241,0.25)' }}>
                                <span style={{ fontSize:'0.7rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#818cf8',marginBottom:14 }}>DEFINITION</span>
                                <p style={{ fontSize:'0.96rem',lineHeight:1.7,color:'var(--text-primary)' }}>{cards[current]?.back}</p>
                            </div>
                        </div>
                    </div>
                    <div style={{ display:'flex',gap:10,marginTop:18,justifyContent:'center' }}>
                        <button onClick={prev} disabled={current===0} style={{ padding:'9px 22px',borderRadius:10,border:'1px solid var(--border)',background:'var(--bg-card)',color:'var(--text-secondary)',cursor:current===0?'not-allowed':'pointer',opacity:current===0?0.4:1,fontFamily:'inherit',fontWeight:600,fontSize:'0.86rem',transition:'all 0.2s' }}>← Prev</button>
                        <button onClick={next} className="btn-gradient" style={{ padding:'9px 28px',fontSize:'0.86rem' }}>{current+1===cards.length?'Finish':'Next →'}</button>
                    </div>
                </div>
            )}
            {done && (
                <div className="glass" style={{ maxWidth:440,margin:'0 auto',padding:'44px 36px',textAlign:'center' }}>
                    <p style={{ fontSize:'2.5rem',marginBottom:12 }}>🎉</p>
                    <h2 style={{ fontWeight:800,fontSize:'1.3rem',marginBottom:10 }}>All done!</h2>
                    <p style={{ color:'var(--text-muted)',fontSize:'0.86rem',marginBottom:24 }}>You reviewed all {cards.length} flashcards!</p>
                    <div style={{ display:'flex',gap:10,justifyContent:'center' }}>
                        <button onClick={restart} style={{ padding:'10px 20px',borderRadius:10,border:'1px solid var(--border)',background:'var(--bg-card)',color:'var(--text-secondary)',cursor:'pointer',fontFamily:'inherit',fontWeight:600,fontSize:'0.86rem' }}>Review Again</button>
                        <button onClick={generate} className="btn-gradient" style={{ padding:'10px 20px',fontSize:'0.86rem' }}>New Set</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main QuizView ─────────────────────────────────────────────────────────────
const QuizView = () => {
    const [tab, setTab] = useState('quiz');
    const [subjects, setSubjects] = useState(['All']);
    const [subject, setSubject] = useState('All');

    useEffect(() => {
        fetch('/api/library')
            .then(r => r.json())
            .then(data => {
                if (data.books) {
                    setSubjects(['All', ...new Set(data.books.map(b => b.subject || 'General'))]);
                }
            })
            .catch(() => {});
    }, []);

    return (
        <div style={{ height:'100%',overflowY:'auto' }}>
            <div style={{ maxWidth:760,margin:'0 auto',padding:'32px 28px' }}>
                <h1 style={{ fontSize:'1.55rem',fontWeight:800,letterSpacing:'-0.03em',marginBottom:4,display:'flex',alignItems:'center',gap:10 }}>
                    <Brain size={22} color="#818cf8"/> Study<span className="gradient-text">Mode</span>
                </h1>

                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28,flexWrap:'wrap',gap:10 }}>
                    <div style={{ display:'flex',gap:3,background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',borderRadius:12,padding:4,width:'fit-content' }}>
                        {[{id:'quiz',label:'🧪 Quiz'},{id:'flash',label:'🃏 Flashcards'}].map(t=>(
                            <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'8px 20px',borderRadius:9,border:'none',background:tab===t.id?'rgba(99,102,241,0.18)':'transparent',color:tab===t.id?'#818cf8':'var(--text-muted)',fontWeight:tab===t.id?700:400,fontSize:'0.86rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s' }}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <select
                        value={subject}
                        onChange={(e)=>setSubject(e.target.value)}
                        style={{ padding:'8px 14px', borderRadius:10, background:'rgba(255,255,255,0.05)', color:'var(--text-primary)', border:'1px solid var(--border)', fontSize:'0.86rem', outline:'none' }}
                    >
                        {subjects.map(s => <option key={s} value={s} style={{ background:'#1e293b', color:'#f8fafc' }}>{s === 'All' ? 'All Subjects' : s}</option>)}
                    </select>
                </div>

                {tab==='quiz'  && <QuizTab subject={subject} />}
                {tab==='flash' && <FlashcardTab subject={subject} />}
            </div>
        </div>
    );
};

export default QuizView;
