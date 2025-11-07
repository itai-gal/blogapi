import React from "react";
import { Link } from "react-router-dom";

export type ArticleListItem = {
    id: number;
    title: string;
    content: string;
    likes_count?: number;
};

type Props = {
    article: ArticleListItem;
    liked?: boolean;
    onToggleLike?: (id: number, liked: boolean) => void;
    onDelete?: (id: number) => void;
    canEdit?: boolean;
};

const Heart: React.FC<{ filled?: boolean; size?: number }> = ({ filled, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path
            d="M12.1 21.35l-1.1-1.02C5.14 14.88 2 12.06 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.73 3.96 1.9C11.38 4.73 12.88 4 14.42 4 16.92 4 18.92 6 18.92 8.5c0 3.56-3.14 6.38-8.99 11.83l-.83.77z"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
        />
    </svg>
);

const ArticleCard: React.FC<Props> = ({ article, liked, onToggleLike, onDelete, canEdit }) => {
    const snippet = article.content.length > 140 ? article.content.slice(0, 140) + "…" : article.content;

    return (
        <div className="panel" style={{ padding: 16 }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "start" }}>
                <div className="stack" style={{ gap: 6 }}>
                    <Link className="title link" to={`/articles/${article.id}`}>{article.title}</Link>
                    <p className="muted" style={{ margin: 0, whiteSpace: "pre-wrap" }}>{snippet}</p>
                </div>

                <div className="row" style={{ gap: 8 }}>
                    {onToggleLike && (
                        <button
                            className={`btn icon ${liked ? "primary" : "ghost"}`}
                            onClick={() => onToggleLike(article.id, !!liked)}
                            aria-label={liked ? "Unlike" : "Like"}
                            title={liked ? "Unlike" : "Like"}
                        >
                            <Heart filled={liked} />
                            <span style={{ marginInlineStart: 6 }}>{article.likes_count ?? 0}</span>
                        </button>
                    )}

                    {canEdit && (
                        <>
                            <Link to={`/articles/${article.id}/edit`} className="btn ghost">Edit</Link>
                            {onDelete && (
                                <button className="btn danger" onClick={() => onDelete(article.id)}>Delete</button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArticleCard;
