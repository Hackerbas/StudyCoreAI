import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, BarChart2, Flame, MessageSquare, Brain, Trophy,
    RefreshCw, UserCircle2, ChevronDown, AlertCircle, BookOpen,
    TrendingUp, GraduationCap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ─── Grade label helper ──────────────────────────────────────────────────────
const gradeLabel = (g) => {
    if (!g) return '—';
    if (parseInt(g) === 13) return 'University';
    return `Grade ${g}`;
};

// ─── Grade accent colours ────────────────────────────────────────────────────
const GRADE_COLORS = {
    8:  '#fb923c',
    9:  '#fbbf24',
    10: '#4ade80',
    11: '#60a5fa',
    12: '#818cf8',
    13: '#e879f9',
};
const gradeColor = (g) => GRADE_COLORS[parseInt(g)] || '#94a3b8';

// ─── Mini stat pill ───────────────────────────────────────────────────────────
const Pill = ({ icon, value, label, color }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {React.cloneElement(icon, { size: 13, color })}
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</span>
        </div>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</span>
    </div>
);

// ─── Student Card ─────────────────────────────────────────────────────────────
const StudentCard = ({ student }) => {
    const stats = student.stats || {};
    const avgScore = stats.quiz_scores?.length
        ? Math.round(stats.quiz_scores.reduce((a, b) => a + b, 0) / stats.quiz_scores.length)
        : null;
    const bestScore = stats.quiz_scores?.length ? Math.max(...stats.quiz_scores) : null;
    const color = gradeColor(student.grade_level);
    const hasActivity = stats.streak || stats.questions_total || stats.quizzes_taken;
    const initial = (student.username || '?')[0].toUpperCase();

    return (
        <div
            className="glass"
            style={{
                padding: '18px 20px', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14,
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'transform 0.18s, box-shadow 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Avatar */}
                <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${color}33, ${color}11)`,
                    border: `1.5px solid ${color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', fontWeight: 800, color,
                }}>
                    {initial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {student.username}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <span style={{
                            padding: '1px 8px', borderRadius: 100, fontSize: '0.65rem', fontWeight: 700,
                            background: `${color}1a`, color, border: `1px solid ${color}30`,
                        }}>
                            {gradeLabel(student.grade_level)}
                        </span>
                        {(stats.streak || 0) >= 3 && (
                            <span style={{ fontSize: '0.65rem', color: '#fb923c', fontWeight: 700 }}>🔥 {stats.streak}d streak</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats row */}
            {hasActivity ? (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-around',
                    padding: '12px 8px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                    flexWrap: 'wrap', gap: 10,
                }}>
                    <Pill icon={<Flame />}         value={stats.streak || 0}                              label="Streak"    color="#fb923c" />
                    <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.07)' }} />
                    <Pill icon={<MessageSquare />}  value={stats.questions_total || 0}                      label="Questions" color="#818cf8" />
                    <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.07)' }} />
                    <Pill icon={<Brain />}          value={stats.quizzes_taken || 0}                        label="Quizzes"   color="#c084fc" />
                    <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.07)' }} />
                    <Pill icon={<Trophy />}         value={bestScore !== null ? `${bestScore}` : '—'}        label="Best"      color="#fbbf24" />
                    <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.07)' }} />
                    <Pill icon={<BarChart2 />}      value={avgScore !== null ? `${avgScore}` : '—'}          label="Avg"       color="#34d399" />
                </div>
            ) : (
                <div style={{
                    padding: '12px', borderRadius: 10, textAlign: 'center',
                    background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)',
                }}>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No activity recorded yet</p>
                </div>
            )}
        </div>
    );
};

