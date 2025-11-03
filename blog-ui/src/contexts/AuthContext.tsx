import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { apiFetch } from "../services/api";
import ENDPOINTS from "../services/endpoints";

type Me = {
    user: { id: number; username: string; email?: string | null };
    profile: { id: number; bio: string; created_at: string };
};

type AuthContextValue = {
    user: Me["user"] | null;
    token: string | null;
    login: (username: string, password: string) => Promise<void>;
    register: (
        username: string,
        password: string,
        email?: string | null
    ) => Promise<void>;
    logout: () => void;
    refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem("access") || null
    );
    const [user, setUser] = useState<Me["user"] | null>(null);

    useEffect(() => {
        if (!token) {
            setUser(null);
            return;
        }
        // load /auth/me with Authorization Bearer
        refreshMe().catch(() => {
            localStorage.removeItem("access");
            setToken(null);
            setUser(null);
        });
    }, [token]);

    async function refreshMe() {
        if (!token) return;
        const me = await apiFetch<Me>(ENDPOINTS.me, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });
        setUser(me.user);
    }

    async function login(username: string, password: string) {
        const res = await apiFetch<{ access: string; refresh: string }>(
            ENDPOINTS.tokenObtain,
            {
                method: "POST",
                body: JSON.stringify({
                    username: username.trim(),
                    password,
                }),
            }
        );
        localStorage.setItem("access", res.access);
        setToken(res.access);
        await refreshMe();
    }

    async function register(
        username: string,
        password: string,
        email?: string | null
    ) {
        const trimmedUsername = (username ?? "").trim();
        const trimmedEmail =
            email && typeof email === "string" ? email.trim() : "";

        // Registration is done against /api/auth/ (AuthViewSet.create)
        await apiFetch(ENDPOINTS.register, {
            method: "POST",
            body: JSON.stringify({
                username: trimmedUsername,
                password,
                ...(trimmedEmail ? { email: trimmedEmail } : {}),
            }),
        });

        // Automatic login after successful registration
        await login(trimmedUsername, password);
    }

    function logout() {
        localStorage.removeItem("access");
        setToken(null);
        setUser(null);
    }

    const value = useMemo<AuthContextValue>(
        () => ({ user, token, login, register, logout, refreshMe }),
        [user, token]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
}

export default AuthProvider;
