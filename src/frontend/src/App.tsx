import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/store";
import AnalyticsPage from "@/pages/AnalyticsPage";
import AuditReportsPage from "@/pages/AuditReportsPage";
import AuditSummaryPage from "@/pages/AuditSummaryPage";
import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/LoginPage";
import MyAuditReportsPage from "@/pages/MyAuditReportsPage";
import OutletsPage from "@/pages/OutletsPage";
import StartAuditPage from "@/pages/StartAuditPage";
import UsersPage from "@/pages/UsersPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import {
  Outlet,
  createRootRoute,
  createRoute,
  redirect,
} from "@tanstack/react-router";

// Dark mode init
const initDarkMode = () => {
  const saved = localStorage.getItem("oho_dark_mode");
  if (
    saved === "true" ||
    (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.add("dark");
  }
};
initDarkMode();

const queryClient = new QueryClient();

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  beforeLoad: () => {
    if (!getSession()) {
      throw redirect({ to: "/login" });
    }
  },
  component: Layout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const usersRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/users",
  beforeLoad: () => {
    const session = getSession();
    if (session?.role === "auditor") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: UsersPage,
});

const outletsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/outlets",
  beforeLoad: () => {
    const session = getSession();
    if (session?.role === "auditor") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: OutletsPage,
});

const auditReportsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/audit-reports",
  beforeLoad: () => {
    const session = getSession();
    if (session?.role === "auditor") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AuditReportsPage,
});

const analyticsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/analytics",
  beforeLoad: () => {
    const session = getSession();
    if (session?.role === "auditor") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AnalyticsPage,
});

const startAuditRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/start-audit",
  component: StartAuditPage,
});

const myAuditsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/my-audits",
  component: MyAuditReportsPage,
});

const auditSummaryRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/audit-summary/$id",
  component: AuditSummaryPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: getSession() ? "/dashboard" : "/login" });
  },
  component: () => null,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  protectedLayoutRoute.addChildren([
    dashboardRoute,
    usersRoute,
    outletsRoute,
    auditReportsRoute,
    analyticsRoute,
    startAuditRoute,
    myAuditsRoute,
    auditSummaryRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
