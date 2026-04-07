import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, CheckCircle, XCircle, Layers, Clock, Zap, ChevronRight, Trophy, RotateCcw } from 'lucide-react';
import { trackEvent } from './StatsView';

const DIFFS = [
    { key:'easy',   label:'Easy',   emoji:'🟢', activeColor:'#4ade80', activeBg:'rgba(74,222,128,0.10)',  activeBorder:'rgba(74,222,128,0.4)'  },
    { key:'medium', label:'Medium', emoji:'🟡', activeColor:'#fbbf24', activeBg:'rgba(251,191,36,0.10)',  activeBorder:'rgba(251,191,36,0.4)'  },
    { key:'hard',   label:'Hard',   emoji:'🔴', activeColor:'#f87171', activeBg:'rgba(248,113,113,0.10)', activeBorder:'rgba(248,113,113,0.4)' },
];

// ─── Timer ring ───────────────────────────────────────────────────────────────
const TimerRing = ({ seconds, max }) => {
    const r = 18;
    const circ = 2 * Math.PI * r;
    const pct  = Math.max(0, seconds / max);
    const color = seconds > max * 0.5 ? '#4ade80' : seconds > max * 0.25 ? '#fbbf24' : '#f87171';
    return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <svg width={44} height={44} style={{ transform:'rotate(-90deg)' }}>
                <circle cx={22} cy={22} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3}/>
                <circle cx={22} cy={22} r={r} fill="none" stroke={color} strokeWidth={3}
                    strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                    style={{ transition:'stroke-dashoffset 0.9s linear, stroke 0.5s' }}/>
            </svg>
            <span style={{ fontSize:'0.72rem', fontWeight:700, color, marginTop:-32, position:'relative', zIndex:1 }}>{seconds}</span>
        </div>
    );
};

