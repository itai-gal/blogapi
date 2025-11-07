// src/pages/ArticleCreatePage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import ENDPOINTS from "../services/endpoints";
import { useAuth } from "../contexts/AuthContext";
import type { ArticleFormValues } from "../components/ArticleForm";

type CreatePayload = {
    title: string;
    content: string;
};

const MIN_TITLE = 3;
const MIN_CONTENT = 10;
const MAX_TITLE = 120;

const ArticleCreatePage: React.FC = () => {
    const nav = useNavigate();
    const { token } = useAuth();

    const [form, setForm] = useState<CreatePayload>({ title: "", content: "" });
    const [submitting, setSubmitting] = useState(false);

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

        setSubmitting(true);
        try {
            const created = await apiFetch<{ id: number }>(ENDPOINTS.articles, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: form.title.trim(),
                    content: form.content.trim(),
                }),
            });

            toast.success("Article created");
            if (created?.id) {
                nav(`/articles/${created.id}`);
            } else {
                nav("/");
            }
        } catch (err: any) {
            const msg =
                typeof err?.message === "string" && err.message.startsWith("HTTP ")
                    ? err.message === "HTTP 401"
                        ? "Unauthorized – please login"
                        : "Failed to create article"
                    : "Failed to create article";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="panel" style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
            <h2 className="title" style={{ marginBottom: 16 }}>Create Article</h2>

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
                    <button
                        type="button"
                        className="btn ghost"
                        onClick={() => nav(-1)}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        className={`btn primary ${!isValid || submitting ? "disabled" : ""}`}
                        disabled={!isValid || submitting}
                    >
                        {submitting ? "Creating…" : "Create"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ArticleCreatePage;
