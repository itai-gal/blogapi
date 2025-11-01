import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import { ENDPOINTS } from "../services/endpoints";

type Article = {
    id: number;
    title: string;
    content: string;
    likes_count?: number;
    tag_names?: string[];
};

type PagedResponse<T> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
};

const ArticlesListPage: React.FC = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(false);

    const fetchedOnce = useRef(false);

    const load = async (pageNum = 1) => {
        setLoading(true);
        try {
            const url = `${ENDPOINTS.articles}?page=${pageNum}`;
            const data = await apiFetch<PagedResponse<Article> | Article[]>(url);

            if (Array.isArray(data)) {
                setArticles(data);
                setHasMore(false);
            } else {
                setArticles(data.results);
                setHasMore(Boolean(data.next));
            }
        } catch {
            toast.error("Failed to load articles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (fetchedOnce.current) return;
        fetchedOnce.current = true;
        load(1);
    }, []);

    const onNext = () => {
        if (!hasMore) return;
        const next = page + 1;
        setPage(next);
        load(next);
    };

    const onPrev = () => {
        if (page <= 1) return;
        const prev = page - 1;
        setPage(prev);
        load(prev);
    };

    return (
        <div className="stack" style={{ gap: 16 }}>
            <div className="panel" style={{ padding: 16 }}>
                <div
                    className="row"
                    style={{ justifyContent: "space-between", alignItems: "center" }}
                >
                    <h2 className="title" style={{ margin: 0 }}>
                        Articles
                    </h2>
                    <div className="row" style={{ gap: 8 }}>
                        <button className="btn ghost" onClick={() => load(page)} disabled={loading}>
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="panel" style={{ padding: 24 }}>
                    <div className="row" style={{ gap: 10, alignItems: "center" }}>
                        <div className="badge">Loading…</div>
                        <span className="muted">Fetching articles</span>
                    </div>
                </div>
            )}

            {!loading && articles.length === 0 && (
                <div className="panel" style={{ padding: 24 }}>
                    <p className="muted" style={{ margin: 0 }}>
                        No articles yet.
                    </p>
                </div>
            )}

            <div
                className="grid"
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 16,
                }}
            >
                {articles.map((a) => (
                    <Link key={a.id} to={`/articles/${a.id}`} className="card link" style={{ textDecoration: "none" }}>
                        <div className="panel" style={{ padding: 16, height: "100%" }}>
                            <h3 className="title" style={{ marginTop: 0, marginBottom: 8 }}>
                                {a.title}
                            </h3>
                            <p className="muted" style={{ marginTop: 0, marginBottom: 12 }}>
                                {a.content.length > 120 ? a.content.slice(0, 120) + "…" : a.content}
                            </p>
                            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                                <span className="badge">{a.likes_count ?? 0} ❤</span>
                                {a.tag_names && a.tag_names.length > 0 && (
                                    <span className="muted" style={{ fontSize: 12 }}>
                                        {a.tag_names.join(", ")}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="row" style={{ gap: 8, justifyContent: "center" }}>
                <button className="btn ghost" onClick={onPrev} disabled={loading || page <= 1}>
                    Prev
                </button>
                <div className="badge">Page {page}</div>
                <button className="btn ghost" onClick={onNext} disabled={loading || !hasMore}>
                    Next
                </button>
            </div>
        </div>
    );
};

export default ArticlesListPage;
