"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Calendar,
  Bell,
  Settings,
  Tag,
  BarChart3,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/tasks", icon: CheckSquare, label: "All Tasks" },
  { href: "/dashboard/projects", icon: FolderKanban, label: "Projects" },
  { href: "/dashboard/calendar", icon: Calendar, label: "Calendar" },
  { href: "/dashboard/tags", icon: Tag, label: "Tags" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/notifications", icon: Bell, label: "Notifications" },
];

type User = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function Sidebar({ user }: { user?: User }) {
  const pathname = usePathname();

  return (
    <aside
      className="w-64 flex flex-col h-full glass border-r"
      style={{ borderColor: "hsl(var(--border))" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: "hsl(var(--border-subtle))" }}>
        <div
          className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0"
          style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.4)" }}
        >
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <span className="font-bold text-base gradient-text">TaskFlow</span>
          <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>Personal Manager</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: isActive ? "hsl(var(--primary-muted))" : "transparent",
                color: isActive ? "hsl(var(--primary))" : "hsl(var(--text-secondary))",
                borderLeft: isActive ? "3px solid hsl(var(--primary))" : "3px solid transparent",
              }}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t" style={{ borderColor: "hsl(var(--border-subtle))" }}>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
          style={{ color: "hsl(var(--text-secondary))" }}
        >
          {user?.image ? (
            <img src={user.image} alt={user.name ?? ""} className="w-8 h-8 rounded-full" style={{ border: "2px solid hsl(var(--border))" }} />
          ) : (
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xs">
              {user?.name?.[0] ?? "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--text-primary))" }}>{user?.name}</p>
            <p className="text-xs truncate" style={{ color: "hsl(var(--text-muted))" }}>{user?.email}</p>
          </div>
          <Settings size={15} style={{ color: "hsl(var(--text-muted))" }} />
        </Link>
      </div>
    </aside>
  );
}
