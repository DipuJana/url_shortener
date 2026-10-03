import { apiRequest, readError } from "./apiClient";
import { getToken } from "../utils/auth";
import type { Analytics, UrlItem } from "../types/url";

type CreateUrlRequest = {
    longUrl: string;
    customAlias: string | null;
    ttlInDays: number | null;
};

type CreateUrlResponse = {
    shortCode: string;
    shortUrl: string;
    clickCount: number;
    expiresAt: string | null;
};

export async function getMyUrls(): Promise<UrlItem[]> {
    const response = await apiRequest(
        "/urls",
        {
            method: "GET",
        },
        getToken() ?? undefined
    );

    if (!response.ok) {
        throw new Error(await readError(response));
    }

    return response.json();
}

export async function createUrl(
    request: CreateUrlRequest
): Promise<CreateUrlResponse> {
    const response = await apiRequest(
        "/urls",
        {
            method: "POST",
            body: JSON.stringify(request),
        },
        getToken() ?? undefined
    );

    if (!response.ok) {
        throw new Error(await readError(response));
    }

    return response.json();
}

export async function getAnalytics(id: number): Promise<Analytics> {
    const response = await apiRequest(
        `/urls/${id}/analytics`,
        {
            method: "GET",
        },
        getToken() ?? undefined
    );

    if (!response.ok) {
        throw new Error(await readError(response));
    }

    return response.json();
}