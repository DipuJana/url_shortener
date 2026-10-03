import { useEffect, useState } from "react";
import { BarChart2, Copy, ExternalLink } from "lucide-react";

import { createUrl, getMyUrls } from "../api/urlApi";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import FormField from "../components/FormField";
import LoadingBox from "../components/LoadingBox";
import SubmitButton from "../components/SubmitButton";
import type { CreateUrlResult, UrlItem } from "../types/url";
import { formatDate } from "../utils/formatDate";

type DashboardPageProps = {
    prefillUrl: string;
    onClearPrefillUrl: () => void;
    onNavigate: (
        route: "home" | "login" | "register" | "dashboard" | "analytics",
        urlId?: number
    ) => void;
    onShowToast: (message: string) => void;
};

function DashboardPage({
                           prefillUrl,
                           onClearPrefillUrl,
                           onNavigate,
                           onShowToast,
                       }: DashboardPageProps) {
    const [originalUrl, setOriginalUrl] = useState(prefillUrl);
    const [customAlias, setCustomAlias] = useState("");
    const [expirationDays, setExpirationDays] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdResult, setCreatedResult] = useState<CreateUrlResult | null>(null);
    const [urls, setUrls] = useState<UrlItem[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [listError, setListError] = useState<string | null>(null);

    const load = async () => {
        setIsLoadingList(true);
        setListError(null);

        try {
            const data = await getMyUrls();
            setUrls(data);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Unable to load your URLs.";

            setListError(message);
        } finally {
            setIsLoadingList(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        if (prefillUrl) {
            setOriginalUrl(prefillUrl);
            onClearPrefillUrl();
        }
    }, [prefillUrl, onClearPrefillUrl]);

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            onShowToast("Short URL copied to clipboard!");
        } catch {
            onShowToast("Failed to copy URL.");
        }
    };

    const handleCreateUrl = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!originalUrl.trim()) return;

        setIsSubmitting(true);
        setCreatedResult(null);

        try {
            const result = await createUrl({
                longUrl: originalUrl.trim(),
                customAlias: customAlias.trim() || null,
                ttlInDays: expirationDays
                    ? Number(expirationDays)
                    : null,
            });

            setCreatedResult(result);

            setOriginalUrl("");
            setCustomAlias("");
            setExpirationDays("");

            await load();

            onShowToast("Short URL created successfully.");
        } catch (error) {
            onShowToast(
                error instanceof Error
                    ? error.message
                    : "Unable to create short URL."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReloadList = () => {
        load();
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">
                        Your dashboard
                    </h1>

                    <p className="mt-1 text-sm text-[#6B7280]">
                        Create and manage your shortened URLs.
                    </p>
                </div>

                <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-8">
                    <h2 className="mb-4 text-lg font-semibold text-[#111827]">
                        Create a short URL
                    </h2>

                    <form onSubmit={handleCreateUrl} className="space-y-4">
                        <FormField
                            label="Original URL"
                            required
                            type="url"
                            value={originalUrl}
                            placeholder="https://example.com/very/long/url"
                            onChange={setOriginalUrl}
                        />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                                label="Custom alias"
                                type="text"
                                value={customAlias}
                                placeholder="my-link"
                                optional
                                onChange={setCustomAlias}
                            />

                            <FormField
                                label="Expiration (days)"
                                type="number"
                                value={expirationDays}
                                placeholder="30"
                                optional
                                min="1"
                                onChange={setExpirationDays}
                            />
                        </div>

                        <SubmitButton
                            loading={isSubmitting}
                            loadingText="Creating..."
                            width="auto"
                        >
                            Create short URL
                        </SubmitButton>
                    </form>

                    {createdResult && (
                        <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-md border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center">
                            <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-green-800">
                                    Your short URL is ready
                                </p>

                                <a
                                    href={createdResult.shortUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-sm font-medium text-[#4F46E5] hover:underline"
                                >
                                    {createdResult.shortUrl}
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleCopy(createdResult.shortUrl)}
                                className="flex items-center gap-1.5 rounded-md border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-800 shadow-sm hover:bg-green-100"
                            >
                                <Copy className="h-3.5 w-3.5" />
                                Copy
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-[#111827]">
                                Your URLs
                            </h2>

                            <p className="text-sm text-[#6B7280]">
                                Your recently created shortened URLs.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleReloadList}
                            className="text-xs font-medium text-[#4F46E5] hover:underline"
                        >
                            Refresh
                        </button>
                    </div>

                    {isLoadingList && (
                        <LoadingBox message="Loading your URLs..." />
                    )}

                    {!isLoadingList && listError && (
                        <ErrorState
                            message={listError}
                            onRetry={handleReloadList}
                        />
                    )}

                    {!isLoadingList && !listError && urls.length === 0 && (
                        <EmptyState />
                    )}

                    {!isLoadingList && !listError && urls.length > 0 && (
                        <div className="space-y-3">
                            {urls.map((urlItem) => {
                                const expired =
                                    urlItem.expiresAt !== null &&
                                    new Date(urlItem.expiresAt).getTime() <
                                    Date.now();

                                return (
                                    <div
                                        key={urlItem.id}
                                        className="flex flex-col justify-between gap-4 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm md:flex-row md:items-center"
                                    >
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                          Original URL
                        </span>

                                                {expired && (
                                                    <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-[#DC2626]">
                            Expired
                          </span>
                                                )}
                                            </div>

                                            <p
                                                className="truncate text-sm font-medium text-[#111827]"
                                                title={urlItem.originalUrl}
                                            >
                                                {urlItem.originalUrl}
                                            </p>

                                            <a
                                                href={urlItem.shortUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block truncate pt-1 text-sm font-semibold text-[#4F46E5] hover:underline"
                                            >
                                                {urlItem.shortUrl}
                                            </a>

                                            <div className="flex flex-wrap items-center gap-x-2 pt-1 text-xs text-[#6B7280]">
                                                <span>{urlItem.clickCount} clicks</span>
                                                <span>·</span>
                                                <span>
                          Created {formatDate(urlItem.createdAt)}
                        </span>
                                                <span>·</span>
                                                <span>
                          Expires {formatDate(urlItem.expiresAt)}
                        </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-shrink-0 items-center gap-2 border-t border-gray-100 pt-2 md:border-t-0 md:pt-0">
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(urlItem.shortUrl)}
                                                className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#111827] shadow-sm hover:bg-gray-50"
                                            >
                                                <Copy className="h-3.5 w-3.5 text-[#6B7280]" />
                                                Copy
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onNavigate("analytics", urlItem.id)
                                                }
                                                className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#111827] shadow-sm hover:bg-gray-50"
                                            >
                                                <BarChart2 className="h-3.5 w-3.5 text-[#6B7280]" />
                                                Analytics
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;