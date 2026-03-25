import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateAuditPDF } from "@/lib/pdf";
import {
  type AuditReport,
  type AuditSubmission,
  clearTestOutletData,
  getAuditReports,
  getAuditSubmissionById,
  getAuditSubmissions,
  loadImagesForSubmission,
} from "@/lib/store";
import { useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Download,
  Eye,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

function scoreColorClass(score: number): string {
  if (score >= 90)
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0";
  if (score >= 75)
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0";
  if (score >= 60)
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0";
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Needs Improvement";
  return "Critical";
}

export default function AuditReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [allSubmissions, setAllSubmissions] = useState<AuditSubmission[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showExpiryModal, setShowExpiryModal] = useState(false);

  useEffect(() => {
    Promise.all([getAuditReports(), getAuditSubmissions()]).then(
      ([reportData, submissionData]) => {
        setReports(reportData);
        setAllSubmissions(submissionData);
        setLoading(false);
      },
    );
  }, []);

  const refresh = () => {
    getAuditReports().then(setReports);
    getAuditSubmissions().then(setAllSubmissions);
  };

  const hasSampleData = reports.some((r) => r.isSample);

  const handleClearTestData = async () => {
    try {
      await clearTestOutletData();
      refresh();
      toast.success("Test outlet data cleared.");
    } catch {
      toast.error("Failed to clear test data.");
    }
  };

  const handleDownload = async (report: AuditReport) => {
    if (!report.submissionId) {
      toast.error("No submission data available for this report.");
      return;
    }
    setDownloadingId(report.id);
    try {
      const sub = await getAuditSubmissionById(report.submissionId);
      if (!sub) {
        toast.error("Submission data not found.");
        return;
      }
      const subWithImages = await loadImagesForSubmission(sub);
      await generateAuditPDF(subWithImages);
    } catch {
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Expiry dates data
  const expiryEntries = useMemo(() => {
    return allSubmissions
      .filter(
        (s) =>
          s.fireExtinguisherExpiryDate &&
          s.fireExtinguisherExpiryDate.trim() !== "",
      )
      .map((s) => ({
        outletName: s.outletName,
        parameterName: "Fire extinguisher",
        expiryDate: s.fireExtinguisherExpiryDate as string,
        submittedAt: s.submittedAt,
      }))
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  }, [allSubmissions]);

  // Filters
  const [search, setSearch] = useState("");
  const [filterOutlet, setFilterOutlet] = useState("all");
  const [filterAuditor, setFilterAuditor] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Sort
  const [sortField, setSortField] = useState<"date" | "score">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Pagination
  const [page, setPage] = useState(1);

  const outletOptions = useMemo(() => {
    return Array.from(new Set(reports.map((r) => r.outletName))).sort();
  }, [reports]);

  const auditorOptions = useMemo(() => {
    return Array.from(new Set(reports.map((r) => r.auditorName))).sort();
  }, [reports]);

  const hasFilters =
    search ||
    filterOutlet !== "all" ||
    filterAuditor !== "all" ||
    filterDateFrom ||
    filterDateTo;

  const clearFilters = () => {
    setSearch("");
    setFilterOutlet("all");
    setFilterAuditor("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setPage(1);
  };

  const getAuditId = (report: AuditReport): string => {
    return report.auditId || report.id.slice(0, 8).toUpperCase();
  };

  const filtered = useMemo(() => {
    let out = [...reports];
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(
        (r) =>
          r.outletName.toLowerCase().includes(q) ||
          r.auditorName.toLowerCase().includes(q) ||
          r.auditId?.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q),
      );
    }
    if (filterOutlet !== "all")
      out = out.filter((r) => r.outletName === filterOutlet);
    if (filterAuditor !== "all")
      out = out.filter((r) => r.auditorName === filterAuditor);
    if (filterDateFrom) out = out.filter((r) => r.date >= filterDateFrom);
    if (filterDateTo) out = out.filter((r) => r.date <= filterDateTo);
    out.sort((a, b) => {
      if (sortField === "date") {
        const diff = a.date.localeCompare(b.date);
        return sortDir === "asc" ? diff : -diff;
      }
      const diff = a.score - b.score;
      return sortDir === "asc" ? diff : -diff;
    });
    return out;
  }, [
    reports,
    search,
    filterOutlet,
    filterAuditor,
    filterDateFrom,
    filterDateTo,
    sortField,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSort = (field: "date" | "score") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: "date" | "score" }) => {
    if (sortField !== field)
      return <ChevronDown className="w-3.5 h-3.5 opacity-30" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-semibold text-lg">Audit Reports</h2>
          <p className="text-sm text-muted-foreground">
            {reports.length} report{reports.length !== 1 ? "s" : ""} on record
            {hasFilters && filtered.length !== reports.length && (
              <span className="ml-1 text-primary">
                &middot; {filtered.length} matching
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            data-ocid="audit.expiry_dates.button"
            onClick={() => setShowExpiryModal(true)}
            className="gap-2"
            style={{ borderColor: "#fdbc0c", color: "#361e14" }}
          >
            <CalendarDays className="w-4 h-4" />
            Expiry Dates
          </Button>
          {hasSampleData && (
            <Button
              variant="outline"
              size="sm"
              data-ocid="audit.delete_button"
              onClick={handleClearTestData}
              className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            >
              <Trash2 className="w-4 h-4" />
              Clear Sample &amp; Test Data
            </Button>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 items-end p-3 bg-muted/30 border rounded-lg">
        <div className="col-span-2 md:col-span-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by outlet or audit ID\u2026"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            data-ocid="audit.search_input"
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select
          value={filterOutlet}
          onValueChange={(v) => {
            setFilterOutlet(v);
            setPage(1);
          }}
        >
          <SelectTrigger
            data-ocid="audit.outlet.select"
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
        <Select
          value={filterAuditor}
          onValueChange={(v) => {
            setFilterAuditor(v);
            setPage(1);
          }}
        >
          <SelectTrigger
            data-ocid="audit.auditor.select"
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
        <Input
          type="date"
          value={filterDateFrom}
          onChange={(e) => {
            setFilterDateFrom(e.target.value);
            setPage(1);
          }}
          data-ocid="audit.date_from.input"
          className="h-9 text-sm"
        />
        <Input
          type="date"
          value={filterDateTo}
          onChange={(e) => {
            setFilterDateTo(e.target.value);
            setPage(1);
          }}
          data-ocid="audit.date_to.input"
          className="h-9 text-sm"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          disabled={!hasFilters}
          data-ocid="audit.clear_filters.button"
          className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </Button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div
          data-ocid="audit.loading_state"
          className="flex justify-center items-center py-16"
        >
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : paged.length === 0 ? (
        <div
          data-ocid="audit.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center border rounded-lg"
        >
          <ClipboardList className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">
            {hasFilters
              ? "No reports match your filters"
              : "No audit reports yet"}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {hasFilters
              ? "Try adjusting or clearing the filters above."
              : "Completed audits will appear here."}
          </p>
          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="mt-3 gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table data-ocid="audit.table">
              <TableHeader>
                <TableRow className="bg-muted/40 tr-brand-header">
                  <TableHead className="font-semibold whitespace-nowrap th-brand">
                    Audit ID
                  </TableHead>
                  <TableHead className="font-semibold th-brand">
                    Outlet
                  </TableHead>
                  <TableHead className="font-semibold th-brand">
                    Auditor
                  </TableHead>
                  <TableHead
                    className="font-semibold cursor-pointer select-none whitespace-nowrap th-brand"
                    onClick={() => handleSort("date")}
                  >
                    <span className="flex items-center gap-1">
                      Audit Date <SortIcon field="date" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="font-semibold cursor-pointer select-none whitespace-nowrap th-brand"
                    onClick={() => handleSort("score")}
                  >
                    <span className="flex items-center gap-1">
                      Score <SortIcon field="score" />
                    </span>
                  </TableHead>
                  <TableHead className="font-semibold th-brand">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-right th-brand">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((report, idx) => (
                  <TableRow
                    key={report.id}
                    data-ocid={`audit.table.row.${idx + 1}`}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {getAuditId(report)}
                      {report.isSample && (
                        <Badge
                          variant="outline"
                          className="ml-2 text-xs border-amber-400 text-amber-600 dark:text-amber-400"
                        >
                          Sample
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {report.outletName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.auditorName}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(report.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge className={scoreColorClass(report.score)}>
                        {report.score}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${scoreColorClass(report.score)}`}
                      >
                        {scoreLabel(report.score)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {report.submissionId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`audit.table.secondary_button.${idx + 1}`}
                            onClick={() =>
                              navigate({
                                to: `/audit-summary/${report.submissionId}`,
                              })
                            }
                            className="h-8 w-8 hover:bg-accent"
                            title="View Audit Summary"
                          >
                            <Eye className="w-3.5 h-3.5 icon-brand" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`audit.table.primary_button.${idx + 1}`}
                          onClick={() => handleDownload(report)}
                          disabled={downloadingId === report.id}
                          className="h-8 w-8 hover:bg-accent"
                          title="Download PDF Report"
                        >
                          {downloadingId === report.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 icon-brand" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}&#8211;
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  data-ocid="audit.pagination_prev"
                  className="h-7 px-2 text-xs"
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  data-ocid="audit.pagination_next"
                  className="h-7 px-2 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expiry Dates Modal */}
      <Dialog open={showExpiryModal} onOpenChange={setShowExpiryModal}>
        <DialogContent
          data-ocid="audit.expiry_dates.dialog"
          className="sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <CalendarDays className="w-5 h-5" style={{ color: "#361e14" }} />
              Fire Extinguisher Expiry Dates
            </DialogTitle>
          </DialogHeader>
          {expiryEntries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>No expiry dates recorded yet.</p>
              <p className="text-xs mt-1">
                Expiry dates are captured when auditors fill the fire
                extinguisher parameter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="tr-brand-header">
                    <TableHead className="th-brand font-semibold">
                      Outlet Name
                    </TableHead>
                    <TableHead className="th-brand font-semibold">
                      Parameter
                    </TableHead>
                    <TableHead className="th-brand font-semibold">
                      Expiry Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiryEntries.map((entry, idx) => (
                    <TableRow
                      key={`${entry.outletName}-${entry.expiryDate}-${idx}`}
                      data-ocid={`audit.expiry.item.${idx + 1}`}
                    >
                      <TableCell className="font-medium">
                        {entry.outletName}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {entry.parameterName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-amber-400 text-amber-700 dark:text-amber-400"
                        >
                          {entry.expiryDate}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
