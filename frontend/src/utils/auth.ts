const TOKEN_KEY = "routex_token";
const EMAIL_KEY = "routex_email";

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getStoredEmail(): string {
    return localStorage.getItem(EMAIL_KEY) ?? "";
}

export function saveAuth(token: string, email: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EMAIL_KEY, email);
}

export function clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
}