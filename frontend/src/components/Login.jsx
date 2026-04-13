import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, LogIn, Eye, EyeOff, User } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPw,   setShowPw]   = useState(false);
    const [error,    setError]    = useState('');
    const [loading,  setLoading]  = useState(false);
    const [guestLoading, setGuestLoading] = useState(false);
    const { login, loginAsGuest } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        const result = await login(username, password);
        if (result.success) navigate('/dashboard');
        else { setError(result.error || 'Invalid credentials'); setLoading(false); }
    };

    const handleGuest = async () => {
        setGuestLoading(true);
        const result = await loginAsGuest();
        if (result.success) navigate('/dashboard');
        else { setError('Could not start guest session'); setGuestLoading(false); }
    };

    return (
        <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24,position:'relative' }}>
            <div style={{ position:'fixed',inset:0,background:'radial-gradient(ellipse 80% 60% at 50% 20%,rgba(99,102,241,0.12) 0%,transparent 70%)',pointerEvents:'none' }}/>
            <div className="glass animate-fade-up" style={{ width:'100%',maxWidth:420,padding:'38px 34px',position:'relative',zIndex:1 }}>
                <div style={{ textAlign:'center',marginBottom:30 }}>
                    <div style={{ width:50,height:50,borderRadius:13,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',boxShadow:'0 0 26px rgba(99,102,241,0.4)' }}><BookOpen size={22} color="white"/></div>
                    <h1 style={{ fontSize:'1.45rem',fontWeight:800,letterSpacing:'-0.03em',marginBottom:5 }}>Welcome back</h1>
                    <p style={{ color:'var(--text-muted)',fontSize:'0.85rem' }}>Sign in to your Teacher Assist account</p>
                </div>

                {error && <div style={{ marginBottom:18,padding:'11px 14px',borderRadius:10,background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',color:'#f87171',fontSize:'0.83rem',textAlign:'center' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:15 }}>
                    <div>
                        <label style={{ fontSize:'0.74rem',fontWeight:600,color:'var(--text-muted)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em' }}>Username</label>
                        <input className="input-field" type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter your username" required style={{ padding:'12px 15px' }}/>
                    </div>
                    <div>
                        <label style={{ fontSize:'0.74rem',fontWeight:600,color:'var(--text-muted)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em' }}>Password</label>
                        <div style={{ position:'relative' }}>
                            <input className="input-field" type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required style={{ padding:'12px 44px 12px 15px' }}/>
                            <button type="button" onClick={()=>setShowPw(p=>!p)} style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',padding:0 }}>
                                {showPw?<EyeOff size={15}/>:<Eye size={15}/>}
                            </button>
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-gradient" style={{ padding:'12px',fontSize:'0.88rem',display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:2 }}>
                        {loading?<span className="spin" style={{ width:15,height:15,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%' }}/>:<><LogIn size={15}/>Sign In</>}
                    </button>
                </form>

                {/* Divider */}
                <div style={{ display:'flex',alignItems:'center',gap:10,margin:'18px 0' }}>
                    <div style={{ flex:1,height:1,background:'var(--border)' }}/><span style={{ fontSize:'0.72rem',color:'var(--text-muted)' }}>or</span><div style={{ flex:1,height:1,background:'var(--border)' }}/>
                </div>

                {/* Guest button */}
                <button onClick={handleGuest} disabled={guestLoading} style={{ width:'100%',padding:'11px',borderRadius:10,border:'1px solid var(--border)',background:'rgba(255,255,255,0.03)',color:'var(--text-secondary)',cursor:'pointer',fontSize:'0.86rem',fontWeight:600,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.18)';e.currentTarget.style.color='white';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-secondary)';}}
                >
                    {guestLoading?<span className="spin" style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%' }}/>:<><User size={15}/>Continue as Guest</>}
                </button>

                <p style={{ textAlign:'center',marginTop:20,fontSize:'0.83rem',color:'var(--text-muted)' }}>
                    Don't have an account? <Link to="/register" style={{ color:'#818cf8',fontWeight:600,textDecoration:'none' }}>Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