// ─── Quiz Setup Screen ────────────────────────────────────────────────────────
const QuizSetup = ({ diff, setDiff, count, setCount, timerOn, setTimerOn, onStart, loading, subjects, subject, setSubject }) => (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:40 }}>
        <div className="glass" style={{ width:'100%', maxWidth:520, padding:'36px 32px', borderRadius:20 }}>
            <div style={{ textAlign:'center', marginBottom:28 }}>
                <Brain size={40} color="#818cf8" style={{ margin:'0 auto 12px', display:'block' }}/>
                <h2 style={{ fontWeight:800, fontSize:'1.35rem', marginBottom:6 }}>Configure Your Quiz</h2>
                <p style={{ color:'var(--text-muted)', fontSize:'0.86rem' }}>Set your preferences, then start!</p>
            </div>

            {/* Subject */}
            <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:8 }}>Subject</label>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                    style={{ width:'100%', padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.05)', color:'var(--text-primary)', border:'1px solid var(--border)', fontSize:'0.88rem', outline:'none' }}>
                    {subjects.map(s => <option key={s} value={s} style={{ background:'#1e293b', color:'#f8fafc' }}>{s === 'All' ? 'All Subjects' : s}</option>)}
                </select>
            </div>

            {/* Difficulty */}
            <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:8 }}>Difficulty</label>
                <div style={{ display:'flex', gap:8 }}>
                    {DIFFS.map(d => (
                        <button key={d.key} onClick={() => setDiff(d.key)} style={{
                            flex:1, padding:'10px 0', border:`1px solid ${diff===d.key ? d.activeBorder : 'var(--border)'}`,
                            borderRadius:10, background: diff===d.key ? d.activeBg : 'transparent',
                            color: diff===d.key ? d.activeColor : 'var(--text-muted)',
                            fontWeight: diff===d.key ? 700 : 500, fontSize:'0.84rem',
                            cursor:'pointer', fontFamily:'inherit', transition:'all 0.18s',
                        }}>{d.emoji} {d.label}</button>
                    ))}
                </div>
            </div>

            {/* Question count */}
            <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:8 }}>Questions: {count}</label>
                <input type="range" min={5} max={20} step={5} value={count} onChange={e => setCount(Number(e.target.value))}
                    style={{ width:'100%', accentColor:'#6366f1' }}/>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'var(--text-muted)', marginTop:4 }}>
                    <span>5</span><span>10</span><span>15</span><span>20</span>
                </div>
            </div>

            {/* Timer toggle */}
            <div style={{ marginBottom:28, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Clock size={15} color="#818cf8"/>
                    <span style={{ fontSize:'0.86rem', fontWeight:600, color:'var(--text-primary)' }}>30s Timer per question</span>
                </div>
                <button onClick={() => setTimerOn(t => !t)} style={{
                    width:42, height:24, borderRadius:12, border:'none', cursor:'pointer',
                    background: timerOn ? '#6366f1' : 'rgba(255,255,255,0.1)',
                    position:'relative', transition:'background 0.2s', flexShrink:0,
                }}>
                    <div style={{
                        position:'absolute', top:3, left: timerOn ? 20 : 3,
                        width:18, height:18, borderRadius:'50%', background:'white',
                        transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)',
                    }}/>
                </button>
            </div>

            <button onClick={onStart} disabled={loading} className="btn-gradient" style={{ width:'100%', padding:'13px', fontSize:'0.96rem', display:'flex', alignItems:'center', justifyContent:'center', gap:8, borderRadius:12 }}>
                {loading ? <><div className="spin" style={{ width:18,height:18,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%' }}/> Generating…</> : <><Brain size={16}/> Start Quiz</>}
            </button>
        </div>
    </div>
);

// ─── Quiz Question Popup ───────────────────────────────────────────────────────
const QuizQuestion = ({ q, qIndex, total, timerOn, onNext, isLast, score }) => {
    const [selected,  setSelected]  = useState(null);
    const [revealed,  setRevealed]  = useState(false);
    const [timeLeft,  setTimeLeft]  = useState(30);
    const timerRef = useRef(null);
    const TIMER_SEC = 30;

    // Start timer when component mounts  
    useEffect(() => {
        if (!timerOn) return;
        setTimeLeft(TIMER_SEC);
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    setRevealed(true);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [timerOn]);

    const handleSelect = (letter) => {
        if (revealed) return;
        clearInterval(timerRef.current);
        setSelected(letter);
        setRevealed(true);
    };

    const isCorrect = selected === q.answer;

    return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:'24px 20px' }}>
            {/* Progress + score */}
            <div style={{ width:'100%', maxWidth:640, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600 }}>Question {qIndex+1} of {total}</span>
                    <span style={{ fontSize:'0.75rem', color:'#818cf8', fontWeight:700 }}>Score: {score}/{qIndex}</span>
                </div>
                <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${((qIndex)/total)*100}%`, background:'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius:2, transition:'width 0.4s' }}/>
                </div>
            </div>

            {/* Question card */}
            <div className="glass" style={{ width:'100%', maxWidth:640, borderRadius:18, padding:'28px 28px 24px', position:'relative' }}>
                {/* Timer */}
                {timerOn && !revealed && (
                    <div style={{ position:'absolute', top:20, right:20 }}>
                        <TimerRing seconds={timeLeft} max={TIMER_SEC}/>
                    </div>
                )}

                <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--accent-light)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:10 }}>Q{qIndex+1}</p>
                <p style={{ fontWeight:700, fontSize:'1.05rem', lineHeight:1.6, marginBottom:22, paddingRight: timerOn && !revealed ? 56 : 0 }}>{q.question}</p>

                {/* Options */}
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {q.options.map((opt, j) => {
                        const letter = opt[0];
                        const isSel  = selected === letter;
                        const isCorr = letter === q.answer;

                        let bg     = 'rgba(255,255,255,0.04)';
                        let border = 'var(--border)';
                        let color  = 'var(--text-primary)';
                        let icon   = null;

                        if (revealed && isCorr) {
                            bg = 'rgba(16,185,129,0.12)'; border = '#10b981'; color = '#4ade80';
                            icon = <CheckCircle size={16} color="#4ade80" style={{ flexShrink:0 }}/>;
                        } else if (revealed && isSel && !isCorr) {
                            bg = 'rgba(239,68,68,0.12)'; border = '#ef4444'; color = '#f87171';
                            icon = <XCircle size={16} color="#f87171" style={{ flexShrink:0 }}/>;
                        } else if (!revealed && isSel) {
                            bg = 'rgba(99,102,241,0.15)'; border = '#818cf8';
                        }

                        return (
                            <button key={j} onClick={() => handleSelect(letter)} style={{
                                display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                                borderRadius:12, background:bg, border:`1px solid ${border}`, color,
                                cursor: revealed ? 'default' : 'pointer', fontFamily:'inherit',
                                fontSize:'0.9rem', textAlign:'left', transition:'all 0.2s',
                            }}
                            onMouseEnter={e => { if (!revealed) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                            onMouseLeave={e => { if (!revealed && !isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; if(!revealed && isSel) e.currentTarget.style.background=bg; }}>
                                <span style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.78rem', flexShrink:0, color: revealed && isCorr ? '#4ade80' : revealed && isSel && !isCorr ? '#f87171' : 'var(--text-secondary)' }}>{letter}</span>
                                <span style={{ flex:1 }}>{opt.slice(3)}</span>
                                {icon}
                            </button>
                        );
                    })}
                </div>

                {/* No selection → time ran out */}
                {revealed && !selected && (
                    <p style={{ marginTop:14, fontSize:'0.82rem', color:'#f87171', fontWeight:600 }}>⏰ Time's up! The correct answer was <strong>{q.answer}</strong>.</p>
                )}

                {/* Result + explanation */}
                {revealed && selected && (
                    <div style={{ marginTop:16, padding:'14px 16px', borderRadius:12, background: isCorrect ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)', border:`1px solid ${isCorrect ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                        <p style={{ fontWeight:700, fontSize:'0.88rem', color: isCorrect ? '#4ade80' : '#f87171', marginBottom: q.explanation ? 8 : 0 }}>
                            {isCorrect ? '✓ Correct!' : `✗ Incorrect — correct answer was ${q.answer}`}
                        </p>
                        {q.explanation && (
                            <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)', lineHeight:1.65 }}>{q.explanation}</p>
                        )}
                    </div>
                )}

                {/* Next button — only shown after reveal */}
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

// ─── Results Screen ───────────────────────────────────────────────────────────
const QuizResults = ({ score, total, onRetry, onNewSetup }) => {
    const pct = Math.round((score / total) * 100);
    const emoji = pct === 100 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '👍' : '📖';
    const msg   = pct === 100 ? 'Perfect score!' : pct >= 70 ? 'Great job!' : pct >= 50 ? 'Good effort — keep studying!' : 'Keep practicing!';

    useEffect(() => {
        trackEvent('quiz_completed', { score });
    }, []); // eslint-disable-line

    return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:40 }}>
            <div className="glass" style={{ width:'100%', maxWidth:460, borderRadius:20, padding:'44px 36px', textAlign:'center' }}>
                <p style={{ fontSize:'3.5rem', marginBottom:16 }}>{emoji}</p>
                <h2 style={{ fontWeight:800, fontSize:'1.6rem', letterSpacing:'-0.03em', marginBottom:8 }}>{msg}</h2>
                <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', marginBottom:28 }}>You answered {score} out of {total} questions correctly.</p>

                {/* Score ring */}
                <div style={{ position:'relative', width:120, height:120, margin:'0 auto 28px' }}>
                    <svg width={120} height={120} style={{ transform:'rotate(-90deg)' }}>
                        <circle cx={60} cy={60} r={50} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10}/>
                        <circle cx={60} cy={60} r={50} fill="none"
                            stroke={pct>=70?'#4ade80':pct>=50?'#fbbf24':'#f87171'} strokeWidth={10}
                            strokeDasharray={2*Math.PI*50}
                            strokeDashoffset={2*Math.PI*50*(1-pct/100)}
                            strokeLinecap="round"
                            style={{ transition:'stroke-dashoffset 1s ease' }}/>
                    </svg>
                    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ fontSize:'1.8rem', fontWeight:800, lineHeight:1 }}>{pct}%</span>
                        <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{score}/{total}</span>
                    </div>
                </div>

                <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                    <button onClick={onRetry} style={{ padding:'11px 22px', borderRadius:12, border:'1px solid var(--border)', background:'transparent', color:'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:'0.88rem', display:'flex', alignItems:'center', gap:7 }}>
                        <RotateCcw size={14}/> Retry
                    </button>
                    <button onClick={onNewSetup} className="btn-gradient" style={{ padding:'11px 24px', fontSize:'0.88rem', borderRadius:12, display:'flex', alignItems:'center', gap:7 }}>
                        <Brain size={14}/> New Quiz
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Quiz Tab ─────────────────────────────────────────────────────────────────
const QuizTab = ({ subjects }) => {
    const [phase,     setPhase]     = useState('setup');   // 'setup' | 'playing' | 'results'
    const [questions, setQuestions] = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState(null);
    const [qIndex,    setQIndex]    = useState(0);
    const [score,     setScore]     = useState(0);

    // Setup settings
    const [diff,     setDiff]     = useState('medium');
    const [count,    setCount]    = useState(5);
    const [timerOn,  setTimerOn]  = useState(false);
    const [subject,  setSubject]  = useState('All');

    const generate = async () => {
        setLoading(true); setError(null);
        try {
            const res  = await fetch('/api/quiz', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ difficulty: diff, num_questions: count, subject }) });
            const data = await res.json();
            if (res.ok) {
                setQuestions(data.questions || []);
                setQIndex(0);
                setScore(0);
                setPhase('playing');
            } else { setError(data.error || 'Failed to generate quiz.'); }
        } catch { setError('Network error.'); }
        finally { setLoading(false); }
    };

    const handleNext = (wasCorrect) => {
        const newScore = score + (wasCorrect ? 1 : 0);
        setScore(newScore);
        if (qIndex + 1 >= questions.length) {
            setPhase('results');
        } else {
            setQIndex(i => i + 1);
        }
    };

    if (phase === 'setup' || phase === 'error') return (
        <>
            {error && <div style={{ maxWidth:520, margin:'0 auto 16px', padding:'12px 16px', borderRadius:12, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', fontSize:'0.86rem' }}>{error}</div>}
            <QuizSetup diff={diff} setDiff={setDiff} count={count} setCount={setCount}
                timerOn={timerOn} setTimerOn={setTimerOn} onStart={generate} loading={loading}
                subjects={subjects} subject={subject} setSubject={setSubject}/>
        </>
    );

    if (phase === 'playing' && questions[qIndex]) return (
        <QuizQuestion
            key={qIndex}
            q={questions[qIndex]}
            qIndex={qIndex}
            total={questions.length}
            timerOn={timerOn}
            onNext={handleNext}
            isLast={qIndex + 1 >= questions.length}
            score={score}
        />
    );

    if (phase === 'results') return (
        <QuizResults
            score={score}
            total={questions.length}
            onRetry={() => { setQIndex(0); setScore(0); setPhase('playing'); }}
            onNewSetup={() => { setPhase('setup'); setError(null); }}
        />
    );

    return null;
};

// ─── Flashcard Tab ─────────────────────────────────────────────────────────────
const FlashcardTab = ({ subject }) => {
    const [cards,   setCards]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);
    const [current, setCurrent] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [done,    setDone]    = useState(false);

    const generate = async () => {
        setLoading(true); setError(null); setCards([]); setCurrent(0); setFlipped(false); setDone(false);
        try {
            const res  = await fetch('/api/flashcards', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ subject }) });
            const data = await res.json();
            if (res.ok) setCards(data.flashcards || []);
            else        setError(data.error);
        } catch { setError('Failed to generate flashcards.'); }
        finally { setLoading(false); }
    };

    const next    = () => { setFlipped(false); setTimeout(() => { if (current+1 >= cards.length) setDone(true); else setCurrent(c=>c+1); }, 180); };
    const prev    = () => { setFlipped(false); setTimeout(() => setCurrent(c=>Math.max(0,c-1)), 180); };
    const restart = () => { setCurrent(0); setFlipped(false); setDone(false); };

    return (
        <div style={{ display:'flex', flexDirection:'column', flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12, padding:'0 4px' }}>
                <p style={{ color:'var(--text-secondary)', fontSize:'0.86rem' }}>Flip-card study from your library. Tap the card to reveal.</p>
                <button onClick={generate} className="btn-gradient" style={{ padding:'10px 22px', fontSize:'0.88rem', display:'flex', alignItems:'center', gap:7 }}>
                    <Layers size={15}/> {cards.length > 0 ? 'New Set' : 'Generate Cards'}
                </button>
            </div>
            {loading && <div style={{ textAlign:'center', padding:'60px 0' }}><div className="spin" style={{ width:40,height:40,border:'3px solid rgba(99,102,241,0.2)',borderTopColor:'#6366f1',borderRadius:'50%',margin:'0 auto 14px' }}/><p style={{ color:'var(--text-secondary)' }}>Generating flashcards…</p></div>}
            {error && <div style={{ padding:'14px 18px', borderRadius:12, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171' }}>{error}</div>}
            {!loading && !error && cards.length === 0 && (
                <div className="glass" style={{ padding:'50px 40px', textAlign:'center' }}>
                    <Layers size={48} style={{ margin:'0 auto 18px', color:'var(--text-muted)', opacity:0.35, display:'block' }}/>
                    <h2 style={{ fontWeight:700, marginBottom:10 }}>Flashcard mode</h2>
                    <p style={{ color:'var(--text-muted)', fontSize:'0.86rem', marginBottom:24 }}>6 term/definition cards generated from your library. Tap to flip!</p>
                    <button onClick={generate} className="btn-gradient" style={{ padding:'12px 32px', fontSize:'0.92rem', display:'inline-flex', alignItems:'center', gap:8 }}><Layers size={16}/>Generate Cards</button>
                </div>
            )}
            {!loading && cards.length > 0 && !done && (
                <div style={{ maxWidth:560, margin:'0 auto', width:'100%' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                        <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Card {current+1} of {cards.length}</span>
                        <div style={{ display:'flex', gap:4 }}>{cards.map((_,i) => <div key={i} style={{ width:24, height:4, borderRadius:2, background:i===current?'#6366f1':i<current?'rgba(99,102,241,0.3)':'var(--border)' }}/>)}</div>
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
                    <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                        <button onClick={restart} style={{ padding:'10px 20px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-card)', color:'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:'0.86rem' }}>Review Again</button>
                        <button onClick={generate} className="btn-gradient" style={{ padding:'10px 20px', fontSize:'0.86rem' }}>New Set</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main QuizView ─────────────────────────────────────────────────────────────
const QuizView = () => {
    const [tab,      setTab]      = useState('quiz');
    const [subjects, setSubjects] = useState(['All']);
    const [subject,  setSubject]  = useState('All');

    useEffect(() => {
        fetch('/api/library').then(r=>r.json()).then(data => {
            if (data.books) setSubjects(['All', ...new Set(data.books.map(b => b.subject || 'General'))]);
        }).catch(()=>{});
    }, []);

    return (
        <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {/* Header */}
            <div style={{ padding:'20px 28px 0', flexShrink:0 }}>
                <h1 style={{ fontSize:'1.55rem', fontWeight:800, letterSpacing:'-0.03em', marginBottom:4, display:'flex', alignItems:'center', gap:10 }}>
                    <Brain size={22} color="var(--text-secondary)"/> Study<span style={{ color:'var(--accent)' }}>Mode</span>
                </h1>
                {/* Tab switcher */}
                <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', borderRadius:12, padding:4, width:'fit-content', marginTop:16 }}>
                    {[{id:'quiz',label:'🧪 Quiz'},{id:'flash',label:'🃏 Flashcards'}].map(t=>(
                        <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'8px 20px', borderRadius:9, border:'none', background:tab===t.id?'var(--bg-card-hover)':'transparent', color:tab===t.id?'var(--text-primary)':'var(--text-muted)', fontWeight:tab===t.id?700:400, fontSize:'0.86rem', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content — fills remaining height */}
            <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>
                {tab==='quiz'  && <QuizTab subjects={subjects}/>}
                {tab==='flash' && (
                    <div style={{ maxWidth:760, margin:'0 auto', padding:'24px 28px', width:'100%', display:'flex', flexDirection:'column', flex:1 }}>
                        <FlashcardTab subject={subject}/>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizView;
