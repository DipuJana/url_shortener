import { apiRequest, readError } from "./apiClient";

export async function login(
    email: string,
    password: string
): Promise<{ token: string; type: string }> {
    const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email,
            password,
        }),
    });

    if (!response.ok) {
        throw new Error(await readError(response));
    }

    return response.json();
}

export async function register(
    email: string,
    password: string
): Promise<void> {
    const response = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            email,
            password,
        }),
    });

    if (!response.ok) {
        throw new Error(await readError(response));
    }
}