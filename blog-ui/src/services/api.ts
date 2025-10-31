export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

function getToken() {
    return localStorage.getItem("token") || "";
}

export async function apiFetch<T>(
    url: string,
    method: HttpMethod = "GET",
    body?: unknown
): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
            const data = await res.json();
            msg = JSON.stringify(data);
        } catch { }
        throw new Error(msg);
    }
    try { return (await res.json()) as T; } catch { return {} as T; }
}
