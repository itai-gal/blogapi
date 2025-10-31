import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";
import { ENDPOINTS } from "../services/endpoints";
import { Link } from "react-router-dom";

type Article = { id: number; title: string; slug: string; likes_count: number; };

function useDebounced(value: string, delay = 300) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return v;
}

const ArticlesListPage: React.FC = () => {
    const [items, setItems] = useState<Article[]>([]);
    const [q, setQ] = useState("");
    const qd = useDebounced(q, 350);

    useEffect(() => {
        (async () => {
            const url = qd ? `${ENDPOINTS.articles}?search=${encodeURIComponent(qd)}` : ENDPOINTS.articles;
            const data = await apiFetch<{ results?: Article[]; count?: number } | Article[]>(url);
            const arr = Array.isArray(data) ? data : data.results || [];
            setItems(arr);
        })();
    }, [qd]);

    const header = useMemo(() => (
        <div className="panel stack" style={{ marginBottom: 16 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
                <h2 className="title" style={{ margin: 0 }}>Articles</h2>
                <span className="badge">Total: {items.length}</span>
            </div>
            <input className="input" placeholder="Search articles..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
    ), [q, items.length]);

    return (
        <>
            {header}
            <div className="grid">
                {items.map(a => (
                    <Link to={`/articles/${a.id}`} key={a.id} className="card" style={{ padding: 16, textDecoration: "none" }}>
                        <h3 className="title">{a.title}</h3>
                        <p className="muted">❤ {a.likes_count ?? 0}</p>
                    </Link>
                ))}
                {!items.length && (
                    <div className="panel" style={{ padding: 24 }}>
                        <div className="stack">
                            <h3 className="title" style={{ margin: 0 }}>No results</h3>
                            <p className="muted">Try a different search query.</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ArticlesListPage;
