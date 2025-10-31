import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import { ENDPOINTS } from "../services/endpoints";

type User = {
    id: number;
    username: string;
    email?: string;
};

type AuthState = {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, email?: string) => Promise<void>;
    logout: () => void;
};

const AuthCtx = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // טעינת משתמש מ־/api/me/ אם יש טוקן
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { setLoading(false); return; }
        (async () => {
            try {
                const data = await apiFetch<{ user: User }>(ENDPOINTS.me);
                setUser(data.user);
            } catch {
                localStorage.removeItem("token");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const login = async (username: string, password: string) => {
        const data = await apiFetch<{ access: string }>(ENDPOINTS.login, "POST", { username, password });
        localStorage.setItem("token", data.access);
        const me = await apiFetch<{ user: User }>(ENDPOINTS.me);
        setUser(me.user);
    };

    const register = async (username: string, password: string, email?: string) => {
        await apiFetch(ENDPOINTS.register, "POST", { username, password, email });
        await login(username, password);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);

    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
