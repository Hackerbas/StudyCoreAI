import React, { useState, useEffect } from 'react';
import { Calendar, Sparkles, Download, BookOpen, Target, Trophy, ClipboardList, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const downloadTxt = (text, filename) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
};

const DURATIONS = [
    { id: 'week',  label: '📅 Week',        sub: '5-day lesson plan'        },
    { id: 'month', label: '🗓️ Month',       sub: '4-week unit plan'          },
    { id: 'year',  label: '🎓 School Year', sub: '10-month curriculum'       },
];

const PERIOD_COLORS = ['#818cf8','#60a5fa','#4ade80','#fbbf24','#f87171','#e879f9','#34d399','#fb923c','#a78bfa','#38bdf8'];

const PeriodCard = ({ period, index, duration }) => {
    const [open, setOpen] = useState(index === 0);
    const color = PERIOD_COLORS[index % PERIOD_COLORS.length];

    return (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 16,
                    padding: '18px 22px', background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                }}
            >
                <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `${color}18`, border: `1.5px solid ${color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.78rem', fontWeight: 800, color,
                }}>
                    {duration === 'week' ? period.label.slice(0, 3).toUpperCase() :
                     duration === 'month' ? `W${index+1}` : period.label.slice(0, 3).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                        {period.label} — {period.topic}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {period.objective}
                    </p>
                </div>
                <ChevronDown size={16} color="var(--text-muted)" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
            </button>

            {open && (
                <div style={{ padding: '0 22px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 2 }}/>

                    {/* Objective */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Target size={14} color="#818cf8"/>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Learning Objective</p>
                            <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{period.objective}</p>
                        </div>
                    </div>

                    {/* Activity */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ClipboardList size={14} color="#60a5fa"/>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Activity</p>
                            <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{period.activity}</p>
                        </div>
                    </div>

                    {/* Assessment */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(74,222,128,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Trophy size={14} color="#4ade80"/>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Assessment</p>
                            <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{period.assessment}</p>
                        </div>
                    </div>

                    {/* Materials */}
                    {period.materials?.length > 0 && (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(251,191,36,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <BookOpen size={14} color="#fbbf24"/>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Materials</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {period.materials.map((m, i) => (
                                        <span key={i} style={{ padding: '3px 10px', borderRadius: 100, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 600 }}>
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const TeacherPlanView = () => {
    const { user } = useAuth();
    const [duration, setDuration] = useState('week');
    const [subject,  setSubject]  = useState('All');
    const [subjects, setSubjects] = useState(['All']);
    const [plan,     setPlan]     = useState(null);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState(null);

    useEffect(() => {
        fetch('/api/library').then(r => r.json()).then(data => {
            if (data.books?.length)
                setSubjects(['All', ...new Set(data.books.map(b => b.subject || 'General'))]);
        }).catch(() => {});
    }, []);

    const generate = async () => {
        setLoading(true); setError(null); setPlan(null);
        try {
            const res  = await fetch('/api/teacher/curriculum_plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    duration,
                    subject,
                    grades: user?.teaching_grades || [],
                }),
            });
            const data = await res.json();
            if (res.ok && data.periods) setPlan(data);
            else setError(data.error || 'Failed to generate plan.');
        } catch { setError('Network error. Please try again.'); }
        finally { setLoading(false); }
    };

    const handleDownload = () => {
        if (!plan) return;
        const lines = plan.periods.map(p =>
            `${p.label} — ${p.topic}\nObjective: ${p.objective}\nActivity: ${p.activity}\nAssessment: ${p.assessment}\nMaterials: ${(p.materials || []).join(', ')}`
        ).join('\n\n---\n\n');
        downloadTxt(`Curriculum Plan (${duration})\nSubject: ${subject}\n\n${lines}`, `CurriculumPlan_${duration}_${subject}.txt`);
    };

    const durationLabels = { week: 'Weekly Teaching Plan', month: 'Monthly Unit Plan', year: 'School Year Curriculum' };

    return (
        <div style={{ height: '100%', overflowY: 'auto' }}>
            <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 28px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
                    <div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Calendar size={24} color="var(--text-secondary)"/>
                            Curriculum <span style={{ color: 'var(--accent)' }}>Planner</span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                            AI-generated teaching plans tailored to your grade levels.
                        </p>
                    </div>
                    {plan && (
                        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                            <Download size={13}/> Save .txt
                        </button>
                    )}
                </div>

                {/* Duration selector */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
                    {DURATIONS.map(d => (
                        <button key={d.id} onClick={() => { setDuration(d.id); setPlan(null); setError(null); }} style={{
                            padding: '14px 16px', borderRadius: 12, border: `1px solid ${duration === d.id ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
                            background: duration === d.id ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.2s',
                        }}>
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: duration === d.id ? '#a5b4fc' : 'var(--text-primary)', marginBottom: 3 }}>{d.label}</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.sub}</p>
                        </button>
                    ))}
                </div>

                {/* Subject + generate row */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
                    <select value={subject} onChange={e => setSubject(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, background: '#1e293b', color: '#f1f5f9', border: '1px solid var(--border)', fontSize: '0.86rem', outline: 'none', cursor: 'pointer' }}>
                        {subjects.map(s => <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>)}
                    </select>
                    <button onClick={generate} disabled={loading} className="btn-gradient" style={{ padding: '10px 24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, opacity: loading ? 0.7 : 1 }}>
                        {loading ? <div className="spin" style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}/> : <Sparkles size={15}/>}
                        {loading ? 'Generating…' : plan ? 'Regenerate' : 'Generate Plan'}
                    </button>
                </div>

                {error && <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, color: '#f87171', marginBottom: 24, fontSize: '0.86rem' }}>{error}</div>}

                {loading && (
                    <div style={{ textAlign: 'center', paddingTop: 80 }}>
                        <div className="spin" style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#818cf8', borderRadius: '50%', margin: '0 auto 18px' }}/>
                        <p style={{ color: 'var(--text-muted)' }}>Building your {duration === 'year' ? 'school year curriculum' : duration === 'month' ? 'monthly unit plan' : 'weekly lesson plan'}…</p>
                    </div>
                )}

                {!loading && !plan && !error && (
                    <div style={{ textAlign: 'center', padding: '70px 20px', border: '1px dashed var(--border)', borderRadius: 16, background: 'rgba(255,255,255,0.015)' }}>
                        <Calendar size={52} style={{ margin: '0 auto 18px', opacity: 0.15, display: 'block' }}/>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: 8 }}>No plan yet</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 400, margin: '0 auto' }}>
                            Select a duration above and click Generate. The AI will create a {duration === 'year' ? '10-month school year curriculum' : duration === 'month' ? '4-week monthly unit plan' : '5-day lesson plan'} for your grades.
                        </p>
                    </div>
                )}

                {!loading && plan?.periods && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{durationLabels[plan.duration] || 'Plan'}</h2>
                            <span style={{ padding: '2px 10px', borderRadius: 100, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', fontSize: '0.72rem', fontWeight: 700 }}>{plan.periods.length} {duration === 'week' ? 'days' : duration === 'month' ? 'weeks' : 'months'}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {plan.periods.map((p, i) => <PeriodCard key={i} period={p} index={i} duration={plan.duration}/>)}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TeacherPlanView;
