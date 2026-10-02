import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

type SubmitButtonProps = {
    loading: boolean;
    loadingText: string;
    children: ReactNode;
    width?: "full" | "auto";
};

function SubmitButton({
                          loading,
                          loadingText,
                          children,
                          width = "full",
                      }: SubmitButtonProps) {
    return (
        <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center justify-center rounded-md bg-[#4F46E5] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#4338CA] disabled:opacity-50 ${
                width === "full" ? "mt-2 w-full" : ""
            }`}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText}
                </>
            ) : (
                children
            )}
        </button>
    );
}

export default SubmitButton;