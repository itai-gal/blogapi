export const API_BASE = "http://127.0.0.1:8000";

export const ENDPOINTS = {
    login: `${API_BASE}/api/token/`,
    register: `${API_BASE}/api/register/`,
    me: `${API_BASE}/api/me/`,
    articles: `${API_BASE}/api/articles/`,
    article: (id: number | string) => `${API_BASE}/api/articles/${id}/`,
    articleComments: (id: number | string) => `${API_BASE}/api/articles/${id}/comments/`,
    postUserLikes: `${API_BASE}/api/post-user-likes/`,
};
