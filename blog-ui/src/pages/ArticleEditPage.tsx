import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import { ENDPOINTS } from "../services/endpoints";
import { useAuth } from "../contexts/AuthContext";

type Tag = { id: number; name: string };
type Article = {
    id: number;
    title: string;
    content: string;
    tags?: number[];
    author_id: number;
};

const ArticleEditPage: React.FC = () => {
    const { user } = useAuth();
    const nav = useNavigate();
    const params = useParams();
    const id = Number(params.id);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<Tag[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

    useEffect(() => {
        (async () => {
            try {
                // טען תגיות
                const tagsUrl = (ENDPOINTS as any).tags;
                if (tagsUrl) {
                    const allTags = await apiFetch<Tag[]>(tagsUrl);
                    setTags(Array.isArray(allTags) ? allTags : []);
                } else {
                    // לא חוסם עריכה אם אין תגיות
                    setTags([]);
                }
            } catch {
                // לא חוסם עריכה אם אין תגיות
                setTags([]);
            }

            try {
                // טען מאמר
                const a = await apiFetch<Article>(ENDPOINTS.article(id));
                if (user && a.author_id !== user.id) {
                    toast("You can only edit your own article");
                    return nav(`/articles/${a.id}`);
                }
                setTitle(a.title ?? "");
                setContent(a.content ?? "");
                setSelectedTagIds(Array.isArray((a as any).tags) ? (a as any).tags : []);
            } catch {
                toast.error("Failed to load article");
                return nav("/");
            } finally {
                setLoading(false);
            }
        })();
    }, [id, nav, user]);

    const toggleTag = (tid: number) => {
        setSelectedTagIds(prev =>
            prev.includes(tid) ? prev.filter(x => x !== tid) : [...prev, tid]
        );
    };

    const onSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const t = title.trim();
        const c = content.trim();
        if (!t || !c) {
            toast("Title & content are required");
            return;
        }
        setSaving(true);
        try {
            const payload = { title: t, content: c, tags: selectedTagIds };
            await apiFetch<Article>(ENDPOINTS.article(id), {
                method: "PUT",
                body: JSON.stringify(payload),
            });
            toast.success("Article updated");
            nav(`/articles/${id}`);
        } catch (err: any) {
            const d = err?.detail;
            if (d?.title?.[0]) return toast.error(String(d.title[0]));
            if (d?.content?.[0]) return toast.error(String(d.content[0]));
            toast.error("Update failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="panel" style={{ padding: 20 }}>
                <div className="row" style={{ gap: 12, alignItems: "center" }}>
                    <div className="badge">Loading…</div>
                    <p className="muted" style={{ margin: 0 }}>Fetching article</p>
                </div>
            </div>
        );
    }

    return (
        <div className="stack" style={{ gap: 12 }}>
            <div className="panel" style={{ padding: 20 }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <h2 className="title" style={{ margin: 0 }}>Edit Article</h2>
                    <Link className="btn ghost" to={`/articles/${id}`}>Back</Link>
                </div>

                <form onSubmit={onSave} className="stack" style={{ gap: 10, marginTop: 12 }}>
                    <input
                        className="input"
                        placeholder="Title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        disabled={saving}
                    />
                    <textarea
                        className="input"
                        placeholder="Content"
                        rows={8}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        disabled={saving}
                    />

                    <div className="panel" style={{ padding: 12 }}>
                        <strong>Tags</strong>
                        <div className="row" style={{ flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                            {tags.map(t => {
                                const active = selectedTagIds.includes(t.id);
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        className={`badge ${active ? "primary" : ""}`}
                                        onClick={() => toggleTag(t.id)}
                                        aria-pressed={active}
                                        title={t.name}
                                    >
                                        {t.name}
                                    </button>
                                );
                            })}
                            {tags.length === 0 && <span className="muted">No tags</span>}
                        </div>
                    </div>

                    <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                        <Link className="btn" to={`/articles/${id}`}>Cancel</Link>
                        <button className="btn primary" type="submit" disabled={saving}>
                            {saving ? "Saving…" : "Save changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ArticleEditPage;
