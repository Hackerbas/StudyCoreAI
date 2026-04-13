import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, UserPlus, Eye, EyeOff } from 'lucide-react';

const GRADE_OPTIONS = [
    { value: 8, label: 'Grade 8' }, { value: 9, label: 'Grade 9' },
    { value: 10, label: 'Grade 10' }, { value: 11, label: 'Grade 11' },
    { value: 12, label: 'Grade 12' }, { value: 13, label: 'University / Other' }
];

const Register = () => {
    const [form, setForm] = useState({ username: '', password: '', role: 'Student', grade_level: '8', dob: '', teacher_password: '' });
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        const result = await register(form.username, form.password, form.role, form.role === 'Student' ? form.grade_level : null, form.dob || null, form.role === 'Teacher' ? form.teacher_password : null);
        if (result.success) { setSuccess(true); setTimeout(() => navigate('/login'), 1500); }
        else { setError(result.error || 'Registration failed'); setLoading(false); }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
            <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }}/>
            <div className="glass animate-fade-up" style={{ width: '100%', maxWidth: 460, padding: '40px 36px', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 28px rgba(99,102,241,0.4)' }}>
                        <BookOpen size={24} color="white"/>
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Create your account</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Join Teacher Assist and start learning smarter</p>
                </div>

                {success && (
                    <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80', fontSize: '0.85rem', textAlign: 'center' }}>
                        ✓ Account created! Redirecting to login…
                    </div>
                )}
                {error && (
                    <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '0.85rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Username</label>
                        <input className="input-field" type="text" value={form.username} onChange={e=>set('username',e.target.value)} placeholder="Pick a username" required style={{ padding: '12px 16px' }}/>
                    </div>

                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input className="input-field" type={showPw ? 'text' : 'password'} value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Choose a strong password" required style={{ padding: '12px 48px 12px 16px' }}/>
                            <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                        </div>
                    </div>

                    {/* Role Selector */}
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>I am a…</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {['Student', 'Teacher'].map(role => (
                                <button key={role} type="button" onClick={() => set('role', role)} style={{
                                    padding: '12px', borderRadius: 10, fontFamily: 'inherit', fontWeight: 600, fontSize: '0.9rem',
                                    border: `1px solid ${form.role === role ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
                                    background: form.role === role ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)',
                                    color: form.role === role ? '#818cf8' : 'var(--text-secondary)',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}>
                                    {role === 'Student' ? '🎓' : '📚'} {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    {form.role === 'Student' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grade Level</label>
                                <select className="input-field" value={form.grade_level} onChange={e=>set('grade_level',e.target.value)} style={{ padding: '11px 14px', background: 'rgba(255,255,255,0.04)', color:'white' }}>
                                    {GRADE_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date of Birth</label>
                                <input className="input-field" type="date" value={form.dob} onChange={e=>set('dob',e.target.value)} style={{ padding: '11px 14px', colorScheme: 'dark' }}/>
                            </div>
                        </div>
                    )}
                    
                    {form.role === 'Teacher' && (
                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Teacher Access Code</label>
                            <input className="input-field" type="password" value={form.teacher_password} onChange={e=>set('teacher_password',e.target.value)} placeholder="Required for Teacher accounts" required style={{ padding: '12px 16px' }}/>
                        </div>
                    )}

                    <button type="submit" disabled={loading || success} className="btn-gradient" style={{ padding: '13px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                        {loading ? <span className="spin" style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%' }}/> : <><UserPlus size={16}/>Create Account</>}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
