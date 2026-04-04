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
    <button onClick={onClick} style={{
        display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
        gap: 12, width: '100%', padding: '12px 18px', border: 'none', borderRadius: 8,
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        color: active ? '#f1f5f9' : 'var(--text-muted)',
        cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
        marginBottom: 4
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
        {React.cloneElement(icon, { size: 18, color: active ? '#f1f5f9' : 'currentColor' })}
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>
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
            {/* Left sidebar */}
            <nav style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--border)', background: '#111318', display: 'flex', flexDirection: 'column', padding: '16px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '0 8px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={16} color="#f1f5f9" />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '1.05rem', color: '#f1f5f9' }}>StudyCore</span>
                </div>
                <div style={{ flex:1,width:'100%' }}>
                    {navItems.map(item=><NavItem key={item.id} icon={item.icon} label={item.label} active={view===item.id} onClick={()=>setView(item.id)}/>)}
                </div>
                <div style={{ borderTop: '1px solid var(--border)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 8px 0', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div title={user.username} style={{ width: 32, height: 32, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', cursor: 'default' }}>
                            {isGuest ? <User size={16} /> : user.username[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#f1f5f9', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>
                            {user.username}
                        </span>
                    </div>
                    <button onClick={handleLogout} title="Logout" style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    ><LogOut size={16} /></button>
                </div>
            </nav>

            {/* Main content */}
            <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
                {/* Top bar */}
                <header style={{ height: 50, flexShrink: 0, borderBottom: '1px solid var(--border)', background: '#111318', display: 'flex', alignItems: 'center', paddingInline: 24, gap: 12 }}>
                    <span className="badge" style={{ background: '#1e293b', color: '#f1f5f9', border: '1px solid var(--border)', fontWeight: 500, padding: '4px 10px' }}>
                        {user.role} Mode
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {user.grade_level ? `Grade ${user.grade_level}` : ''}
                    </span>
                </header>

                {/* Guest banner */}
                {isGuest && (
                    <div style={{ background:'linear-gradient(90deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))',borderBottom:'1px solid rgba(99,102,241,0.2)',padding:'9px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <User size={14} color="#f1f5f9" />
                            <strong style={{ color: '#f1f5f9' }}>Guest Mode</strong> — explore the app. Sign up to save your progress and chats.
                        </span>
                        <button onClick={() => navigate('/register')} style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid var(--border)', background: '#1e293b', color: '#f1f5f9', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#334155'} onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}>
                            Create Account
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
