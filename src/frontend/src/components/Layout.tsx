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
} from "lucide-react";
import { useState } from "react";

const SIDEBAR_BG = "#361e14";
const SIDEBAR_ACTIVE_BG = "#fdbc0c";
const SIDEBAR_ACTIVE_TEXT = "#361e14";
const SIDEBAR_TEXT = "#ffffff";
const SIDEBAR_TEXT_DIM = "rgba(255,255,255,0.65)";
const _SIDEBAR_HOVER_BG = "rgba(253,188,12,0.15)";
const SIDEBAR_BORDER = "rgba(255,255,255,0.1)";

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
        style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}
      >
        <img
          src="/assets/uploads/Logo_small-1.png"
          alt="Oho Shawarma"
          className="w-10 h-10 object-contain flex-shrink-0"
        />
        <div>
          <p
            className="font-display font-bold text-sm leading-tight"
            style={{ color: SIDEBAR_TEXT }}
          >
            Oho Shawarma
          </p>
          <p
            className="text-xs leading-tight"
            style={{ color: SIDEBAR_TEXT_DIM }}
          >
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
                backgroundColor: active ? SIDEBAR_ACTIVE_BG : "transparent",
                color: active ? SIDEBAR_ACTIVE_TEXT : SIDEBAR_TEXT,
                fontWeight: active ? 600 : 500,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    SIDEBAR_ACTIVE_BG;
                  (e.currentTarget as HTMLButtonElement).style.color =
                    SIDEBAR_ACTIVE_TEXT;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    SIDEBAR_TEXT;
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
      <div
        className="px-3 py-4"
        style={{ borderTop: `1px solid ${SIDEBAR_BORDER}` }}
      >
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              backgroundColor: SIDEBAR_ACTIVE_BG,
              color: SIDEBAR_ACTIVE_TEXT,
            }}
          >
            {session?.name?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="min-w-0">
            <p
              className="text-xs font-semibold truncate"
              style={{ color: SIDEBAR_TEXT }}
            >
              {session?.name}
            </p>
            <p
              className="text-xs truncate capitalize"
              style={{ color: SIDEBAR_TEXT_DIM }}
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
          style={{ color: SIDEBAR_TEXT_DIM }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(239,68,68,0.15)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color =
              SIDEBAR_TEXT_DIM;
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
        style={{ backgroundColor: SIDEBAR_BG }}
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
            style={{ backgroundColor: SIDEBAR_BG }}
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
          <Button
            variant="ghost"
            size="icon"
            data-ocid="header.dark_mode_toggle"
            onClick={toggleDark}
            className="rounded-full"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
