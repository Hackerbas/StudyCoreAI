import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Brain, MessageSquare, Upload, ChevronRight, Shield, Zap, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const features = [
    { icon: <Upload size={22} color="#818cf8"/>,    title: 'Upload Your Books',     desc: 'Teachers upload PDFs directly to the library. The AI instantly reads and indexes every page.' },
    { icon: <Brain size={22} color="#c084fc"/>,     title: 'AI Quiz &amp; Flashcards', desc: 'Generate multiple-choice quizzes or flip-card sets in one click — from your uploaded materials only.' },
    { icon: <MessageSquare size={22} color="#60a5fa"/>, title: 'Intelligent Chat',   desc: 'Ask any question about your library. StudyCore answers using only your books — nothing from outside.' },
    { icon: <Shield size={22} color="#34d399"/>,    title: 'Source-Locked Learning', desc: 'Every answer is grounded strictly in your uploaded documents. No hallucinations from the internet.' },
    { icon: <BookOpen size={22} color="#fb923c"/>,  title: 'PDF Book Reader',        desc: 'Open any book as a real PDF viewer with AI chat and personal notes pinned right beside the page.' },
    { icon: <Zap size={22} color="#f59e0b"/>,       title: 'Study Stats & Streaks',  desc: 'Track your questions asked, quizzes taken, and daily study streak — all stored privately in your browser.' },
];

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
                    <span style={{ fontWeight:900,fontSize:'1.3rem',letterSpacing:'-0.03em' }}>Study<span className="gradient-text">Core AI</span></span>
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
                <div className="badge animate-fade-up" style={{ marginBottom:22,display:'inline-flex',padding:'5px 14px',background:'rgba(99,102,241,0.1)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.25)',fontSize:'0.76rem',gap:6 }}>
                    <Zap size={12}/> Powered by Llama 3.3 70B · 3-key rotation for zero downtime
                </div>
                <h1 className="animate-fade-up" style={{ fontSize:'clamp(2.2rem,6vw,3.8rem)',fontWeight:900,lineHeight:1.1,letterSpacing:'-0.04em',marginBottom:22 }}>
                    Your Books.<br/><span className="gradient-text">Your Private AI Tutor.</span>
                </h1>
                <p className="animate-fade-up" style={{ fontSize:'1.05rem',color:'var(--text-secondary)',maxWidth:560,margin:'0 auto 36px',lineHeight:1.75 }}>
                    Upload your textbooks. StudyCore AI reads them and becomes your personal tutor — chat, quizzes, flashcards, and more. Always using only what you've uploaded.
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

            {/* Features */}
            <section style={{ maxWidth:1100,margin:'0 auto',padding:'0 40px 90px' }}>
                <h2 style={{ textAlign:'center',fontSize:'1.7rem',fontWeight:800,marginBottom:10,letterSpacing:'-0.03em' }}>
                    Everything you need to <span className="gradient-text">study smarter</span>
                </h2>
                <p style={{ textAlign:'center',color:'var(--text-secondary)',marginBottom:48,fontSize:'0.95rem' }}>
                    No outside sources. No distractions. Just your books and AI.
                </p>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:18 }}>
                    {features.map((f,i) => (
                        <div key={i} className="glass animate-fade-up" style={{ padding:'24px',transition:'all 0.25s' }}
                        onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 12px 36px rgba(0,0,0,0.3)';}}
                        onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}
                        >
                            <div style={{ width:44,height:44,borderRadius:12,background:'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14 }}>{f.icon}</div>
                            <h3 style={{ fontWeight:700,fontSize:'0.96rem',marginBottom:7 }} dangerouslySetInnerHTML={{__html:f.title}}/>
                            <p style={{ color:'var(--text-muted)',fontSize:'0.85rem',lineHeight:1.65 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section style={{ margin:'0 40px 70px',borderRadius:22,background:'linear-gradient(135deg,rgba(79,70,229,0.14),rgba(124,58,237,0.09))',border:'1px solid rgba(99,102,241,0.2)',padding:'52px 40px',textAlign:'center' }}>
                <h2 style={{ fontSize:'1.8rem',fontWeight:800,letterSpacing:'-0.03em',marginBottom:10 }}>Ready to transform how you study?</h2>
                <p style={{ color:'var(--text-secondary)',marginBottom:28,fontSize:'0.95rem' }}>Create a free account or jump in as a guest — no commitment needed.</p>
                <div style={{ display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap' }}>
                    <button onClick={()=>navigate('/register')} className="btn-gradient" style={{ padding:'13px 36px',fontSize:'0.95rem' }}>Create Free Account</button>
                    <button onClick={handleGuest} style={{ padding:'13px 28px',fontSize:'0.95rem',fontWeight:600,borderRadius:12,border:'1px solid var(--border)',background:'transparent',color:'var(--text-secondary)',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:7 }}
                    onMouseEnter={e=>e.currentTarget.style.color='white'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-secondary)'}
                    ><User size={15}/> Browse as Guest</button>
                </div>
            </section>

            <footer style={{ textAlign:'center',padding:'20px',borderTop:'1px solid var(--border)',color:'var(--text-muted)',fontSize:'0.78rem' }}>
                © 2026 StudyCore AI — Source-locked learning powered by AI.
            </footer>
        </div>
    );
};

export default LandingPage;
