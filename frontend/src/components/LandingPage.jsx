import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';


const LandingPage = () => {
    const navigate   = useNavigate();
    const { loginAsGuest } = useAuth();
    const [guestError, setGuestError] = React.useState('');
    const [guestLoading, setGuestLoading] = React.useState(false);

    const handleGuest = async () => {
        setGuestLoading(true); setGuestError('');
        const result = await loginAsGuest();
        setGuestLoading(false);
        if (result.success) navigate('/dashboard');
        else setGuestError(result.error || 'Guest login failed. Please try again.');
    };

    return (
        <div style={{ minHeight:'100vh', overflowX:'hidden' }}>
            {/* Nav */}
            <header style={{ position:'sticky',top:0,zIndex:50,padding:'0 40px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(6,11,24,0.9)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                    <div style={{ width:48,height:48,borderRadius:12,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 20px rgba(99,102,241,0.4)',overflow:'hidden' }}>
                        <img src="/favicon.png" alt="Logo" style={{ width:'80%',height:'80%',objectFit:'contain' }}/>
                    </div>
                    <span style={{ fontWeight:900,fontSize:'1.3rem',letterSpacing:'-0.03em' }}>Teacher<span className="gradient-text"> Assist</span></span>
                </div>
                <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                    <button onClick={handleGuest} style={{ padding:'7px 16px',borderRadius:9,border:'1px solid var(--border)',background:'transparent',color:'var(--text-muted)',cursor:'pointer',fontSize:'0.82rem',fontWeight:600,fontFamily:'inherit',transition:'all 0.2s',display:'flex',alignItems:'center',gap:6 }}
                    onMouseEnter={e=>{e.currentTarget.style.color='var(--text-secondary)';e.currentTarget.style.borderColor='rgba(255,255,255,0.15)';}}
                    onMouseLeave={e=>{e.currentTarget.style.color='var(--text-muted)';e.currentTarget.style.borderColor='var(--border)';}}
                    ><User size={13}/>Try as Guest</button>
                    <button onClick={()=>navigate('/login')} style={{ padding:'7px 16px',borderRadius:9,border:'1px solid var(--border)',background:'transparent',color:'var(--text-secondary)',cursor:'pointer',fontSize:'0.82rem',fontWeight:600,fontFamily:'inherit',transition:'all 0.2s' }}
                    onMouseEnter={e=>e.currentTarget.style.color='white'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-secondary)'}
                    >Login</button>
                    <button onClick={()=>navigate('/register')} className="btn-gradient" style={{ padding:'7px 18px',fontSize:'0.82rem' }}>Get Started</button>
                </div>
            </header>

            {/* Hero */}
            <section style={{ maxWidth:960,margin:'0 auto',padding:'90px 40px 70px',textAlign:'center',position:'relative' }}>
                <div style={{ position:'fixed',top:'20%',left:'50%',transform:'translateX(-50%)',width:700,height:400,background:'radial-gradient(ellipse,rgba(99,102,241,0.1) 0%,transparent 70%)',pointerEvents:'none',zIndex:0 }}/>

                <h1 className="animate-fade-up" style={{ fontSize:'clamp(2.2rem,6vw,3.8rem)',fontWeight:900,lineHeight:1.1,letterSpacing:'-0.04em',marginBottom:22 }}>
                    Your Books.<br/><span className="gradient-text">Your Private AI Tutor.</span>
                </h1>
                <p className="animate-fade-up" style={{ fontSize:'1.05rem',color:'var(--text-secondary)',maxWidth:560,margin:'0 auto 36px',lineHeight:1.75 }}>
                    Welcome to your study assistant AI! We’re here to make learning easier, give you the tools to practice, and help you achieve your goals. Let’s get started!
                </p>
                <div className="animate-fade-up" style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', flexDirection:'column', alignItems:'center' }}>
                    <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
                        <button onClick={() => navigate('/register')} className="btn-gradient" style={{ padding:'13px 30px', fontSize:'0.96rem', display:'flex', alignItems:'center', gap:8 }}>
                            Start Learning <ChevronRight size={17}/>
                        </button>
                        <button onClick={handleGuest} disabled={guestLoading} style={{ padding:'13px 30px', fontSize:'0.96rem', fontWeight:600, borderRadius:12, border:'1px solid var(--border)', background:'var(--bg-card)', color:'var(--text-primary)', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', display:'flex', alignItems:'center', gap:8, opacity: guestLoading ? 0.7 : 1 }}
                        onMouseEnter={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
                        ><User size={16}/>{guestLoading ? 'Entering…' : 'Try as Guest'}</button>
                    </div>
                    {guestError && <p style={{ color:'#f87171', fontSize:'0.8rem', marginTop:4 }}>{guestError}</p>}
                </div>
            </section>


            <footer style={{ textAlign:'center',padding:'20px',borderTop:'1px solid var(--border)',color:'var(--text-muted)',fontSize:'0.78rem' }}>
                © 2026 Teacher Assist — Source-locked learning powered by AI.
            </footer>
        </div>
    );
};

export default LandingPage;
