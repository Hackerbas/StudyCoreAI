import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import BookLibrary from './BookLibrary';
import QuizView from './QuizView';
import StatsView from './StatsView';
import StudyPlanView from './StudyPlanView';
import ChangelogPopup from './ChangelogPopup';
import AdminPanel from './AdminPanel';
import { LogOut, BookOpen, MessageSquare, Upload, Brain, BarChart2, User, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NavItem = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} title={label} style={{
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        gap:4,width:'100%',padding:'13px 0',border:'none',borderRadius:0,
        background:active?'rgba(99,102,241,0.15)':'transparent',
        borderLeft:`2px solid ${active?'#6366f1':'transparent'}`,
        color:active?'#818cf8':'var(--text-muted)',
        cursor:'pointer',transition:'all 0.2s',fontFamily:'inherit',
    }}
    onMouseEnter={e=>{ if(!active) e.currentTarget.style.color='var(--text-secondary)'; }}
    onMouseLeave={e=>{ if(!active) e.currentTarget.style.color='var(--text-muted)'; }}
    >
        {icon}
        <span style={{ fontSize:'0.57rem',fontWeight:600,letterSpacing:'0.04em' }}>{label}</span>
    </button>
);

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState('chat');

    const handleLogout = async () => { await logout(); navigate('/login'); };

    if (!user) return (
        <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <div className="spin" style={{ width:34,height:34,border:'3px solid rgba(99,102,241,0.2)',borderTopColor:'#6366f1',borderRadius:'50%' }}/>
        </div>
    );

    const isTeacher = user.role === 'Teacher';
    const isGuest   = user.isGuest || user.role === 'Guest';
    const isAdmin   = user.role === 'Admin';

    if (isAdmin) {
        return <AdminPanel />;
    }

    const navItems = [
        { id:'chat',   icon:<MessageSquare size={18}/>, label:'Chat'    },
        { id:'bookAI', icon:<BookOpen size={18}/>,      label:'BookAI'  },
        { id:'quiz',   icon:<Brain size={18}/>,         label:'Quiz'    },
        { id:'plan',   icon:<Calendar size={18}/>,      label:'Plan'    },
        { id:'stats',  icon:<BarChart2 size={18}/>,     label:'Stats'   },
        ...(isTeacher ? [{ id:'manage', icon:<Upload size={18}/>, label:'Manage' }] : []),
    ];

    return (
        <div style={{ display:'flex',height:'100vh',overflow:'hidden' }}>
            <ChangelogPopup />
            {/* Left icon rail */}
            <nav style={{ width:58,flexShrink:0,borderRight:'1px solid var(--border)',background:'rgba(6,11,24,0.97)',display:'flex',flexDirection:'column',alignItems:'center' }}>
                <div style={{ width:58,height:54,display:'flex',alignItems:'center',justifyContent:'center',borderBottom:'1px solid var(--border)',flexShrink:0 }}>
                    <div style={{ width:30,height:30,borderRadius:8,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 14px rgba(99,102,241,0.4)' }}><BookOpen size={14} color="white"/></div>
                </div>
                <div style={{ flex:1,width:'100%' }}>
                    {navItems.map(item=><NavItem key={item.id} icon={item.icon} label={item.label} active={view===item.id} onClick={()=>setView(item.id)}/>)}
                </div>
                <div style={{ borderTop:'1px solid var(--border)',width:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'10px 0 8px' }}>
                    <div title={user.username} style={{ width:28,height:28,borderRadius:'50%',background:isGuest?'rgba(148,163,184,0.2)':'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:700,color:isGuest?'#94a3b8':'white',marginBottom:3,cursor:'default',border:isGuest?'1px solid rgba(148,163,184,0.3)':'none' }}>
                        {isGuest ? <User size={13}/> : user.username[0].toUpperCase()}
                    </div>
                    <button onClick={handleLogout} title="Logout" style={{ padding:5,borderRadius:7,border:'none',background:'transparent',cursor:'pointer',color:'var(--text-muted)',transition:'all 0.2s' }}
                    onMouseEnter={e=>e.currentTarget.style.color='#f87171'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}
                    ><LogOut size={14}/></button>
                </div>
            </nav>

            {/* Main content */}
            <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
                {/* Top bar */}
                <header style={{ height:46,flexShrink:0,borderBottom:'1px solid var(--border)',background:'rgba(6,11,24,0.9)',backdropFilter:'blur(16px)',display:'flex',alignItems:'center',paddingInline:18,gap:9 }}>
                    <span style={{ fontWeight:700,fontSize:'0.9rem',letterSpacing:'-0.02em' }}>Study<span className="gradient-text">Core AI</span></span>
                    <span className="badge" style={{ background:isGuest?'rgba(148,163,184,0.08)':isTeacher?'rgba(168,85,247,0.1)':'rgba(99,102,241,0.1)', color:isGuest?'#94a3b8':isTeacher?'#c084fc':'#818cf8', border:`1px solid ${isGuest?'rgba(148,163,184,0.2)':isTeacher?'rgba(168,85,247,0.25)':'rgba(99,102,241,0.25)'}` }}>
                        {user.role}
                    </span>
                    <span style={{ marginLeft:'auto',fontSize:'0.76rem',color:'var(--text-muted)' }}>
                        {user.username}{user.grade_level?<> · <span style={{ color:'#818cf8' }}>Gr {user.grade_level}</span></>:''}
                    </span>
                </header>

                {/* Guest banner */}
                {isGuest && (
                    <div style={{ background:'linear-gradient(90deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))',borderBottom:'1px solid rgba(99,102,241,0.2)',padding:'9px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
                        <span style={{ fontSize:'0.8rem',color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:8 }}>
                            <User size={13} color="#818cf8"/>
                            <strong style={{ color:'#818cf8' }}>Guest Mode</strong> — you can explore the app. Sign up to save progress, notes, and more.
                        </span>
                        <button onClick={()=>navigate('/register')} style={{ padding:'5px 14px',borderRadius:7,border:'1px solid rgba(99,102,241,0.35)',background:'rgba(99,102,241,0.1)',color:'#818cf8',cursor:'pointer',fontSize:'0.76rem',fontWeight:700,fontFamily:'inherit',whiteSpace:'nowrap' }}>
                            Create Account →
                        </button>
                    </div>
                )}

                <main style={{ flex:1,overflow:'hidden',display:'flex',flexDirection:'column' }}>
                    {view==='chat'   && <StudentDashboard />}
                    {view==='bookAI' && <BookLibrary user={user} />}
                    {view==='quiz'   && <QuizView />}
                    {view==='plan'   && <StudyPlanView />}
                    {view==='stats'  && <StatsView />}
                    {view==='manage' && isTeacher && <TeacherDashboard />}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
