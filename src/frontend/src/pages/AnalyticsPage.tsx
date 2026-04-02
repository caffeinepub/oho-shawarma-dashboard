import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type AuditReport,
  type AuditSubmission,
  getAuditReports,
  getAuditSubmissions,
} from "@/lib/store";
import {
  Activity,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Store,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ---- Color Palette ----
const ANALYTICS_ACCENT = "#0ea5e9";
const TIER_COLORS = {
  excellent: "#22c55e",
  good: "#3b82f6",
  needsImprovement: "#f97316",
  critical: "#ef4444",
};

// Flat colorful palette for section/hygiene bars
const FLAT_COLORS = [
  "#0ea5e9", // sky blue
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f97316", // orange
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
];

function scoreTier(
  score: number,
): "excellent" | "good" | "needsImprovement" | "critical" {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "needsImprovement";
  return "critical";
}

const SECTION_IDS = [
  "shop-exterior",
  "kitchen-floors-walls",
  "equipment-cleanliness",
  "other-operations",
  "food-handling-safety",
  "employee-hygiene",
  "raw-material-compliance",
];

const SECTION_SHORT: Record<string, string> = {
  "shop-exterior": "Shop Exterior",
  "kitchen-floors-walls": "Kitchen Floors",
  "equipment-cleanliness": "Equipment",
  "other-operations": "Operations",
  "food-handling-safety": "Food Safety",
  "employee-hygiene": "Employee Hygiene",
  "raw-material-compliance": "Raw Material",
};

const HYGIENE_CATEGORIES = [
  {
    name: "Outlet Hygiene",
    key: "outlet-hygiene",
    sectionIds: ["shop-exterior"],
  },
  {
    name: "Cleaning Compliance",
    key: "cleaning-compliance",
    sectionIds: [
      "kitchen-floors-walls",
      "equipment-cleanliness",
      "other-operations",
    ],
  },
  {
    name: "Food Hygiene",
    key: "food-hygiene",
    sectionIds: ["food-handling-safety"],
  },
  {
    name: "Employee Hygiene",
    key: "employee-hygiene",
    sectionIds: ["employee-hygiene"],
  },
  {
    name: "Raw Material",
    key: "raw-material",
    sectionIds: ["raw-material-compliance"],
  },
];

type DrillDown =
  | { type: "tier"; key: string; label: string }
  | { type: "section"; key: string; label: string }
  | { type: "hygiene"; key: string; label: string };

interface DrillOutlet {
  name: string;
  score: number;
  count: number;
}

function scoreRing(score: number) {
  if (score >= 90) return "bg-green-500";
  if (score >= 75) return "bg-blue-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function DrillDownPanel({
  drillDown,
  outlets,
  onClose,
}: {
  drillDown: DrillDown;
  outlets: DrillOutlet[];
  onClose: () => void;
}) {
  return (
    <div className="border rounded-lg bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Outlet breakdown
          </p>
          <p className="font-semibold text-sm mt-0.5">{drillDown.label}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
          data-ocid="analytics.drill_down.close_button"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
      {outlets.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No outlets found for this selection.
        </p>
      ) : (
        <ScrollArea className="max-h-64">
          <div className="space-y-2 pr-2">
            {outlets.map((o, idx) => (
              <div
                key={o.name}
                className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors"
              >
                <span className="text-xs text-muted-foreground w-5 text-right font-mono">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{o.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.count} audit{o.count !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${scoreRing(o.score)}`}
                      style={{ width: `${o.score}%` }}
                    />
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      o.score >= 90
                        ? "text-green-600 dark:text-green-400"
                        : o.score >= 75
                          ? "text-blue-600 dark:text-blue-400"
                          : o.score >= 60
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {o.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

const trendChartConfig: ChartConfig = {
  score: { label: "Avg Compliance %", color: "#0ea5e9" },
};

// Normalize date to YYYY-MM-DD for consistent comparison.
// Handles both DD/MM/YYYY (audit form format) and YYYY-MM-DD (ISO) inputs.
function toISODate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  // DD/MM/YYYY → YYYY-MM-DD
  const ddmmyyyy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  // Already YYYY-MM-DD or ISO timestamp → take first 10 chars
  return dateStr.slice(0, 10);
}

export default function AnalyticsPage() {
  const [allReports, setAllReports] = useState<AuditReport[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<AuditSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOutlet, setFilterOutlet] = useState("all");
  const [filterAuditor, setFilterAuditor] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [drillDown, setDrillDown] = useState<DrillDown | null>(null);

  useEffect(() => {
    Promise.all([getAuditReports(), getAuditSubmissions()])
      .then(([reports, submissions]) => {
        setAllReports(reports);
        setAllSubmissions(submissions);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load analytics data:", err);
        setLoading(false);
      });
  }, []);

  const outletOptions = useMemo(
    () => Array.from(new Set(allReports.map((r) => r.outletName))).sort(),
    [allReports],
  );

  const auditorOptions = useMemo(
    () => Array.from(new Set(allReports.map((r) => r.auditorName))).sort(),
    [allReports],
  );

  const filteredReports = useMemo(
    () =>
      allReports.filter((r) => {
        if (filterOutlet !== "all" && r.outletName !== filterOutlet)
          return false;
        if (filterAuditor !== "all" && r.auditorName !== filterAuditor)
          return false;
        const rDate = toISODate(r.date);
        if (filterDateFrom && rDate < filterDateFrom) return false;
        if (filterDateTo && rDate > filterDateTo) return false;
        return true;
      }),
    [allReports, filterOutlet, filterAuditor, filterDateFrom, filterDateTo],
  );

  const filteredSubmissions = useMemo(
    () =>
      allSubmissions.filter((s) => {
        const date = s.auditDate || s.submittedAt?.slice(0, 10);
        if (filterOutlet !== "all" && s.outletName !== filterOutlet)
          return false;
        if (filterAuditor !== "all" && s.auditorName !== filterAuditor)
          return false;
        const normDate = toISODate(date);
        if (filterDateFrom && normDate && normDate < filterDateFrom)
          return false;
        if (filterDateTo && normDate && normDate > filterDateTo) return false;
        return true;
      }),
    [allSubmissions, filterOutlet, filterAuditor, filterDateFrom, filterDateTo],
  );

  const clearFilters = () => {
    setFilterOutlet("all");
    setFilterAuditor("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const hasFilters =
    filterOutlet !== "all" ||
    filterAuditor !== "all" ||
    !!filterDateFrom ||
    !!filterDateTo;

  // KPIs
  const totalAudits = filteredReports.length;
  const avgScore =
    totalAudits > 0
      ? Math.round(
          filteredReports.reduce((s, r) => s + r.score, 0) / totalAudits,
        )
      : 0;
  const passRate =
    totalAudits > 0
      ? Math.round(
          (filteredReports.filter((r) => r.score >= 75).length / totalAudits) *
            100,
        )
      : 0;
  const outletsAudited = new Set(filteredReports.map((r) => r.outletName)).size;

  // Chart 1: Pie - compliance tiers
  const tierCounts = useMemo(() => {
    const counts = { excellent: 0, good: 0, needsImprovement: 0, critical: 0 };
    for (const r of filteredReports) {
      counts[scoreTier(r.score)]++;
    }
    return [
      {
        name: "excellent",
        label: "Excellent",
        value: counts.excellent,
        fill: TIER_COLORS.excellent,
      },
      {
        name: "good",
        label: "Good",
        value: counts.good,
        fill: TIER_COLORS.good,
      },
      {
        name: "needsImprovement",
        label: "Needs Improvement",
        value: counts.needsImprovement,
        fill: TIER_COLORS.needsImprovement,
      },
      {
        name: "critical",
        label: "Critical",
        value: counts.critical,
        fill: TIER_COLORS.critical,
      },
    ].filter((d) => d.value > 0);
  }, [filteredReports]);

  // Chart 2: Outlet Performance
  const outletPerformance = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    for (const r of filteredReports) {
      if (!map[r.outletName]) map[r.outletName] = { total: 0, count: 0 };
      map[r.outletName].total += r.score;
      map[r.outletName].count++;
    }
    return Object.entries(map)
      .map(([name, d]) => ({
        name,
        score: Math.round(d.total / d.count),
        count: d.count,
      }))
      .sort((a, b) => b.score - a.score);
  }, [filteredReports]);

  const outletChartWidth = Math.max(600, outletPerformance.length * 85);

  // Chart 3: Section Performance
  const sectionPerformance = useMemo(() => {
    if (filteredSubmissions.length === 0) return [];
    return SECTION_IDS.map((id) => {
      const scores = filteredSubmissions
        .map((s) => s.sectionScores?.[id])
        .filter((v): v is number => v !== undefined && v !== null);
      const avg =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;
      return { name: SECTION_SHORT[id], score: avg, id };
    });
  }, [filteredSubmissions]);

  // Chart 4: Hygiene Compliance
  const hygieneData = useMemo(() => {
    return HYGIENE_CATEGORIES.map((cat) => {
      const allScores: number[] = [];
      for (const s of filteredSubmissions) {
        for (const id of cat.sectionIds) {
          const v = s.sectionScores?.[id];
          if (v !== undefined && v !== null) allScores.push(v);
        }
      }
      const avg =
        allScores.length > 0
          ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
          : 0;
      return { name: cat.name, score: avg, key: cat.key };
    });
  }, [filteredSubmissions]);

  // Chart 5: Trend Over Time
  const trendData = useMemo(() => {
    const dayMap: Record<string, { total: number; count: number }> = {};
    for (const s of filteredSubmissions) {
      const rawDay = s.auditDate || s.submittedAt?.slice(0, 10);
      const day = toISODate(rawDay);
      if (!day) continue;
      if (!dayMap[day]) dayMap[day] = { total: 0, count: 0 };
      dayMap[day].total += s.score;
      dayMap[day].count++;
    }
    if (Object.keys(dayMap).length === 0) {
      for (const r of filteredReports) {
        const day = toISODate(r.date);
        if (!dayMap[day]) dayMap[day] = { total: 0, count: 0 };
        dayMap[day].total += r.score;
        dayMap[day].count++;
      }
    }
    // Sort ascending: oldest date on the left, newest on the right
    return Object.entries(dayMap)
      .map(([date, d]) => ({ date, score: Math.round(d.total / d.count) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSubmissions, filteredReports]);

  // ---- Drill-down data ----
  const drillOutlets = useMemo((): DrillOutlet[] => {
    if (!drillDown) return [];

    if (drillDown.type === "tier") {
      const inTier = filteredReports.filter(
        (r) => scoreTier(r.score) === drillDown.key,
      );
      const map: Record<string, { total: number; count: number }> = {};
      for (const r of inTier) {
        if (!map[r.outletName]) map[r.outletName] = { total: 0, count: 0 };
        map[r.outletName].total += r.score;
        map[r.outletName].count++;
      }
      return Object.entries(map)
        .map(([name, d]) => ({
          name,
          score: Math.round(d.total / d.count),
          count: d.count,
        }))
        .sort((a, b) => a.score - b.score);
    }

    if (drillDown.type === "section") {
      const sectionId = drillDown.key;
      const map: Record<string, { total: number; count: number }> = {};
      for (const s of filteredSubmissions) {
        const score = s.sectionScores?.[sectionId];
        if (score === undefined || score === null) continue;
        if (!map[s.outletName]) map[s.outletName] = { total: 0, count: 0 };
        map[s.outletName].total += score;
        map[s.outletName].count++;
      }
      return Object.entries(map)
        .map(([name, d]) => ({
          name,
          score: Math.round(d.total / d.count),
          count: d.count,
        }))
        .sort((a, b) => a.score - b.score);
    }

    if (drillDown.type === "hygiene") {
      const cat = HYGIENE_CATEGORIES.find((c) => c.key === drillDown.key);
      if (!cat) return [];
      const map: Record<string, { total: number; count: number }> = {};
      for (const s of filteredSubmissions) {
        const scores: number[] = [];
        for (const id of cat.sectionIds) {
          const v = s.sectionScores?.[id];
          if (v !== undefined && v !== null) scores.push(v);
        }
        if (scores.length === 0) continue;
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (!map[s.outletName]) map[s.outletName] = { total: 0, count: 0 };
        map[s.outletName].total += avg;
        map[s.outletName].count++;
      }
      return Object.entries(map)
        .map(([name, d]) => ({
          name,
          score: Math.round(d.total / d.count),
          count: d.count,
        }))
        .sort((a, b) => a.score - b.score);
    }

    return [];
  }, [drillDown, filteredReports, filteredSubmissions]);

  const openDrill = (type: DrillDown["type"], key: string, label: string) => {
    setDrillDown((prev) =>
      prev?.type === type && prev?.key === key ? null : { type, key, label },
    );
  };

  if (loading) {
    return (
      <div
        data-ocid="analytics.loading_state"
        className="flex justify-center items-center py-20"
      >
        <span className="animate-spin rounded-full border-4 border-muted border-t-primary w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <BarChart2
              className="w-5 h-5"
              style={{ color: ANALYTICS_ACCENT }}
            />
            Analytics Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Performance insights across all outlets and audits
          </p>
        </div>
        {hasFilters && (
          <Badge variant="outline" className="gap-1.5 text-xs">
            Filters active
          </Badge>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="border">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Outlet
              </span>
              <Select value={filterOutlet} onValueChange={setFilterOutlet}>
                <SelectTrigger
                  data-ocid="analytics.outlet.select"
                  className="h-9 text-sm"
                >
                  <SelectValue placeholder="All Outlets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outlets</SelectItem>
                  {outletOptions.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Auditor
              </span>
              <Select value={filterAuditor} onValueChange={setFilterAuditor}>
                <SelectTrigger
                  data-ocid="analytics.auditor.select"
                  className="h-9 text-sm"
                >
                  <SelectValue placeholder="All Auditors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Auditors</SelectItem>
                  {auditorOptions.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                From Date
              </span>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                data-ocid="analytics.date_from.input"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                To Date
              </span>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                data-ocid="analytics.date_to.input"
                className="h-9 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              data-ocid="analytics.clear_filters.button"
              className="h-9 gap-2 self-end"
              disabled={!hasFilters}
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Audits",
            value: totalAudits,
            suffix: "",
            icon: <BarChart2 className="w-4 h-4" />,
            color: "#3b82f6",
          },
          {
            label: "Average Score",
            value: avgScore,
            suffix: "%",
            icon: <Activity className="w-4 h-4" />,
            color:
              avgScore >= 75
                ? "#22c55e"
                : avgScore >= 60
                  ? "#f59e0b"
                  : "#ef4444",
          },
          {
            label: "Pass Rate",
            value: passRate,
            suffix: "%",
            icon: <CheckCircle2 className="w-4 h-4" />,
            color: passRate >= 75 ? "#22c55e" : "#f59e0b",
          },
          {
            label: "Outlets Audited",
            value: outletsAudited,
            suffix: "",
            icon: <Store className="w-4 h-4" />,
            color: ANALYTICS_ACCENT,
          },
        ].map((kpi, i) => (
          <Card
            key={kpi.label}
            data-ocid={`analytics.kpi.card.${i + 1}`}
            className="border"
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {kpi.label}
                  </p>
                  <p
                    className="font-display font-bold text-2xl mt-1"
                    style={{ color: kpi.color }}
                  >
                    {kpi.value}
                    {kpi.suffix && (
                      <span className="text-sm font-normal text-muted-foreground ml-0.5">
                        {kpi.suffix}
                      </span>
                    )}
                  </p>
                </div>
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: `${kpi.color}20`,
                    color: kpi.color,
                  }}
                >
                  {kpi.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalAudits === 0 ? (
        <div
          data-ocid="analytics.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center border rounded-lg"
        >
          <BarChart2 className="w-14 h-14 text-muted-foreground/30 mb-4" />
          <p className="font-semibold text-muted-foreground text-lg">
            No data to display
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs">
            {hasFilters
              ? "No audits match the selected filters. Try clearing some filters."
              : "Submit audits to see analytics here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Chart 1: Compliance Tier Distribution (Pie) */}
          <Card className="border" data-ocid="analytics.compliance_pie.card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display font-semibold text-base flex items-center gap-2">
                <TrendingUp
                  className="w-4 h-4"
                  style={{ color: ANALYTICS_ACCENT }}
                />
                Compliance Score Distribution
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Click a slice to see outlets in that tier
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {tierCounts.length > 0 ? (
                <ChartContainer
                  config={{
                    excellent: {
                      label: "Excellent (90-100%)",
                      color: TIER_COLORS.excellent,
                    },
                    good: { label: "Good (75-89%)", color: TIER_COLORS.good },
                    needsImprovement: {
                      label: "Needs Improvement (60-74%)",
                      color: TIER_COLORS.needsImprovement,
                    },
                    critical: {
                      label: "Critical (<60%)",
                      color: TIER_COLORS.critical,
                    },
                  }}
                  className="h-[260px] w-full"
                >
                  <PieChart>
                    <Pie
                      data={tierCounts}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      cursor="pointer"
                      onClick={(entry) =>
                        openDrill("tier", entry.name, entry.label)
                      }
                    >
                      {tierCounts.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.fill}
                          opacity={
                            drillDown?.type === "tier" &&
                            drillDown.key !== entry.name
                              ? 0.4
                              : 1
                          }
                          stroke={
                            drillDown?.type === "tier" &&
                            drillDown.key === entry.name
                              ? "#fff"
                              : "transparent"
                          }
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        `${value} audit${Number(value) !== 1 ? "s" : ""}`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        color: "#26283B",
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#26283B", fontWeight: 600 }}
                      itemStyle={{ color: "#26283B" }}
                    />
                    <Legend />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                  No data
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "Excellent",
                    range: "90-100%",
                    color: "bg-green-500",
                    key: "excellent",
                  },
                  {
                    label: "Good",
                    range: "75-89%",
                    color: "bg-blue-500",
                    key: "good",
                  },
                  {
                    label: "Needs Improvement",
                    range: "60-74%",
                    color: "bg-amber-500",
                    key: "needsImprovement",
                  },
                  {
                    label: "Critical",
                    range: "<60%",
                    color: "bg-red-500",
                    key: "critical",
                  },
                ].map((tier) => (
                  <button
                    type="button"
                    key={tier.label}
                    onClick={() =>
                      openDrill(
                        "tier",
                        tier.key,
                        `${tier.label} (${tier.range})`,
                      )
                    }
                    className={`flex items-center gap-2 text-xs rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60 text-left ${
                      drillDown?.type === "tier" && drillDown.key === tier.key
                        ? "bg-muted"
                        : ""
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tier.color}`}
                    />
                    <span className="text-muted-foreground">
                      {tier.label} ({tier.range}):
                    </span>
                    <span className="font-semibold">
                      {tierCounts.find((t) => t.name === tier.key)?.value ?? 0}
                    </span>
                    {drillDown?.type === "tier" &&
                    drillDown.key === tier.key ? (
                      <ChevronUp className="w-3 h-3 ml-auto" />
                    ) : (
                      <ChevronDown className="w-3 h-3 ml-auto opacity-40" />
                    )}
                  </button>
                ))}
              </div>
              {drillDown?.type === "tier" && (
                <DrillDownPanel
                  drillDown={drillDown}
                  outlets={drillOutlets}
                  onClose={() => setDrillDown(null)}
                />
              )}
            </CardContent>
          </Card>

          {/* Chart 5: Trend Over Time (Line) */}
          <Card className="border" data-ocid="analytics.trend.card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display font-semibold text-base flex items-center gap-2">
                <TrendingUp
                  className="w-4 h-4"
                  style={{ color: ANALYTICS_ACCENT }}
                />
                Audit Trend Over Time
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Average compliance score by date
              </p>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <ChartContainer
                  config={trendChartConfig}
                  className="h-[300px] w-full"
                >
                  <LineChart
                    data={trendData}
                    margin={{ top: 10, right: 16, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border/40"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => {
                        if (!v || typeof v !== "string") return "";
                        const months = [
                          "Jan",
                          "Feb",
                          "Mar",
                          "Apr",
                          "May",
                          "Jun",
                          "Jul",
                          "Aug",
                          "Sep",
                          "Oct",
                          "Nov",
                          "Dec",
                        ];
                        // Handle DD/MM/YYYY
                        const slashParts = v.split("/");
                        if (slashParts.length === 3) {
                          const month = Number.parseInt(slashParts[1], 10) - 1;
                          if (month >= 0 && month < 12)
                            return `${Number.parseInt(slashParts[0], 10)} ${months[month]}`;
                        }
                        // Handle YYYY-MM-DD
                        const dashParts = v.split("-");
                        if (dashParts.length === 3) {
                          const month = Number.parseInt(dashParts[1], 10) - 1;
                          if (month >= 0 && month < 12)
                            return `${Number.parseInt(dashParts[2], 10)} ${months[month]}`;
                        }
                        return v;
                      }}
                      angle={-30}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(v) => [`${v}%`, "Avg Score"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke={ANALYTICS_ACCENT}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: ANALYTICS_ACCENT }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart 3: Section Performance */}
          <Card
            className="border"
            data-ocid="analytics.section_performance.card"
          >
            <CardHeader className="pb-2">
              <CardTitle className="font-display font-semibold text-base flex items-center gap-2">
                <BarChart2
                  className="w-4 h-4"
                  style={{ color: ANALYTICS_ACCENT }}
                />
                Section Performance
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Click a bar to see outlet breakdown for that section
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {sectionPerformance.length > 0 &&
              filteredSubmissions.length > 0 ? (
                <ChartContainer
                  config={{
                    score: { label: "Avg Score %", color: ANALYTICS_ACCENT },
                  }}
                  className="h-[280px] w-full"
                >
                  <BarChart
                    data={sectionPerformance}
                    margin={{ top: 20, right: 12, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border/40"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                      height={70}
                      interval={0}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip
                      formatter={(v) => [`${v}%`, "Avg Score"]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        color: "#26283B",
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#26283B", fontWeight: 600 }}
                      itemStyle={{ color: "#26283B" }}
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    />
                    <Bar
                      dataKey="score"
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                      onClick={(entry) =>
                        openDrill("section", entry.id, entry.name)
                      }
                    >
                      {sectionPerformance.map((entry, index) => (
                        <Cell
                          key={entry.id}
                          fill={FLAT_COLORS[index % FLAT_COLORS.length]}
                          opacity={
                            drillDown?.type === "section" &&
                            drillDown.key !== entry.id
                              ? 0.35
                              : 1
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  Submit audits to see section breakdown
                </div>
              )}
              {drillDown?.type === "section" && (
                <DrillDownPanel
                  drillDown={drillDown}
                  outlets={drillOutlets}
                  onClose={() => setDrillDown(null)}
                />
              )}
            </CardContent>
          </Card>

          {/* Chart 4: Hygiene Compliance */}
          <Card className="border" data-ocid="analytics.hygiene.card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display font-semibold text-base flex items-center gap-2">
                <CheckCircle2
                  className="w-4 h-4"
                  style={{ color: ANALYTICS_ACCENT }}
                />
                Hygiene Compliance
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Click a bar to see outlet breakdown by category
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredSubmissions.length > 0 ? (
                <ChartContainer
                  config={{
                    score: { label: "Score %", color: ANALYTICS_ACCENT },
                  }}
                  className="h-[280px] w-full"
                >
                  <BarChart
                    data={hygieneData}
                    margin={{ top: 20, right: 12, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border/40"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                      height={70}
                      interval={0}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip
                      formatter={(v) => [`${v}%`, "Score"]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        color: "#26283B",
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#26283B", fontWeight: 600 }}
                      itemStyle={{ color: "#26283B" }}
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    />
                    <Bar
                      dataKey="score"
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                      onClick={(entry) =>
                        openDrill("hygiene", entry.key, entry.name)
                      }
                    >
                      {hygieneData.map((h, index) => (
                        <Cell
                          key={h.key}
                          fill={FLAT_COLORS[index % FLAT_COLORS.length]}
                          opacity={
                            drillDown?.type === "hygiene" &&
                            drillDown.key !== h.key
                              ? 0.35
                              : 1
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  Submit audits to see hygiene compliance
                </div>
              )}
              {drillDown?.type === "hygiene" && (
                <DrillDownPanel
                  drillDown={drillDown}
                  outlets={drillOutlets}
                  onClose={() => setDrillDown(null)}
                />
              )}
            </CardContent>
          </Card>

          {/* Chart 2: Outlet Performance (scrollable) */}
          <Card
            className="border xl:col-span-2"
            data-ocid="analytics.outlet_performance.card"
          >
            <CardHeader className="pb-2">
              <CardTitle className="font-display font-semibold text-base flex items-center gap-2">
                <Store
                  className="w-4 h-4"
                  style={{ color: ANALYTICS_ACCENT }}
                />
                Outlet Performance Comparison
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Average compliance score per outlet &mdash; ranked highest to
                lowest
                {outletPerformance.length > 8 && (
                  <span
                    className="ml-2 font-medium"
                    style={{ color: ANALYTICS_ACCENT }}
                  >
                    (scroll right to see all)
                  </span>
                )}
              </p>
            </CardHeader>
            <CardContent>
              {outletPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <div style={{ minWidth: `${outletChartWidth}px` }}>
                    <ChartContainer
                      config={{
                        score: {
                          label: "Avg Score %",
                          color: ANALYTICS_ACCENT,
                        },
                      }}
                      className="h-[320px] w-full"
                    >
                      <BarChart
                        data={outletPerformance}
                        margin={{ top: 24, right: 12, left: 0, bottom: 80 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border/40"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          angle={-40}
                          textAnchor="end"
                          height={90}
                          interval={0}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 11 }}
                          unit="%"
                        />
                        <Tooltip
                          formatter={(v, _name, props) => [
                            `${v}%  (${props.payload?.count ?? 0} audit${
                              props.payload?.count !== 1 ? "s" : ""
                            })`,
                            "Avg Score",
                          ]}
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            color: "#26283B",
                            fontSize: 12,
                          }}
                          labelStyle={{ color: "#26283B", fontWeight: 600 }}
                          itemStyle={{ color: "#26283B" }}
                          cursor={{ fill: "rgba(0,0,0,0.05)" }}
                        />
                        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                          {outletPerformance.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={
                                entry.score >= 90
                                  ? TIER_COLORS.excellent
                                  : entry.score >= 75
                                    ? TIER_COLORS.good
                                    : entry.score >= 60
                                      ? TIER_COLORS.needsImprovement
                                      : TIER_COLORS.critical
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>
              ) : (
                <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
                  No outlet data available
                </div>
              )}
              {outletPerformance.length > 0 && (
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {[
                    { label: "Excellent (90-100%)", color: "bg-green-500" },
                    { label: "Good (75-89%)", color: "bg-blue-500" },
                    {
                      label: "Needs Improvement (60-74%)",
                      color: "bg-amber-500",
                    },
                    { label: "Critical (<60%)", color: "bg-red-500" },
                  ].map((t) => (
                    <div
                      key={t.label}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${t.color}`} />
                      {t.label}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
