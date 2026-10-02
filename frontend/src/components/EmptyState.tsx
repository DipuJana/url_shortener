import { Link2 } from "lucide-react";

function EmptyState() {
    return (
        <div className="space-y-3 rounded-lg border border-[#E5E7EB] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-[#4F46E5]">
                <Link2 className="h-6 w-6" />
            </div>

            <h3 className="text-base font-semibold text-[#111827]">
                No shortened URLs yet
            </h3>

            <p className="mx-auto max-w-sm text-sm text-[#6B7280]">
                Create your first short URL to get started.
            </p>
        </div>
    );
}

export default EmptyState;