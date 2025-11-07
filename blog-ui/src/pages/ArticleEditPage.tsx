// src/pages/ArticleEditPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import ENDPOINTS from "../services/endpoints";
import { useAuth } from "../contexts/AuthContext";
import type { ArticleFormValues } from "../components/ArticleForm";

type Article = { id: number; title: string; content: string };

const MIN_TITLE = 3;
const MIN_CONTENT = 10;
const MAX_TITLE = 120;

const ArticleEditPage: React.FC = () => {
    const { id } = useParams();
    const articleId = Number(id);
    const nav = useNavigate();
    const { token } = useAuth();

    const [form, setForm] = useState<ArticleFormValues>({ title: "", content: "" });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const titleErr = useMemo(() => {
        if (!form.title.trim()) return "Title is required";
        if (form.title.trim().length < MIN_TITLE) return `Title must be at least ${MIN_TITLE} chars`;
        if (form.title.trim().length > MAX_TITLE) return `Title must be <= ${MAX_TITLE} chars`;
        return "";
    }, [form.title]);

    const contentErr = useMemo(() => {
        if (!form.content.trim()) return "Content is required";
        if (form.content.trim().length < MIN_CONTENT) return `Content must be at least ${MIN_CONTENT} chars`;
        return "";
    }, [form.content]);

    const isValid = !titleErr && !contentErr;

    useEffect(() => {
        (async () => {
            try {
                const a = await apiFetch<Article>(ENDPOINTS.article(articleId));
                setForm({ title: a.title, content: a.content });
            } catch {
                toast.error("Failed to load article");
                nav(-1);
            } finally {
                setLoading(false);
            }
        })();
    }, [articleId, nav]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!token) {
            toast.error("You must be logged in");
            return;
        }
        if (!isValid) {
            toast.error("Please fix validation errors");
            return;
        }

        setSaving(true);
        try {
            await apiFetch(ENDPOINTS.article(articleId), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: form.title.trim(),
                    content: form.content.trim(),
                }),
            });
            toast.success("Article updated");
            nav(`/articles/${articleId}`);
        } catch {
            toast.error("Failed to update");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="panel" style={{ padding: 24 }}>
                <div className="row" style={{ gap: 12, alignItems: "center" }}>
                    <div className="badge">Loading…</div>
                    <p className="muted" style={{ margin: 0 }}>Fetching article</p>
                </div>
            </div>
        );
    }

    return (
        <div className="panel" style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
            <h2 className="title" style={{ marginBottom: 16 }}>Edit Article</h2>

            <form onSubmit={onSubmit} className="stack" style={{ gap: 12 }}>
                <div className="stack" style={{ gap: 6 }}>
                    <label className="muted" htmlFor="title">
                        Title {form.title.length ? `(${form.title.trim().length}/${MAX_TITLE})` : ""}
                    </label>
                    <input
                        id="title"
                        className={`input ${titleErr ? "error" : ""}`}
                        placeholder="Awesome article title"
                        value={form.title}
                        maxLength={MAX_TITLE + 1}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                    {titleErr && <small className="muted" style={{ color: "var(--danger, #c33)" }}>{titleErr}</small>}
                </div>

                <div className="stack" style={{ gap: 6 }}>
                    <label className="muted" htmlFor="content">Content</label>
                    <textarea
                        id="content"
                        className={`input ${contentErr ? "error" : ""}`}
                        placeholder="Write something meaningful…"
                        rows={10}
                        value={form.content}
                        onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                        style={{ resize: "vertical" }}
                    />
                    {contentErr && <small className="muted" style={{ color: "var(--danger, #c33)" }}>{contentErr}</small>}
                </div>

                <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
                    <button type="button" className="btn ghost" onClick={() => nav(-1)} disabled={saving}>
                        Cancel
                    </button>
                    <button className={`btn primary ${!isValid || saving ? "disabled" : ""}`} disabled={!isValid || saving}>
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ArticleEditPage;
