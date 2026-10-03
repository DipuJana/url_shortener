import {
    Link2,
    LogOut,
    Menu,
    X,
} from "lucide-react";

type NavbarProps = {
    isAuthenticated: boolean;
    userEmail: string;
    mobileMenuOpen: boolean;
    onToggleMobileMenu: () => void;
    onNavigate: (
        route: "home" | "login" | "register" | "dashboard"
    ) => void;
    onLogout: () => void;
};

function Navbar({
                    isAuthenticated,
                    userEmail,
                    mobileMenuOpen,
                    onToggleMobileMenu,
                    onNavigate,
                    onLogout,
                }: NavbarProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <button
                    onClick={() =>
                        onNavigate(isAuthenticated ? "dashboard" : "home")
                    }
                    className="group flex items-center gap-2.5"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#4F46E5] text-white shadow-sm transition group-hover:bg-[#4338CA]">
                        <Link2 className="h-5 w-5" />
                    </div>

                    <span className="text-xl font-bold tracking-tight text-[#111827]">
            Route<span className="text-[#4F46E5]">X</span>
          </span>
                </button>

                <nav className="hidden items-center gap-6 md:flex">
                    {!isAuthenticated ? (
                        <>
                            <button
                                onClick={() => onNavigate("home")}
                                className="text-sm font-medium text-[#6B7280] transition hover:text-[#111827]"
                            >
                                Home
                            </button>

                            <div className="h-4 w-px bg-[#E5E7EB]" />

                            <button
                                onClick={() => onNavigate("login")}
                                className="text-sm font-medium text-[#6B7280] transition hover:text-[#111827]"
                            >
                                Login
                            </button>

                            <button
                                onClick={() => onNavigate("register")}
                                className="rounded-md bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#4338CA]"
                            >
                                Register
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => onNavigate("dashboard")}
                                className="text-sm font-medium text-[#4F46E5]"
                            >
                                Dashboard
                            </button>

                            <div className="h-4 w-px bg-[#E5E7EB]" />

                            <span className="rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#6B7280]">
                {userEmail}
              </span>

                            <button
                                onClick={onLogout}
                                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </>
                    )}
                </nav>

                <button
                    onClick={onToggleMobileMenu}
                    className="rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <Menu className="h-6 w-6" />
                    )}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="space-y-2 border-b border-[#E5E7EB] bg-white px-4 pb-4 pt-2 md:hidden">
                    {!isAuthenticated ? (
                        <>
                            <button
                                onClick={() => onNavigate("home")}
                                className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Home
                            </button>

                            <button
                                onClick={() => onNavigate("login")}
                                className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Login
                            </button>

                            <button
                                onClick={() => onNavigate("register")}
                                className="block w-full rounded-md bg-[#4F46E5] px-4 py-2 text-center text-base font-medium text-white"
                            >
                                Register
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => onNavigate("dashboard")}
                                className="block w-full rounded-md bg-indigo-50 px-3 py-2 text-left text-base font-medium text-[#4F46E5]"
                            >
                                Dashboard
                            </button>

                            <button
                                onClick={onLogout}
                                className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-red-600 hover:bg-red-50"
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}

export default Navbar;