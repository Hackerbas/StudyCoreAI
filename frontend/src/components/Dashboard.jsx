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
import { LogOut, BookOpen, MessageSquare, Upload, Brain, BarChart2, User, Calendar, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

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
    const { t, lang, setLang } = useLanguage();

    const [chats, setChats] = React.useState(() => {
        try {
            const s = localStorage.getItem('studycore_chats');
            if (s) return JSON.parse(s);
        } catch {}
        return [{ id: 'default', title: 'New Chat', messages: [], updatedAt: Date.now() }];
    });
    const [activeChatId, setActiveChatId] = React.useState(() => {
        return localStorage.getItem('studycore_active_chat') || 'default';
    });

    React.useEffect(() => {
        localStorage.setItem('studycore_chats', JSON.stringify(chats));
        localStorage.setItem('studycore_active_chat', activeChatId);
    }, [chats, activeChatId]);

    const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

    const createNewChat = () => {
        const newChat = { id: Date.now().toString(), title: 'New Chat', messages: [], updatedAt: Date.now() };
        setChats(prev => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        setView('chat'); 
    };

    const updateMessages = (newMessagesArr) => {
        setChats(prev => prev.map(c => {
            if (c.id === activeChatId) {
                let updatedTitle = c.title;
                if (c.title === 'New Chat' && newMessagesArr.length > 0) {
                     const firstUserMsg = newMessagesArr.find(m => m.role === 'user');
                     if (firstUserMsg) {
                         updatedTitle = firstUserMsg.content.slice(0, 25) + (firstUserMsg.content.length > 25 ? '...' : '');
                     }
                }
                return { ...c, messages: newMessagesArr, title: updatedTitle, updatedAt: Date.now() };
            }
            return c;
        }));
    };
    
    const deleteChat = (e, id) => {
        e.stopPropagation();
        setChats(prev => {
            const filtered = prev.filter(c => c.id !== id);
            if (filtered.length === 0) {
                 const nc = { id: Date.now().toString(), title: 'New Chat', messages: [], updatedAt: Date.now() };
                 setActiveChatId(nc.id);
                 return [nc];
            }
            if (activeChatId === id) setActiveChatId(filtered[0].id);
            return filtered;
        });
    };

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
        { id:'chat',   icon:<MessageSquare size={18}/>, label: t('dashboard') },
        { id:'bookAI', icon:<BookOpen size={18}/>,      label:'BookAI'  },
        { id:'quiz',   icon:<Brain size={18}/>,         label: t('quiz')    },
        { id:'plan',   icon:<Calendar size={18}/>,      label: t('study_plan')    },
        { id:'stats',  icon:<BarChart2 size={18}/>,     label: t('stats')   },
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
                <div style={{ padding: '0 12px 16px' }}>
                    <button onClick={createNewChat} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', borderRadius: 8, background: '#1e293b', border: '1px solid var(--border)', color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#334155'} onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}>
                        <Plus size={16} /> New Chat
                    </button>
                </div>
                
                <div style={{ flex: 1, width: '100%', overflowY: 'auto' }}>
                    <div style={{ padding: '0 8px', marginBottom: 16 }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, paddingLeft: 8 }}>Tools</div>
                        {navItems.map(item=><NavItem key={item.id} icon={item.icon} label={item.label} active={view===item.id && item.id!=='chat'} onClick={()=>{
                            setView(item.id);
                        }}/>)}
                    </div>
                    
                    <div style={{ padding: '0 8px' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, paddingLeft: 8 }}>Recent Chats</div>
                        {chats.map(c => {
                            const isActive = view === 'chat' && activeChatId === c.id;
                            return (
                                <div key={c.id} onClick={() => { setActiveChatId(c.id); setView('chat'); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent', color: isActive ? '#f8fafc' : 'var(--text-secondary)', cursor: 'pointer', marginBottom: 2, transition: 'all 0.2s' }}
                                onMouseEnter={e => { if(!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }} onMouseLeave={e => { if(!isActive) e.currentTarget.style.background = 'transparent'; }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                                        <MessageSquare size={14} flexShrink={0} color={isActive ? '#f8fafc' : 'var(--text-muted)'} />
                                        <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isActive ? 500 : 400 }}>{c.title}</span>
                                    </div>
                                    <button onClick={e => deleteChat(e, c.id)} title={t('delete_chat')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderRadius: 4 }}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* Footer User / Lang Profile */}
                <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ padding: '0 8px', marginBottom: 12 }}>
                        <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ width: '100%', background: '#1e293b', border: '1px solid var(--border)', color: '#f1f5f9', padding: '6px 8px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer' }}>
                            <option value="en">English</option>
                            <option value="ar">العربية (Arabic)</option>
                            <option value="tr">Türkçe (Turkish)</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div title={user.username} style={{ width: 32, height: 32, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', cursor: 'default' }}>
                                {isGuest ? <User size={16} /> : user.username[0].toUpperCase()}
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#f1f5f9', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>
                                {user.username}
                            </span>
                        </div>
                        <button onClick={handleLogout} title={t('logout')} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        ><LogOut size={16} /></button>
                    </div>
                </div>
            </nav>

            {/* Main content */}
            <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
                {/* Top bar */}
                <header style={{ height: 50, flexShrink: 0, borderBottom: '1px solid var(--border)', background: '#111318', display: 'flex', alignItems: 'center', paddingInline: 24, gap: 12 }}>
                    <span className="badge" style={{ background: '#1e293b', color: '#f1f5f9', border: '1px solid var(--border)', fontWeight: 500, padding: '4px 10px' }}>
                        {user.role} {t('mode')}
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
                    {view==='chat'   && <StudentDashboard chatMessages={activeChat.messages} setChatMessages={updateMessages} createNewChat={createNewChat} />}
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
