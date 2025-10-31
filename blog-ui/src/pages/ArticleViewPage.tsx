import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import { ENDPOINTS } from "../services/endpoints";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

type Article = { id: number; title: string; content: string; likes_count: number; };
type Comment = { id: number; content: string; created_at: string; author_id: number; };

const ArticleViewPage: React.FC = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [a, setA] = useState<Article | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [text, setText] = useState("");

    useEffect(() => {
        (async () => {
            const art = await apiFetch<Article>(ENDPOINTS.article(id!));
            setA(art);
            const cs = await apiFetch<Comment[]>(ENDPOINTS.articleComments(id!));
            setComments(cs);
        })();
    }, [id]);

    const addComment = async () => {
        const content = text.trim();
        if (!content) return toast.error("Comment cannot be empty");
        try {
            const c = await apiFetch<Comment>(ENDPOINTS.articleComments(id!), "POST", { content });
            setComments(prev => [...prev, c]);
            setText("");
            toast.success("Comment added");
        } catch {
            toast.error("Failed to add comment");
        }
    };

    return (
        <div className="stack">
            {a && (
                <article className="panel stack">
                    <div className="row" style={{ justifyContent: "space-between" }}>
                        <h2 className="title" style={{ margin: 0 }}>{a.title}</h2>
                        <span className="badge">❤ {a.likes_count ?? 0}</span>
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{a.content}</div>
                </article>
            )}

            <section className="panel stack">
                <h3 className="title" style={{ margin: 0 }}>Comments</h3>
                <div className="stack">
                    {comments.map(c => (
                        <div key={c.id} className="card" style={{ padding: 12 }}>
                            <div className="row" style={{ justifyContent: "space-between" }}>
                                <span className="muted">User #{c.author_id}</span>
                                <span className="muted">{new Date(c.created_at).toLocaleString()}</span>
                            </div>
                            <div style={{ marginTop: 8 }}>{c.content}</div>
                        </div>
                    ))}
                    {!comments.length && <p className="muted">No comments yet.</p>}
                </div>

                {user && (
                    <div className="row" style={{ marginTop: 10 }}>
                        <input className="input" value={text} onChange={e => setText(e.target.value)} placeholder="Add a comment…" />
                        <button className="btn" onClick={addComment}>Add</button>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ArticleViewPage;
