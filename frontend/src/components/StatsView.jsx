import React, { useState, useEffect } from 'react';
import { BarChart2, Flame, MessageSquare, Brain, BookOpen, Trophy, Calendar, RefreshCw } from 'lucide-react';

const STATS_KEY = 'sc_study_stats';

const getStats = () => {
    try { return JSON.parse(localStorage.getItem(STATS_KEY) || '{}'); } catch { return {}; }
};

export const trackEvent = (event, payload = {}) => {
    const stats = getStats();
    const today = new Date().toISOString().split('T')[0];

    if (event === 'question_asked') {
        stats.questions_total = (stats.questions_total || 0) + 1;
        stats.questions_today = stats.last_question_date === today
            ? (stats.questions_today || 0) + 1
            : 1;
        stats.last_question_date = today;
    }
    if (event === 'quiz_completed') {
        stats.quizzes_taken = (stats.quizzes_taken || 0) + 1;
        stats.quiz_scores   = [...(stats.quiz_scores || []), payload.score];
    }
    if (event === 'book_opened') {
        const opened = new Set(stats.books_opened || []);
        opened.add(payload.bookId);
        stats.books_opened = [...opened];
    }

    // Streak tracking
    const prev = stats.last_active_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (prev === yesterday) stats.streak = (stats.streak || 0) + 1;
    else if (prev !== today)  stats.streak = 1;
    stats.last_active_date = today;

    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

const StatCard = ({ icon, label, value, sub, color = '#818cf8' }) => (
    <div className="glass" style={{ padding:'22px 20px' }}>
        <div style={{ width:40,height:40,borderRadius:11,background:'var(--bg-card-hover)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14 }}>
            {React.cloneElement(icon, { color, size:20 })}
        </div>
        <p style={{ fontSize:'2rem',fontWeight:800,letterSpacing:'-0.04em',color:'var(--text-primary)',lineHeight:1 }}>{value}</p>
        <p style={{ fontSize:'0.88rem',fontWeight:600,color:'var(--text-secondary)',marginTop:6 }}>{label}</p>
        {sub && <p style={{ fontSize:'0.74rem',color:'var(--text-muted)',marginTop:3 }}>{sub}</p>}
    </div>
);

const StatsView = () => {
    const [stats, setStats] = useState(getStats());

    useEffect(() => {
        trackEvent('page_view'); // logs active day / streak
        setStats(getStats());
    }, []);

    const avgScore = stats.quiz_scores?.length
        ? Math.round(stats.quiz_scores.reduce((a,b)=>a+b,0) / stats.quiz_scores.length)
        : null;
    const bestScore = stats.quiz_scores?.length ? Math.max(...stats.quiz_scores) : null;
    const totalQuestions = stats.quiz_totals?.length
        ? stats.quiz_totals[stats.quiz_totals.length - 1]
        : (stats.last_quiz_total || 5);

    const reset = () => {
        localStorage.removeItem(STATS_KEY);
        setStats({});
    };

    return (
        <div style={{ height:'100%',overflowY:'auto' }}>
            <div style={{ maxWidth:860,margin:'0 auto',padding:'36px 28px' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:30,flexWrap:'wrap',gap:12 }}>
                    <div>
                        <h1 style={{ fontSize:'1.55rem',fontWeight:800,letterSpacing:'-0.03em',display:'flex',alignItems:'center',gap:10,marginBottom:4 }}>
                            <BarChart2 size={24} color="var(--text-secondary)"/> My <span style={{ color: 'var(--accent)' }}>Study Stats</span>
                        </h1>
                        <p style={{ color:'var(--text-secondary)',fontSize:'0.86rem' }}>Your personal learning progress — stored locally in your browser.</p>
                    </div>
                    <button onClick={reset} style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,border:'1px solid var(--border)',background:'transparent',color:'var(--text-muted)',cursor:'pointer',fontSize:'0.78rem',fontFamily:'inherit',fontWeight:600,transition:'all 0.2s' }}
                    onMouseEnter={e=>{e.currentTarget.style.color='#f87171';e.currentTarget.style.borderColor='rgba(239,68,68,0.3)';}}
                    onMouseLeave={e=>{e.currentTarget.style.color='var(--text-muted)';e.currentTarget.style.borderColor='var(--border)';}}
                    ><RefreshCw size={13}/> Reset Stats</button>
                </div>

                {/* Main stat grid */}
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:28 }}>
                    <StatCard icon={<Flame/>}         label="Day Streak"      value={stats.streak || 0}              sub="Consecutive days active"    color="#fb923c"/>
                    <StatCard icon={<MessageSquare/>} label="Questions Asked"  value={stats.questions_total || 0}     sub={`${stats.questions_today||0} today`} color="#818cf8"/>
                    <StatCard icon={<Brain/>}         label="Quizzes Taken"   value={stats.quizzes_taken || 0}       sub="All time"                   color="#c084fc"/>
                    <StatCard icon={<BookOpen/>}      label="Books Opened"    value={(stats.books_opened||[]).length} sub="Unique documents"           color="#60a5fa"/>
                    <StatCard icon={<Trophy/>}        label="Best Quiz Score" value={bestScore !== null ? `${bestScore} pts` : '—'} sub="Your personal best" color="#fbbf24"/>
                    <StatCard icon={<BarChart2/>}     label="Avg Quiz Score"  value={avgScore !== null ? `${avgScore} pts` : '—'}  sub="Across all quizzes" color="#34d399"/>
                </div>

                {/* Quiz history */}
                {stats.quiz_scores?.length > 0 && (
                    <div className="glass" style={{ padding:'22px 24px' }}>
                        <h2 style={{ fontSize:'0.96rem',fontWeight:700,marginBottom:16,display:'flex',alignItems:'center',gap:8 }}><Brain size={16} color="var(--accent)"/> Quiz History</h2>
                        <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                            {stats.quiz_scores.slice(-20).reverse().map((score,i) => {
                                const total = stats.quiz_totals?.[stats.quiz_scores.length - 1 - i] || 5;
                                const ratio = score / total;
                                return (
                                    <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 14px', borderRadius:10, background:'var(--bg-card)', border:`1px solid ${ratio>=0.8?'var(--success)':ratio>=0.6?'var(--warning)':'var(--danger)'}` }}>
                                        <span style={{ fontSize:'1.1rem', fontWeight:800, color:ratio>=0.8?'var(--success)':ratio>=0.6?'var(--warning)':'var(--danger)' }}>{score} pts</span>
                                        <span style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>Quiz {stats.quiz_scores.length - i}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!stats.streak && !stats.questions_total && !stats.quizzes_taken && (
                    <div style={{ textAlign:'center',paddingTop:40,color:'var(--text-muted)' }}>
                        <Calendar size={44} style={{ margin:'0 auto 14px',opacity:0.15,display:'block' }}/>
                        <p style={{ fontWeight:600,marginBottom:8,fontSize:'0.96rem' }}>No activity yet</p>
                        <p style={{ fontSize:'0.84rem' }}>Start chatting, take a quiz, or open a book — your stats will appear here!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsView;
