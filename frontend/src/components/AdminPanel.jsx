import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    ShieldCheck, Users, BookOpen, Terminal, Settings, Download,
    LogOut, RefreshCw, Search, Trash2, KeyRound, Plus, X, Check,
    ChevronLeft, ChevronRight, Eye, EyeOff, BarChart2, Database,
    Zap, FileText, AlertTriangle, GraduationCap, UserPlus, Clock
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
// ────────────────────────────────────────────────────────────────────────────────
const UsersTab = ({ users, onRefresh, showToast }) => {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [modal, setModal] = useState(null);

    const filtered = users.filter(u => {
        const mR = roleFilter==='All'||u.role===roleFilter;
        const mS = (u.username||'').toLowerCase().includes(search.toLowerCase());
        return mR && mS;
    });

    const doRole = async (uid, role) => {
        const r = await fetch(`/api/admin/users/${uid}/role`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({role})});
        if(r.ok){showToast(`Role → ${role}`);onRefresh();}else showToast('Role update failed.',false);
    };
    const doPassword = async (uid, pw) => {
        const r = await fetch(`/api/admin/users/${uid}/reset_password`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({new_password:pw})});
        setModal(null);
        if(r.ok)showToast('Password reset.');else showToast('Reset failed.',false);
    };
    const doGrade = async (uid, grade) => {
        const r = await fetch(`/api/admin/users/${uid}/grade`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({grade_level:grade})});
        setModal(null);
        if(r.ok){showToast('Grade updated.');onRefresh();}else showToast('Grade update failed.',false);
    };
    const doDelete = async (uid, username) => {
        const r = await fetch(`/api/admin/users/${uid}`,{method:'DELETE'});
        setModal(null);
        if(r.ok){showToast(`"${username}" deleted.`);onRefresh();}else showToast('Delete failed.',false);
    };

    return (
        <div>
            {modal?.type==='password' && <PasswordModal username={modal.u.username} onSubmit={pw=>doPassword(modal.u.id,pw)} onClose={()=>setModal(null)}/>}
            {modal?.type==='grade'    && <GradeModal username={modal.u.username} currentGrade={modal.u.grade_level} onSubmit={g=>doGrade(modal.u.id,g)} onClose={()=>setModal(null)}/>}
            {modal?.type==='delete'   && <ConfirmModal title="Delete User" message={`Permanently delete "${modal.u.username}"? All their data will be removed.`} onConfirm={()=>doDelete(modal.u.id,modal.u.username)} onClose={()=>setModal(null)}/>}

            <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
                <div style={{ position:'relative', flex:1, minWidth:200 }}>
                    <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#475569' }}/>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search username…" style={searchStyle}/>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                    {['All','Student','Teacher','Admin'].map(r=><button key={r} onClick={()=>setRoleFilter(r)} style={chipBtn(roleFilter===r)}>{r}</button>)}
                </div>
                <span style={{ color:'#475569', fontSize:'0.78rem' }}>{filtered.length} users</span>
            </div>

            <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.84rem' }}>
                    <thead>
                        <tr style={{ background:'rgba(0,0,0,0.35)' }}>
                            {['User','Role','Grade','Joined','Actions'].map((h,i)=><th key={h} style={theadTh(i===4)}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length===0 ? <tr><td colSpan={5} style={{ padding:36, textAlign:'center', color:'#334155' }}>No users found.</td></tr>
                        : filtered.map((u,i)=>{
                            const c = ROLE_C[u.role]||ROLE_C.Student;
                            return (
                                <tr key={u.id} style={{ borderTop:'1px solid rgba(255,255,255,0.04)', background:i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                                    <td style={{ padding:'12px 18px' }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                            <div style={{ width:32, height:32, borderRadius:'50%', background:c.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:800, color:c.text, flexShrink:0, border:`1px solid ${c.border}` }}>{(u.username||'?')[0].toUpperCase()}</div>
                                            <div>
                                                <div style={{ fontWeight:600, color:'#f1f5f9' }}>{u.username}</div>
                                                <div style={{ fontSize:'0.68rem', color:'#334155', fontFamily:'monospace' }}>{String(u.id).slice(0,14)}…</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding:'12px 18px' }}>
                                        <select value={u.role||'Student'} onChange={e=>doRole(u.id,e.target.value)} style={{ padding:'5px 10px', borderRadius:8, background:'rgba(0,0,0,0.3)', border:`1px solid ${c.border}`, color:c.text, fontSize:'0.78rem', fontWeight:700, outline:'none', cursor:'pointer' }}>
                                            {['Student','Teacher','Admin'].map(r=><option key={r} value={r} style={{background:'#0d1117'}}>{r}</option>)}
                                        </select>
                                    </td>
                                    <td style={{ padding:'12px 18px', color:'#94a3b8', fontSize:'0.82rem' }}>{u.grade_level?`Grade ${u.grade_level}`:<span style={{color:'#334155'}}>—</span>}</td>
                                    <td style={{ padding:'12px 18px', color:'#475569', fontSize:'0.76rem', fontFamily:'monospace', whiteSpace:'nowrap' }}>{u.created_at?new Date(u.created_at).toLocaleDateString():'—'}</td>
                                    <td style={{ padding:'12px 18px', textAlign:'right' }}>
                                        <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                                            <button onClick={()=>setModal({type:'grade',u})} style={actionBtn('rgba(99,102,241,0.3)','rgba(99,102,241,0.08)','#818cf8')}><GraduationCap size={11}/> Grade</button>
                                            <button onClick={()=>setModal({type:'password',u})} style={actionBtn('rgba(251,191,36,0.3)','rgba(251,191,36,0.08)','#fbbf24')}><KeyRound size={11}/> Reset PW</button>
                                            <button onClick={()=>setModal({type:'delete',u})} style={actionBtn('rgba(239,68,68,0.3)','rgba(239,68,68,0.08)','#f87171')}><Trash2 size={11}/> Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────────
// TAB: LIBRARY
// ────────────────────────────────────────────────────────────────────────────────
const LibraryTab = ({ books, setBooks, showToast }) => {
    const [loading] = useState(false);
    const [search, setSearch] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);

    const doDelete = async () => {
        const r = await fetch(`/api/admin/books/${deleteTarget.id}`,{method:'DELETE'});
        const target = deleteTarget;
        setDeleteTarget(null);
        if(r.ok){showToast(`"${target.title||target.filename}" deleted.`);setBooks(prev=>prev.filter(b=>b.id!==target.id));}else showToast('Delete failed.',false);
    };

    const filtered = books.filter(b=>(b.title||b.filename||'').toLowerCase().includes(search.toLowerCase())||(b.subject||'').toLowerCase().includes(search.toLowerCase()));
    const subjectMap = books.reduce((a,b)=>{const s=b.subject||'General';a[s]=(a[s]||0)+1;return a;},{});

    return (
        <div>
            {deleteTarget && <ConfirmModal title="Delete Book" message={`Delete "${deleteTarget.title||deleteTarget.filename}"? This can't be undone.`} onConfirm={doDelete} onClose={()=>setDeleteTarget(null)}/>}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
                {Object.entries(subjectMap).map(([s,n])=>(
                    <span key={s} style={{ padding:'4px 12px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background:'rgba(52,211,153,0.1)', color:'#34d399', border:'1px solid rgba(52,211,153,0.25)' }}>{s} ({n})</span>
                ))}
            </div>
            <div style={{ position:'relative', marginBottom:14 }}>
                <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#475569' }}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title or subject…" style={searchStyle}/>
            </div>
            {loading ? <div style={{ textAlign:'center', padding:50, color:'#334155' }}>Loading…</div> : (
                <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.84rem' }}>
                        <thead><tr style={{ background:'rgba(0,0,0,0.35)' }}>
                            {['Title','Subject','Author','Year','Grade Range','Action'].map((h,i)=><th key={h} style={theadTh(i===5)}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                            {filtered.length===0 ? <tr><td colSpan={6} style={{ padding:36, textAlign:'center', color:'#334155' }}>No books found.</td></tr>
                            : filtered.map((b,i)=>(
                                <tr key={b.id} style={{ borderTop:'1px solid rgba(255,255,255,0.04)', background:i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                                    <td style={{ padding:'12px 18px' }}>
                                        <div style={{ fontWeight:600, color:'#f1f5f9' }}>{b.title||b.filename?.replace('.pdf','')||'Untitled'}</div>
                                        <div style={{ fontSize:'0.68rem', color:'#334155', marginTop:2 }}>{b.filename}</div>
                                    </td>
                                    <td style={{ padding:'12px 18px' }}><span style={{ padding:'3px 10px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background:'rgba(52,211,153,0.1)', color:'#34d399', border:'1px solid rgba(52,211,153,0.2)' }}>{b.subject||'General'}</span></td>
                                    <td style={{ padding:'12px 18px', color:'#94a3b8', fontSize:'0.82rem' }}>{b.author||<span style={{color:'#334155'}}>—</span>}</td>
                                    <td style={{ padding:'12px 18px', color:'#475569', fontSize:'0.82rem' }}>{b.year||'—'}</td>
                                    <td style={{ padding:'12px 18px', color:'#475569', fontSize:'0.78rem' }}>{b.min_grade&&b.max_grade?`Gr ${b.min_grade}–${b.max_grade}`:'—'}</td>
                                    <td style={{ padding:'12px 18px', textAlign:'right' }}>
                                        <button onClick={()=>setDeleteTarget(b)} style={actionBtn('rgba(239,68,68,0.3)','rgba(239,68,68,0.08)','#f87171')}><Trash2 size={11}/> Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────────
// TAB: ACTIVITY LOGS
// ────────────────────────────────────────────────────────────────────────────────
const LogsTab = ({ logs }) => {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [page, setPage] = useState(0);
    const PER = 50;

    const filtered = logs.filter(l=>{
        const mR = roleFilter==='All'||l.role===roleFilter;
        const s = search.toLowerCase();
        const mS = !s||(l.username||'').toLowerCase().includes(s)||(l.action||'').toLowerCase().includes(s)||(l.detail||'').toLowerCase().includes(s);
        return mR&&mS;
    });
    const pages = Math.ceil(filtered.length/PER)||1;
    const paged = filtered.slice(page*PER,(page+1)*PER);
    useEffect(()=>setPage(0),[search,roleFilter]);

    return (
        <div>
            <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
                <div style={{ position:'relative', flex:1, minWidth:200 }}>
                    <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#475569' }}/>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search user, action, detail…" style={searchStyle}/>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                    {['All','Student','Teacher','Admin'].map(r=><button key={r} onClick={()=>setRoleFilter(r)} style={chipBtn(roleFilter===r)}>{r}</button>)}
                </div>
                <span style={{ color:'#475569', fontSize:'0.78rem', whiteSpace:'nowrap' }}>{filtered.length} events</span>
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
const AdminToolsTab = ({ currentUser }) => {
    const now = useClock();
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
// TAB: EXPORT
// ────────────────────────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────────────────────────
// MAIN AdminPanel
// ────────────────────────────────────────────────────────────────────────────────
const TABS = [
    { id:'overview', label:'Overview',      icon:BarChart2  },
    { id:'users',    label:'Users',         icon:Users      },
    { id:'library',  label:'Library',       icon:BookOpen   },
    { id:'logs',     label:'Activity Logs', icon:Terminal   },
    { id:'tools',    label:'Admin Tools',   icon:Settings   },
    { id:'export',   label:'Export',        icon:Download   },
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

    const tabTitles = { overview:'Overview', users:'User Management', library:'Library Control', logs:'Activity Logs', tools:'Admin Tools', export:'Export & Reports' };

    // Derive books list from stats for export (null until LibraryTab loads; ExportTab handles its own fetch)
    // We'll pass an empty array and let ExportTab use its own state
    const [books, setBooks] = useState([]);

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
                            {tab==='overview' && <OverviewTab stats={stats} logs={logs}/>}
                            {tab==='users'    && <UsersTab users={users} onRefresh={fetchAll} showToast={showToast}/>}
                            {tab==='library'  && <LibraryTab books={books} setBooks={setBooks} showToast={showToast}/>}
                            {tab==='logs'     && <LogsTab logs={logs}/>}
                            {tab==='tools'    && <AdminToolsTab currentUser={user}/>}
                            {tab==='export'   && <ExportTab users={users} logs={logs} books={books}/>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
