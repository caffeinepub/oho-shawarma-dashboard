import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAuditReports,
  getMyAuditSubmissions,
  getOutlets,
  getSession,
  getUsers,
} from "@/lib/store";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  ClipboardList,
  PlusCircle,
  Store,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function AuditorDashboard() {
  const session = getSession();
  const navigate = useNavigate();
  const [myAudits] = useState(() =>
    session ? getMyAuditSubmissions(session.userId) : [],
  );

  const recent = [...myAudits]
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-[#fdbc0c] pl-4">
        <h2 className="font-display font-bold text-2xl">
          Welcome back, {session?.name} 👋
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Ready to start a new audit? Your recent activity is below.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Total Audits
            </CardTitle>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#e0f2fe" }}
            >
              <ClipboardList className="w-5 h-5" style={{ color: "#0ea5e9" }} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-display font-bold text-3xl">{myAudits.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Audits submitted by you
            </p>
          </CardContent>
        </Card>

        <Card className="border flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quick Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full gap-2 btn-brand"
              data-ocid="auditor.start_audit.primary_button"
              onClick={() => navigate({ to: "/start-audit" })}
            >
              <PlusCircle className="w-4 h-4" />
              Start New Audit
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border">
        <CardHeader>
          <CardTitle className="font-display font-semibold text-base">
            Recent Audits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div
              data-ocid="auditor.recent_audits.empty_state"
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <ClipboardList className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-muted-foreground">No audits yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Start your first audit to see it here
              </p>
            </div>
          ) : (
            <Table data-ocid="auditor.recent_audits.table">
              <TableHeader>
                <TableRow className="bg-muted/40 tr-brand-header">
                  <TableHead className="font-semibold th-brand">
                    Outlet
                  </TableHead>
                  <TableHead className="font-semibold th-brand">Date</TableHead>
                  <TableHead className="font-semibold th-brand">
                    Score
                  </TableHead>
                  <TableHead className="font-semibold th-brand">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((audit, idx) => (
                  <TableRow
                    key={audit.id}
                    data-ocid={`auditor.recent_audits.item.${idx + 1}`}
                  >
                    <TableCell className="font-medium">
                      {audit.outletName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(audit.submittedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${scoreColor(audit.score)}`}>
                        {audit.score}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {audit.score >= 70 ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Pass
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">
                          <XCircle className="w-3 h-3 mr-1" />
                          Fail
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const STAT_ICON_COLORS = [
  { bg: "#e0f2fe", icon: "#0ea5e9" }, // sky for Users
  { bg: "#d1fae5", icon: "#10b981" }, // emerald for Outlets
  { bg: "#ede9fe", icon: "#8b5cf6" }, // violet for Audits
  { bg: "#ffedd5", icon: "#f97316" }, // orange for Auditors
];

function AdminDashboard() {
  const session = getSession();
  const [users] = useState(() => getUsers());
  const [outlets] = useState(() => getOutlets());
  const [audits] = useState(() => getAuditReports());

  const auditorCount = users.filter((u) => u.role === "auditor").length;

  const stats = [
    {
      label: "Total Users",
      value: users.length,
      icon: Users,
      description: "Active team members",
    },
    {
      label: "Total Outlets",
      value: outlets.length,
      icon: Store,
      description: "Active restaurant locations",
    },
    {
      label: "Total Audits",
      value: audits.length,
      icon: ClipboardList,
      description: "Audit reports on record",
    },
    {
      label: "Auditors",
      value: auditorCount,
      icon: TrendingUp,
      description: "Users with auditor role",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-[#fdbc0c] pl-4">
        <h2 className="font-display font-bold text-2xl">
          Welcome back, {session?.name} 👋
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Here's an overview of your Oho Shawarma operations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={stat.label} className="border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: STAT_ICON_COLORS[i].bg }}
              >
                <stat.icon
                  className="w-5 h-5"
                  style={{ color: STAT_ICON_COLORS[i].icon }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-display font-bold text-3xl">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border">
        <CardHeader>
          <CardTitle className="font-display font-semibold text-base">
            Quick Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Logged in as</span>
            <span className="text-sm font-medium">{session?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Role</span>
            <span className="text-sm font-medium capitalize">
              {session?.role}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">System</span>
            <span className="text-sm font-medium">
              Oho Shawarma Internal v2.0
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const session = getSession();
  if (session?.role === "auditor") {
    return <AuditorDashboard />;
  }
  return <AdminDashboard />;
}
