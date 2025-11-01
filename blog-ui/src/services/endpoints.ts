const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const ENDPOINTS = {
    tokenObtain: `${API_BASE}/api/token/`,
    tokenRefresh: `${API_BASE}/api/token/refresh/`,
    me: `${API_BASE}/api/auth/me/`,
    register: `${API_BASE}/api/auth/`,
    articles: `${API_BASE}/api/articles/`,
    article: (id: number) => `${API_BASE}/api/articles/${id}/`,
    postUserLikes: `${API_BASE}/api/post-user-likes/`,
    postUserLikeDetail: (id: number) => `${API_BASE}/api/post-user-likes/${id}/`,
    comments: `${API_BASE}/api/comments/`,
    articleComments: (articleId: number) => `${API_BASE}/api/articles/${articleId}/comments/`,
};
export default ENDPOINTS;