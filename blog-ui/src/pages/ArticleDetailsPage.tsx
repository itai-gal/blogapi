import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import { ENDPOINTS } from "../services/endpoints";

type Article = {
    id: number;
    title: string;
    content: string;
    likes_count?: number;
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

    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [likeId, setLikeId] = useState<number | null>(null);
    const [likesCount, setLikesCount] = useState<number>(0);


    // Guard למניעת כפל-fetch תחת StrictMode
    const fetchedOnce = useRef(false);

    const fetchLikeRowMine = async (articleId: number): Promise<LikeRow | null> => {
        try {
            const urlMine = `${ENDPOINTS.postUserLikes}?article=${articleId}&mine=1`;
            const mine = await apiFetch<LikeRow[]>(urlMine);
            if (Array.isArray(mine) && mine.length > 0) return mine[0];
        } catch {
            // fallback – אם אין תמיכה ב־mine=1, נסה להחזיר את השורה הראשונה ולסנן בצד לקוח לפי user (אם צריך)
            try {
                const url = `${ENDPOINTS.postUserLikes}?article=${articleId}`;
                const rows = await apiFetch<LikeRow[]>(url);
                if (Array.isArray(rows) && rows.length > 0) return rows[0];
            } catch {
                /* ignore */
            }
        }
        return null;
    };

    const loadArticleAndLike = async () => {
        setLoading(true);
        try {
            const a = await apiFetch<Article>(ENDPOINTS.article(id));
            setArticle(a);
            setLikesCount(a.likes_count ?? 0);

            const mine = await fetchLikeRowMine(a.id);
            if (mine) {
                setLiked(true);
                setLikeId(mine.id);
            } else {
                setLiked(false);
                setLikeId(null);
            }
        } catch {
            toast.error("Failed to load article");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (fetchedOnce.current) return;
        fetchedOnce.current = true;
        loadArticleAndLike();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const onToggleLike = async () => {
        if (!article) return;

        const optimisticLiked = !liked;
        setLiked(optimisticLiked);
        setLikesCount((c) => c + (optimisticLiked ? 1 : -1));

        try {
            if (optimisticLiked) {
                // יצירת לייק
                const row = await apiFetch<LikeRow>(ENDPOINTS.postUserLikes, {
                    method: "POST",
                    body: JSON.stringify({ article: article.id }),
                } as RequestInit);
                setLikeId(row.id);
                toast.success("Liked");
            } else {
                // הסרת לייק
                let toDeleteId = likeId;
                if (!toDeleteId) {
                    const mine = await fetchLikeRowMine(article.id);
                    if (mine) toDeleteId = mine.id;
                }
                if (toDeleteId) {
                    await apiFetch(ENDPOINTS.postUserLikeDetail(toDeleteId), {
                        method: "DELETE",
                    } as RequestInit);
                }
                toast("Unliked 💔");
            }
        } catch {
            // החזרת מצב במקרה כשל
            setLiked(!optimisticLiked);
            setLikesCount((c) => c + (optimisticLiked ? -1 : 1));
            toast.error("Action failed");
        }
    };

    const header = useMemo(
        () => (
            <div className="panel stack" style={{ marginBottom: 16 }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <h2 className="title" style={{ margin: 0 }}>{article?.title || "Article"}</h2>
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
                </div>
            </div>
        ),
        [article?.title, liked, likesCount]
    );

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