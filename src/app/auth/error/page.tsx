"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (err: string | null) => {
    switch (err) {
      case "Configuration":
        return "There is a problem with the server configuration. Please check your environment variables.";
      case "AccessDenied":
        return "Access was denied. You do not have permission to sign in.";
      case "Verification":
        return "The verification link was invalid or has expired.";
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
        return "An error occurred with Google OAuth login. Please try again.";
      default:
        return "An unexpected authentication error occurred.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "hsl(var(--background))" }}>
      <div
        className="glass rounded-2xl max-w-md w-full p-8 text-center animate-slide-up"
        style={{ border: "1px solid hsl(var(--border))" }}
      >
        <div
          className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-5"
          style={{ background: "hsl(var(--danger-muted))" }}
        >
          <AlertTriangle size={28} style={{ color: "hsl(var(--danger))" }} />
        </div>

        <h1 className="text-xl font-bold mb-2" style={{ color: "hsl(var(--text-primary))" }}>
          Authentication Error
        </h1>
        <p className="text-sm mb-6" style={{ color: "hsl(var(--text-muted))" }}>
          {getErrorMessage(error)}
        </p>

        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold gradient-primary text-white cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  );
}
