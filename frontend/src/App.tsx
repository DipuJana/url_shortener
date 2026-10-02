import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart2,
  Check,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  LogOut,
  Menu,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

const API_BASE = "/api/v1";
const TOKEN_KEY = "routex_token";
const EMAIL_KEY = "routex_email";

type Route = "home" | "login" | "register" | "dashboard" | "analytics";

type UrlItem = {
  id: number;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  clickCount: number;
  createdAt: string;
  expiresAt: string | null;
};

type Analytics = {
  shortCode: string;
  originalUrl: string;
  totalClicks?: number;
  clickCount?: number;
  createdAt: string;
  expiresAt: string | null;
  isExpired: boolean;
};

type AuthUser = {
  email: string;
};

function getRoute(): { route: Route; id?: number } {
  const path = window.location.pathname;

  if (path === "/" || path === "") return { route: "home" };
  if (path === "/login") return { route: "login" };
  if (path === "/register") return { route: "register" };
  if (path === "/dashboard") return { route: "dashboard" };

  const match = path.match(/^\/dashboard\/urls\/(\d+)\/analytics$/);
  if (match) {
    return { route: "analytics", id: Number(match[1]) };
  }

  return { route: "home" };
}

function formatDate(value: string | null): string {
  if (!value) return "Never";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();

    if (typeof body?.message === "string") return body.message;
    if (typeof body?.error === "string") return body.error;
    if (typeof body === "string") return body;
  } catch {
    // Response did not contain JSON.
  }

  return `Request failed with status ${response.status}.`;
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredEmail(): string {
  return localStorage.getItem(EMAIL_KEY) ?? "";
}

function extractToken(data: unknown): string {
  if (
    data &&
    typeof data === "object" &&
    "token" in data &&
    typeof data.token === "string"
  ) {
    return data.token;
  }

  if (
    data &&
    typeof data === "object" &&
    "accessToken" in data &&
    typeof data.accessToken === "string"
  ) {
    return data.accessToken;
  }

  throw new Error(
    "Login succeeded, but no JWT token was found in the response."
  );
}

