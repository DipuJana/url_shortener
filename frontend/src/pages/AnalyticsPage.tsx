import { useEffect, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    Copy,
    ExternalLink,
} from "lucide-react";

import { getAnalytics } from "../api/urlApi";
import LoadingBox from "../components/LoadingBox";
import type { Analytics } from "../types/url";
import { formatDate } from "../utils/formatDate";

type AnalyticsPageProps = {
    urlId: number | null;
    onNavigate: (
        route: "home" | "login" | "register" | "dashboard" | "analytics",
        id?: number
    ) => void;
    onShowToast: (message: string) => void;
};

type DetailRowProps = {
    label: string;
    value: string;
    breakAll?: boolean;
    mono?: boolean;
    status?: "active" | "expired";
};

function DetailRow({
                       label,
                       value,
                       breakAll = false,
                       mono = false,
                       status,
                   }: DetailRowProps) {
    return (
        <div className="grid gap-1 border-b border-[#E5E7EB] pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[140px_1fr] sm:gap-4">
            <span className="text-sm font-medium text-[#6B7280]">
                {label}
            </span>

            {status ? (
                <span
                    className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                        status === "expired"
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                    }`}
                >
                    {value}
                </span>
            ) : (
                <span
                    className={`text-sm text-[#111827] ${
                        breakAll ? "break-all" : ""
                    } ${mono ? "font-mono" : ""}`}
                >
                    {value}
                </span>
            )}
        </div>
    );
}

function AnalyticsPage({
                           urlId,
                           onNavigate,
                           onShowToast,
                       }: AnalyticsPageProps) {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!urlId) {
            setIsLoading(false);
            setAnalytics(null);
            return;
        }

        const loadAnalytics = async () => {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const data = await getAnalytics(urlId);
                setAnalytics(data);
            } catch (error) {
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Unable to load analytics."
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadAnalytics();
    }, [urlId]);

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <LoadingBox message="Loading analytics..." />
                </div>
            </div>
        );
    }

    if (errorMessage || !analytics) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#F8FAFC] p-8">
                <div className="w-full max-w-md rounded-lg border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
                    <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />

                    <h3 className="text-base font-semibold text-[#111827]">
                        Unable to load analytics
                    </h3>

                    <p className="mt-1 text-sm text-[#6B7280]">
                        {errorMessage ?? "Analytics data was not found."}
                    </p>

                    <button
                        onClick={() => onNavigate("dashboard")}
                        className="mt-5 rounded-md bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4338CA]"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const totalClicks = analytics.totalClicks ?? 0;

    const shortUrl =
        `${window.location.origin}/${analytics.shortCode}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shortUrl);
            onShowToast("Short URL copied to clipboard!");
        } catch {
            onShowToast("Failed to copy URL.");
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-6">
                <button
                    onClick={() => onNavigate("dashboard")}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#111827]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </button>

                <div>
                    <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">
                        URL Analytics
                    </h1>

                    <p className="mt-1 text-sm text-[#6B7280]">
                        Performance information for this shortened URL.
                    </p>
                </div>

                <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div className="min-w-0">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                            Short URL
                        </span>

                        <a
                            href={shortUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 flex items-center gap-1 truncate text-base font-semibold text-[#4F46E5] hover:underline"
                        >
                            {shortUrl}
                            <ExternalLink className="h-4 w-4 flex-shrink-0" />
                        </a>
                    </div>

                    <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-medium text-[#111827] shadow-sm hover:bg-gray-50"
                    >
                        <Copy className="h-3.5 w-3.5 text-[#6B7280]" />
                        Copy
                    </button>
                </div>

                <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                        Total Clicks
                    </p>

                    <p className="text-4xl font-extrabold text-[#111827] md:text-5xl">
                        {totalClicks}
                    </p>
                </div>

                <div className="space-y-4 rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-[#111827]">
                        URL Details
                    </h3>

                    <DetailRow
                        label="Original URL"
                        value={analytics.originalUrl}
                        breakAll
                    />

                    <DetailRow
                        label="Short Code"
                        value={analytics.shortCode}
                        mono
                    />

                    <DetailRow
                        label="Created"
                        value={formatDate(analytics.createdAt)}
                    />

                    <DetailRow
                        label="Expires"
                        value={formatDate(analytics.expiresAt)}
                    />

                    <DetailRow
                        label="Status"
                        value={analytics.isExpired ? "Expired" : "Active"}
                        status={analytics.isExpired ? "expired" : "active"}
                    />
                </div>
            </div>
        </div>
    );
}

export default AnalyticsPage;