import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    ShieldCheck, Users, BookOpen, Terminal, Settings, Download,
    LogOut, RefreshCw, Search, Trash2, KeyRound, Plus, X, Check,
    ChevronLeft, ChevronRight, Eye, EyeOff, BarChart2, Database,
    Zap, FileText, AlertTriangle, GraduationCap, UserPlus, Clock,
    Power, Megaphone, Activity, Globe, Edit3
} from 'lucide-react';

// ── Clock ─────────────────────────────────────────────────────────────────────
function useClock() {
    const [now, setNow] = useState(new Date());
    useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
    return now;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function useToast() {
    const [toasts, setToasts] = useState([]);
    const show = useCallback((msg, ok = true) => {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, ok }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
    }, []);
    return [toasts, show];
}
const ToastStack = ({ toasts }) => (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:8 }}>
        {toasts.map(t => (
            <div key={t.id} className="animate-fade-up" style={{ padding:'12px 18px', borderRadius:12, fontSize:'0.84rem', fontWeight:600, background:t.ok?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)', border:`1px solid ${t.ok?'#10b981':'#ef4444'}`, color:t.ok?'#4ade80':'#f87171', boxShadow:'0 8px 32px rgba(0,0,0,0.4)', display:'flex', alignItems:'center', gap:8 }}>
                {t.ok ? <Check size={14}/> : <X size={14}/>} {t.msg}
            </div>
        ))}
    </div>
);

