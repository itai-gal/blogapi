import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import ENDPOINTS from "../services/endpoints";
import { useAuth } from "../contexts/AuthContext";

type Article = {
    id: number;
    title: string;
    content: string;
    likes_count?: number;
    user_liked?: boolean;
    author_username?: string;
};

type LikeRow = { id: number; user: number; article: number };

const Heart: React.FC<{ filled?: boolean; size?: number }> = ({ filled, size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path
            d="M12.1 21.35l-1.1-1.02C5.14 14.88 2 12.06 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.73 3.96 1.9C11.38 4.73 12.88 4 14.42 4 16.92 4 18.92 6 18.92 8.5c0 3.56-3.14 6.38-8.99 11.83l-.83.77z"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
        />
    </svg>
);

const ArticleDetailsPage: React.FC = () => {
    const params = useParams();
    const id = Number(params.id);
    const nav = useNavigate();
    const { token } = useAuth();

    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [likeId, setLikeId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Guard: invalid id in URL (e.g., NaN)
    const invalidId = Number.isNaN(id);

    useEffect(() => {
        if (invalidId) {
            setLoading(false);
            setArticle(null);
            return;
        }

        (async () => {
            setLoading(true);
            try {
                const a = await apiFetch<Article>(ENDPOINTS.article(id), {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
                setArticle(a);
                setLikesCount(a.likes_count ?? 0);
                setLiked(!!a.user_liked);

                if (token) {
                    try {
                        const mine = await apiFetch<LikeRow[]>(
                            `${ENDPOINTS.postUserLikes}?article=${id}&mine=1`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        setLikeId(mine[0]?.id ?? null);
                    } catch {
                        setLikeId(null);
                    }
                } else {
                    setLikeId(null);
                }
            } catch {
                toast.error("Failed to load article");
            } finally {
                setLoading(false);
            }
        })();
    }, [id, token, invalidId]);

    const onToggleLike = async () => {
        if (!article) return;
        if (!token) {
            toast.error("You must be logged in");
            return;
        }

        const willLike = !liked;
        // optimistic UI
        setLiked(willLike);
        setLikesCount((c) => c + (willLike ? 1 : -1));

        try {
            if (willLike) {
                // Create like
                const row = await apiFetch<LikeRow>(ENDPOINTS.postUserLikes, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ article: article.id }),
                });
                setLikeId(row.id);
                toast.success("Liked");
            } else {
                // Unlike via custom route
                try {
                    await apiFetch(ENDPOINTS.postUserLikesByArticle(article.id), {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setLikeId(null);
                    toast("Unliked", { icon: "💔" });
                } catch {
                    // Fallback: find my like row and delete by id
                    const mine = await apiFetch<LikeRow[]>(
                        `${ENDPOINTS.postUserLikes}?article=${article.id}&mine=1`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const rowId = mine[0]?.id;
                    if (!rowId) {
                        throw new Error("Like row not found");
                    }
                    await apiFetch(ENDPOINTS.postUserLikeDetail(rowId), {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setLikeId(null);
                    toast("Unliked", { icon: "💔" });
                }
            }
        } catch {
            // revert on failure
            setLiked(!willLike);
            setLikesCount((c) => c + (willLike ? -1 : 1));
            toast.error("Action failed");
        }
    };

    const onDelete = async () => {
        if (!article) return;
        if (!token) {
            toast.error("You must be logged in");
            return;
        }
        if (!window.confirm("Delete this article?")) return;

        setDeleting(true);
        try {
            await apiFetch(ENDPOINTS.article(article.id), {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Article deleted");
            nav("/");
        } catch (e: any) {
            const msg =
                typeof e?.message === "string" && e.message.startsWith("HTTP ")
                    ? e.message === "HTTP 401" || e.message === "HTTP 403"
                        ? "Not allowed"
                        : "Delete failed"
                    : "Delete failed";
            toast.error(msg);
        } finally {
            setDeleting(false);
        }
    };

    const header = useMemo(
        () => (
            <div className="panel stack" style={{ marginBottom: 16 }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <h2 className="title" style={{ margin: 0 }}>{article?.title || "Article"}</h2>
                    <div className="row" style={{ gap: 8 }}>
                        <button
                            className={`btn icon ${liked ? "primary" : "ghost"}`}
                            aria-pressed={liked}
                            aria-label={liked ? "Unlike" : "Like"}
                            onClick={onToggleLike}
                            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                        >
                            <Heart filled={liked} />
                            <span>{likesCount}</span>
                        </button>
                        <button
                            className={`btn danger ${deleting ? "disabled" : ""}`}
                            onClick={onDelete}
                            disabled={deleting}
                            title="Delete article"
                        >
                            {deleting ? "Deleting…" : "Delete"}
                        </button>
                    </div>
                </div>
            </div>
        ),
        [article?.title, liked, likesCount, deleting]
    );

    if (invalidId) {
        return (
            <div className="panel" style={{ padding: 24 }}>
                <h3 className="title" style={{ margin: 0 }}>Invalid article id</h3>
            </div>
        );
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

    if (!article) {
        return (
            <div className="panel" style={{ padding: 24 }}>
                <h3 className="title" style={{ margin: 0 }}>Article not found</h3>
            </div>
        );
    }

    return (
        <>
            {header}
            <div className="panel" style={{ padding: 24 }}>
                <div className="stack" style={{ gap: 12 }}>
                    <p style={{ whiteSpace: "pre-wrap" }}>{article.content}</p>
                </div>
            </div>
        </>
    );
};

export default ArticleDetailsPage;
