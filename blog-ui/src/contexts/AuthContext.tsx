import React, { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import { ENDPOINTS } from "../services/endpoints";

type User = { id: number; username: string; email?: string };
type AuthContextValue = {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, email?: string) => Promise<void>;
    logout: () => void;
    me: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);
export const useAuth = () => useContext(AuthContext);

const TOKEN_KEY = "access_token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // טוען משתמש אם יש טוקן
    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem(TOKEN_KEY);
                if (!token) return;
                await me();
            } catch { }
            finally {
                setLoading(false);
            }
        })();
    }, []);

    const me = async () => {
        const res = await apiFetch<{ user: User }>(ENDPOINTS.me, { method: "GET" });
        setUser(res.user);
    };

    const login = async (username: string, password: string) => {
        const tokens = await apiFetch<{ access: string; refresh: string }>(ENDPOINTS.tokenObtain, {
            method: "POST",
            body: JSON.stringify({ username, password }),
        });
        localStorage.setItem(TOKEN_KEY, tokens.access);
        await me();
        toast.success("Logged in");
    };

    const register = async (username: string, password: string, email?: string) => {
        await apiFetch(ENDPOINTS.register, {
            method: "POST",
            body: JSON.stringify({ username, password, email }),
        });
        await login(username, password);
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        toast.success("Logged out");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, me }}>
            {children}
        </AuthContext.Provider>
    );
};
