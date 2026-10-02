import { AlertCircle } from "lucide-react";

type ErrorStateProps = {
    message: string;
    onRetry: () => void;
};

function ErrorState({ message, onRetry }: ErrorStateProps) {
    return (
        <div className="space-y-3 rounded-lg border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto h-6 w-6 text-[#DC2626]" />

            <h3 className="text-base font-semibold text-[#111827]">
                Unable to load your URLs.
            </h3>

            <p className="text-sm text-[#6B7280]">
                {message}
            </p>

            <button
                onClick={onRetry}
                className="rounded-md bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#4338CA]"
            >
                Try again
            </button>
        </div>
    );
}

export default ErrorState;