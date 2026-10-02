import type { ReactNode } from "react";
import { Link2 } from "lucide-react";

type AuthShellProps = {
    title: string;
    subtitle: string;
    children: ReactNode;
};

function AuthShell({ title, subtitle, children }: AuthShellProps) {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#F8FAFC] px-4 py-12">
            <div className="w-full max-w-md rounded-lg border border-[#E5E7EB] bg-white p-8 shadow-sm">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-[#4F46E5] text-white shadow-sm">
                        <Link2 className="h-6 w-6" />
                    </div>

                    <h2 className="text-2xl font-bold text-[#111827]">
                        {title}
                    </h2>

                    <p className="mt-1 text-sm text-[#6B7280]">
                        {subtitle}
                    </p>
                </div>

                {children}
            </div>
        </div>
    );
}

export default AuthShell;