function App() {
  const initial = getRoute();

  const [currentRoute, setCurrentRoute] = useState<Route>(initial.route);
  const [selectedUrlId, setSelectedUrlId] = useState<number | null>(
    initial.id ?? null
  );

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(getToken())
  );
  const [userEmail, setUserEmail] = useState<AuthUser["email"]>(
    getStoredEmail()
  );

  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [prefillUrl, setPrefillUrl] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  const navigateTo = (route: Route, id?: number) => {
    setMobileMenuOpen(false);

    if (
      (route === "dashboard" || route === "analytics") &&
      !getToken()
    ) {
      window.history.pushState({}, "", "/login");
      setCurrentRoute("login");
      setSelectedUrlId(null);
      showToast("Please sign in to access the dashboard.");
      return;
    }

    if (
      (route === "login" || route === "register") &&
      getToken()
    ) {
      window.history.pushState({}, "", "/dashboard");
      setCurrentRoute("dashboard");
      setSelectedUrlId(null);
      return;
    }

    const path =
      route === "home"
        ? "/"
        : route === "login"
          ? "/login"
          : route === "register"
            ? "/register"
            : route === "dashboard"
              ? "/dashboard"
              : `/dashboard/urls/${id}/analytics`;

    window.history.pushState({}, "", path);
    setCurrentRoute(route);
    setSelectedUrlId(id ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handlePopState = () => {
      const next = getRoute();
      setCurrentRoute(next.route);
      setSelectedUrlId(next.id ?? null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);

    setIsAuthenticated(false);
    setUserEmail("");
    setUrls([]);
    navigateTo("home");
    showToast("Successfully logged out.");
  };

  const authenticatedFetch = async (
    path: string,
    options: RequestInit = {}
  ) => {
    const token = getToken();

    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);

    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EMAIL_KEY);
      setIsAuthenticated(false);
      setUserEmail("");
      throw new Error("Your session has expired. Please sign in again.");
    }

    return response;
  };

  const loadUrls = async () => {
    try {
      const response = await authenticatedFetch("/urls");

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data: UrlItem[] = await response.json();
      setUrls(data);
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Unable to load your URLs.");
    }
  };

  const Toast = () => {
    if (!toastMessage) return null;

    return (
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-md border border-gray-800 bg-[#111827] px-4 py-3 text-sm text-white shadow-lg">
        <Check className="h-4 w-4 text-green-400" />
        <span>{toastMessage}</span>
      </div>
    );
  };

  const Navbar = () => (
    <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigateTo(isAuthenticated ? "dashboard" : "home")}
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
                onClick={() => navigateTo("home")}
                className="text-sm font-medium text-[#6B7280] transition hover:text-[#111827]"
              >
                Home
              </button>
              <div className="h-4 w-px bg-[#E5E7EB]" />
              <button
                onClick={() => navigateTo("login")}
                className="text-sm font-medium text-[#6B7280] transition hover:text-[#111827]"
              >
                Login
              </button>
              <button
                onClick={() => navigateTo("register")}
                className="rounded-md bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#4338CA]"
              >
                Register
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigateTo("dashboard")}
                className="text-sm font-medium text-[#4F46E5]"
              >
                Dashboard
              </button>
              <div className="h-4 w-px bg-[#E5E7EB]" />
              <span className="rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#6B7280]">
                {userEmail}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          )}
        </nav>

        <button
          onClick={() => setMobileMenuOpen((open) => !open)}
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
                onClick={() => navigateTo("home")}
                className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Home
              </button>
              <button
                onClick={() => navigateTo("login")}
                className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Login
              </button>
              <button
                onClick={() => navigateTo("register")}
                className="block w-full rounded-md bg-[#4F46E5] px-4 py-2 text-center text-base font-medium text-white"
              >
                Register
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigateTo("dashboard")}
                className="block w-full rounded-md bg-indigo-50 px-3 py-2 text-left text-base font-medium text-[#4F46E5]"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
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

  const HomePage = () => {
    const [heroUrl, setHeroUrl] = useState("");

    const handleHeroSubmit = (event: React.FormEvent) => {
      event.preventDefault();

      const value = heroUrl.trim();
      if (!value) return;

      setPrefillUrl(value);

      if (!isAuthenticated) {
        showToast("Please sign in or register to shorten URLs.");
        navigateTo("login");
        return;
      }

      navigateTo("dashboard");
    };

    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-between bg-[#F8FAFC]">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 text-center sm:px-6 md:py-24 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#4F46E5]">
            <Sparkles className="h-3.5 w-3.5" />
            Fast & Reliable URL Shortener
          </div>

          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-[#111827] sm:text-5xl md:text-6xl">
            Short links.{" "}
            <span className="text-[#4F46E5]">Simple sharing.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-[#6B7280] md:text-xl">
            Create clean, shareable short URLs in seconds with lightning-fast
            redirects and basic click analytics.
          </p>

          <div className="mx-auto mb-16 max-w-xl rounded-lg border border-[#E5E7EB] bg-white p-2 shadow-sm">
            <form
              onSubmit={handleHeroSubmit}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <input
                type="url"
                required
                value={heroUrl}
                onChange={(event) => setHeroUrl(event.target.value)}
                placeholder="Paste your long URL here..."
                className="flex-1 bg-transparent px-4 py-3 text-sm text-[#111827] outline-none placeholder:text-[#6B7280]"
              />
              <button
                type="submit"
                className="rounded-md bg-[#4F46E5] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#4338CA]"
              >
                Shorten URL
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-3">
            {[
              {
                icon: <Zap className="h-5 w-5" />,
                title: "Fast",
                text: "Create short URLs in seconds with the RouteX Spring Boot backend.",
              },
              {
                icon: <Link2 className="h-5 w-5" />,
                title: "Custom aliases",
                text: "Use a memorable custom alias whenever you need one.",
              },
              {
                icon: <BarChart2 className="h-5 w-5" />,
                title: "Simple analytics",
                text: "Track total clicks and basic URL information.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-indigo-50 text-[#4F46E5]">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-[#111827]">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#6B7280]">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>

        <footer className="border-t border-[#E5E7EB] bg-white py-6 text-center text-xs text-[#6B7280]">
          RouteX — Simple URL shortening
        </footer>
      </div>
    );
  };

  const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleLogin = async (event: React.FormEvent) => {
      event.preventDefault();
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          throw new Error(await readError(response));
        }

        const data = await response.json();
        const token = extractToken(data);

        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(EMAIL_KEY, email);

        setIsAuthenticated(true);
        setUserEmail(email);

        showToast("Signed in successfully.");
        navigateTo("dashboard");
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to sign in."
        );
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <AuthShell
        title="Welcome back"
        subtitle="Sign in to manage your shortened URLs."
      >
        {errorMessage && <ErrorBox message={errorMessage} />}

        <form onSubmit={handleLogin} className="space-y-4">
          <FormField
            label="Email"
            type="email"
            value={email}
            placeholder="you@example.com"
            onChange={setEmail}
          />
          <FormField
            label="Password"
            type="password"
            value={password}
            placeholder="••••••••"
            onChange={setPassword}
          />

          <SubmitButton loading={isLoading} loadingText="Signing in...">
            Sign in
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-[#6B7280]">
          Don't have an account?{" "}
          <button
            onClick={() => navigateTo("register")}
            className="font-medium text-[#4F46E5] hover:underline"
          >
            Create an account
          </button>
        </p>
      </AuthShell>
    );
  };

  const RegisterPage = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleRegister = async (event: React.FormEvent) => {
      event.preventDefault();
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
          throw new Error(await readError(response));
        }

        showToast("Account created. Please sign in.");
        navigateTo("login");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to create your account."
        );
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <AuthShell
        title="Create your account"
        subtitle="Start creating and managing short links."
      >
        {errorMessage && <ErrorBox message={errorMessage} />}

        <form onSubmit={handleRegister} className="space-y-4">
          <FormField
            label="Name"
            type="text"
            value={name}
            placeholder="Jane Doe"
            onChange={setName}
          />
          <FormField
            label="Email"
            type="email"
            value={email}
            placeholder="you@example.com"
            onChange={setEmail}
          />
          <FormField
            label="Password"
            type="password"
            value={password}
            placeholder="••••••••"
            onChange={setPassword}
          />

          <SubmitButton
            loading={isLoading}
            loadingText="Creating account..."
          >
            Create account
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-[#6B7280]">
          Already have an account?{" "}
          <button
            onClick={() => navigateTo("login")}
            className="font-medium text-[#4F46E5] hover:underline"
          >
            Sign in
          </button>
        </p>
      </AuthShell>
    );
  };

  const DashboardPage = () => {
    const [originalUrl, setOriginalUrl] = useState(prefillUrl);
    const [customAlias, setCustomAlias] = useState("");
    const [expirationDays, setExpirationDays] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdResult, setCreatedResult] = useState<UrlItem | null>(null);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [listError, setListError] = useState<string | null>(null);

    const load = async () => {
      setIsLoadingList(true);
      setListError(null);

      try {
        await loadUrls();
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
        setPrefillUrl("");
      }
    }, [prefillUrl]);

    const handleCopy = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast("Short URL copied to clipboard!");
      } catch {
        showToast("Failed to copy URL.");
      }
    };

    const handleCreateUrl = async (event: React.FormEvent) => {
      event.preventDefault();

      if (!originalUrl.trim()) return;

      setIsSubmitting(true);
      setCreatedResult(null);

      try {
        const response = await authenticatedFetch("/urls", {
          method: "POST",
          body: JSON.stringify({
            longUrl: originalUrl.trim(),
            customAlias: customAlias.trim() || null,
            ttlInDays: expirationDays
              ? Number(expirationDays)
              : null,
          }),
        });

        if (!response.ok) {
          throw new Error(await readError(response));
        }

        const data = await response.json();

        const result: UrlItem = {
          id: data.id ?? Date.now(),
          originalUrl: data.originalUrl ?? originalUrl.trim(),
          shortCode: data.shortCode,
          shortUrl: data.shortUrl,
          clickCount: data.clickCount ?? 0,
          createdAt: data.createdAt ?? new Date().toISOString(),
          expiresAt: data.expiresAt ?? null,
        };

        setCreatedResult(result);
        setOriginalUrl("");
        setCustomAlias("");
        setExpirationDays("");

        await loadUrls();
        showToast("Short URL created successfully.");
      } catch (error) {
        showToast(
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
              <ErrorState message={listError} onRetry={handleReloadList} />
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
                          <span>Created {formatDate(urlItem.createdAt)}</span>
                          <span>·</span>
                          <span>Expires {formatDate(urlItem.expiresAt)}</span>
                        </div>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-2 border-t border-gray-100 pt-2 md:border-t-0 md:pt-0">
                        <button
                          onClick={() => handleCopy(urlItem.shortUrl)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#111827] shadow-sm hover:bg-gray-50"
                        >
                          <Copy className="h-3.5 w-3.5 text-[#6B7280]" />
                          Copy
                        </button>

                        <button
                          onClick={() =>
                            navigateTo("analytics", urlItem.id)
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#111827] shadow-sm hover:bg-gray-50"
                        >
                          <BarChart2 className="h-3.5 w-3.5 text-[#6B7280]" />
                          Analytics
                        </button>

                        {/* No DELETE endpoint exists in the current backend,
                            so the mock trash action is intentionally removed. */}
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
  };

  const AnalyticsPage = () => {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
      if (!selectedUrlId) return;

      const loadAnalytics = async () => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
          const response = await authenticatedFetch(
            `/urls/${selectedUrlId}/analytics`
          );

          if (!response.ok) {
            throw new Error(await readError(response));
          }

          const data: Analytics = await response.json();
          setAnalytics(data);
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load analytics."
          );
        } finally {
          setIsLoading(false);
        }
      };

      loadAnalytics();
    }, [selectedUrlId]);

    if (isLoading) {
      return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <LoadingBox message="Loading analytics..." />
          </div>
        </div>
      );
    }

    if (errorMessage || !analytics) {
      return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#F8FAFC] p-8">
          <div className="w-full max-w-md rounded-lg border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
            <h3 className="text-base font-semibold text-[#111827]">
              Unable to load analytics
            </h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              {errorMessage ?? "Analytics data was not found."}
            </p>
            <button
              onClick={() => navigateTo("dashboard")}
              className="mt-5 rounded-md bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4338CA]"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    const totalClicks =
      analytics.totalClicks ?? analytics.clickCount ?? 0;

    const shortUrl =
      urls.find((url) => url.id === selectedUrlId)?.shortUrl ??
      `${window.location.origin}/${analytics.shortCode}`;

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(shortUrl);
        showToast("Short URL copied to clipboard!");
      } catch {
        showToast("Failed to copy URL.");
      }
    };

    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <button
            onClick={() => navigateTo("dashboard")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#111827]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <div>
            <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">
              URL Analytics
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              Performance information for this shortened URL.
            </p>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm sm:flex-row sm:items-center">
            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                Short URL
              </span>
              <a
                href={shortUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 flex items-center gap-1 truncate text-base font-semibold text-[#4F46E5] hover:underline"
              >
                {shortUrl}
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
              </a>
            </div>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-medium text-[#111827] shadow-sm hover:bg-gray-50"
            >
              <Copy className="h-3.5 w-3.5 text-[#6B7280]" />
              Copy
            </button>
          </div>

          <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Total Clicks
            </p>
            <p className="text-4xl font-extrabold text-[#111827] md:text-5xl">
              {totalClicks}
            </p>
          </div>

          <div className="space-y-4 rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-[#111827]">
              URL Details
            </h3>

            <DetailRow
              label="Original URL"
              value={analytics.originalUrl}
              breakAll
            />
            <DetailRow
              label="Short Code"
              value={analytics.shortCode}
              mono
            />
            <DetailRow
              label="Created"
              value={formatDate(analytics.createdAt)}
            />
            <DetailRow
              label="Expires"
              value={formatDate(analytics.expiresAt)}
            />
            <DetailRow
              label="Status"
              value={analytics.isExpired ? "Expired" : "Active"}
              status={analytics.isExpired ? "expired" : "active"}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#111827]">
      <Navbar />
      <Toast />

      <main>
        {currentRoute === "home" && <HomePage />}
        {currentRoute === "login" && <LoginPage />}
        {currentRoute === "register" && <RegisterPage />}
        {currentRoute === "dashboard" && <DashboardPage />}
        {currentRoute === "analytics" && <AnalyticsPage />}
      </main>
    </div>
  );

  function AuthShell({
    title,
    subtitle,
    children,
  }: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
  }) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#F8FAFC] px-4 py-12">
        <div className="w-full max-w-md rounded-lg border border-[#E5E7EB] bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-[#4F46E5] text-white shadow-sm">
              <Link2 className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#111827]">{title}</h2>
            <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    );
  }

  function FormField({
    label,
    type,
    value,
    placeholder,
    onChange,
    required = false,
    optional = false,
    min,
  }: {
    label: string;
    type: string;
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    required?: boolean;
    optional?: boolean;
    min?: string;
  }) {
    return (
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#111827]">
          {label}{" "}
          {required && <span className="text-red-500">*</span>}
          {optional && (
            <span className="font-normal text-[#6B7280]">(Optional)</span>
          )}
        </label>

        <input
          type={type}
          required={required}
          min={min}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-md border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
        />
      </div>
    );
  }

  function SubmitButton({
    loading,
    loadingText,
    children,
    width = "full",
  }: {
    loading: boolean;
    loadingText: string;
    children: React.ReactNode;
    width?: "full" | "auto";
  }) {
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

  function ErrorBox({ message }: { message: string }) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-[#DC2626]">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>{message}</span>
      </div>
    );
  }

  function LoadingBox({ message }: { message: string }) {
    return (
      <div className="space-y-3 rounded-lg border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#4F46E5]" />
        <p className="text-sm text-[#6B7280]">{message}</p>
      </div>
    );
  }

  function ErrorState({
    message,
    onRetry,
  }: {
    message: string;
    onRetry: () => void;
  }) {
    return (
      <div className="space-y-3 rounded-lg border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto h-6 w-6 text-[#DC2626]" />
        <h3 className="text-base font-semibold text-[#111827]">
          Unable to load your URLs.
        </h3>
        <p className="text-sm text-[#6B7280]">{message}</p>
        <button
          onClick={onRetry}
          className="rounded-md bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#4338CA]"
        >
          Try again
        </button>
      </div>
    );
  }

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

  function DetailRow({
    label,
    value,
    mono = false,
    breakAll = false,
    status,
  }: {
    label: string;
    value: string;
    mono?: boolean;
    breakAll?: boolean;
    status?: "active" | "expired";
  }) {
    return (
      <div className="flex flex-col justify-between gap-1 border-t border-[#E5E7EB] py-3 first:border-t-0 sm:flex-row">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
          {label}
        </span>

        {status ? (
          <span
            className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${
              status === "expired"
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {value}
          </span>
        ) : (
          <span
            className={`text-sm font-medium text-[#111827] ${
              mono
                ? "rounded border border-[#E5E7EB] bg-[#F8FAFC] px-2 py-1 font-mono"
                : ""
            } ${breakAll ? "break-all sm:max-w-md sm:text-right" : ""}`}
          >
            {value}
          </span>
        )}
      </div>
    );
  }
}

export default App;
