const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

export const ENDPOINTS = {
    // Articles
    articles: `${API_BASE}/api/articles/`,
    article: (id: number | string) => `${API_BASE}/api/articles/${id}/`,
    articleComments: (id: number | string) => `${API_BASE}/api/articles/${id}/comments/`,

    // Likes
    postUserLikes: `${API_BASE}/api/post-user-likes/`,
    postUserLikeDetail: (id: number | string) =>
        `${API_BASE}/api/post-user-likes/${id}/`,

    // --- Users / Auth ---
    users: `${API_BASE}/api/users/`,
    userDetail: (id: number | string) => `${API_BASE}/api/users/${id}/`,
    login: `${API_BASE}/api/token/`,
    me: `${API_BASE}/api/users/me/`,
    register: `${API_BASE}/api/users/`,
};

export default ENDPOINTS;