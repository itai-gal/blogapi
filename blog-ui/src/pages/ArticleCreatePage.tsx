import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../services/api";
import ENDPOINTS from "../services/endpoints";
import { useAuth } from "../contexts/AuthContext";


type ArticleDTO = {
    id: number;
    title: string;
    content: string;
    slug?: string;
    created_at?: string;
    updated_at?: string;
};

type FormState = {
    title: string;
    content: string;
};

type FieldErrors = Record<string, string[]>;

const ArticleCreatePage: React.FC = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState<FormState>({ title: "", content: "" });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [apiError, setApiError] = useState<string | null>(null);

    // Build endpoint (POST to /api/articles/)
    const createUrl = useMemo(() => ENDPOINTS.articles, []);

    const onChange =
        (field: keyof FormState) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                setForm((prev) => ({ ...prev, [field]: e.target.value }));
                // Clear field-level error as user edits
                if (errors[field]) {
                    setErrors((prev) => {
                        const next = { ...prev };
                        delete next[field];
                        return next;
                    });
                }
            };

    const validateClient = (): boolean => {
        const next: FieldErrors = {};
        if (!form.title.trim()) next.title = ["Title is required."];
        if (!form.content.trim()) next.content = ["Content is required."];
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError(null);

        // Client-side quick validation
        if (!validateClient()) return;

        setSubmitting(true);
        try {
            const body = {
                title: form.title.trim(),
                content: form.content.trim(),
            };

            const created = await apiFetch<ArticleDTO>(createUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(body),
            });

            // Defensive: ensure we have a numeric id
            const newId = Number((created as any)?.id);
            if (!newId || Number.isNaN(newId)) {
                // If the serializer didn't return id, fall back to list page
                console.warn("Create succeeded but response missing numeric id:", created);
                navigate("/articles", { replace: true });
                return;
            }

            // Navigate to details page of the newly created article
            navigate(`/articles/${newId}`, { replace: true });
        } catch (err: any) {
            // apiFetch throws with parsed json if available -> might be {field: ["error", ...]}
            if (err && typeof err === "object") {
                // DRF field errors
                const fieldErrs: FieldErrors = {};
                let hasFieldErrors = false;
                for (const k of Object.keys(err)) {
                    const val = (err as any)[k];
                    if (Array.isArray(val)) {
                        fieldErrs[k] = val.map(String);
                        hasFieldErrors = true;
                    }
                }
                if (hasFieldErrors) {
                    setErrors(fieldErrs);
                } else if (err.detail) {
                    setApiError(String(err.detail));
                } else {
                    setApiError("Failed to create article. Please try again.");
                }
            } else {
                setApiError("Failed to create article. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="stack" style={{ gap: 12 }}>
            <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ margin: 0 }}>Create Article</h2>
                <Link className="btn ghost" to="/">Back to list</Link>
            </div>

            <form className="panel stack" style={{ gap: 12, padding: 16 }} onSubmit={onSubmit} noValidate>
                {/* Global API error */}
                {apiError && (
                    <div className="badge danger" role="alert">
                        {apiError}
                    </div>
                )}

                <div className="stack" style={{ gap: 6 }}>
                    <label htmlFor="title"><strong>Title</strong></label>
                    <input
                        id="title"
                        className={`input ${errors.title ? "input-error" : ""}`}
                        placeholder="Enter a title…"
                        value={form.title}
                        onChange={onChange("title")}
                        disabled={submitting}
                    />
                    {errors.title && (
                        <ul className="muted" style={{ margin: 0, paddingLeft: 18 }}>
                            {errors.title.map((m, i) => (
                                <li key={i}>{m}</li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="stack" style={{ gap: 6 }}>
                    <label htmlFor="content"><strong>Content</strong></label>
                    <textarea
                        id="content"
                        className={`input ${errors.content ? "input-error" : ""}`}
                        placeholder="Write your article content…"
                        value={form.content}
                        onChange={onChange("content")}
                        rows={10}
                        disabled={submitting}
                    />
                    {errors.content && (
                        <ul className="muted" style={{ margin: 0, paddingLeft: 18 }}>
                            {errors.content.map((m, i) => (
                                <li key={i}>{m}</li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="row" style={{ gap: 8 }}>
                    <button
                        type="submit"
                        className="btn primary"
                        disabled={submitting || !form.title.trim() || !form.content.trim()}
                    >
                        {submitting ? "Creating…" : "Create"}
                    </button>
                    <Link className="btn ghost" to="/">Cancel</Link>
                </div>

                {/* Small helper text */}
                <p className="muted" style={{ margin: 0 }}>
                    Note: author is set on the server from your authenticated user; slug is auto-generated.
                </p>
            </form>
        </div>
    );
};

export default ArticleCreatePage;
