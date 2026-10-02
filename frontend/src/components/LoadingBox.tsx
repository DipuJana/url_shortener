import { Loader2 } from "lucide-react";

type LoadingBoxProps = {
    message: string;
};

function LoadingBox({ message }: LoadingBoxProps) {
    return (
        <div className="space-y-3 rounded-lg border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#4F46E5]" />
            <p className="text-sm text-[#6B7280]">{message}</p>
        </div>
    );
}

export default LoadingBox;