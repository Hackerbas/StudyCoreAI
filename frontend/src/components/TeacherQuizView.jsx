import React, { useState, useEffect, useRef } from 'react';
import { Brain, Copy, Users, Trophy, CheckCircle, XCircle, Zap, RotateCcw } from 'lucide-react';

const S = { // shared mini-styles
  card: { padding:'20px 24px', borderRadius:16, border:'1px solid rgba(255,255,255,0.07)' },
  label: { fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 },
  pill: (c) => ({ padding:'3px 10px', borderRadius:100, fontSize:'0.72rem', fontWeight:700, background:`${c}15`, border:`1px solid ${c}30`, color:c }),
};

const DIFFS = [{k:'easy',l:'🟢 Easy'},{k:'medium',l:'🟡 Medium'},{k:'hard',l:'🔴 Hard'}];

const Leaderboard = ({ participants, compact }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
    {participants.slice(0, compact ? 5 : 20).map((p, i) => (
      <div key={p.username} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10, background:i===0?'rgba(251,191,36,0.08)':'rgba(255,255,255,0.03)', border:`1px solid ${i===0?'rgba(251,191,36,0.2)':'rgba(255,255,255,0.05)'}` }}>
        <span style={{ width:22, textAlign:'center', fontWeight:800, fontSize:'0.8rem', color:['#fbbf24','#94a3b8','#b45309'][i]||'var(--text-muted)' }}>{i+1}</span>
        <span style={{ flex:1, fontWeight:600, fontSize:'0.88rem', color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.username}</span>
        <span style={{ fontWeight:800, fontSize:'0.9rem', color:'#818cf8' }}>{p.score}</span>
      </div>
    ))}
    {!participants.length && <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'0.84rem', padding:'12px 0' }}>No participants yet</p>}
  </div>
);

