import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function Login() {
  const { user, loading, signInWithGoogle } = useAuth();
  const { theme } = useTheme();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {theme === "dark" ? (
              <img
                src="/flow-logo-white.png"
                alt="Flow AI"
                className="h-12 w-auto object-contain"
              />
            ) : (
              <img
                src="/flow-logo.png"
                alt="Flow AI"
                className="h-12 w-auto object-contain"
              />
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome to AI Architect
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to start transforming meeting transcripts into developer-ready specifications.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl border-2 border-border bg-card text-sm font-semibold text-foreground hover:bg-muted/60 hover:border-indigo-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {signingIn ? "Signing in..." : "Continue with Google"}
          </button>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
              <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}
