import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import ENDPOINTS from "../services/endpoints";
import { useAuth } from "../contexts/AuthContext";

type Article = {
    id: number;
    title: string;
    content: string;
    likes_count?: number;
    user_liked?: boolean;
    created_at?: string;
    updated_at?: string;
};

type Page<T> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
};

const Heart: React.FC<{ filled?: boolean; size?: number }> = ({ filled, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path
            d="M12.1 21.35l-1.1-1.02C5.14 14.88 2 12.06 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.73 3.96 1.9C11.38 4.73 12.88 4 14.42 4 16.92 4 18.92 6 18.92 8.5c0 3.56-3.14 6.38-8.99 11.83l-.83.77z"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
        />
    </svg>
);

const ORDERING_OPTIONS = [
    { v: "-created_at", label: "Newest" },
    { v: "created_at", label: "Oldest" },
    { v: "-likes_count", label: "Most liked" },
    { v: "title", label: "Title A→Z" },
];

const ArticlesListPage: React.FC = () => {
    const { token } = useAuth();
    const [params, setParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState<Page<Article>>({ count: 0, next: null, previous: null, results: [] });

    const query = params.get("search") ?? "";
    const ordering = params.get("ordering") ?? "-created_at";
    const pageNum = params.get("page") ?? "1";

    const url = useMemo(() => {
        const u = new URL(ENDPOINTS.articles, window.location.origin);
        if (query) u.searchParams.set("search", query);
        if (ordering) u.searchParams.set("ordering", ordering);
        if (pageNum) u.searchParams.set("page", pageNum);
        return u.pathname + "?" + u.searchParams.toString();
    }, [query, ordering, pageNum]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await apiFetch<Page<Article>>(url, {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
                // in case of non-paginated response
                if (Array.isArray((res as any))) {
                    setPage({ count: (res as any).length, next: null, previous: null, results: res as any });
                } else {
                    setPage(res);
                }
            } catch {
                setPage({ count: 0, next: null, previous: null, results: [] });
            } finally {
                setLoading(false);
            }
        })();
    }, [url, token]);

    const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        const next = new URLSearchParams(params);
        if (v) next.set("search", v); else next.delete("search");
        next.set("page", "1");
        setParams(next);
    };

    const onOrderingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const next = new URLSearchParams(params);
        next.set("ordering", e.target.value);
        next.set("page", "1");
        setParams(next);
    };

    const go = (href: string | null) => {
        if (!href) return;
        const u = new URL(href, window.location.origin);
        setParams(u.searchParams);
    };

    return (
        <div className="stack" style={{ gap: 12 }}>
            <div className="panel" style={{ padding: 16 }}>
                <div className="row" style={{ gap: 12, alignItems: "center" }}>
                    <input
                        className="input"
                        placeholder="Search articles…"
                        value={query}
                        onChange={onSearchChange}
                        style={{ maxWidth: 280 }}
                    />
                    <select className="input" value={ordering} onChange={onOrderingChange}>
                        {ORDERING_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                    </select>
                    <Link className="btn primary" to="/articles/new">New Article</Link>
                </div>
            </div>

            {loading && (
                <div className="panel" style={{ padding: 16 }}>
                    <div className="row" style={{ gap: 8, alignItems: "center" }}>
                        <div className="badge">Loading…</div>
                        <span className="muted">Fetching articles</span>
                    </div>
                </div>
            )}

            {!loading && page.results.length === 0 && (
                <div className="panel" style={{ padding: 16 }}>
                    <p className="muted" style={{ margin: 0 }}>No articles found.</p>
                </div>
            )}

            {!loading && page.results.length > 0 && (
                <div className="stack" style={{ gap: 8 }}>
                    {page.results.map(a => (
                        <div key={a.id} className="panel row" style={{ padding: 16, justifyContent: "space-between" }}>
                            <div className="stack" style={{ gap: 6 }}>
                                <Link className="link" to={`/articles/${a.id}`}>
                                    <strong>{a.title}</strong>
                                </Link>
                                <p className="muted" style={{ margin: 0 }}>
                                    {(a.content || "").slice(0, 120)}{(a.content || "").length > 120 ? "…" : ""}
                                </p>
                            </div>
                            <div className="row" style={{ gap: 8, alignItems: "center" }}>
                                <Heart filled={!!a.user_liked} />
                                <span className="muted">{a.likes_count ?? 0}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="row" style={{ gap: 8, justifyContent: "center" }}>
                <button className="btn ghost" onClick={() => go(page.previous)} disabled={!page.previous}>Prev</button>
                <button className="btn ghost" onClick={() => go(page.next)} disabled={!page.next}>Next</button>
            </div>
        </div>
    );
};

export default ArticlesListPage;
