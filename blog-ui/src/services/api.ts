// token is read from localStorage in buildHeaders; avoid importing getToken here.

export type JsonValue = unknown;

function buildHeaders(base?: HeadersInit, hasBody?: boolean): HeadersInit {
    const headers = new Headers(base || {});
    // Authorization
    // Read token from localStorage (safe check for SSR). Replace with your app's token getter if needed.
    const token = (typeof window !== "undefined") ? (localStorage.getItem("token") ?? undefined) : undefined;
    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    // JSON defaults if body exists
    if (hasBody) {
        if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
        if (!headers.has("Accept")) headers.set("Accept", "application/json");
    }
    return headers;
}

/**
 * Generic API fetcher.
 * Usage:
 *   apiFetch<T>(url)                         // GET
 *   apiFetch<T>(url, { method: "POST", body: JSON.stringify(data) })
 */
export async function apiFetch<T = any>(input: string, init?: RequestInit): Promise<T> {
    const hasBody = !!init?.body;
    const finalInit: RequestInit = {
        method: init?.method || "GET",
        ...init,
        headers: buildHeaders(init?.headers, hasBody),
    };

    const res = await fetch(input, finalInit);
    if (!res.ok) {
        // Try to parse server error body for better DX
        let detail: any = undefined;
        try {
            detail = await res.json();
        } catch {
            /* ignore */
        }
        const err = new Error(`HTTP ${res.status}`);
        (err as any).status = res.status;
        (err as any).detail = detail;
        throw err;
    }

    // Handle empty response (204) gracefully
    if (res.status === 204) return undefined as T;

    const text = await res.text();
    if (!text) return undefined as T;
    try {
        return JSON.parse(text) as T;
    } catch {
        // not JSON
        return text as unknown as T;
    }
}