import { AlertCircle } from "lucide-react";

type ErrorBoxProps = {
    message: string;
};

function ErrorBox({ message }: ErrorBoxProps) {
    return (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-[#DC2626]">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{message}</span>
        </div>
    );
}

export default ErrorBox;