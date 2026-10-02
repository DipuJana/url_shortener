export type UrlItem = {
    id: number;
    originalUrl: string;
    shortCode: string;
    shortUrl: string;
    clickCount: number;
    createdAt: string;
    expiresAt: string | null;
};

export type Analytics = {
    shortCode: string;
    originalUrl: string;
    totalClicks: number;
    createdAt: string;
    expiresAt: string | null;
    isExpired: boolean;
};