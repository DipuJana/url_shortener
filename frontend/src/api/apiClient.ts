const API_BASE = "/api/v1";

export async function readError(response: Response): Promise<string> {
    try {
        const body = await response.json();

        if (typeof body?.message === "string") {
            return body.message;
        }

        if (typeof body?.error === "string") {
            return body.error;
        }

        if (typeof body === "string") {
            return body;
        }
    } catch {
        // Response did not contain JSON.
    }

    return `Request failed with status ${response.status}.`;
}

export async function apiRequest(
    path: string,
    options: RequestInit = {},
    token?: string
): Promise<Response> {
    const headers = new Headers(options.headers);

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });
}