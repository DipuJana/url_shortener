import { Check } from "lucide-react";

type ToastProps = {
    message: string | null;
};

function Toast({ message }: ToastProps) {
    if (!message) {
        return null;
    }

    return (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-md border border-gray-800 bg-[#111827] px-4 py-3 text-sm text-white shadow-lg">
            <Check className="h-4 w-4 text-green-400" />
            <span>{message}</span>
        </div>
    );
}

export default Toast;