// ── Modal Base ────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, width=440 }) => (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
        <div style={{ width, maxWidth:'92vw', background:'#0d1117', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, padding:'28px 26px', boxShadow:'0 24px 80px rgba(0,0,0,0.7)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
                <h3 style={{ fontWeight:800, fontSize:'1rem', color:'#f1f5f9', margin:0 }}>{title}</h3>
                <button onClick={onClose} style={{ background:'transparent', border:'none', color:'#64748b', cursor:'pointer', display:'flex', padding:4 }}><X size={18}/></button>
            </div>
            {children}
        </div>
    </div>
);

const modalBtnBase = { padding:'9px 20px', borderRadius:10, cursor:'pointer', fontFamily:'inherit', fontSize:'0.84rem', fontWeight:700 };
const cancelBtn = { ...modalBtnBase, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'#94a3b8' };

// ── Confirm Modal ─────────────────────────────────────────────────────────────
const ConfirmModal = ({ title, message, onConfirm, onClose }) => (
    <Modal title={title} onClose={onClose} width={400}>
        <p style={{ color:'#94a3b8', fontSize:'0.88rem', lineHeight:1.7, marginBottom:22 }}>{message}</p>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={onClose} style={cancelBtn}>Cancel</button>
            <button onClick={onConfirm} style={{ ...modalBtnBase, border:'1px solid rgba(239,68,68,0.4)', background:'rgba(239,68,68,0.15)', color:'#f87171' }}>Confirm Delete</button>
        </div>
    </Modal>
);

// ── Password Reset Modal ──────────────────────────────────────────────────────
const PasswordModal = ({ username, onSubmit, onClose }) => {
    const [pw, setPw] = useState('');
    const [show, setShow] = useState(false);
    const [err, setErr] = useState('');
    const submit = () => { if (pw.length < 6) { setErr('Min 6 characters.'); return; } onSubmit(pw); };
    return (
        <Modal title={`Reset Password — ${username}`} onClose={onClose} width={400}>
            <div style={{ position:'relative', marginBottom:err?8:14 }}>
                <input type={show?'text':'password'} value={pw} onChange={e=>{setPw(e.target.value);setErr('');}} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="New password..." style={{ width:'100%', padding:'10px 42px 10px 14px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'#f1f5f9', fontSize:'0.9rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
                <button onClick={()=>setShow(s=>!s)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', color:'#64748b', cursor:'pointer', display:'flex' }}>{show?<EyeOff size={15}/>:<Eye size={15}/>}</button>
            </div>
            {err && <p style={{ color:'#f87171', fontSize:'0.78rem', marginBottom:10 }}>{err}</p>}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={onClose} style={cancelBtn}>Cancel</button>
                <button onClick={submit} style={{ ...modalBtnBase, border:'1px solid rgba(251,191,36,0.4)', background:'rgba(251,191,36,0.12)', color:'#fbbf24' }}>Reset Password</button>
            </div>
        </Modal>
    );
};

// ── Grade Modal ───────────────────────────────────────────────────────────────
const GradeModal = ({ username, currentGrade, onSubmit, onClose }) => {
    const [grade, setGrade] = useState(currentGrade || '');
    return (
        <Modal title={`Set Grade — ${username}`} onClose={onClose} width={360}>
            <select value={grade} onChange={e=>setGrade(e.target.value)} style={{ width:'100%', padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'#f1f5f9', fontSize:'0.88rem', outline:'none', marginBottom:16, cursor:'pointer' }}>
                <option value="" style={{background:'#0d1117'}}>-- No grade --</option>
                {[...Array(12)].map((_,i)=><option key={i+1} value={i+1} style={{background:'#0d1117'}}>Grade {i+1}</option>)}
            </select>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={onClose} style={cancelBtn}>Cancel</button>
                <button onClick={()=>onSubmit(grade||null)} style={{ ...modalBtnBase, border:'1px solid rgba(99,102,241,0.4)', background:'rgba(99,102,241,0.15)', color:'#818cf8' }}>Save Grade</button>
            </div>
        </Modal>
    );
};

// ── Create Admin Modal ────────────────────────────────────────────────────────
const CreateAdminModal = ({ onSubmit, onClose }) => {
    const [form, setForm] = useState({ username:'', password:'' });
    const [show, setShow] = useState(false);
    const [err, setErr] = useState('');
    const submit = () => {
        if (!form.username.trim()) { setErr('Username required.'); return; }
        if (form.password.length < 6) { setErr('Password min 6 chars.'); return; }
        onSubmit(form);
    };
    const field = (key, placeholder, type='text') => (
        <input autoFocus={key==='username'} type={key==='password'?(show?'text':'password'):type} value={form[key]} onChange={e=>{setForm(p=>({...p,[key]:e.target.value}));setErr('');}} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder={placeholder} style={{ width:'100%', padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'#f1f5f9', fontSize:'0.88rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit', marginBottom:12 }}/>
    );
    return (
        <Modal title="Create Admin Account" onClose={onClose}>
            {field('username','Admin username...')}
            <div style={{ position:'relative' }}>
                {field('password','Password...')}
                <button onClick={()=>setShow(s=>!s)} style={{ position:'absolute', right:12, top:10, background:'transparent', border:'none', color:'#64748b', cursor:'pointer', display:'flex' }}>{show?<EyeOff size={15}/>:<Eye size={15}/>}</button>
            </div>
            {err && <p style={{ color:'#f87171', fontSize:'0.78rem', marginBottom:10 }}>{err}</p>}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={onClose} style={cancelBtn}>Cancel</button>
                <button onClick={submit} style={{ ...modalBtnBase, border:'1px solid rgba(99,102,241,0.4)', background:'rgba(99,102,241,0.15)', color:'#818cf8' }}>Create Admin</button>
            </div>
        </Modal>
    );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const ROLE_C = {
    Admin:   { text:'#f87171', bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.3)'   },
    Teacher: { text:'#c4b5fd', bg:'rgba(139,92,246,0.12)', border:'rgba(139,92,246,0.3)'  },
    Student: { text:'#60a5fa', bg:'rgba(59,130,246,0.12)', border:'rgba(59,130,246,0.3)'  },
};
const RoleBadge = ({ role }) => { const c = ROLE_C[role]||ROLE_C.Student; return <span style={{ padding:'3px 10px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background:c.bg, color:c.text, border:`1px solid ${c.border}`, whiteSpace:'nowrap' }}>{role}</span>; };
const StatCard = ({ label, value, icon:Icon, color, sub }) => (
    <div style={{ padding:'22px 24px', borderRadius:18, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:16, right:16, opacity:0.1, color }}><Icon size={40}/></div>
        <div style={{ fontSize:'0.7rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{label}</div>
        <div style={{ fontSize:'2.8rem', fontWeight:900, color, lineHeight:1, marginBottom:6 }}>{value ?? '—'}</div>
        {sub && <div style={{ fontSize:'0.72rem', color:'#475569', fontWeight:600 }}>{sub}</div>}
        <div style={{ position:'absolute', bottom:0, left:0, height:3, width:'100%', background:`linear-gradient(90deg,${color}80,transparent)` }}/>
    </div>
);

// ── INPUT shared style ────────────────────────────────────────────────────────
const searchStyle = { width:'100%', padding:'9px 12px 9px 36px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#f1f5f9', fontSize:'0.85rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
const theadTh = (right=false) => ({ padding:'13px 18px', textAlign:right?'right':'left', color:'#475569', fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' });
const actionBtn = (border, bg, color) => ({ padding:'5px 11px', borderRadius:8, border:`1px solid ${border}`, background:bg, color, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4, fontSize:'0.72rem', fontWeight:600, fontFamily:'inherit' });
const chipBtn = (active) => ({ padding:'6px 14px', borderRadius:20, border:`1px solid ${active?'rgba(99,102,241,0.5)':'rgba(255,255,255,0.08)'}`, background:active?'rgba(99,102,241,0.15)':'transparent', color:active?'#818cf8':'#64748b', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' });

// ────────────────────────────────────────────────────────────────────────────────
// TAB: OVERVIEW
// ────────────────────────────────────────────────────────────────────────────────
const OverviewTab = ({ stats, logs }) => {
    const rb = stats.role_breakdown || {};
    const total = (rb.Student||0)+(rb.Teacher||0)+(rb.Admin||0);
    const pct = n => total > 0 ? `${((n/total)*100).toFixed(1)}%` : '0%';
    return (
        <div style={{ display:'flex', flexDirection:'column', gap:26 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
                <StatCard label="Total Users" value={stats.users} icon={Users} color="#60a5fa" sub={`${rb.Student||0} students`}/>
                <StatCard label="Library Books" value={stats.books} icon={BookOpen} color="#34d399" sub="Uploaded PDFs"/>
                <StatCard label="Activity Logs" value={stats.logs} icon={Zap} color="#a78bfa" sub="All-time events"/>
                <StatCard label="Saved Quizzes" value={stats.saved_quizzes} icon={FileText} color="#fbbf24" sub="By all users"/>
            </div>

            <div style={{ padding:'22px 24px', borderRadius:18, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>Role Distribution</div>
                <div style={{ display:'flex', gap:2, height:10, borderRadius:6, overflow:'hidden', marginBottom:14, background:'rgba(255,255,255,0.04)' }}>
                    <div style={{ width:pct(rb.Student||0), background:'#3b82f6', transition:'width 0.6s ease' }}/>
                    <div style={{ width:pct(rb.Teacher||0), background:'#a855f7', transition:'width 0.6s ease' }}/>
                    <div style={{ width:pct(rb.Admin||0),   background:'#ef4444', transition:'width 0.6s ease' }}/>
                </div>
                <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                    {[['Students', rb.Student||0,'#60a5fa'],['Teachers', rb.Teacher||0,'#c4b5fd'],['Admins', rb.Admin||0,'#f87171']].map(([label,n,color])=>(
                        <div key={label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:10, height:10, borderRadius:3, background:color }}/>
                            <span style={{ color:'#94a3b8', fontSize:'0.82rem' }}>{label}</span>
                            <span style={{ color, fontWeight:800, fontSize:'0.88rem' }}>{n}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ padding:'22px 24px', borderRadius:18, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>Recent Activity</div>
                {(!logs||logs.length===0) ? <p style={{ color:'#334155', fontSize:'0.84rem' }}>No events yet.</p> : (
                    <div style={{ display:'flex', flexDirection:'column', gap:1, maxHeight:320, overflowY:'auto' }}>
                        {logs.slice(0,15).map(l => {
                            const isErr = l.action?.includes('Failed')||l.action?.includes('Deleted')||l.action?.includes('delete');
                            const isAdm = l.role==='Admin'||l.action?.includes('Admin');
                            const ac = isErr?'#f87171':isAdm?'#c4b5fd':'#34d399';
                            return (
                                <div key={l.id} style={{ display:'flex', gap:12, padding:'6px 8px', borderRadius:6, alignItems:'flex-start', fontFamily:'monospace', fontSize:'0.75rem' }}>
                                    <span style={{ color:'#334155', whiteSpace:'nowrap', flexShrink:0 }}>{new Date(l.created_at).toLocaleTimeString()}</span>
                                    <span style={{ color:'#38bdf8', fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}>@{l.username}</span>
                                    <span style={{ color:ROLE_C[l.role]?.text||'#64748b', flexShrink:0 }}>{l.role}</span>
                                    <span style={{ color:ac, fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}>[{l.action}]</span>
                                    <span style={{ color:'#475569', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.detail}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────────
// TAB: USERS
// ── Full Edit Modal ───────────────────────────────────────────────────────────
const FullEditModal = ({ userId, onClose, onSaved, showToast }) => {
    const [data, setData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [pw, setPw] = useState('');
    const GRADES = [8,9,10,11,12];
    const inp = {width:'100%',padding:'9px 12px',borderRadius:9,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'#f1f5f9',fontSize:'0.85rem',outline:'none',boxSizing:'border-box',fontFamily:'inherit'};
    const lbl = (t) => <div style={{fontSize:'0.68rem',fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:5}}>{t}</div>;

    useEffect(() => {
        fetch(`/api/admin/users/${userId}/full`).then(r=>r.json()).then(d=>{
            const u = d.user||{};
            const st = u.stats||{};
            setData({
                username: u.username||'', role: u.role||'Student',
                grade_level: u.grade_level||'', teaching_grades: u.teaching_grades||[],
                banned: u.banned||false,
                streak: st.streak||0, questions: st.questions_asked||0,
                quizzes: st.quizzes_taken||0, best: st.best_score||0, avg: st.avg_score||0,
            });
        }).catch(()=>showToast('Failed to load user.',false));
    },[userId]);

    const upd = (k,v) => setData(p=>({...p,[k]:v}));
    const toggleGrade = g => setData(p=>({...p,teaching_grades:p.teaching_grades.includes(g)?p.teaching_grades.filter(x=>x!==g):[...p.teaching_grades,g]}));

    const save = async () => {
        setSaving(true);
        const payload = {
            username: data.username, role: data.role,
            grade_level: data.grade_level||null,
            teaching_grades: data.teaching_grades,
            banned: data.banned,
            stats: { streak:+data.streak, questions_asked:+data.questions, quizzes_taken:+data.quizzes, best_score:+data.best, avg_score:+data.avg },
        };
        if(pw) payload.password = pw;
        const r = await fetch(`/api/admin/users/${userId}/full`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        setSaving(false);
        if(r.ok){showToast('User saved!');onSaved();}else showToast('Save failed.',false);
    };

    if(!data) return (
        <Modal title="Loading…" onClose={onClose} width={520}>
            <div style={{display:'flex',justifyContent:'center',padding:40}}><div className="spin" style={{width:28,height:28,border:'3px solid rgba(99,102,241,0.2)',borderTopColor:'#6366f1',borderRadius:'50%'}}/></div>
        </Modal>
    );

    return (
        <Modal title={`✏️ Full Edit — ${data.username}`} onClose={onClose} width={560}>
            <div style={{display:'flex',flexDirection:'column',gap:16,maxHeight:'70vh',overflowY:'auto',paddingRight:4}}>
                {/* Identity */}
                <div style={{padding:'16px',borderRadius:12,background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.15)'}}>
                    <div style={{fontWeight:700,color:'#818cf8',fontSize:'0.78rem',marginBottom:12,textTransform:'uppercase',letterSpacing:'0.06em'}}>Identity</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                        <div>{lbl('Username')}<input value={data.username} onChange={e=>upd('username',e.target.value)} style={inp}/></div>
                        <div>{lbl('Role')}
                            <select value={data.role} onChange={e=>upd('role',e.target.value)} style={inp}>
                                {['Student','Teacher','Admin'].map(r=><option key={r} value={r} style={{background:'#0d1117'}}>{r}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{marginTop:12,position:'relative'}}>
                        {lbl('New Password (leave blank to keep current)')}
                        <input type={showPw?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" style={{...inp,paddingRight:40}}/>
                        <button onClick={()=>setShowPw(s=>!s)} style={{position:'absolute',right:10,bottom:8,background:'transparent',border:'none',color:'#64748b',cursor:'pointer',display:'flex'}}>{showPw?<EyeOff size={14}/>:<Eye size={14}/>}</button>
                    </div>
                </div>

                {/* Grade / Teaching */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div style={{padding:'14px',borderRadius:12,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)'}}>
                        {lbl('Grade Level')}
                        <select value={data.grade_level} onChange={e=>upd('grade_level',e.target.value)} style={inp}>
                            <option value="" style={{background:'#0d1117'}}>None</option>
                            {GRADES.map(g=><option key={g} value={g} style={{background:'#0d1117'}}>Grade {g}</option>)}
                        </select>
                    </div>
                    <div style={{padding:'14px',borderRadius:12,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)'}}>
                        {lbl('Banned?')}
                        <button onClick={()=>upd('banned',!data.banned)} style={{width:'100%',padding:'8px',borderRadius:9,border:`1px solid ${data.banned?'rgba(239,68,68,0.4)':'rgba(255,255,255,0.1)'}`,background:data.banned?'rgba(239,68,68,0.12)':'transparent',color:data.banned?'#f87171':'#64748b',cursor:'pointer',fontWeight:700,fontFamily:'inherit'}}>
                            {data.banned?'🚫 Banned — Click to Unban':'✓ Active — Click to Ban'}
                        </button>
                    </div>
                </div>

                {data.role==='Teacher' && (
                    <div style={{padding:'14px',borderRadius:12,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)'}}>
                        {lbl('Teaching Grades')}
                        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
                            {GRADES.map(g=><button key={g} onClick={()=>toggleGrade(g)} style={{padding:'5px 14px',borderRadius:100,border:`1px solid ${data.teaching_grades.includes(g)?'rgba(99,102,241,0.5)':'rgba(255,255,255,0.1)'}`,background:data.teaching_grades.includes(g)?'rgba(99,102,241,0.12)':'transparent',color:data.teaching_grades.includes(g)?'#a5b4fc':'#64748b',fontWeight:700,fontSize:'0.78rem',cursor:'pointer',fontFamily:'inherit'}}>Gr {g}</button>)}
                        </div>
                    </div>
                )}

                {/* Stats Editor */}
                <div style={{padding:'16px',borderRadius:12,background:'rgba(251,191,36,0.04)',border:'1px solid rgba(251,191,36,0.15)'}}>
                    <div style={{fontWeight:700,color:'#fbbf24',fontSize:'0.78rem',marginBottom:12,textTransform:'uppercase',letterSpacing:'0.06em'}}>Stats Override</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
                        {[['Streak🔥','streak'],['Questions💬','questions'],['Quizzes🎯','quizzes'],['Best🏆','best'],['Avg📊','avg']].map(([label,key])=>(
                            <div key={key}>
                                {lbl(label)}
                                <input type="number" min={0} value={data[key]} onChange={e=>upd(key,e.target.value)} style={{...inp,textAlign:'center'}}/>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
                <button onClick={onClose} style={cancelBtn}>Cancel</button>
                <button onClick={save} disabled={saving} style={{...modalBtnBase,border:'1px solid rgba(99,102,241,0.4)',background:'rgba(99,102,241,0.15)',color:'#818cf8'}}>
                    {saving?'Saving…':'💾 Save All Changes'}
                </button>
            </div>
        </Modal>
    );
};

// ────────────────────────────────────────────────────────────────────────────────
const UsersTab = ({ users, onRefresh, showToast, onViewAs }) => {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [modal, setModal] = useState(null);
    const [editUserId, setEditUserId] = useState(null);
    const [selected, setSelected] = useState(new Set());

    const filtered = users.filter(u => {
        const mR = roleFilter==='All'||u.role===roleFilter;
        const mS = (u.username||'').toLowerCase().includes(search.toLowerCase());
        return mR && mS;
    });

    const doDelete = async (uid, username) => {
        const r = await fetch(`/api/admin/users/${uid}`,{method:'DELETE'});
        setModal(null);
        if(r.ok){showToast(`"${username}" deleted.`);onRefresh();}else showToast('Delete failed.',false);
    };
    const doBan = async (u) => {
        const r = await fetch(`/api/admin/users/${u.id}/ban`,{method:'POST'});
        if(r.ok){const d=await r.json();showToast(d.message);onRefresh();}else showToast('Ban failed.',false);
    };
    const bulkDelete = async () => {
        if(selected.size===0) return;
        let ok=0;
        for(const id of selected){ const r=await fetch(`/api/admin/users/${id}`,{method:'DELETE'}); if(r.ok) ok++; }
        setSelected(new Set()); setModal(null); showToast(`Deleted ${ok} user(s).`); onRefresh();
    };
    const toggleSel = (id) => setSelected(p=>{ const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
    const selAll = () => setSelected(filtered.length===selected.size?new Set():new Set(filtered.map(u=>u.id)));

    return (
        <div>
            {modal?.type==='delete' && <ConfirmModal title="Delete User" message={`Permanently delete "${modal.u.username}"?`} onConfirm={()=>doDelete(modal.u.id,modal.u.username)} onClose={()=>setModal(null)}/>}
            {modal?.type==='bulk_delete' && <ConfirmModal title={`Delete ${selected.size} Users`} message="This will permanently delete all selected users and their data." onConfirm={bulkDelete} onClose={()=>setModal(null)}/>}
            {editUserId && <FullEditModal userId={editUserId} showToast={showToast} onClose={()=>setEditUserId(null)} onSaved={()=>{setEditUserId(null);onRefresh();}}/>}

            <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
                <div style={{position:'relative',flex:1,minWidth:200}}>
                    <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#475569'}}/>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search username…" style={searchStyle}/>
                </div>
                <div style={{display:'flex',gap:6}}>
                    {['All','Student','Teacher','Admin'].map(r=><button key={r} onClick={()=>setRoleFilter(r)} style={chipBtn(roleFilter===r)}>{r}</button>)}
                </div>
                <span style={{color:'#475569',fontSize:'0.78rem'}}>{filtered.length} users</span>
                {selected.size>0 && <button onClick={()=>setModal({type:'bulk_delete'})} style={actionBtn('rgba(239,68,68,0.4)','rgba(239,68,68,0.12)','#f87171')}>🗑 Delete {selected.size} Selected</button>}
            </div>

            <div style={{borderRadius:16,overflow:'hidden',border:'1px solid rgba(255,255,255,0.06)'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.83rem'}}>
                    <thead>
                        <tr style={{background:'rgba(0,0,0,0.35)'}}>
                            <th style={{padding:'12px 14px',width:36}}><input type="checkbox" onChange={selAll} checked={selected.size===filtered.length&&filtered.length>0} style={{cursor:'pointer'}}/></th>
                            {['User','Role','Grade / Info','Stats','Actions'].map((h,i)=><th key={h} style={theadTh(i===4)}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length===0
                            ? <tr><td colSpan={6} style={{padding:36,textAlign:'center',color:'#334155'}}>No users found.</td></tr>
                            : filtered.map((u,i)=>{
                                const c=ROLE_C[u.role]||ROLE_C.Student;
                                const st=u.stats||{};
                                const isBanned=u.banned;
                                return (
                                    <tr key={u.id} style={{borderTop:'1px solid rgba(255,255,255,0.04)',background:isBanned?'rgba(239,68,68,0.04)':i%2===0?'transparent':'rgba(255,255,255,0.01)',opacity:isBanned?0.75:1}}>
                                        <td style={{padding:'10px 14px',textAlign:'center'}}><input type="checkbox" checked={selected.has(u.id)} onChange={()=>toggleSel(u.id)} style={{cursor:'pointer'}}/></td>
                                        <td style={{padding:'10px 14px'}}>
                                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                                                <div style={{width:34,height:34,borderRadius:'50%',background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem',fontWeight:800,color:c.text,flexShrink:0,border:`1px solid ${c.border}`}}>{(u.username||'?')[0].toUpperCase()}</div>
                                                <div>
                                                    <div style={{fontWeight:700,color:'#f1f5f9',display:'flex',alignItems:'center',gap:6}}>
                                                        {u.username}
                                                        {isBanned && <span style={{fontSize:'0.62rem',padding:'1px 7px',borderRadius:100,background:'rgba(239,68,68,0.15)',color:'#f87171',border:'1px solid rgba(239,68,68,0.3)',fontWeight:800}}>BANNED</span>}
                                                    </div>
                                                    <div style={{fontSize:'0.66rem',color:'#334155',fontFamily:'monospace'}}>ID:{String(u.id).slice(0,12)}…</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{padding:'10px 14px'}}>
                                            <select value={u.role||'Student'} onChange={e=>{fetch(`/api/admin/users/${u.id}/role`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:e.target.value})}).then(r=>{if(r.ok){showToast(`Role → ${e.target.value}`);onRefresh();}else showToast('Failed',false);});}} style={{padding:'4px 8px',borderRadius:8,background:'rgba(0,0,0,0.3)',border:`1px solid ${c.border}`,color:c.text,fontSize:'0.76rem',fontWeight:700,outline:'none',cursor:'pointer'}}>
                                                {['Student','Teacher','Admin'].map(r=><option key={r} value={r} style={{background:'#0d1117'}}>{r}</option>)}
                                            </select>
                                        </td>
                                        <td style={{padding:'10px 14px',color:'#94a3b8',fontSize:'0.8rem'}}>
                                            <div>{u.grade_level?`Grade ${u.grade_level}`:u.teaching_grades?.length?`Teaches: ${u.teaching_grades.join(', ')}`:<span style={{color:'#334155'}}>—</span>}</div>
                                            <div style={{fontSize:'0.65rem',color:'#475569'}}>{u.created_at?`Joined ${new Date(u.created_at).toLocaleDateString()}`:'—'}</div>
                                        </td>
                                        <td style={{padding:'10px 14px'}}>
                                            <div style={{display:'flex',gap:10,fontSize:'0.72rem',color:'#64748b'}}>
                                                <span title="Streak">🔥{st.streak||0}</span>
                                                <span title="Questions">💬{st.questions_asked||0}</span>
                                                <span title="Quizzes">🎯{st.quizzes_taken||0}</span>
                                                <span title="Best Score">🏆{st.best_score||0}</span>
                                            </div>
                                        </td>
                                        <td style={{padding:'10px 14px',textAlign:'right'}}>
                                            <div style={{display:'flex',gap:5,justifyContent:'flex-end',flexWrap:'wrap'}}>
                                                <button onClick={()=>setEditUserId(u.id)} style={actionBtn('rgba(99,102,241,0.35)','rgba(99,102,241,0.1)','#818cf8')}>✏️ Edit All</button>
                                                <button onClick={()=>onViewAs(u)} style={actionBtn('rgba(52,211,153,0.3)','rgba(52,211,153,0.08)','#34d399')}>👁 View As</button>
                                                <button onClick={()=>doBan(u)} style={actionBtn(isBanned?'rgba(251,191,36,0.3)':'rgba(239,68,68,0.25)',isBanned?'rgba(251,191,36,0.08)':'rgba(239,68,68,0.07)',isBanned?'#fbbf24':'#f87171')}>{isBanned?'Unban':'Ban'}</button>
                                                <button onClick={()=>setModal({type:'delete',u})} style={actionBtn('rgba(239,68,68,0.3)','rgba(239,68,68,0.08)','#f87171')}><Trash2 size={11}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────────
// TAB: LIBRARY (enhanced)
// ────────────────────────────────────────────────────────────────────────────────
const LibraryTab = ({ books, setBooks, showToast }) => {
    const [search, setSearch] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [nuking, setNuking] = useState(false);
    const [nukeConfirm, setNukeConfirm] = useState(false);
    const [chunkCounts, setChunkCounts] = useState({});
    const [reindexing, setReindexing] = useState(null);

    const doDelete = async () => {
        const r = await fetch(`/api/admin/books/${deleteTarget.id}`,{method:'DELETE'});
        const target = deleteTarget;
        setDeleteTarget(null);
        if(r.ok){showToast(`"${target.title||target.filename}" deleted.`);setBooks(prev=>prev.filter(b=>b.id!==target.id));}else showToast('Delete failed.',false);
    };

    const doNuke = async () => {
        setNuking(true); setNukeConfirm(false);
        const r = await fetch('/api/admin/books/all',{method:'DELETE'});
        setNuking(false);
        if(r.ok){const d=await r.json();showToast(d.message);setBooks([]);}else showToast('Nuke failed.',false);
    };

    const fetchChunks = async (bookId) => {
        try{
            const r=await fetch(`/api/admin/books/${bookId}/chunk-count`);
            if(r.ok){const d=await r.json();setChunkCounts(p=>({...p,[bookId]:d}));}
        }catch{}
    };

    const doReindex = async (bookId, title) => {
        setReindexing(bookId);
        const r=await fetch(`/api/admin/books/${bookId}/reindex`,{method:'POST'});
        setReindexing(null);
        if(r.ok){const d=await r.json();showToast(d.message);fetchChunks(bookId);}else showToast('Reindex failed.',false);
    };

    const filtered = books.filter(b=>(b.title||b.filename||'').toLowerCase().includes(search.toLowerCase())||(b.subject||'').toLowerCase().includes(search.toLowerCase()));
    const subjectMap = books.reduce((a,b)=>{const s=b.subject||'General';a[s]=(a[s]||0)+1;return a;},{});

    return (
        <div>
            {deleteTarget && <ConfirmModal title="Delete Book" message={`Delete "${deleteTarget.title||deleteTarget.filename}"? This can't be undone.`} onConfirm={doDelete} onClose={()=>setDeleteTarget(null)}/>}
            {nukeConfirm && <ConfirmModal title="☢ NUKE ENTIRE LIBRARY" message={`This will PERMANENTLY DELETE ALL ${books.length} BOOKS and their PDF files. There is NO undo. Type-confirm and click to proceed.`} onConfirm={doNuke} onClose={()=>setNukeConfirm(false)}/>}

            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
                {Object.entries(subjectMap).map(([s,n])=>(
                    <span key={s} style={{ padding:'4px 12px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background:'rgba(52,211,153,0.1)', color:'#34d399', border:'1px solid rgba(52,211,153,0.25)' }}>{s} ({n})</span>
                ))}
            </div>
            <div style={{ position:'relative', marginBottom:14 }}>
                <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#475569' }}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title or subject…" style={searchStyle}/>
            </div>
            <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)', marginBottom:24 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.84rem' }}>
                    <thead><tr style={{ background:'rgba(0,0,0,0.35)' }}>
                        {['Title','Subject','Author','Yr','Grade','Chunks / Knowledge','Actions'].map((h,i)=><th key={h} style={theadTh(i===6)}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                        {filtered.length===0 ? <tr><td colSpan={7} style={{ padding:36, textAlign:'center', color:'#334155' }}>No books found.</td></tr>
                        : filtered.map((b,i)=>(
                            <tr key={b.id} style={{ borderTop:'1px solid rgba(255,255,255,0.04)', background:i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                                <td style={{ padding:'11px 14px' }}>
                                    <div style={{ fontWeight:600, color:'#f1f5f9', fontSize:'0.83rem' }}>{b.title||b.filename?.replace('.pdf','')||'Untitled'}</div>
                                    <div style={{ fontSize:'0.65rem', color:'#334155', marginTop:1 }}>ID:{b.id} · {b.filename}</div>
                                </td>
                                <td style={{ padding:'11px 14px' }}><span style={{ padding:'2px 9px', borderRadius:20, fontSize:'0.7rem', fontWeight:700, background:'rgba(52,211,153,0.1)', color:'#34d399', border:'1px solid rgba(52,211,153,0.2)' }}>{b.subject||'General'}</span></td>
                                <td style={{ padding:'11px 14px', color:'#94a3b8', fontSize:'0.8rem' }}>{b.author||<span style={{color:'#334155'}}>—</span>}</td>
                                <td style={{ padding:'11px 14px', color:'#475569', fontSize:'0.8rem' }}>{b.year||'—'}</td>
                                <td style={{ padding:'11px 14px', color:'#475569', fontSize:'0.78rem' }}>{b.min_grade&&b.max_grade?`Gr ${b.min_grade}–${b.max_grade}`:'—'}</td>
                                <td style={{ padding:'11px 14px' }}>
                                    {chunkCounts[b.id] ? (
                                        <div style={{ fontSize:'0.72rem' }}>
                                            <span style={{ color:'#34d399', fontWeight:700 }}>{chunkCounts[b.id].chunks}</span><span style={{ color:'#475569' }}> chunks</span>
                                            <span style={{ color:'#818cf8', fontWeight:700, marginLeft:8 }}>{chunkCounts[b.id].knowledge}</span><span style={{ color:'#475569' }}> knowledge</span>
                                        </div>
                                    ) : (
                                        <button onClick={()=>fetchChunks(b.id)} style={{ fontSize:'0.68rem', padding:'2px 8px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'#475569', cursor:'pointer' }}>Check</button>
                                    )}
                                </td>
                                <td style={{ padding:'11px 14px', textAlign:'right' }}>
                                    <div style={{ display:'flex', gap:5, justifyContent:'flex-end' }}>
                                        <button onClick={()=>doReindex(b.id, b.title)} disabled={reindexing===b.id} style={actionBtn('rgba(99,102,241,0.3)','rgba(99,102,241,0.08)','#818cf8')}>{reindexing===b.id?'…':'⟳'} Reindex</button>
                                        <button onClick={()=>setDeleteTarget(b)} style={actionBtn('rgba(239,68,68,0.3)','rgba(239,68,68,0.08)','#f87171')}><Trash2 size={11}/> Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Danger Zone */}
            <div style={{ padding:'22px 24px', borderRadius:18, background:'rgba(239,68,68,0.04)', border:'1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}><AlertTriangle size={16} color="#f87171"/><span style={{ fontSize:'0.72rem', fontWeight:800, color:'#f87171', textTransform:'uppercase', letterSpacing:'0.08em' }}>Danger Zone</span></div>
                <p style={{ color:'#64748b', fontSize:'0.83rem', marginBottom:14 }}>Nuke Library permanently deletes ALL books, their PDF files, chunks, and knowledge data. Students lose access immediately.</p>
                <button onClick={()=>setNukeConfirm(true)} disabled={nuking||books.length===0} style={{ padding:'10px 22px', borderRadius:10, border:'1px solid rgba(239,68,68,0.5)', background:'rgba(239,68,68,0.12)', color:'#f87171', cursor:'pointer', fontWeight:700, fontSize:'0.84rem', fontFamily:'inherit' }}>
                    {nuking?'Deleting…':`☢ Nuke Library (${books.length} books)`}
                </button>
            </div>
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────────
// TAB: ACTIVITY LOGS
// ────────────────────────────────────────────────────────────────────────────────
const LogsTab = ({ logs, showToast, onRefresh }) => {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [actionFilter, setActionFilter] = useState('All');
    const [page, setPage] = useState(0);
    const [clearing, setClearing] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const PER = 50;

    const ACTION_TYPES = ['All','Login','Chat','Quiz','Plan','Admin','Failed'];

    const clearLogs = async () => {
        setClearing(true);
        const r = await fetch('/api/admin/logs/clear', {method:'DELETE'});
        setClearing(false); setConfirmClear(false);
        if(r.ok){showToast('All logs cleared.');onRefresh();}else showToast('Clear failed.',false);
    };

    const filtered = logs.filter(l=>{
        const mR = roleFilter==='All'||l.role===roleFilter;
        const mA = actionFilter==='All'||(l.action||'').toLowerCase().includes(actionFilter.toLowerCase());
        const s = search.toLowerCase();
        const mS = !s||(l.username||'').toLowerCase().includes(s)||(l.action||'').toLowerCase().includes(s)||(l.detail||'').toLowerCase().includes(s);
        return mR&&mA&&mS;
    });
    const pages = Math.ceil(filtered.length/PER)||1;
    const paged = filtered.slice(page*PER,(page+1)*PER);
    useEffect(()=>setPage(0),[search,roleFilter,actionFilter]);

    return (
        <div>
            {confirmClear && <ConfirmModal title="Clear All Logs" message={`This will permanently delete all ${logs.length} activity log entries. Cannot be undone.`} onConfirm={clearLogs} onClose={()=>setConfirmClear(false)}/>}
            <div style={{display:'flex',gap:10,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
                <div style={{position:'relative',flex:1,minWidth:200}}>
                    <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#475569'}}/>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search user, action, detail…" style={searchStyle}/>
                </div>
                <div style={{display:'flex',gap:5}}>
                    {['All','Student','Teacher','Admin'].map(r=><button key={r} onClick={()=>setRoleFilter(r)} style={chipBtn(roleFilter===r)}>{r}</button>)}
                </div>
                <button onClick={()=>setConfirmClear(true)} disabled={clearing||logs.length===0} style={actionBtn('rgba(239,68,68,0.3)','rgba(239,68,68,0.08)','#f87171')}>
                    <Trash2 size={11}/> Clear All ({logs.length})
                </button>
                <span style={{color:'#475569',fontSize:'0.78rem',whiteSpace:'nowrap'}}>{filtered.length} events</span>
            </div>
            <div style={{display:'flex',gap:5,marginBottom:14,flexWrap:'wrap'}}>
                {ACTION_TYPES.map(a=><button key={a} onClick={()=>setActionFilter(a)} style={{...chipBtn(actionFilter===a),fontSize:'0.72rem',padding:'4px 10px'}}>{a}</button>)}
            </div>

            <div style={{ background:'#020408', border:'1px solid #0f172a', borderRadius:14, overflow:'hidden' }}>
                <div style={{ padding:'10px 18px', borderBottom:'1px solid #0f172a', display:'flex', alignItems:'center', gap:8 }}>
                    <Terminal size={13} color="#10b981"/>
                    <span style={{ color:'#10b981', fontSize:'0.72rem', fontWeight:700, fontFamily:'monospace', letterSpacing:'0.08em' }}>ACTIVITY_LOG // {filtered.length} EVENTS // PAGE {page+1}/{pages}</span>
                </div>
                <div style={{ padding:'6px 0', maxHeight:'55vh', overflowY:'auto' }}>
                    {paged.length===0 ? <div style={{ padding:'28px 18px', color:'#334155', fontFamily:'monospace', fontSize:'0.78rem' }}>{'>'} No records match filters.</div>
                    : paged.map(l=>{
                        const isErr=l.action?.includes('Failed')||l.action?.includes('Deleted')||l.action?.includes('delete');
                        const isAdm=l.role==='Admin'||l.action?.includes('Admin');
                        const ac=isErr?'#fca5a5':isAdm?'#d8b4fe':'#fbbf24';
                        return (
                            <div key={l.id} style={{ display:'flex', padding:'3px 18px', borderLeft:`3px solid ${isErr?'#ef444430':isAdm?'#a855f730':'#10b98120'}`, fontFamily:'monospace', fontSize:'0.74rem', gap:0 }}>
                                <span style={{ color:'#334155', flexShrink:0, minWidth:168 }}>[{new Date(l.created_at).toLocaleString()}]</span>
                                <span style={{ color:'#38bdf8', fontWeight:700, flexShrink:0, minWidth:118, paddingLeft:8 }}>@{l.username||'system'}</span>
                                <span style={{ color:ROLE_C[l.role]?.text||'#64748b', flexShrink:0, minWidth:78, paddingLeft:8 }}>{l.role||'?'}</span>
                                <span style={{ color:ac, fontWeight:700, flexShrink:0, minWidth:170, paddingLeft:8 }}>[{l.action}]</span>
                                <span style={{ color:'#475569', flex:1, paddingLeft:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.detail}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            {pages>1&&(
                <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'center', marginTop:12 }}>
                    <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{ padding:'7px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:page===0?'#334155':'#94a3b8', cursor:page===0?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:4, fontSize:'0.8rem' }}><ChevronLeft size={13}/> Prev</button>
                    <span style={{ color:'#475569', fontSize:'0.8rem', minWidth:100, textAlign:'center' }}>Page {page+1} / {pages}</span>
                    <button onClick={()=>setPage(p=>Math.min(pages-1,p+1))} disabled={page>=pages-1} style={{ padding:'7px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:page>=pages-1?'#334155':'#94a3b8', cursor:page>=pages-1?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:4, fontSize:'0.8rem' }}>Next <ChevronRight size={13}/></button>
                </div>
            )}
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────────
// TAB: ADMIN TOOLS
// ────────────────────────────────────────────────────────────────────────────────
const AdminToolsTab = ({ currentUser, showToast }) => {
    const now = useClock();
    const [reindexing, setReindexing] = useState(false);
    const [reindexResult, setReindexResult] = useState(null);

    const doReindex = async () => {
        setReindexing(true);
        setReindexResult(null);
        try {
            const res = await fetch('/api/admin/reindex', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setReindexResult(data);
                showToast(`Re-indexed ${data.updated}/${data.total} books!`);
            } else {
                showToast(data.error || 'Re-index failed.', false);
            }
        } catch {
            showToast('Network error during re-index.', false);
        } finally {
            setReindexing(false);
        }
    };

    const infoRow = (label, val) => (
        <div style={{ padding:'12px 16px', borderRadius:12, background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize:'0.68rem', color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{label}</div>
            <div style={{ fontSize:'0.88rem', color:'#f1f5f9', fontWeight:600 }}>{val}</div>
        </div>
    );
    return (
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            {/* Session block */}
            <div style={{ padding:'22px 24px', borderRadius:18, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:16 }}>Active Session</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {infoRow('Logged In As', currentUser?.username||'—')}
                    {infoRow('Role', currentUser?.role||'—')}
                    {infoRow('Auth Level', 'OMEGA — Full Control')}
                    {infoRow('Local Time', now.toLocaleTimeString())}
                </div>
            </div>

            {/* Re-Index Library */}
            <div style={{ padding:'22px 24px', borderRadius:18, background:'rgba(52,211,153,0.04)', border:'1px solid rgba(52,211,153,0.15)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <Database size={16} color="#34d399"/>
                    <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#34d399', textTransform:'uppercase', letterSpacing:'0.08em' }}>Library Re-Index</div>
                </div>
                <p style={{ color:'#64748b', fontSize:'0.84rem', lineHeight:1.6, marginBottom:16 }}>
                    Re-download every PDF from storage and re-extract <strong style={{ color:'#34d399' }}>ALL</strong> pages of text. Use this after upgrading to remove the old 15-page extraction limit so the AI can access full book content.
                </p>
                <button onClick={doReindex} disabled={reindexing} style={{ padding:'10px 22px', borderRadius:12, border:'1px solid rgba(52,211,153,0.35)', background:'rgba(52,211,153,0.12)', color:'#34d399', cursor:reindexing?'not-allowed':'pointer', fontWeight:700, fontSize:'0.84rem', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, transition:'all 0.2s' }}>
                    {reindexing ? <><RefreshCw size={14} className="spin"/> Re-Indexing… This may take a while</> : <><RefreshCw size={14}/> Re-Index All Books</>}
                </button>
                {reindexResult && (
                    <div style={{ marginTop:14, padding:'12px 16px', borderRadius:12, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)' }}>
                        <p style={{ fontWeight:700, fontSize:'0.84rem', color:'#4ade80', marginBottom:4 }}>✓ {reindexResult.message}</p>
                        {reindexResult.errors?.length > 0 && (
                            <div style={{ marginTop:8 }}>
                                <p style={{ fontSize:'0.76rem', color:'#f87171', fontWeight:600, marginBottom:4 }}>Errors:</p>
                                {reindexResult.errors.map((e,i) => <p key={i} style={{ fontSize:'0.72rem', color:'#fca5a5', fontFamily:'monospace' }}>{e}</p>)}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div style={{ padding:'22px 24px', borderRadius:18, background:'rgba(239,68,68,0.04)', border:'1px solid rgba(239,68,68,0.15)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <AlertTriangle size={16} color="#f87171"/>
                    <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#f87171', textTransform:'uppercase', letterSpacing:'0.08em' }}>Danger Zone</div>
                </div>
                <p style={{ color:'#64748b', fontSize:'0.84rem', lineHeight:1.6 }}>
                    Irreversible actions are protected by our database policies. User deletions are permanent and cannot be recovered. Use the User Management tab to remove accounts.
                </p>
            </div>
        </div>
    );
};
// ────────────────────────────────────────────────────────────────────────────────
// TAB: DATABASE
// ────────────────────────────────────────────────────────────────────────────────
const DatabaseTab = ({ showToast }) => {
    const [dbStats, setDbStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [vacuuming, setVacuuming] = useState(false);
    const [vacuumResult, setVacuumResult] = useState(null);

    const fetchStats = async () => {
        setLoading(true);
        const r = await fetch('/api/admin/db/stats');
        if(r.ok){const d=await r.json();setDbStats(d.counts);}
        else showToast('Stats fetch failed.',false);
        setLoading(false);
    };
    const doVacuum = async () => {
        setVacuuming(true); setVacuumResult(null);
        const r = await fetch('/api/admin/db/vacuum',{method:'POST'});
        if(r.ok){const d=await r.json();setVacuumResult(d);showToast(`Vacuum done: ${d.removed_chunks} chunks, ${d.removed_knowledge} knowledge rows removed.`);}
        else showToast('Vacuum failed.',false);
        setVacuuming(false);
    };
    useEffect(()=>{fetchStats();},[]);

    const TABLE_COLORS = { users:'#60a5fa', books:'#34d399', book_chunks:'#818cf8', book_knowledge:'#fbbf24', activity_logs:'#f87171', saved_quizzes:'#fb923c' };
    const TABLE_LABELS = { users:'Users', books:'Books', book_chunks:'Book Chunks (RAG)', book_knowledge:'AI Knowledge Rows', activity_logs:'Activity Logs', saved_quizzes:'Saved Quizzes' };

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <p style={{ color:'#64748b', fontSize:'0.84rem' }}>Live database row counts across all tables.</p>
                <button onClick={fetchStats} disabled={loading} style={actionBtn('rgba(99,102,241,0.3)','rgba(99,102,241,0.08)','#818cf8')}><RefreshCw size={11} className={loading?'spin':''}/> Refresh</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
                {Object.entries(TABLE_LABELS).map(([key,label])=>{
                    const count = dbStats?.[key];
                    const color = TABLE_COLORS[key]||'#94a3b8';
                    const warn = key==='book_chunks'&&count===0;
                    return (
                        <div key={key} style={{ padding:'20px 22px', borderRadius:16, background:'rgba(255,255,255,0.02)', border:`1px solid ${warn?'rgba(239,68,68,0.4)':'rgba(255,255,255,0.06)'}`, position:'relative', overflow:'hidden' }}>
                            <div style={{ fontSize:'0.65rem', fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{label}</div>
                            <div style={{ fontSize:'2.4rem', fontWeight:900, color:warn?'#f87171':color, lineHeight:1 }}>{count===-1?'ERR':count??'…'}</div>
                            {warn&&<div style={{ fontSize:'0.68rem', color:'#f87171', marginTop:4 }}>⚠ Empty — run reindex!</div>}
                            <div style={{ position:'absolute', bottom:0, left:0, height:3, width:'100%', background:`linear-gradient(90deg,${color}80,transparent)` }}/>
                        </div>
                    );
                })}
            </div>

            <div style={{ padding:'22px 24px', borderRadius:18, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight:700, color:'#f1f5f9', marginBottom:8 }}>🧹 Vacuum Database</div>
                <p style={{ color:'#64748b', fontSize:'0.83rem', marginBottom:14 }}>Remove orphaned chunk and knowledge rows whose parent book has been deleted. Safe to run anytime.</p>
                {vacuumResult && <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', color:'#34d399', fontSize:'0.82rem', marginBottom:12 }}>Removed {vacuumResult.removed_chunks} orphan chunks + {vacuumResult.removed_knowledge} knowledge rows.</div>}
                <button onClick={doVacuum} disabled={vacuuming} style={{ padding:'10px 22px', borderRadius:10, border:'1px solid rgba(16,185,129,0.3)', background:'rgba(16,185,129,0.08)', color:'#34d399', cursor:'pointer', fontWeight:700, fontSize:'0.84rem', fontFamily:'inherit' }}>
                    {vacuuming?'Vacuuming…':'Run Vacuum'}
                </button>
            </div>
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────────
// TAB: AI & MODELS
// ────────────────────────────────────────────────────────────────────────────────
const AIModelsTab = ({ showToast }) => {
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const MODELS = [
        { name:'llama-3.3-70b-versatile', label:'Primary', color:'#818cf8', desc:'Best quality, 100K tokens/day limit' },
        { name:'llama-3.1-8b-instant',    label:'Fallback 1', color:'#34d399', desc:'Fast & light — used when primary is rate-limited' },
        { name:'gemma2-9b-it',             label:'Fallback 2', color:'#fbbf24', desc:'Google Gemma — last resort fallback' },
    ];

    const testAI = async () => {
        setTesting(true); setTestResult(null);
        try{
            const r = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'Say OK',mode:'normal'})});
            const d = await r.json();
            setTestResult(r.ok ? {ok:true, msg:'AI responded successfully!'} : {ok:false, msg:d.error||'AI test failed'});
        }catch(e){setTestResult({ok:false,msg:e.message});}
        setTesting(false);
    };

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ padding:'22px 24px', borderRadius:18, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight:700, color:'#f1f5f9', marginBottom:16 }}>Groq Model Fallback Chain</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {MODELS.map((m,i)=>(
                        <div key={m.name} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 18px', borderRadius:14, background:'rgba(255,255,255,0.02)', border:`1px solid ${m.color}25` }}>
                            <div style={{ width:32, height:32, borderRadius:'50%', background:`${m.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, color:m.color, fontSize:'0.9rem', flexShrink:0 }}>{i+1}</div>
                            <div style={{ flex:1 }}>
                                <div style={{ fontWeight:700, color:'#f1f5f9', fontFamily:'monospace', fontSize:'0.84rem' }}>{m.name}</div>
                                <div style={{ fontSize:'0.72rem', color:'#64748b', marginTop:2 }}>{m.desc}</div>
                            </div>
                            <span style={{ padding:'3px 10px', borderRadius:20, fontSize:'0.7rem', fontWeight:700, background:`${m.color}18`, color:m.color, border:`1px solid ${m.color}30` }}>{m.label}</span>
                        </div>
                    ))}
                </div>
                <p style={{ color:'#475569', fontSize:'0.78rem', marginTop:14, lineHeight:1.6 }}>When a model hits its rate limit or daily cap, the system automatically falls back to the next model. No manual intervention needed.</p>
            </div>

            <div style={{ padding:'22px 24px', borderRadius:18, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight:700, color:'#f1f5f9', marginBottom:8 }}>Prompt Mode Rules</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {[['👨‍🎓 Students','Fully restricted — ONLY library content. Off-topic questions are refused.','#60a5fa'],
                      ['👩‍🏫 Teachers','Unrestricted — can ask anything, supplements library context with general AI knowledge.','#c4b5fd'],
                      ['🛡 Admins','Same as Teachers — fully unrestricted.','#f87171']].map(([r,d,c])=>(
                        <div key={r} style={{ display:'flex', gap:14, padding:'12px 16px', borderRadius:12, background:'rgba(255,255,255,0.02)', border:`1px solid ${c}20` }}>
                            <span style={{ fontWeight:700, color:c, minWidth:110, fontSize:'0.82rem' }}>{r}</span>
                            <span style={{ color:'#64748b', fontSize:'0.82rem', lineHeight:1.5 }}>{d}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ padding:'22px 24px', borderRadius:18, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight:700, color:'#f1f5f9', marginBottom:8 }}>Live AI Health Check</div>
                {testResult && <div style={{ marginBottom:12, padding:'10px 14px', borderRadius:10, background:testResult.ok?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)', border:`1px solid ${testResult.ok?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)'}`, color:testResult.ok?'#34d399':'#f87171', fontSize:'0.82rem' }}>{testResult.msg}</div>}
                <button onClick={testAI} disabled={testing} style={{ padding:'10px 22px', borderRadius:10, border:'1px solid rgba(99,102,241,0.3)', background:'rgba(99,102,241,0.1)', color:'#818cf8', cursor:'pointer', fontWeight:700, fontSize:'0.84rem', fontFamily:'inherit' }}>
                    {testing?'Testing…':'⚡ Send Test Ping to AI'}
                </button>
            </div>
        </div>
    );
};

const ExportTab = ({ users, logs, books }) => {
    const csv = (headers, rows) => {
        const lines = [headers.join(','), ...rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(','))];
        const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
        return URL.createObjectURL(blob);
    };
    const download = (filename, href) => { const a=document.createElement('a'); a.href=href; a.download=filename; a.click(); URL.revokeObjectURL(href); };

    const dlUsers = () => download('studycore_users.csv', csv(
        ['ID','Username','Role','Grade','Joined'],
        users.map(u=>[u.id,u.username,u.role,u.grade_level||'',u.created_at||''])
    ));
    const dlLogs = () => download('studycore_logs.csv', csv(
        ['ID','Timestamp','Username','Role','Action','Detail'],
        logs.map(l=>[l.id,l.created_at,l.username,l.role,l.action,l.detail])
    ));
    const dlBooks = () => download('studycore_books.csv', csv(
        ['ID','Filename','Title','Subject','Author','Year','Min Grade','Max Grade'],
        books.map(b=>[b.id,b.filename,b.title,b.subject,b.author,b.year,b.min_grade,b.max_grade])
    ));

    const card = (title, desc, count, label, onClick, color) => (
        <div style={{ padding:'24px', borderRadius:18, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20 }}>
            <div>
                <div style={{ fontWeight:700, color:'#f1f5f9', marginBottom:6 }}>{title}</div>
                <div style={{ color:'#64748b', fontSize:'0.84rem', lineHeight:1.6, marginBottom:12 }}>{desc}</div>
                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background:`rgba(${color},0.12)`, color:`rgb(${color})`, border:`1px solid rgba(${color},0.3)` }}>{count} records</span>
            </div>
            <button onClick={onClick} style={{ padding:'10px 18px', borderRadius:12, border:`1px solid rgba(${color},0.35)`, background:`rgba(${color},0.1)`, color:`rgb(${color})`, cursor:'pointer', fontWeight:700, fontSize:'0.84rem', fontFamily:'inherit', display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
                <Download size={14}/> {label}
            </button>
        </div>
    );

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <p style={{ color:'#64748b', fontSize:'0.84rem', marginBottom:4 }}>Download CSVs generated live from current database data. All files are client-side generated — no server upload.</p>
            {card('Users Export','Full user table: username, role, grade, join date.',users.length,'Export Users CSV',dlUsers,'96,165,250')}
            {card('Activity Logs Export','Complete event log with timestamps, user, role, action detail.',logs.length,'Export Logs CSV',dlLogs,'167,139,250')}
            {card('Library Books Export','All uploaded books with metadata.',books.length,'Export Books CSV',dlBooks,'52,211,153')}
        </div>
    );
};

// ── Site Control Tab ─────────────────────────────────────────────────────────
const SiteControlTab = ({ showToast }) => {
    const [maint, setMaint] = useState(false);
    const [maintMsg, setMaintMsg] = useState("We'll be back soon! 🚀");
    const [ann, setAnn] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/admin/maintenance').then(r=>r.json()).then(d=>{setMaint(d.enabled);setMaintMsg(d.message||'');}).catch(()=>{});
        fetch('/api/admin/announcement').then(r=>r.json()).then(d=>setAnn(d.announcement||'')).catch(()=>{});
    }, []);

    const saveMaint = async () => {
        setSaving(true);
        const r = await fetch('/api/admin/maintenance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:maint,message:maintMsg})});
        setSaving(false);
        if(r.ok) showToast(`Maintenance mode ${maint?'ON':'OFF'}.`); else showToast('Save failed.',false);
    };
    const saveAnn = async () => {
        if(!ann.trim()){const r=await fetch('/api/admin/announcement',{method:'DELETE'});if(r.ok)showToast('Announcement cleared.');return;}
        const r=await fetch('/api/admin/announcement',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:ann})});
        if(r.ok)showToast('Announcement saved!');else showToast('Failed.',false);
    };

    const inp = {width:'100%',padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'#f1f5f9',fontSize:'0.88rem',outline:'none',boxSizing:'border-box',fontFamily:'inherit'};
    return (
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
            {/* Maintenance Mode */}
            <div style={{padding:'24px',borderRadius:18,background:maint?'rgba(239,68,68,0.06)':'rgba(255,255,255,0.02)',border:`1px solid ${maint?'rgba(239,68,68,0.3)':'rgba(255,255,255,0.06)'}`}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <Power size={18} color={maint?'#f87171':'#475569'}/>
                        <span style={{fontWeight:800,fontSize:'1rem',color:maint?'#f87171':'#f1f5f9'}}>Maintenance Mode</span>
                        {maint && <span style={{padding:'2px 10px',borderRadius:100,background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',color:'#f87171',fontSize:'0.7rem',fontWeight:800}}>ACTIVE</span>}
                    </div>
                    <button onClick={()=>setMaint(m=>!m)} style={{width:52,height:28,borderRadius:100,background:maint?'#ef4444':'rgba(255,255,255,0.08)',border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s'}}>
                        <div style={{position:'absolute',top:4,left:maint?26:4,width:20,height:20,borderRadius:'50%',background:'white',transition:'left 0.2s'}}/>
                    </button>
                </div>
                <p style={{color:'#64748b',fontSize:'0.84rem',marginBottom:14}}>When ON, all non-admin users see a maintenance page. They cannot access any features until you turn this off.</p>
                <label style={{fontSize:'0.72rem',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6}}>Maintenance Message</label>
                <input value={maintMsg} onChange={e=>setMaintMsg(e.target.value)} style={{...inp,marginBottom:14}}/>
                <button onClick={saveMaint} disabled={saving} className="btn-gradient" style={{padding:'10px 24px',borderRadius:10,fontSize:'0.88rem'}}>
                    {saving?'Saving…':'Save Maintenance Settings'}
                </button>
            </div>

            {/* Announcement Banner */}
            <div style={{padding:'24px',borderRadius:18,background:'rgba(251,191,36,0.04)',border:'1px solid rgba(251,191,36,0.15)'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                    <Megaphone size={18} color="#fbbf24"/>
                    <span style={{fontWeight:800,fontSize:'1rem',color:'#f1f5f9'}}>Site-Wide Announcement</span>
                </div>
                <p style={{color:'#64748b',fontSize:'0.84rem',marginBottom:14}}>Shows a dismissible banner at the top of the dashboard for ALL users. Leave empty to clear it.</p>
                <textarea value={ann} onChange={e=>setAnn(e.target.value)} rows={3} placeholder="e.g. 🎉 New features just dropped! Check out the Quiz section." style={{...inp,resize:'vertical',marginBottom:14}}/>
                <div style={{display:'flex',gap:10}}>
                    <button onClick={saveAnn} className="btn-gradient" style={{padding:'10px 20px',borderRadius:10,fontSize:'0.88rem'}}>Save Announcement</button>
                    <button onClick={()=>{setAnn('');fetch('/api/admin/announcement',{method:'DELETE'}).then(()=>showToast('Cleared.'));}} style={{padding:'10px 18px',borderRadius:10,border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.08)',color:'#f87171',cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Clear</button>
                </div>
            </div>
        </div>
    );
};

// ── Create User Tab ───────────────────────────────────────────────────────────
const CreateUserTab = ({ showToast, onRefresh }) => {
    const [form, setForm] = useState({username:'',password:'',role:'Student',grade_level:'',teaching_grades:[]});
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const [success, setSuccess] = useState('');
    const GRADES = [8,9,10,11,12];

    const inp = {width:'100%',padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'#f1f5f9',fontSize:'0.88rem',outline:'none',boxSizing:'border-box',fontFamily:'inherit'};
    const upd = (k,v) => { setForm(p=>({...p,[k]:v})); setErr(''); setSuccess(''); };

    const toggleGrade = (g) => {
        setForm(p=>({...p,teaching_grades:p.teaching_grades.includes(g)?p.teaching_grades.filter(x=>x!==g):[...p.teaching_grades,g]}));
    };

    const submit = async () => {
        if(!form.username.trim()||form.password.length<6){setErr('Username required, password 6+ chars.');return;}
        setLoading(true);setErr('');
        try{
            const res=await fetch('/api/admin/users/create_any',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,grade_level:form.grade_level||null})});
            const d=await res.json();
            if(res.ok){setSuccess(d.message);showToast(d.message);setForm({username:'',password:'',role:'Student',grade_level:'',teaching_grades:[]});onRefresh();}
            else setErr(d.error||'Failed.');
        }catch{setErr('Network error.');}
        finally{setLoading(false);}
    };

    return (
        <div style={{maxWidth:580}}>
            <div style={{padding:'28px 32px',borderRadius:20,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <h3 style={{fontWeight:800,fontSize:'1.05rem',marginBottom:20,display:'flex',alignItems:'center',gap:9}}><UserPlus size={18} color="#818cf8"/> Create New User</h3>
                {err && <div style={{marginBottom:14,padding:'10px 14px',borderRadius:10,background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',color:'#f87171',fontSize:'0.84rem'}}>{err}</div>}
                {success && <div style={{marginBottom:14,padding:'10px 14px',borderRadius:10,background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.25)',color:'#4ade80',fontSize:'0.84rem'}}>{success}</div>}
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                    <div><label style={{fontSize:'0.72rem',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6}}>Username</label><input value={form.username} onChange={e=>upd('username',e.target.value)} style={inp}/></div>
                    <div><label style={{fontSize:'0.72rem',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6}}>Password</label>
                        <div style={{position:'relative'}}>
                            <input type={show?'text':'password'} value={form.password} onChange={e=>upd('password',e.target.value)} style={{...inp,paddingRight:42}}/>
                            <button onClick={()=>setShow(s=>!s)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'transparent',border:'none',color:'#64748b',cursor:'pointer',display:'flex'}}>{show?<EyeOff size={15}/>:<Eye size={15}/>}</button>
                        </div>
                    </div>
                    <div><label style={{fontSize:'0.72rem',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6}}>Role</label>
                        <div style={{display:'flex',gap:8}}>
                            {['Student','Teacher','Admin'].map(r=><button key={r} onClick={()=>upd('role',r)} style={{padding:'8px 20px',borderRadius:10,border:`1px solid ${form.role===r?'rgba(99,102,241,0.5)':'rgba(255,255,255,0.1)'}`,background:form.role===r?'rgba(99,102,241,0.12)':'transparent',color:form.role===r?'#a5b4fc':'#64748b',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{r}</button>)}
                        </div>
                    </div>
                    {form.role==='Student' && <div><label style={{fontSize:'0.72rem',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6}}>Grade Level</label>
                        <select value={form.grade_level} onChange={e=>upd('grade_level',e.target.value)} style={{...inp}}>
                            <option value="" style={{background:'#0d1117'}}>No grade</option>
                            {GRADES.map(g=><option key={g} value={g} style={{background:'#0d1117'}}>Grade {g}</option>)}
                        </select>
                    </div>}
                    {form.role==='Teacher' && <div><label style={{fontSize:'0.72rem',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6}}>Teaching Grades</label>
                        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                            {GRADES.map(g=><button key={g} onClick={()=>toggleGrade(g)} style={{padding:'6px 14px',borderRadius:100,border:`1px solid ${form.teaching_grades.includes(g)?'rgba(99,102,241,0.5)':'rgba(255,255,255,0.1)'}`,background:form.teaching_grades.includes(g)?'rgba(99,102,241,0.12)':'transparent',color:form.teaching_grades.includes(g)?'#a5b4fc':'#64748b',fontWeight:700,fontSize:'0.8rem',cursor:'pointer',fontFamily:'inherit'}}>Grade {g}</button>)}
                        </div>
                    </div>}
                    <button onClick={submit} disabled={loading} className="btn-gradient" style={{padding:'12px',fontSize:'0.92rem',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:4}}>
                        {loading?<div className="spin" style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%'}}/>:<><UserPlus size={15}/>Create User</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Live Quizzes Tab ──────────────────────────────────────────────────────────
const LiveQuizzesTab = ({ showToast }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const STATUS_C = {waiting:'#fbbf24',active:'#4ade80',reveal:'#818cf8',finished:'#64748b'};

    const fetchSessions = async () => {
        setLoading(true);
        try{const r=await fetch('/api/admin/live_quizzes');if(r.ok)setSessions((await r.json()).sessions||[]);}catch{}
        setLoading(false);
    };
    const deleteSession = async (code) => {
        const r=await fetch(`/api/admin/live_quizzes/${code}`,{method:'DELETE'});
        if(r.ok){showToast(`Session ${code} deleted.`);fetchSessions();}else showToast('Delete failed.',false);
    };
    useEffect(()=>{fetchSessions();},[]);

    return (
        <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <p style={{color:'#64748b',fontSize:'0.84rem'}}>All live quiz sessions hosted by teachers.</p>
                <button onClick={fetchSessions} style={actionBtn('rgba(99,102,241,0.3)','rgba(99,102,241,0.08)','#818cf8')}><RefreshCw size={11} className={loading?'spin':''}/> Refresh</button>
            </div>
            {loading?<p style={{color:'#475569',textAlign:'center',padding:40}}>Loading…</p>:
            sessions.length===0?<p style={{color:'#334155',textAlign:'center',padding:40}}>No quiz sessions found.</p>:
            <div style={{borderRadius:16,overflow:'hidden',border:'1px solid rgba(255,255,255,0.06)'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.84rem'}}>
                    <thead><tr style={{background:'rgba(0,0,0,0.35)'}}>
                        {['Code','Teacher','Status','Question','Created','Actions'].map((h,i)=><th key={h} style={theadTh(i===5)}>{h}</th>)}
                    </tr></thead>
                    <tbody>{sessions.map((s,i)=>(
                        <tr key={s.code} style={{borderTop:'1px solid rgba(255,255,255,0.04)',background:i%2===0?'transparent':'rgba(255,255,255,0.01)'}}>
                            <td style={{padding:'11px 14px'}}><span style={{fontFamily:'monospace',fontWeight:800,color:'#a5b4fc',fontSize:'1rem',letterSpacing:'0.1em'}}>{s.code}</span></td>
                            <td style={{padding:'11px 14px',color:'#94a3b8'}}>{s.teacher_name}</td>
                            <td style={{padding:'11px 14px'}}><span style={{padding:'2px 10px',borderRadius:100,fontSize:'0.72rem',fontWeight:700,background:`${STATUS_C[s.status]||'#64748b'}15`,color:STATUS_C[s.status]||'#64748b',border:`1px solid ${STATUS_C[s.status]||'#64748b'}30`}}>{s.status}</span></td>
                            <td style={{padding:'11px 14px',color:'#64748b',fontSize:'0.8rem'}}>Q{(s.current_q||0)+1}</td>
                            <td style={{padding:'11px 14px',color:'#475569',fontSize:'0.76rem',fontFamily:'monospace'}}>{s.created_at?new Date(s.created_at).toLocaleString():'—'}</td>
                            <td style={{padding:'11px 14px',textAlign:'right'}}><button onClick={()=>deleteSession(s.code)} style={actionBtn('rgba(239,68,68,0.3)','rgba(239,68,68,0.08)','#f87171')}><Trash2 size={11}/> Delete</button></td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>}
        </div>
    );
};

// ── System Health Tab ─────────────────────────────────────────────────────────
const SystemHealthTab = ({ showToast }) => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(false);
    const now = useClock();

    const check = async () => {
        setLoading(true);
        try{const r=await fetch('/api/admin/system_health');if(r.ok)setHealth(await r.json());else showToast('Health check failed.',false);}
        catch{showToast('Network error.',false);}
        setLoading(false);
    };
    useEffect(()=>{check();},[]);

    const Row = ({label,val,ok}) => (
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderRadius:12,background:'rgba(255,255,255,0.02)',border:`1px solid ${ok===false?'rgba(239,68,68,0.2)':ok?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.05)'}`}}>
            <span style={{color:'#94a3b8',fontSize:'0.85rem'}}>{label}</span>
            <span style={{fontWeight:700,fontSize:'0.88rem',color:ok===false?'#f87171':ok?'#4ade80':'#f1f5f9',fontFamily:'monospace'}}>{String(val)}</span>
        </div>
    );

    return (
        <div style={{display:'flex',flexDirection:'column',gap:20,maxWidth:680}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <p style={{color:'#64748b',fontSize:'0.84rem'}}>Real-time platform health check. Last checked: {now.toLocaleTimeString()}</p>
                <button onClick={check} disabled={loading} style={actionBtn('rgba(99,102,241,0.3)','rgba(99,102,241,0.08)','#818cf8')}><RefreshCw size={11} className={loading?'spin':''}/> Recheck</button>
            </div>
            {health && (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    <Row label="Supabase Connected" val={health.supabase_ok?'✓ Connected':'✗ Disconnected'} ok={health.supabase_ok}/>
                    <Row label="Groq API Keys Loaded" val={`${health.groq_keys} key(s)`} ok={health.groq_keys>0}/>
                    <Row label="Python Version" val={health.python} ok={null}/>
                    <Row label="Platform" val={health.platform} ok={null}/>
                    <Row label="Server Status" val="Online" ok={true}/>
                    <Row label="Admin Session" val="Active — Full Control" ok={true}/>
                </div>
            )}
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────────
// MAIN AdminPanel
// ────────────────────────────────────────────────────────────────────────────────
const TABS = [
    { id:'overview',   label:'Overview',       icon:BarChart2  },
    { id:'users',      label:'Users',          icon:Users      },
    { id:'createuser', label:'Create User',    icon:UserPlus   },
    { id:'library',    label:'Library',        icon:BookOpen   },
    { id:'database',   label:'Database',       icon:Database   },
    { id:'sitecontrol',label:'Site Control',   icon:Power      },
    { id:'livequizzes',label:'Live Quizzes',   icon:Activity   },
    { id:'aimodels',   label:'AI & Models',    icon:Zap        },
    { id:'logs',       label:'Activity Logs',  icon:Terminal   },
    { id:'tools',      label:'Admin Tools',    icon:Settings   },
    { id:'health',     label:'System Health',  icon:Globe      },
    { id:'export',     label:'Export',         icon:Download   },
];

const AdminPanel = () => {
    const { user, logout } = useAuth();
    const [tab, setTab] = useState('overview');
    const [stats, setStats] = useState({ users:0, books:0, logs:0, saved_quizzes:0, role_breakdown:{} });
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toasts, showToast] = useToast();
    const now = useClock();

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [sr, ur, lr, br] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/users'),
                fetch('/api/admin/logs'),
                fetch('/api/admin/books'),
            ]);
            if(sr.ok) setStats(await sr.json());
            if(ur.ok) setUsers((await ur.json()).users||[]);
            if(lr.ok) setLogs((await lr.json()).logs||[]);
            if(br.ok) setBooks((await br.json()).books||[]);
        } catch { showToast('Data fetch failed.', false); }
        finally { setLoading(false); }
    };

    useEffect(()=>{ fetchAll(); },[]);

    const NavBtn = ({ id, label, icon:Icon }) => (
        <button onClick={()=>setTab(id)} style={{ display:'flex', alignItems:'center', gap:11, width:'100%', padding:'12px 20px', border:'none', borderLeft:`3px solid ${tab===id?'#818cf8':'transparent'}`, background:tab===id?'rgba(99,102,241,0.1)':'transparent', color:tab===id?'#818cf8':'#475569', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.06em', transition:'all 0.2s', textShadow:tab===id?'0 0 12px rgba(129,140,248,0.5)':'none' }}>
            <Icon size={15}/> {label}
        </button>
    );

    const tabTitles = { overview:'Overview', users:'User Management', createuser:'Create User', library:'Library Control', database:'Database Inspector', sitecontrol:'Site Control', livequizzes:'Live Quiz Sessions', aimodels:'AI & Models', logs:'Activity Logs', tools:'Admin Tools', health:'System Health', export:'Export & Reports' };

    const handleViewAs = async (u) => {
        const r = await fetch(`/api/admin/impersonate/${u.id}`,{method:'POST'});
        if(r.ok){ showToast(`Now viewing as ${u.username}. Go to main dashboard.`); window.open('/dashboard','_blank'); }
        else showToast('Impersonation failed.',false);
    };

    return (
        <div style={{ display:'flex', height:'100vh', background:'#060913', color:'#f8fafc', fontFamily:'"Inter",sans-serif', overflow:'hidden' }}>
            <ToastStack toasts={toasts}/>

            {/* Background glow */}
            <div style={{ position:'absolute', top:'-15%', left:'-10%', width:'50%', height:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%)', pointerEvents:'none' }}/>
            <div style={{ position:'absolute', bottom:'-15%', right:'-10%', width:'50%', height:'50%', background:'radial-gradient(circle,rgba(16,185,129,0.04) 0%,transparent 70%)', pointerEvents:'none' }}/>

            {/* ── Sidebar ─────────────────────────────────────────────────────── */}
            <nav style={{ width:240, flexShrink:0, borderRight:'1px solid rgba(255,255,255,0.05)', background:'rgba(2,6,23,0.7)', backdropFilter:'blur(20px)', display:'flex', flexDirection:'column', zIndex:10 }}>
                <div style={{ padding:'24px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                        <div style={{ background:'linear-gradient(135deg,#6366f1,#a855f7)', padding:8, borderRadius:12, display:'flex', boxShadow:'0 0 20px rgba(99,102,241,0.4)', flexShrink:0 }}>
                            <ShieldCheck size={20} color="white"/>
                        </div>
                        <span style={{ fontWeight:900, fontSize:'1.1rem', background:'linear-gradient(to right,#fff,#94a3b8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>STUDY_CORE</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 11px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:20, width:'fit-content' }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 8px #10b981' }}/>
                        <span style={{ color:'#10b981', fontSize:'0.68rem', fontWeight:700, letterSpacing:'1px' }}>SYSTEM ONLINE</span>
                    </div>
                </div>

                <div style={{ flex:1, paddingTop:20, display:'flex', flexDirection:'column', gap:2 }}>
                    <div style={{ padding:'0 20px 8px', fontSize:'0.62rem', color:'#334155', fontWeight:800, letterSpacing:'2px' }}>CONTROL PANELS</div>
                    {TABS.map(t=><NavBtn key={t.id} {...t}/>)}
                </div>

                <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ marginBottom:12, padding:'10px 14px', borderRadius:12, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize:'0.68rem', color:'#334155', marginBottom:3 }}>Signed in as</div>
                        <div style={{ fontWeight:700, color:'#f1f5f9', fontSize:'0.84rem' }}>{user?.username}</div>
                        <RoleBadge role={user?.role}/>
                    </div>
                    <button onClick={()=>{logout();window.location.href='/login';}} style={{ width:'100%', padding:'10px', borderRadius:10, background:'rgba(239,68,68,0.08)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.18)', cursor:'pointer', fontWeight:600, fontSize:'0.8rem', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit', transition:'all 0.2s' }}>
                        <LogOut size={14}/> Sign Out
                    </button>
                </div>
            </nav>

            {/* ── Main ────────────────────────────────────────────────────────── */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative', zIndex:10 }}>
                <header style={{ padding:'18px 36px', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(2,6,23,0.4)', backdropFilter:'blur(10px)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                    <div>
                        <h2 style={{ fontSize:'1.25rem', fontWeight:800, margin:0, color:'#f1f5f9' }}>{tabTitles[tab]}</h2>
                        <div style={{ color:'#334155', fontSize:'0.74rem', marginTop:3, fontFamily:'monospace' }}>/admin/{tab} — {now.toLocaleString()}</div>
                    </div>
                    <button onClick={fetchAll} style={{ background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.35)', color:'#c7d2fe', padding:'8px 16px', borderRadius:10, cursor:'pointer', display:'flex', gap:7, alignItems:'center', fontWeight:600, fontSize:'0.8rem', transition:'all 0.2s', fontFamily:'inherit' }}>
                        <RefreshCw size={13} className={loading?'spin':''}/> Refresh
                    </button>
                </header>

                <div style={{ flex:1, overflowY:'auto', padding:'32px 36px', scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.08) transparent' }}>
                    {loading && tab==='overview' ? (
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'50%', gap:16 }}>
                            <Database size={36} color="#6366f1" className="spin" style={{ filter:'drop-shadow(0 0 12px #6366f1)' }}/>
                            <div style={{ color:'#475569', fontFamily:'monospace', fontSize:'0.8rem', letterSpacing:'2px' }}>LOADING DATA…</div>
                        </div>
                    ) : (
                                        <div className="animate-fade-up">
                            {tab==='overview'    && <OverviewTab stats={stats} logs={logs}/>}
                            {tab==='users'       && <UsersTab users={users} onRefresh={fetchAll} showToast={showToast} onViewAs={handleViewAs}/>}
                            {tab==='createuser'  && <CreateUserTab showToast={showToast} onRefresh={fetchAll}/>}
                            {tab==='library'     && <LibraryTab books={books} setBooks={setBooks} showToast={showToast}/>}
                            {tab==='database'    && <DatabaseTab showToast={showToast}/>}
                            {tab==='sitecontrol' && <SiteControlTab showToast={showToast}/>}
                            {tab==='livequizzes' && <LiveQuizzesTab showToast={showToast}/>}
                            {tab==='aimodels'    && <AIModelsTab showToast={showToast}/>}
                            {tab==='logs'        && <LogsTab logs={logs} showToast={showToast} onRefresh={fetchAll}/>}
                            {tab==='tools'       && <AdminToolsTab currentUser={user} showToast={showToast}/>}
                            {tab==='health'      && <SystemHealthTab showToast={showToast}/>}
                            {tab==='export'      && <ExportTab users={users} logs={logs} books={books}/>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
