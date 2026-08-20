"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{ background: "hsl(var(--background))" }} />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -20%, hsl(var(--primary) / 0.4), transparent), radial-gradient(ellipse 60% 40% at 80% 80%, hsl(var(--accent) / 0.3), transparent)",
        }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto px-6 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 gradient-primary shadow-lg"
            style={{ boxShadow: "0 0 40px hsl(var(--primary) / 0.4)" }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M6 8h14M6 14h10M6 20h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="24" cy="20" r="6" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2" />
              <path d="M21 20l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">TaskFlow</h1>
          <p style={{ color: "hsl(var(--text-secondary))" }} className="text-sm">
            Your personal productivity command center
          </p>
        </div>

        {/* Card */}
        <div
          className="glass-elevated rounded-2xl p-8"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          <h2
            className="text-xl font-semibold mb-2 text-center"
            style={{ color: "hsl(var(--text-primary))" }}
          >
            Welcome back
          </h2>
          <p
            className="text-center text-sm mb-8"
            style={{ color: "hsl(var(--text-muted))" }}
          >
            Sign in to access your tasks, calendar sync, and notifications.
          </p>

          <button
            id="google-signin-btn"
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 rounded-xl px-6 py-3.5 font-medium text-sm transition-all duration-200 cursor-pointer"
            style={{
              background: "hsl(var(--surface-elevated))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--text-primary))",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "hsl(var(--primary))";
              e.currentTarget.style.background = "hsl(var(--primary-muted))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "hsl(var(--border))";
              e.currentTarget.style.background = "hsl(var(--surface-elevated))";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z" />
              <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24Z" />
              <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09Z" />
              <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96Z" />
            </svg>
            Continue with Google
          </button>

          <p
            className="text-center text-xs mt-6"
            style={{ color: "hsl(var(--text-muted))" }}
          >
            By signing in, you grant access to Google Calendar and Gmail
            for task sync and reminders.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: "📅", label: "Calendar Sync" },
            { icon: "🔔", label: "Push Alerts" },
            { icon: "📄", label: "PDF Export" },
          ].map((f) => (
            <div
              key={f.label}
              className="glass rounded-xl p-3 text-center"
              style={{ border: "1px solid hsl(var(--border-subtle))" }}
            >
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                {f.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
