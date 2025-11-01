import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import { ENDPOINTS } from "../services/endpoints";

type Comment = {
    id: number;
    content: string;
    created_at: string;
    article: number;
    author_id: number;
};

type Props = {
    articleId: number;
};

const CommentsPanel: React.FC<Props> = ({ articleId }) => {
    const [items, setItems] = useState<Comment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [creating, setCreating] = useState<boolean>(false);
    const [content, setContent] = useState<string>("");

    // טוען תגובות לפי מאמר
    const load = async () => {
        setLoading(true);
        try {
            // ליסט לפי פרמטר article
            const url = ENDPOINTS.articleComments(articleId);
            const data = await apiFetch<Comment[]>(url);
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            toast.error("Failed to load comments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [articleId]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = content.trim();
        if (!trimmed) {
            toast("Please write a comment first.");
            return;
        }
        setCreating(true);
        try {
            // יצירה בנתיב המקונן של המאמר
            await apiFetch<Comment>(ENDPOINTS.articleComments(articleId), {
                method: "POST",
                body: JSON.stringify({ content: trimmed }),
            });
            setContent("");
            toast.success("Comment added");
            // לרענן רשימה
            await load();
        } catch (err: any) {
            const detail = err?.detail;
            if (detail?.content?.[0]) {
                toast.error(String(detail.content[0]));
            } else {
                toast.error("Failed to add comment");
            }
        } finally {
            setCreating(false);
        }
    };

    return (
        <section className="panel" style={{ padding: 16, marginTop: 16 }}>
            <h3 className="title" style={{ marginTop: 0 }}>Comments</h3>

            <form onSubmit={onSubmit} className="stack" style={{ gap: 8, marginBottom: 16 }}>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write a comment…"
                    rows={3}
                    className="input"
                    disabled={creating}
                />
                <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                    <button className="btn primary" type="submit" disabled={creating}>
                        {creating ? "Posting…" : "Post comment"}
                    </button>
                </div>
            </form>

            {loading ? (
                <p className="muted">Loading comments…</p>
            ) : items.length === 0 ? (
                <p className="muted">No comments yet.</p>
            ) : (
                <ul className="stack" style={{ gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
                    {items.map((c) => (
                        <li key={c.id} className="panel" style={{ padding: 12 }}>
                            <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                                <strong>#{c.id}</strong>
                                <span className="muted" style={{ fontSize: 12 }}>
                                    {new Date(c.created_at).toLocaleString()}
                                </span>
                            </div>
                            <p style={{ margin: "6px 0 0" }}>{c.content}</p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default CommentsPanel;
