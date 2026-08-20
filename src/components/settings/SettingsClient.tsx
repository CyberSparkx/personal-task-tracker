"use client";

import { signOut, signIn } from "next-auth/react";
import {
  User, Mail, Link2, Shield, Bell, LogOut,
  CheckCircle2, AlertCircle, ExternalLink,
} from "lucide-react";

type Props = {
  user: { id: string; name?: string | null; email?: string | null; image?: string | null };
  googleLinked: boolean;
  googleScopes: string | null;
  vapidPublicKey: string | null;
};

export function SettingsClient({ user, googleLinked, googleScopes, vapidPublicKey }: Props) {
  const hasCalendarScope = googleScopes?.includes("calendar") ?? false;
  const hasGmailScope = googleScopes?.includes("gmail") ?? false;

  return (
    <div className="max-w-2xl space-y-5">
      {/* Profile */}
      <div className="glass rounded-2xl p-6" style={{ border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(var(--primary-muted))" }}>
            <User size={16} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h2 className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>Profile</h2>
        </div>
        <div className="flex items-center gap-4">
          {user.image ? (
            <img src={user.image} alt={user.name ?? ""} className="w-14 h-14 rounded-full"
              style={{ border: "2px solid hsl(var(--border))" }} />
          ) : (
            <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg">
              {user.name?.[0] ?? "U"}
            </div>
          )}
          <div>
            <p className="font-semibold text-base" style={{ color: "hsl(var(--text-primary))" }}>{user.name}</p>
            <p className="text-sm flex items-center gap-1.5 mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
              <Mail size={13} /> {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Google Integration */}
      <div className="glass rounded-2xl p-6" style={{ border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(var(--accent-muted))" }}>
            <Link2 size={16} style={{ color: "hsl(var(--accent))" }} />
          </div>
          <h2 className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>Google Integration</h2>
        </div>

        <div className="space-y-3">
          {/* Connection status */}
          <div className="flex items-center justify-between py-3 border-b"
            style={{ borderColor: "hsl(var(--border-subtle))" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "hsl(var(--text-primary))" }}>Google Account</p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
                {user.email}
              </p>
            </div>
            {googleLinked ? (
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                style={{ background: "hsl(var(--success-muted))", color: "hsl(var(--success))" }}>
                <CheckCircle2 size={12} /> Connected
              </span>
            ) : (
              <button id="connect-google-btn" onClick={() => signIn("google")}
                className="text-xs px-3 py-1.5 rounded-lg cursor-pointer gradient-primary text-white">
                Connect
              </button>
            )}
          </div>

          {/* Scopes */}
          <ScopeRow label="Google Calendar" granted={hasCalendarScope}
            desc="Create and update Calendar events from tasks" />
          <ScopeRow label="Gmail / Email" granted={hasGmailScope}
            desc="Send reminder emails and daily digest" />
        </div>

        {googleLinked && (!hasCalendarScope || !hasGmailScope) && (
          <button id="reconnect-google-btn"
            onClick={() => signIn("google")}
            className="mt-4 flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl cursor-pointer"
            style={{ background: "hsl(var(--warning-muted))", color: "hsl(var(--warning))", border: "1px solid hsl(var(--warning) / 0.3)" }}>
            <AlertCircle size={15} /> Re-authenticate to grant missing permissions
          </button>
        )}
      </div>

      {/* Push Notifications */}
      <div className="glass rounded-2xl p-6" style={{ border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(var(--primary-muted))" }}>
            <Bell size={16} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h2 className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>Push Notifications</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "hsl(var(--text-primary))" }}>VAPID Keys</p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
              Required for Web Push to work on this server
            </p>
          </div>
          {vapidPublicKey ? (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
              style={{ background: "hsl(var(--success-muted))", color: "hsl(var(--success))" }}>
              <CheckCircle2 size={12} /> Configured
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
              style={{ background: "hsl(var(--danger-muted))", color: "hsl(var(--danger))" }}>
              <AlertCircle size={12} /> Not configured
            </span>
          )}
        </div>
        {!vapidPublicKey && (
          <div className="mt-4 p-3 rounded-xl text-xs font-mono"
            style={{ background: "hsl(var(--surface-elevated))", color: "hsl(var(--text-muted))", border: "1px solid hsl(var(--border))" }}>
            npx web-push generate-vapid-keys
          </div>
        )}
      </div>

      {/* Security */}
      <div className="glass rounded-2xl p-6" style={{ border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(var(--danger-muted))" }}>
            <Shield size={16} style={{ color: "hsl(var(--danger))" }} />
          </div>
          <h2 className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>Security</h2>
        </div>
        <button id="signout-settings-btn"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-pointer"
          style={{ background: "hsl(var(--danger-muted))", color: "hsl(var(--danger))", border: "1px solid hsl(var(--danger) / 0.3)" }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}

function ScopeRow({ label, granted, desc }: { label: string; granted: boolean; desc: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium" style={{ color: "hsl(var(--text-primary))" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>{desc}</p>
      </div>
      <span className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full ${granted ? "" : ""}`}
        style={{
          background: granted ? "hsl(var(--success-muted))" : "hsl(var(--surface-elevated))",
          color: granted ? "hsl(var(--success))" : "hsl(var(--text-muted))",
        }}>
        {granted ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
        {granted ? "Granted" : "Not granted"}
      </span>
    </div>
  );
}
