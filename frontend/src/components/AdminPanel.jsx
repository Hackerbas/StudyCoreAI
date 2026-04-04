import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Users, Activity, Search, Trash2, KeyRound, RefreshCw, X, Server, Terminal, Disc, Cpu, Zap, LogOut } from 'lucide-react';

const AdminPanel = () => {
    const { user, logout } = useAuth();
    const [tab, setTab] = useState('overview');
    const [stats, setStats] = useState({ users: 0, books: 0, logs: 0 });
    const [usersList, setUsersList] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [stRes, usRes, logRes] = await Promise.all([
                fetch('/api/admin/stats'), fetch('/api/admin/users'), fetch('/api/admin/logs')
            ]);
            if (stRes.ok) setStats(await stRes.json());
            if (usRes.ok) setUsersList((await usRes.json()).users || []);
            if (logRes.ok) setLogs((await logRes.json()).logs || []);
        } catch(e) {
            setMessage({ type: 'error', text: 'Critical Error: Data fetch failed.' });
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchAll(); }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ role: newRole })
            });
            if(res.ok) { fetchAll(); setMessage({ type:'success', text:`Privilege escalation successful for User ID ${userId.slice(0,6)}` }); }
        } catch{}
    };

    const handleDeleteUser = async (userId, username) => {
        if(!window.confirm(`WARNING: Executing delete on user {${username}}. This is irreversible. Confirm?`)) return;
        try {
            const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            if(res.ok) { fetchAll(); setMessage({ type:'success', text:`User {${username}} eradicated.` }); }
        } catch{}
    };

    const handleResetPassword = async (userId, username) => {
        const newPass = window.prompt(`Force new passkey for ${username} (min 6 chars):`);
        if(!newPass || newPass.length < 6) return alert("Execution aborted: Passkey too weak.");
        try {
            const res = await fetch(`/api/admin/users/${userId}/reset_password`, {
                method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ new_password: newPass })
            });
            if(res.ok) { setMessage({ type:'success', text:`Passkey overwritten for {${username}}` }); }
        } catch{}
    };

    const NavBtn = ({ id, icon, label }) => (
        <button 
            onClick={()=>setTab(id)} 
            style={{ 
                display:'flex', alignItems:'center', gap:10, width:'100%', padding:'14px 20px', border:'none', 
                background:tab===id?'linear-gradient(90deg, rgba(99,102,241,0.15) 0%, transparent 100%)':'transparent', 
                color:tab===id?'#818cf8':'#64748b', 
                borderLeft:tab===id?'3px solid #818cf8':'3px solid transparent', 
                textAlign:'left', cursor:'pointer', fontWeight:600, transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                fontFamily:'inherit', textTransform:'uppercase', letterSpacing:'1px', fontSize:'0.75rem',
                textShadow: tab===id ? '0 0 10px rgba(129, 140, 248, 0.6)' : 'none'
            }}>
            {icon} {label}
        </button>
    );

    return (
        <div style={{ display:'flex', height:'100vh', background:'#060913', color:'#f8fafc', fontFamily:'"Inter", sans-serif', overflow:'hidden' }}>
            
            {/* Custom Background Overlays */}
            <div style={{ position:'absolute', top:'-20%', left:'-10%', width:'50%', height:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.06) 0%, rgba(0,0,0,0) 70%)', pointerEvents:'none'}} />
            <div style={{ position:'absolute', bottom:'-20%', right:'-10%', width:'50%', height:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.04) 0%, rgba(0,0,0,0) 70%)', pointerEvents:'none'}} />

            {/* Futuristic Sidebar */}
            <div style={{ width: 280, backdropFilter:'blur(20px)', borderRight:'1px solid rgba(255,255,255,0.05)', background:'rgba(2,6,23,0.7)', display:'flex', flexDirection:'column', zIndex:10 }}>
                <div style={{ padding:'30px 24px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <h1 style={{ display:'flex', alignItems:'center', gap:12, fontSize:'1.4rem', fontWeight:900, color:'#e2e8f0', letterSpacing:'-0.03em' }}>
                        <div style={{ background:'linear-gradient(135deg, #6366f1, #a855f7)', padding:8, borderRadius:12, display:'flex', boxShadow:'0 0 20px rgba(99,102,241,0.4)' }}>
                            <ShieldCheck size={24} color="white"/>
                        </div>
                        <span style={{ background:'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>STUDY_CORE</span>
                    </h1>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:16, padding:'6px 12px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:20, width:'fit-content' }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 8px #10b981', animation:'pulse 2s infinite' }} />
                        <span style={{ color:'#10b981', fontSize:'0.7rem', fontWeight:700, letterSpacing:'1px' }}>SYSTEM ONLINE</span>
                    </div>
                </div>

                <div style={{ flex:1, paddingTop:24, display:'flex', flexDirection:'column', gap:4 }}>
                    <div style={{ padding:'0 20px', fontSize:'0.65rem', color:'#475569', fontWeight:800, letterSpacing:'2px', marginBottom:8 }}>MAIN CONTROLS</div>
                    <NavBtn id="overview" icon={<Activity size={16}/>} label="Cluster Overview" />
                    <NavBtn id="users" icon={<Users size={16}/>} label="Access Management" />
                    <NavBtn id="logs" icon={<Terminal size={16}/>} label="Sys_Logs" />
                </div>

                <div style={{ padding:24 }}>
                    <button onClick={()=>{logout(); window.location.href='/login';}} style={{ width:'100%', padding:'12px', borderRadius:10, background:'linear-gradient(to bottom, rgba(239,68,68,0.1), rgba(239,68,68,0.05))', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)', cursor:'pointer', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.2)'} onMouseLeave={e=>e.currentTarget.style.background='linear-gradient(to bottom, rgba(239,68,68,0.1), rgba(239,68,68,0.05))'}>
                        <LogOut size={16}/> Drop Connection
                    </button>
                    <div style={{ textAlign:'center', marginTop:16, fontSize:'0.65rem', color:'#475569', fontFamily:'monospace' }}>AUTH_LEVEL: OMEGA<br/>v2.0.4.x_core</div>
                </div>
            </div>

            {/* Main Interface */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', position:'relative', zIndex:10 }}>
                
                {/* Glassy Header */}
                <header style={{ padding:'24px 40px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(2,6,23,0.4)', backdropFilter:'blur(10px)' }}>
                    <div>
                        <h2 style={{ fontSize:'1.4rem', fontWeight:300, letterSpacing:'1px', margin:0 }}>
                            {tab === 'overview' ? <><strong style={{fontWeight:800}}>Cluster</strong> Overview</> : 
                             tab === 'users' ? <><strong style={{fontWeight:800}}>Access</strong> Management</> : 
                             <><strong style={{fontWeight:800}}>System</strong> Logs</>}
                        </h2>
                        <p style={{ color:'#64748b', fontSize:'0.8rem', marginTop:4, fontFamily:'monospace' }}>/root/admin/{tab}</p>
                    </div>
                    <button onClick={fetchAll} style={{ background:'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))', border:'1px solid rgba(99,102,241,0.3)', color:'#c7d2fe', padding:'8px 16px', borderRadius:8, cursor:'pointer', display:'flex', gap:8, alignItems:'center', fontWeight:600, fontSize:'0.8rem', boxShadow:'0 0 15px rgba(99,102,241,0.15)', transition:'all 0.2s' }} onMouseEnter={e=>e.currentTarget.style.boxShadow='0 0 25px rgba(99,102,241,0.4)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='0 0 15px rgba(99,102,241,0.15)'}>
                        <RefreshCw size={14} className={loading ? "spin" : ""}/> Sync Nodes
                    </button>
                </header>
                
                <div style={{ flex:1, overflowY:'auto', padding:'40px', scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.1) transparent' }}>
                    
                    {/* Alerts */}
                    {message && (
                        <div className="animate-fade-up" style={{ padding:'16px 20px', borderRadius:12, background:message.type==='error'?'linear-gradient(to right, rgba(239,68,68,0.15), rgba(239,68,68,0.05))':'linear-gradient(to right, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', borderLeft:`4px solid ${message.type==='error'?'#ef4444':'#10b981'}`, color:message.type==='error'?'#fca5a5':'#a7f3d0', marginBottom:30, display:'flex', justifyContent:'space-between', alignItems:'center', backdropFilter:'blur(5px)', boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, fontWeight:500, letterSpacing:'0.5px' }}>
                                {message.type==='error' ? <AlertCircle size={18}/> : <CheckCircle size={18}/>}
                                {message.text}
                            </div>
                            <X size={18} cursor="pointer" onClick={()=>setMessage(null)} style={{opacity:0.6}}/>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60%', gap:20 }}>
                            <Cpu size={40} color="#6366f1" className="spin" style={{ filter:'drop-shadow(0 0 10px #6366f1)' }}/>
                            <div style={{ color:'#818cf8', fontWeight:600, letterSpacing:'2px', fontSize:'0.8rem', fontFamily:'monospace' }}>INITIALIZING NEURAL LINK...</div>
                        </div>
                    ) : (
                        <div className="animate-fade-up">
                            
                            {tab === 'overview' && (
                                <>
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:24, marginBottom:40 }}>
                                    {[
                                        {t:'Registered Identities', n:stats.users, c:'#3b82f6', ic:<Users size={20}/>, p:'+12% capacity'},
                                        {t:'Encrypted Volumes', n:stats.books, c:'#10b981', ic:<Disc size={20}/>, p:'Secure'},
                                        {t:'Network Events', n:stats.logs, c:'#a855f7', ic:<Zap size={20}/>, p:'Live feed'}
                                    ].map((s,i)=>(
                                        <div key={i} style={{ padding:24, borderRadius:20, background:'linear-gradient(145deg, rgba(30,41,59,0.4) 0%, rgba(15,23,42,0.4) 100%)', border:'1px solid rgba(255,255,255,0.05)', backdropFilter:'blur(10px)', position:'relative', overflow:'hidden', boxShadow:'0 10px 40px rgba(0,0,0,0.2)' }}>
                                            <div style={{ position:'absolute', top:0, right:0, padding:20, opacity:0.1, color:s.c }}>{s.ic}</div>
                                            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                                <div style={{ color:'#94a3b8', fontSize:'0.75rem', fontWeight:800, letterSpacing:'1px', textTransform:'uppercase' }}>{s.t}</div>
                                                <div style={{ fontSize:'3.5rem', fontWeight:900, color:s.c, textShadow:`0 0 20px ${s.c}40`, lineHeight:1 }}>{s.n}</div>
                                                <div style={{ fontSize:'0.7rem', color:'#64748b', fontWeight:600 }}>{s.p}</div>
                                            </div>
                                            <div style={{ position:'absolute', bottom:0, left:0, height:4, width:'100%', background:`linear-gradient(90deg, ${s.c}, transparent)` }}/>
                                        </div>
                                    ))}
                                </div>
                                
                                <div style={{ border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, background:'rgba(15,23,42,0.4)', padding:24 }}>
                                    <h3 style={{ fontSize:'0.9rem', color:'#cbd5e1', marginBottom:16, display:'flex', gap:8, alignItems:'center' }}><Server size={16}/> Hardware Metrics (Simulated)</h3>
                                    <div style={{ display:'flex', gap:20 }}>
                                        <div style={{ flex:1, background:'rgba(0,0,0,0.3)', height:8, borderRadius:4, overflow:'hidden' }}><div style={{ width:'45%', background:'#3b82f6', height:'100%', boxShadow:'0 0 10px #3b82f6'}}/></div>
                                        <div style={{ flex:1, null:'CPU' }}>CPU: 45%</div>
                                    </div>
                                    <div style={{ display:'flex', gap:20, marginTop:12 }}>
                                        <div style={{ flex:1, background:'rgba(0,0,0,0.3)', height:8, borderRadius:4, overflow:'hidden' }}><div style={{ width:'72%', background:'#10b981', height:'100%', boxShadow:'0 0 10px #10b981'}}/></div>
                                        <div style={{ flex:1, null:'RAM' }}>MEM: 72%</div>
                                    </div>
                                </div>
                                </>
                            )}

                            {tab === 'users' && (
                                <div style={{ background:'rgba(15,23,42,0.5)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:20, overflow:'hidden', boxShadow:'0 20px 40px rgba(0,0,0,0.3)' }}>
                                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
                                        <thead style={{ background:'rgba(0,0,0,0.4)', color:'#94a3b8', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'1px' }}>
                                            <tr>
                                                <th style={{ padding:'16px 24px', textAlign:'left', fontWeight:700 }}>Identifier (User)</th>
                                                <th style={{ padding:'16px 24px', textAlign:'left', fontWeight:700 }}>Privilege Level</th>
                                                <th style={{ padding:'16px 24px', textAlign:'left', fontWeight:700 }}>Security Hash / Pass</th>
                                                <th style={{ padding:'16px 24px', textAlign:'right', fontWeight:700 }}>Execute Commands</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usersList.length === 0 ? (
                                                <tr><td colSpan={4} style={{ padding:40, textAlign:'center', color:'#64748b' }}>No identities found.</td></tr>
                                            ) : usersList.map((u, i) => (
                                                <tr key={u.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', background:(i%2===0)?'transparent':'rgba(255,255,255,0.01)', transition:'all 0.2s' }}>
                                                    <td style={{ padding:'16px 24px', fontWeight:600, color:'#f8fafc', display:'flex', alignItems:'center', gap:12 }}>
                                                        <div style={{ width:8, height:8, borderRadius:'50%', background:u.role==='Admin'?'#ef4444':u.role==='Teacher'?'#a855f7':'#3b82f6', boxShadow:`0 0 8px ${u.role==='Admin'?'#ef4444':u.role==='Teacher'?'#a855f7':'#3b82f6'}` }}/>
                                                        {u.username}
                                                    </td>
                                                    <td style={{ padding:'16px 24px' }}>
                                                        <select value={u.role || 'Student'} onChange={(e)=>handleRoleChange(u.id, e.target.value)} style={{ padding:'6px 12px', background:'rgba(0,0,0,0.5)', color:u.role==='Admin'?'#fca5a5':u.role==='Teacher'?'#d8b4fe':'#93c5fd', border:`1px solid ${u.role==='Admin'?'#ef444440':u.role==='Teacher'?'#a855f740':'#3b82f640'}`, borderRadius:8, fontWeight:700, outline:'none', cursor:'pointer' }}>
                                                            {['Student','Teacher','Admin'].map(r=><option value={r} key={r}>{r}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding:'16px 24px', color:'#ef4444', fontFamily:'monospace' }}>
                                                        <button onClick={()=>handleResetPassword(u.id, u.username)} title="Force Reset" style={{ background:'transparent', border:'1px dotted #ef4444', color:'#ef4444', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:6 }} onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.1)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><KeyRound size={12}/> FORCE RESET</button>
                                                    </td>
                                                    <td style={{ padding:'16px 24px', textAlign:'right' }}>
                                                        <button onClick={()=>handleDeleteUser(u.id, u.username)} title="Eradicate" style={{ background:'rgba(239,68,68,0.1)', color:'#f87171', border:'1px solid rgba(239,68,68,0.2)', padding:'8px 12px', borderRadius:8, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, fontWeight:700, fontSize:'0.7rem', transition:'all 0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.3)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.1)'}>
                                                            <Trash2 size={14}/> PURGE
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {tab === 'logs' && (
                                <div style={{ background:'#000000', border:'1px solid #1e293b', borderRadius:16, padding:24, fontFamily:'monospace', boxShadow:'inset 0 0 40px rgba(0,0,0,1)' }}>
                                    <div style={{ color:'#10b981', marginBottom:20, display:'flex', alignItems:'center', gap:8, fontSize:'0.8rem' }}><Terminal size={14}/> ROOT TERMINAL v4.2 // TAILING ACCESS LOGS</div>
                                    <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:'60vh', overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'#334155 #000' }}>
                                        {logs.length === 0 ? <span style={{color:'#475569'}}>{'>'} No data stream found.</span> : logs.map(l => (
                                            <div key={l.id} style={{ display:'flex', gap:16, padding:'8px 12px', background:'rgba(16,185,129,0.03)', borderRadius:4, borderLeft:`3px solid ${l.action.includes('Failed') || l.action.includes('Deleted') ? '#ef4444' : l.action.includes('Admin') ? '#a855f7' : '#10b981'}`, fontSize:'0.8rem' }}>
                                                <div style={{ width:140, color:'#475569' }}>[{new Date(l.created_at).toLocaleString()}]</div>
                                                <div style={{ width:120, color:'#38bdf8', fontWeight:700 }}>@{l.username.padEnd(10)}</div>
                                                <div style={{ width:140, color:l.action.includes('Failed') || l.action.includes('Deleted') ? '#fca5a5' : '#fbbf24' }}>[{l.action}]</div>
                                                <div style={{ flex:1, color:'#cbd5e1' }}>{l.detail}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
