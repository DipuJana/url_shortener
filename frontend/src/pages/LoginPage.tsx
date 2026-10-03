import { useState } from "react";

import { login } from "../api/authApi";
import AuthShell from "../components/AuthShell";
import ErrorBox from "../components/ErrorBox";
import FormField from "../components/FormField";
import SubmitButton from "../components/SubmitButton";
import { saveAuth } from "../utils/auth";

type LoginPageProps = {
    onLoginSuccess: (email: string) => void;
    onNavigate: (route: "home" | "login" | "register" | "dashboard") => void;
    onShowToast: (message: string) => void;
};

function LoginPage({
                       onLoginSuccess,
                       onNavigate,
                       onShowToast,
                   }: LoginPageProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();

        setIsLoading(true);
        setErrorMessage(null);

        try {
            const response = await login(email, password);

            saveAuth(response.token, email);

            onLoginSuccess(email);
            onShowToast("Signed in successfully.");
            onNavigate("dashboard");
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
                    type="button"
                    onClick={() => onNavigate("register")}
                    className="font-medium text-[#4F46E5] hover:underline"
                >
                    Create an account
                </button>
            </p>
        </AuthShell>
    );
}

export default LoginPage;