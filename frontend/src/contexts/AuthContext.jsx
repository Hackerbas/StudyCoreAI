import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/check_auth')
            .then(res => { if (res.ok) return res.json(); throw new Error('Not authenticated'); })
            .then(data => { if (data.authenticated) setUser({ username: data.username, role: data.role, grade_level: data.grade_level }); })
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const login = async (username, password) => {
        const res  = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, password }) });
        const data = await res.json();
        if (res.ok) { setUser({ username: data.username, role: data.role, grade_level: data.grade_level }); return { success: true }; }
        return { success: false, error: data.error };
    };

    const loginAsGuest = async () => {
        const res  = await fetch('/api/guest', { method: 'POST' });
        const data = await res.json();
        if (res.ok) { setUser({ username: 'Guest', role: 'Guest', grade_level: null, isGuest: true }); return { success: true }; }
        return { success: false, error: data.error };
    };

    const register = async (username, password, role, gradeLevel, dob) => {
        const res  = await fetch('/api/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, password, role, grade_level: gradeLevel, dob }) });
        const data = await res.json();
        return res.ok ? { success: true } : { success: false, error: data.error };
    };

    const logout = async () => {
        await fetch('/api/logout', { method: 'POST' });
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, loginAsGuest, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
