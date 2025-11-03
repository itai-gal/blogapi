export async function apiFetch<T = any>(
    url: string,
    init: RequestInit = {}
): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(init.headers as Record<string, string> | undefined),
    };

    const finalInit: RequestInit = {
        method: init.method ?? "GET",
        headers,
        body: init.body,
        credentials: init.credentials ?? "omit", // without cookies by default
        signal: init.signal,
    };

    const res = await fetch(url, finalInit);

    // Read text once and then try to parse as JSON
    const bodyText = res.status === 204 ? "" : await res.text();

    if (!res.ok) {
        let errParsed: any = bodyText;
        try { errParsed = bodyText ? JSON.parse(bodyText) : null; } catch { }
        // Help with debugging:
        // eslint-disable-next-line no-console
        console.error("apiFetch error", res.status, errParsed ?? bodyText);
        throw new Error(`HTTP ${res.status}`);
    }

    if (!bodyText) return undefined as T;

    try {
        return JSON.parse(bodyText) as T;
    } catch {
        // If the server returned non-JSON text
        return bodyText as unknown as T;
    }
}