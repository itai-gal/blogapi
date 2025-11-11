const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

export const ENDPOINTS = {
    // --- JWT (root) ---
    tokenObtain: `${API_BASE}/token/`,
    tokenRefresh: `${API_BASE}/token/refresh/`,

    // --- Auth ViewSet (under /api) ---
    authRoot: `${API_BASE}/api/auth/`,
    register: `${API_BASE}/api/auth/register/`,
    me: `${API_BASE}/api/auth/me/`,

    // --- Articles / Likes / Comments ---
    articles: `${API_BASE}/api/articles/`,
    article: (id: number) => `${API_BASE}/api/articles/${id}/`,

    postUserLikes: `${API_BASE}/api/post-user-likes/`,
    postUserLikeDetail: (id: number) => `${API_BASE}/api/post-user-likes/${id}/`,

    // ✅ FIXED: add /api prefix here
    postUserLikesByArticle: (articleId: number) =>
        `${API_BASE}/api/post-user-likes/by-article/${articleId}/`,

    comments: `${API_BASE}/api/comments/`,

    articleComments: (articleId: number) =>
        `${API_BASE}/api/articles/${articleId}/comments/`,
};

export default ENDPOINTS;