// ── Setup Phase ──────────────────────────────────────────────────────────────
const Setup = ({ onCreated }) => {
  const [diff, setDiff] = useState('medium');
  const [count, setCount] = useState(10);
  const [subject, setSubject] = useState('All');
  const [subjects, setSubjects] = useState(['All']);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/library').then(r=>r.json()).then(d => {
      if (d.books) setSubjects(['All', ...new Set(d.books.map(b=>b.subject||'General'))]);
    }).catch(()=>{});
  }, []);

  const create = async () => {
    setLoading(true); setErr('');
    try {
      const res = await fetch('/api/live_quiz/create', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ subject, difficulty:diff, num_questions:count }) });
      const d = await res.json();
      if (res.ok) onCreated(d.code, d.num_questions);
      else setErr(d.error || 'Failed');
    } catch { setErr('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, padding:32 }}>
      <div className="glass" style={{ width:'100%', maxWidth:520, padding:'36px 32px', borderRadius:20 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <Zap size={36} color="#818cf8" style={{ margin:'0 auto 12px', display:'block' }}/>
          <h2 style={{ fontWeight:800, fontSize:'1.3rem', marginBottom:6 }}>Host a Live Quiz</h2>
          <p style={{ color:'var(--text-muted)', fontSize:'0.86rem' }}>AI generates questions → students join with a code → live game!</p>
        </div>
        {err && <div style={{ marginBottom:16, padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', fontSize:'0.84rem' }}>{err}</div>}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={S.label}>Subject</label>
            <select value={subject} onChange={e=>setSubject(e.target.value)} style={{ width:'100%', padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text-primary)', fontSize:'0.88rem', outline:'none' }}>
              {subjects.map(s=><option key={s} value={s} style={{ background:'#1e293b' }}>{s==='All'?'All Subjects':s}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Difficulty</label>
            <div style={{ display:'flex', gap:8 }}>
              {DIFFS.map(d=><button key={d.k} onClick={()=>setDiff(d.k)} style={{ flex:1, padding:'9px 0', borderRadius:10, border:`1px solid ${diff===d.k?'rgba(99,102,241,0.5)':'var(--border)'}`, background:diff===d.k?'rgba(99,102,241,0.12)':'transparent', color:diff===d.k?'#a5b4fc':'var(--text-muted)', fontWeight:700, fontSize:'0.84rem', cursor:'pointer', fontFamily:'inherit' }}>{d.l}</button>)}
            </div>
          </div>
          <div>
            <label style={S.label}>Questions: {count}</label>
            <input type="range" min={5} max={20} step={5} value={count} onChange={e=>setCount(Number(e.target.value))} style={{ width:'100%', accentColor:'#6366f1' }}/>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'var(--text-muted)', marginTop:4 }}><span>5</span><span>10</span><span>15</span><span>20</span></div>
          </div>
          <button onClick={create} disabled={loading} className="btn-gradient" style={{ padding:'13px', fontSize:'0.95rem', display:'flex', alignItems:'center', justifyContent:'center', gap:8, borderRadius:12, marginTop:4 }}>
            {loading ? <><div className="spin" style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%' }}/> Generating…</> : <><Zap size={16}/>Create Quiz</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Lobby Phase (waiting for students) ───────────────────────────────────────
const Lobby = ({ code, state, onStart, onEnd }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false), 2000); };
  const pts = state?.participants || [];

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'32px 24px' }}>
      <div className="glass" style={{ ...S.card, textAlign:'center', marginBottom:20 }}>
        <p style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Room Code — Share with your students</p>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginBottom:16 }}>
          <span style={{ fontSize:'3rem', fontWeight:900, letterSpacing:'0.2em', color:'#a5b4fc', fontFamily:'monospace' }}>{code}</span>
          <button onClick={copy} style={{ padding:'8px 16px', borderRadius:10, border:'1px solid rgba(99,102,241,0.4)', background:'rgba(99,102,241,0.1)', color:'#818cf8', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:'0.84rem', display:'flex', alignItems:'center', gap:6 }}>
            <Copy size={14}/>{copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p style={{ color:'var(--text-muted)', fontSize:'0.84rem' }}>Students go to <strong>Quiz → Join Live Quiz</strong> and enter this code.</p>
      </div>

      <div className="glass" style={{ ...S.card, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <p style={{ fontWeight:700, fontSize:'0.95rem', display:'flex', alignItems:'center', gap:8 }}><Users size={16} color="#818cf8"/> Waiting Room <span style={{ color:'#818cf8', marginLeft:4 }}>({pts.length})</span></p>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 8px #4ade80', animation:'pulse 1.5s ease-in-out infinite' }}/>
        </div>
        {pts.length === 0
          ? <p style={{ color:'var(--text-muted)', fontSize:'0.84rem', textAlign:'center', padding:'20px 0' }}>Waiting for students to join…</p>
          : <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {pts.map(p=><span key={p.username} style={{ padding:'6px 14px', borderRadius:100, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', fontSize:'0.84rem', fontWeight:600 }}>🎓 {p.username}</span>)}
            </div>
        }
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={onStart} disabled={pts.length===0} className="btn-gradient" style={{ flex:1, padding:'13px', fontSize:'0.92rem', display:'flex', alignItems:'center', justifyContent:'center', gap:8, borderRadius:12, opacity:pts.length===0?0.5:1 }}>
          <Zap size={16}/> Start Quiz!
        </button>
        <button onClick={onEnd} style={{ padding:'13px 20px', borderRadius:12, border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.08)', color:'#f87171', cursor:'pointer', fontFamily:'inherit', fontSize:'0.88rem', fontWeight:600 }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

// ── Active/Reveal Question ───────────────────────────────────────────────────
const HostQuestion = ({ state, code, onAction }) => {
  const q = state?.question;
  const pts = state?.participants || [];
  const status = state?.status;
  const answered = state?.answer_count || 0;
  const total = pts.length;

  if (!q) return null;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:16, height:'100%', padding:'20px 24px', boxSizing:'border-box' }}>
      {/* Left: question */}
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div className="glass" style={{ ...S.card }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600 }}>Question {q.index+1} of {q.total}</span>
            <span style={{ fontSize:'0.82rem', color:'#4ade80', fontWeight:700 }}>{answered}/{total} answered</span>
          </div>
          <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.08)', marginBottom:16, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${q.total?((q.index)/q.total)*100:0}%`, background:'linear-gradient(90deg,#6366f1,#8b5cf6)', transition:'width 0.4s' }}/>
          </div>
          <p style={{ fontWeight:700, fontSize:'1.1rem', lineHeight:1.6, marginBottom:18 }}>{q.question}</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {(q.options||[]).map((opt,i) => {
              const letter = opt[0];
              const isCorrect = status==='reveal' && letter === q.answer;
              const isWrong = status==='reveal' && letter !== q.answer;
              return (
                <div key={i} style={{ padding:'12px 16px', borderRadius:12, border:`1px solid ${isCorrect?'#4ade80':isWrong?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.1)'}`, background:isCorrect?'rgba(74,222,128,0.1)':isWrong?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', gap:10, opacity:isWrong?0.5:1 }}>
                  <span style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.8rem', flexShrink:0 }}>{letter}</span>
                  <span style={{ flex:1, fontSize:'0.9rem' }}>{opt.slice(3)}</span>
                  {isCorrect && <CheckCircle size={16} color="#4ade80"/>}
                </div>
              );
            })}
          </div>
          {status==='reveal' && q.explanation && (
            <div style={{ marginTop:14, padding:'12px 16px', borderRadius:10, background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.2)', fontSize:'0.84rem', color:'var(--text-secondary)', lineHeight:1.65 }}>
              💡 {q.explanation}
            </div>
          )}
        </div>

        {/* Teacher controls */}
        <div style={{ display:'flex', gap:10 }}>
          {status==='active' && (
            <button onClick={()=>onAction('reveal')} className="btn-gradient" style={{ flex:1, padding:'12px', fontSize:'0.9rem', display:'flex', alignItems:'center', justifyContent:'center', gap:8, borderRadius:12 }}>
              <CheckCircle size={15}/> Reveal Answer
            </button>
          )}
          {status==='reveal' && (
            <button onClick={()=>onAction('next')} className="btn-gradient" style={{ flex:1, padding:'12px', fontSize:'0.9rem', display:'flex', alignItems:'center', justifyContent:'center', gap:8, borderRadius:12 }}>
              {q.index+1 >= q.total ? <><Trophy size={15}/> Show Results</> : <>Next Question →</>}
            </button>
          )}
          <button onClick={()=>onAction('end')} style={{ padding:'12px 18px', borderRadius:12, border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.07)', color:'#f87171', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:'0.84rem' }}>End</button>
        </div>
      </div>

      {/* Right: live leaderboard */}
      <div className="glass" style={{ ...S.card, display:'flex', flexDirection:'column' }}>
        <p style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:14, display:'flex', alignItems:'center', gap:7 }}><Trophy size={15} color="#fbbf24"/> Leaderboard</p>
        <Leaderboard participants={pts} compact/>
      </div>
    </div>
  );
};

// ── Final Results ────────────────────────────────────────────────────────────
const HostResults = ({ state, onReset }) => {
  const pts = state?.participants || [];
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, padding:32 }}>
      <div className="glass" style={{ width:'100%', maxWidth:480, padding:'40px 32px', borderRadius:20, textAlign:'center' }}>
        <p style={{ fontSize:'3rem', marginBottom:12 }}>🏆</p>
        <h2 style={{ fontWeight:800, fontSize:'1.4rem', marginBottom:4 }}>Quiz Complete!</h2>
        <p style={{ color:'var(--text-muted)', fontSize:'0.86rem', marginBottom:28 }}>{pts.length} students participated</p>
        <div style={{ marginBottom:28, textAlign:'left' }}>
          <p style={{ fontWeight:700, fontSize:'0.88rem', marginBottom:12, display:'flex', alignItems:'center', gap:7 }}><Trophy size={15} color="#fbbf24"/> Final Leaderboard</p>
          <Leaderboard participants={pts}/>
        </div>
        <button onClick={onReset} className="btn-gradient" style={{ padding:'12px 32px', fontSize:'0.9rem', display:'inline-flex', alignItems:'center', gap:8, borderRadius:12 }}>
          <RotateCcw size={14}/> New Quiz
        </button>
      </div>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const TeacherQuizView = () => {
  const [phase, setPhase] = useState('setup'); // setup | lobby | game | done
  const [code, setCode]   = useState('');
  const [state, setState] = useState(null);
  const pollRef = useRef(null);

  const startPolling = (c) => {
    if (pollRef.current) clearInterval(pollRef.current);
    const poll = async () => {
      try {
        const res = await fetch(`/api/live_quiz/${c}/state`);
        const d   = await res.json();
        if (res.ok) {
          setState(d);
          if (d.status === 'finished') { setPhase('done'); clearInterval(pollRef.current); }
          else if (d.status === 'waiting') setPhase('lobby');
          else setPhase('game');
        }
      } catch {}
    };
    poll();
    pollRef.current = setInterval(poll, 2000);
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  const handleCreated = (c) => { setCode(c); setPhase('lobby'); startPolling(c); };

  const handleStart = async () => {
    await fetch(`/api/live_quiz/${code}/start`, { method:'POST' });
  };

  const handleAction = async (action) => {
    if (action === 'end') {
      await fetch(`/api/live_quiz/${code}/end`, { method:'POST' });
      return;
    }
    await fetch(`/api/live_quiz/${code}/next`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action }) });
  };

  const reset = () => { setPhase('setup'); setCode(''); setState(null); clearInterval(pollRef.current); };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'20px 28px 0', flexShrink:0 }}>
        <h1 style={{ fontSize:'1.55rem', fontWeight:800, letterSpacing:'-0.03em', marginBottom:4, display:'flex', alignItems:'center', gap:10 }}>
          <Zap size={22} color="var(--text-secondary)"/> Live<span style={{ color:'var(--accent)' }}> Quiz</span>
          {code && <span style={{ marginLeft:8, padding:'3px 14px', borderRadius:100, background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)', color:'#a5b4fc', fontSize:'1rem', fontFamily:'monospace', letterSpacing:'0.12em' }}>{code}</span>}
        </h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.85rem', marginBottom:0 }}>
          {phase==='setup' && 'Create and host a live Blooket-style quiz for your class.'}
          {phase==='lobby' && 'Waiting for students to join…'}
          {phase==='game'  && (state?.status==='active' ? 'Question live — waiting for answers.' : 'Showing answer — review with the class.')}
          {phase==='done'  && 'Quiz finished!'}
        </p>
      </div>

      <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>
        {phase==='setup' && <Setup onCreated={handleCreated}/>}
        {phase==='lobby' && <Lobby code={code} state={state} onStart={handleStart} onEnd={reset}/>}
        {phase==='game'  && <HostQuestion state={state} code={code} onAction={handleAction}/>}
        {phase==='done'  && <HostResults state={state} onReset={reset}/>}
      </div>
    </div>
  );
};

export default TeacherQuizView;
