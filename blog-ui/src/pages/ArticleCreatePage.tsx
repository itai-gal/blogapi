import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import { ENDPOINTS } from "../services/endpoints";

type Tag = { id: number; name: string };
type Article = { id: number };

const ArticleCreatePage: React.FC = () => {
    const nav = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<Tag[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // new tag inline
    const [newTagName, setNewTagName] = useState("");
    const [creatingTag, setCreatingTag] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch<Tag[]>((ENDPOINTS as any).tags ?? "/tags");
                setTags(Array.isArray(data) ? data : []);
            } catch {
                toast.error("Failed to load tags");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toggleTag = (id: number) => {
        setSelectedTagIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const onCreateArticle = async (e: React.FormEvent) => {
        e.preventDefault();
        const t = title.trim();
        const c = content.trim();
        if (!t || !c) {
            toast("Title & content are required");
            return;
        }
        setCreating(true);
        try {
            const payload = { title: t, content: c, tags: selectedTagIds };
            const res = await apiFetch<Article>(ENDPOINTS.articles, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            toast.success("Article published");
            nav(`/articles/${res.id}`);
        } catch (err: any) {
            const d = err?.detail;
            if (d?.title?.[0]) return toast.error(String(d.title[0]));
            if (d?.content?.[0]) return toast.error(String(d.content[0]));
            toast.error("Failed to publish");
        } finally {
            setCreating(false);
        }
    };

    const onCreateTag = async () => {
        const name = newTagName.trim();
        if (!name) {
            toast("Type a tag name");
            return;
        }
        setCreatingTag(true);
        try {
            const t = await apiFetch<Tag>((ENDPOINTS as any).tags ?? "/tags", {
                method: "POST",
                body: JSON.stringify({ name }),
            });
            setTags(prev => [...prev, t]);
            setSelectedTagIds(prev => [...prev, t.id]);
            setNewTagName("");
            toast.success("Tag created");
        } catch (e: any) {
            const d = e?.detail;
            if (d?.name?.[0]) return toast.error(String(d.name[0]));
            toast.error("Failed to create tag");
        } finally {
            setCreatingTag(false);
        }
    };

    return (
        <div className="stack" style={{ gap: 12 }}>
            <div className="panel" style={{ padding: 20 }}>
                <h2 className="title" style={{ marginTop: 0 }}>New Article</h2>
                <form onSubmit={onCreateArticle} className="stack" style={{ gap: 10 }}>
                    <input
                        className="input"
                        placeholder="Title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        disabled={creating}
                    />
                    <textarea
                        className="input"
                        placeholder="Content"
                        rows={8}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        disabled={creating}
                    />

                    <div className="panel" style={{ padding: 12 }}>
                        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                            <strong>Tags</strong>
                            <div className="row" style={{ gap: 8 }}>
                                <input
                                    className="input"
                                    style={{ width: 180 }}
                                    placeholder="New tag…"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    disabled={creatingTag}
                                />
                                <button
                                    type="button"
                                    className="btn ghost"
                                    onClick={onCreateTag}
                                    disabled={creatingTag}
                                >
                                    {creatingTag ? "Adding…" : "+ Add"}
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <p className="muted" style={{ marginTop: 8 }}>Loading tags…</p>
                        ) : (
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
                                {tags.length === 0 && <span className="muted">No tags yet.</span>}
                            </div>
                        )}
                    </div>

                    <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                        <button className="btn" type="button" onClick={() => nav(-1)} disabled={creating}>
                            Cancel
                        </button>
                        <button className="btn primary" type="submit" disabled={creating}>
                            {creating ? "Publishing…" : "Publish"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ArticleCreatePage;
