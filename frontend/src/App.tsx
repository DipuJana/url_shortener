import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import Toast from "./components/Toast";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";

const TOKEN_KEY = "routex_token";
const EMAIL_KEY = "routex_email";

type Route = "home" | "login" | "register" | "dashboard" | "analytics";

  // type UrlItem

  //type Analytics

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

  // function formatDate

  // async function readError

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredEmail(): string {
  return localStorage.getItem(EMAIL_KEY) ?? "";
}

// function ectractToken ()

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

//  const urls
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
    // setUrls([]);
    navigateTo("home");
    showToast("Successfully logged out.");
  };

  // const authenticatedFetch

  // loadUrls

  // Toast

  // Navbar

  // HomePage

  // LoginPage

  // RegisterPage

  // DashboardPage

  // AnalyticsPage

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#111827]">
      <Navbar
          isAuthenticated={isAuthenticated}
          userEmail={userEmail}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() =>
              setMobileMenuOpen((open) => !open)
          }
          onNavigate={(route) => navigateTo(route)}
          onLogout={handleLogout}
      />

      <Toast message={toastMessage} />

      <main>
        {currentRoute === "home" && (
            <HomePage
                isAuthenticated={isAuthenticated}
                prefillUrl={prefillUrl}
                setPrefillUrl={setPrefillUrl}
                navigateTo={navigateTo}
                showToast={showToast}
            />
        )}
        {currentRoute === "login" && (
            <LoginPage
                onLoginSuccess={(email) => {
                  setIsAuthenticated(true);
                  setUserEmail(email);
                }}
                onNavigate={navigateTo}
                onShowToast={showToast}
            />
        )}
        {currentRoute === "register" && (
            <RegisterPage
                onNavigate={navigateTo}
                onShowToast={showToast}
            />
        )}
        {currentRoute === "dashboard" && (
            <DashboardPage
                prefillUrl={prefillUrl}
                onClearPrefillUrl={() => setPrefillUrl("")}
                onNavigate={navigateTo}
                onShowToast={showToast}
            />
        )}
        {currentRoute === "analytics" && (
            <AnalyticsPage
                urlId={selectedUrlId}
                onNavigate={navigateTo}
                onShowToast={showToast}
            />
        )}
      </main>
    </div>
  );

  // function AuthShell

  // FormField

  // SubmitButton

  // function ErrorBox

  // function LoadingBox

  // ErrorState

  // EmptyState

  // function DetailRow
}

export default App;
