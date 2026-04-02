import { Button } from "@/components/ui/button";
import { getSession, logout } from "@/lib/store";
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BarChart2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  Store,
  Sun,
  Users,
  Wrench,
} from "lucide-react";
import { useState } from "react";

// Light mode (brand)
const LIGHT = {
  bg: "#361e14",
  text: "#ffffff",
  textDim: "rgba(255,255,255,0.65)",
  activeBg: "#fdbc0c",
  activeText: "#361e14",
  border: "rgba(255,255,255,0.1)",
  avatarBg: "#fdbc0c",
  avatarText: "#361e14",
};

// Dark mode (neutral)
const DARK = {
  bg: "#1e293b",
  text: "#e2e8f0",
  textDim: "rgba(226,232,240,0.6)",
  activeBg: "#334155",
  activeText: "#f1f5f9",
  border: "rgba(255,255,255,0.08)",
  avatarBg: "#475569",
  avatarText: "#f1f5f9",
};

const adminNavItems = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "sidebar.dashboard_link",
  },
  {
    path: "/outlets",
    label: "Outlet Management",
    icon: Store,
    ocid: "sidebar.outlets_link",
  },
  {
    path: "/users",
    label: "User Management",
    icon: Users,
    ocid: "sidebar.users_link",
  },
  {
    path: "/audit-reports",
    label: "Audit Reports",
    icon: ClipboardList,
    ocid: "sidebar.audit_reports_link",
  },
  {
    path: "/analytics",
    label: "Analytics",
    icon: BarChart2,
    ocid: "sidebar.analytics_link",
  },
  {
    path: "/maintenance-tracker",
    label: "Maintenance Tracker",
    icon: Wrench,
    ocid: "sidebar.maintenance_tracker_link",
  },
];

const auditorNavItems = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "sidebar.dashboard_link",
  },
  {
    path: "/start-audit",
    label: "Start Audit",
    icon: PlusCircle,
    ocid: "sidebar.start_audit_link",
  },
  {
    path: "/my-audits",
    label: "My Audit Reports",
    icon: FileText,
    ocid: "sidebar.my_audits_link",
  },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "User Management",
  "/outlets": "Outlet Management",
  "/audit-reports": "Audit Reports",
  "/start-audit": "Start Audit",
  "/my-audits": "My Audit Reports",
  "/analytics": "Analytics",
  "/maintenance-tracker": "Maintenance Tracker",
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("oho_dark_mode");
    const isDark =
      saved !== null
        ? saved === "true"
        : document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", isDark);
    return isDark;
  });

  const C = dark ? DARK : LIGHT;

  const navItems =
    session?.role === "auditor" ? auditorNavItems : adminNavItems;

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("oho_dark_mode", String(next));
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const currentTitle = pageTitles[location.pathname] ?? "Dashboard";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo & Brand */}
      <div
        className="flex items-center gap-3 px-5 py-6"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <img
          src="/assets/uploads/Logo_small-1.png"
          alt="Oho Shawarma"
          className="w-10 h-10 object-contain flex-shrink-0"
        />
        <div>
          <p
            className="font-display font-bold text-sm leading-tight"
            style={{ color: C.text }}
          >
            Oho Shawarma
          </p>
          <p className="text-xs leading-tight" style={{ color: C.textDim }}>
            Auditing Dashboard
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              type="button"
              key={item.path}
              data-ocid={item.ocid}
              onClick={() => {
                navigate({ to: item.path });
                setMobileOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all"
              style={{
                backgroundColor: active ? C.activeBg : "transparent",
                color: active ? C.activeText : C.text,
                fontWeight: active ? 600 : 500,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    C.activeBg;
                  (e.currentTarget as HTMLButtonElement).style.color =
                    C.activeText;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = C.text;
                }
              }}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="px-3 py-4" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              backgroundColor: C.avatarBg,
              color: C.avatarText,
            }}
          >
            {session?.name?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="min-w-0">
            <p
              className="text-xs font-semibold truncate"
              style={{ color: C.text }}
            >
              {session?.name}
            </p>
            <p
              className="text-xs truncate capitalize"
              style={{ color: C.textDim }}
            >
              {session?.role}
            </p>
          </div>
        </div>
        <button
          type="button"
          data-ocid="sidebar.logout_button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all"
          style={{ color: C.textDim }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(239,68,68,0.15)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = C.textDim;
          }}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex w-64 flex-col flex-shrink-0"
        style={{ backgroundColor: C.bg }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            role="button"
            tabIndex={0}
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
          />
          <aside
            className="absolute left-0 top-0 h-full w-64 flex flex-col"
            style={{ backgroundColor: C.bg }}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 md:px-6 h-14 border-b bg-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="font-display font-semibold text-lg">
              {currentTitle}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              data-ocid="header.dark_mode_toggle"
              onClick={toggleDark}
              className="rounded-full"
            >
              {dark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
