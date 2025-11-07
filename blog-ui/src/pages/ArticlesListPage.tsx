import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import ENDPOINTS from "../services/endpoints";
import { useAuth } from "../contexts/AuthContext";
import { useLikes } from "../contexts/LikesContext";

type Article = { id: number; title: string; content: string; likes_count?: number };
type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };
type MaybeArray<T> = T[] | Paginated<T> | { items?: T[] } | unknown;

const isArr = Array.isArray;

function normalizeArticles(payload: MaybeArray<Article>): Article[] {
    if (isArr(payload)) return payload as Article[];
    if (payload && typeof payload === "object") {
        const obj = payload as Record<string, unknown>;
        if (isArr(obj.results as unknown[])) return obj.results as Article[];
        if (isArr(obj.items as unknown[])) return obj.items as Article[];
    }
    return [];
}

const ArticlesListPage: React.FC = () => {
    const { token } = useAuth();
    const { has, refreshLikes } = useLikes();

    const [items, setItems] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [badShape, setBadShape] = useState<null | string>(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            setBadShape(null);
            try {
                const res = await apiFetch<MaybeArray<Article>>(ENDPOINTS.articles, {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
                const arr = normalizeArticles(res);
                if (!isArr(arr)) {
                    setBadShape("Response is not an array");
                    if (alive) setItems([]);
                } else if (alive) {
                    setItems(arr);
                }
            } catch {
                toast.error("Failed to load articles");
                if (alive) {
                    setItems([]);
                    setBadShape("Network or server error");
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [token]);

    useEffect(() => {
        if (!token) return;
        refreshLikes().catch(() => { });
    }, [token, refreshLikes]);

    const list = useMemo(() => (isArr(items) ? items : []), [items]);

    if (loading) {
        return (
            <div className="panel" style={{ padding: 24 }}>
                <div className="row" style={{ gap: 12, alignItems: "center" }}>
                    <div className="badge">Loading…</div>
                    <p className="muted" style={{ margin: 0 }}>Fetching articles</p>
                </div>
            </div>
        );
    }

    if (badShape) {
        return (
            <div className="panel" style={{ padding: 24 }}>
                <h3 className="title" style={{ marginTop: 0 }}>Unexpected response</h3>
                <p className="muted" style={{ marginBottom: 8 }}>{badShape}</p>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.8 }}>
                    {`Make sure /api/articles/ returns an array or `}
                    {"{ results: [...] }"}
                    {`.`}
                </pre>
            </div>
        );
    }

    if (!list.length) {
        return (
            <div className="panel" style={{ padding: 24 }}>
                <h3 className="title" style={{ marginTop: 0 }}>No articles yet</h3>
                <p className="muted" style={{ marginBottom: 0 }}>Create one to get started.</p>
            </div>
        );
    }

    return (
        <div className="stack" style={{ gap: 12 }}>
            {list.map((a) => {
                const liked = has(a.id);
                return (
                    <div key={a.id} className="panel" style={{ padding: 16 }}>
                        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                            <Link to={`/articles/${a.id}`} className="link">
                                <h3 className="title" style={{ margin: 0 }}>{a.title}</h3>
                            </Link>
                            <div className="row" style={{ gap: 8, alignItems: "center" }}>
                                <span className={`badge ${liked ? "primary" : ""}`} title="Your like">
                                    {liked ? "♥ Liked" : "♡"}
                                </span>
                                <span className="muted" title="Likes count">{a.likes_count ?? 0}</span>
                            </div>
                        </div>
                        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
                            {a.content.length > 140 ? a.content.slice(0, 140) + "…" : a.content}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};

export default ArticlesListPage;