// ─── Summary top bar ─────────────────────────────────────────────────────────
const SummaryBar = ({ students }) => {
    const allStats    = students.map(s => s.stats || {});
    const totalQ      = allStats.reduce((a, s) => a + (s.questions_total || 0), 0);
    const totalQuizzes= allStats.reduce((a, s) => a + (s.quizzes_taken || 0), 0);
    const allScores   = allStats.flatMap(s => s.quiz_scores || []);
    const avgScore    = allScores.length ? Math.round(allScores.reduce((a,b)=>a+b,0)/allScores.length) : null;
    const active      = allStats.filter(s => (s.streak || 0) >= 1).length;

    const items = [
        { icon: <Users size={18} color="#818cf8"/>,       value: students.length,                          label: 'Students'        },
        { icon: <TrendingUp size={18} color="#4ade80"/>,   value: active,                                   label: 'Active Today'    },
        { icon: <MessageSquare size={18} color="#60a5fa"/>,value: totalQ,                                   label: 'Total Questions' },
        { icon: <Brain size={18} color="#c084fc"/>,        value: totalQuizzes,                             label: 'Quizzes Taken'   },
        { icon: <Trophy size={18} color="#fbbf24"/>,       value: avgScore !== null ? `${avgScore} pts` : '—', label: 'Class Avg Score' },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
            {items.map((item, i) => (
                <div key={i} className="glass" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {item.icon}
                    </div>
                    <div>
                        <p style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>{item.value}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─── Main TeacherStatsView ────────────────────────────────────────────────────
const TeacherStatsView = () => {
    const { user } = useAuth();
    const [students, setStudents]           = useState([]);
    const [teachingGrades, setTeachingGrades] = useState([]);
    const [activeGrade, setActiveGrade]     = useState(null); // null = all
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);
    const [lastRefresh, setLastRefresh]     = useState(null);

    const fetchStudents = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res  = await fetch('/api/teacher/student_stats');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            setStudents(data.students || []);
            setTeachingGrades(data.teaching_grades || []);
            setLastRefresh(new Date());
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load + auto-refresh every 60s
    useEffect(() => {
        fetchStudents();
        const interval = setInterval(fetchStudents, 60000);
        return () => clearInterval(interval);
    }, [fetchStudents]);

    // Sort teaching grades
    const sortedGrades = [...teachingGrades].sort((a, b) => a - b);

    // Filter students by selected grade
    const displayed = activeGrade === null
        ? students
        : students.filter(s => parseInt(s.grade_level) === parseInt(activeGrade));

    return (
        <div style={{ height: '100%', overflowY: 'auto' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 28px' }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
                    <div>
                        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <GraduationCap size={26} color="var(--text-secondary)" />
                            Student <span style={{ color: 'var(--accent)' }}>Progress</span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                            Live overview of your students' learning activity.
                            {lastRefresh && (
                                <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                                    Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={fetchStudents}
                        disabled={loading}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 9,
                            border: '1px solid var(--border)', background: 'transparent',
                            color: 'var(--text-secondary)', cursor: 'pointer',
                            fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600,
                            transition: 'all 0.2s',
                            opacity: loading ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#f1f5f9'; }}}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                        Refresh
                    </button>
                </div>

                {/* Error state */}
                {error && (
                    <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                        <AlertCircle size={16} />
                        <span style={{ fontSize: '0.87rem' }}>{error}</span>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && !error && students.length === 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                        {[1,2,3,4].map(i => (
                            <div key={i} className="glass" style={{ padding: '18px 20px', borderRadius: 16, height: 120, opacity: 0.4, animation: 'pulse 1.5s ease-in-out infinite' }}>
                                <div style={{ width: '60%', height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.1)', marginBottom: 10 }} />
                                <div style={{ width: '40%', height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.07)' }} />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* Summary stats */}
                        <SummaryBar students={students} />

                        {/* Grade filter chips */}
                        {sortedGrades.length > 1 && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
                                <button
                                    onClick={() => setActiveGrade(null)}
                                    style={{
                                        padding: '6px 16px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 700,
                                        fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.18s',
                                        border: `1px solid ${activeGrade === null ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                        background: activeGrade === null ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                                        color: activeGrade === null ? '#a5b4fc' : 'var(--text-secondary)',
                                    }}
                                >
                                    All Grades
                                    <span style={{ marginLeft: 6, fontSize: '0.7rem', opacity: 0.7 }}>{students.length}</span>
                                </button>
                                {sortedGrades.map(g => {
                                    const count  = students.filter(s => parseInt(s.grade_level) === g).length;
                                    const col    = gradeColor(g);
                                    const active = parseInt(activeGrade) === g;
                                    return (
                                        <button key={g}
                                            onClick={() => setActiveGrade(g)}
                                            style={{
                                                padding: '6px 16px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 700,
                                                fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.18s',
                                                border: `1px solid ${active ? `${col}60` : 'rgba(255,255,255,0.1)'}`,
                                                background: active ? `${col}1a` : 'rgba(255,255,255,0.03)',
                                                color: active ? col : 'var(--text-secondary)',
                                            }}
                                        >
                                            {gradeLabel(g)}
                                            <span style={{ marginLeft: 6, fontSize: '0.7rem', opacity: 0.7 }}>{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Student grid */}
                        {displayed.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                                {displayed.map(s => <StudentCard key={s.id} student={s} />)}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--text-muted)' }}>
                                <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.12, display: 'block' }} />
                                <p style={{ fontWeight: 600, marginBottom: 8, fontSize: '1rem' }}>
                                    {students.length === 0 ? 'No students yet' : 'No students in this grade'}
                                </p>
                                <p style={{ fontSize: '0.84rem', maxWidth: 340, margin: '0 auto' }}>
                                    {students.length === 0
                                        ? 'Students who register with a grade in your teaching range will appear here.'
                                        : `Try switching to a different grade filter.`}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TeacherStatsView;
