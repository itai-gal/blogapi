import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import ENDPOINTS from "../services/endpoints";
import { useAuth } from "./AuthContext";

type LikeRow = { id: number; article: number; user: number };
type LikesMap = Record<number, true>;

export type LikesContextValue = {
    has: (articleId: number) => boolean;
    setLocalLike: (articleId: number, liked: boolean) => void;
    refreshLikes: () => Promise<void>;
};

const LikesContext = createContext<LikesContextValue | undefined>(undefined);

export const LikesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token } = useAuth();
    const [likes, setLikes] = useState<LikesMap>({});

    const has = useCallback((articleId: number) => !!likes[articleId], [likes]);

    const setLocalLike = useCallback((articleId: number, liked: boolean) => {
        setLikes((prev) => {
            const next = { ...prev };
            if (liked) next[articleId] = true;
            else delete next[articleId];
            return next;
        });
    }, []);

    const refreshLikes = useCallback(async () => {
        if (!token) {
            setLikes({});
            return;
        }
        const url = `${ENDPOINTS.postUserLikes}?mine=1`;
        const rows = await apiFetch<LikeRow[]>(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const map: LikesMap = {};
        if (Array.isArray(rows)) {
            for (const r of rows) map[r.article] = true;
        }
        setLikes(map);
    }, [token]);

    const value = useMemo(() => ({ has, setLocalLike, refreshLikes }), [has, setLocalLike, refreshLikes]);

    return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>;
};

export function useLikes(): LikesContextValue {
    const ctx = useContext(LikesContext);
    if (!ctx) throw new Error("useLikes must be used within LikesProvider");
    return ctx;
}
