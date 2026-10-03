import { useState } from "react";

import { register } from "../api/authApi";
import AuthShell from "../components/AuthShell";
import ErrorBox from "../components/ErrorBox";
import FormField from "../components/FormField";
import SubmitButton from "../components/SubmitButton";

type RegisterPageProps = {
    onNavigate: (
        route: "home" | "login" | "register" | "dashboard"
    ) => void;
    onShowToast: (message: string) => void;
};

function RegisterPage({
                          onNavigate,
                          onShowToast,
                      }: RegisterPageProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleRegister = async (event: React.FormEvent) => {
        event.preventDefault();

        setIsLoading(true);
        setErrorMessage(null);

        try {
            await register(email, password);

            onShowToast("Account created. Please sign in.");
            onNavigate("login");
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
                    type="button"
                    onClick={() => onNavigate("login")}
                    className="font-medium text-[#4F46E5] hover:underline"
                >
                    Sign in
                </button>
            </p>
        </AuthShell>
    );
}

export default RegisterPage;