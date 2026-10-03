import { useState } from "react";
import { ArrowRight, Link2, Sparkles, Zap } from "lucide-react";

type HomePageProps = {
    isAuthenticated: boolean;
    prefillUrl: string;
    setPrefillUrl: (value: string) => void;
    navigateTo: (
        route: "home" | "login" | "register" | "dashboard" | "analytics",
        id?: number
    ) => void;
    showToast: (message: string) => void;
};

function HomePage({
                      isAuthenticated,
                      setPrefillUrl,
                      navigateTo,
                      showToast,
                  }: HomePageProps) {
    const [heroUrl, setHeroUrl] = useState("");

    const handleHeroSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        const value = heroUrl.trim();

        if (!value) {
            return;
        }

        setPrefillUrl(value);

        if (!isAuthenticated) {
            showToast("Please sign in or register to shorten URLs.");
            navigateTo("login");
            return;
        }

        navigateTo("dashboard");
    };

    return (
        <>
            {/* Hero */}
            <section className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pb-24 lg:pt-24">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
                        <Sparkles className="h-4 w-4" />
                        Simple URL shortening
                    </div>

                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                        Short links.
                        <br />
                        <span className="text-indigo-600">
                            Simple sharing.
                        </span>
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
                        RouteX turns long URLs into short, shareable links with
                        custom aliases and simple analytics.
                    </p>
                </div>

                {/* URL form */}
                <div className="mx-auto mt-12 max-w-3xl">
                    <form
                        onSubmit={handleHeroSubmit}
                        className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
                    >
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                                <Link2 className="h-5 w-5 shrink-0 text-gray-400" />

                                <input
                                    type="url"
                                    required
                                    value={heroUrl}
                                    onChange={(event) =>
                                        setHeroUrl(event.target.value)
                                    }
                                    placeholder="Paste your long URL here..."
                                    className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                                />
                            </div>

                            <button
                                type="submit"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                            >
                                Shorten URL
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* Features */}
            <section className="border-y border-gray-100 bg-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
                    <div className="text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Zap className="h-5 w-5" />
                        </div>

                        <h2 className="mt-4 text-lg font-semibold text-gray-900">
                            Fast
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                            Create short links quickly and share them anywhere.
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Link2 className="h-5 w-5" />
                        </div>

                        <h2 className="mt-4 text-lg font-semibold text-gray-900">
                            Custom aliases
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                            Choose a memorable custom alias for your links.
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Sparkles className="h-5 w-5" />
                        </div>

                        <h2 className="mt-4 text-lg font-semibold text-gray-900">
                            Simple analytics
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                            Keep track of clicks and basic link information.
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}

export default HomePage;