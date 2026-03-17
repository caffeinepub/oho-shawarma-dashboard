import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateAuditPDF } from "@/lib/pdf";
import {
  SECTION_WEIGHTS,
  getAuditSubmissionById,
  loadImagesForSubmission,
} from "@/lib/store";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
} from "lucide-react";
import { useState } from "react";

const SECTION_LABELS: Record<string, string> = {
  "shop-exterior": "Shop Exterior Audit",
  "kitchen-floors-walls": "Kitchen Floors and Walls",
  "equipment-cleanliness": "Equipment Cleanliness",
  "other-operations": "Other Operations Cleanliness",
  "food-handling-safety": "Food Handling and Safety",
  "employee-hygiene": "Employee Hygiene",
  "raw-material-compliance": "Raw Material Brand Compliance",
};

function ScoreBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const color =
    value >= 70 ? "bg-green-500" : value >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className={`h-2 rounded-full bg-muted overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function ScoreText({ value }: { value: number }) {
  const cls =
    value >= 70
      ? "text-green-600 dark:text-green-400"
      : value >= 40
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";
  return <span className={cls}>{value}%</span>;
}

export default function AuditSummaryPage() {
  const { id } = useParams({ from: "/protected/audit-summary/$id" });
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);

  const submission = getAuditSubmissionById(id);

  const handleDownload = async () => {
    if (!submission) return;
    setDownloading(true);
    try {
      // Load images from IndexedDB before generating PDF
      const submissionWithImages = await loadImagesForSubmission(submission);
      await generateAuditPDF(submissionWithImages);
    } finally {
      setDownloading(false);
    }
  };

  if (!submission) {
    return (
      <div
        className="max-w-lg mx-auto mt-16 text-center space-y-4"
        data-ocid="audit_summary.error_state"
      >
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="font-display font-bold text-xl">Report Not Found</h2>
        <p className="text-muted-foreground text-sm">
          The audit report you are looking for does not exist or has been
          removed.
        </p>
        <Button
          variant="outline"
          data-ocid="audit_summary.cancel_button"
          onClick={() => navigate({ to: "/dashboard" })}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const passStatus = submission.score >= 70;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Page Header */}
      <div
        className="flex items-start justify-between gap-4"
        data-ocid="audit_summary.page"
      >
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            Audit Report
          </p>
          <h2 className="font-display font-bold text-2xl">
            {submission.auditId}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {submission.outletName}
          </p>
        </div>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${
            passStatus
              ? "bg-green-50 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
              : "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
          }`}
        >
          {passStatus ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          {passStatus ? "Pass" : "Fail"}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Outlet", value: submission.outletName },
          { label: "Auditor", value: submission.auditorName },
          {
            label: "Audit Date",
            value:
              submission.auditDate ||
              new Date(submission.submittedAt).toLocaleDateString("en-IN"),
          },
          {
            label: "Submitted",
            value: new Date(submission.submittedAt).toLocaleDateString(
              "en-IN",
              { day: "numeric", month: "short", year: "numeric" },
            ),
          },
        ].map((item) => (
          <Card key={item.label} className="border">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {item.label}
              </p>
              <p className="font-semibold text-sm mt-1 truncate">
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Final Score */}
      <Card className="border" data-ocid="audit_summary.card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display font-bold text-base flex items-center gap-2">
            <span className="w-2 h-5 rounded-sm bg-primary inline-block" />
            Final Compliance Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-3">
            <span
              className={`text-5xl font-bold leading-none font-display ${
                passStatus
                  ? "text-green-600 dark:text-green-400"
                  : submission.score >= 40
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400"
              }`}
            >
              {submission.score}%
            </span>
            <span className="text-muted-foreground text-sm pb-1">
              {passStatus ? "Compliant" : "Non-Compliant"}
            </span>
          </div>
          <ScoreBar value={submission.score} className="h-3" />
        </CardContent>
      </Card>

      {/* Section Scores */}
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display font-bold text-base flex items-center gap-2">
            <span className="w-2 h-5 rounded-sm bg-primary inline-block" />
            Section Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.keys(SECTION_WEIGHTS).map((sid) => {
              const score = submission.sectionScores[sid] ?? 0;
              const weight = SECTION_WEIGHTS[sid] ?? 0;
              return (
                <div key={sid} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {SECTION_LABELS[sid] ?? sid}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        Weight: {Math.round(weight * 100)}%
                      </span>
                      <span className="font-bold w-10 text-right">
                        <ScoreText value={score} />
                      </span>
                    </div>
                  </div>
                  <ScoreBar value={score} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Overall Remarks */}
      {submission.overallRemarks && (
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display font-bold text-base flex items-center gap-2">
              <span className="w-2 h-5 rounded-sm bg-primary inline-block" />
              Overall Remarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {submission.overallRemarks}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Signatures */}
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display font-bold text-base flex items-center gap-2">
            <span className="w-2 h-5 rounded-sm bg-primary inline-block" />
            Signatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Auditor Signature
              </p>
              {submission.auditorSignature ? (
                <img
                  src={submission.auditorSignature}
                  alt="Auditor Signature"
                  className="border rounded-md bg-white w-full max-w-[240px] h-[80px] object-contain"
                />
              ) : (
                <div className="border rounded-md bg-muted/30 w-full max-w-[240px] h-[80px] flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    No signature
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Manager Signature
                {submission.managerName && (
                  <span className="ml-2 text-foreground normal-case">
                    — {submission.managerName}
                  </span>
                )}
              </p>
              {submission.managerSignature ? (
                <img
                  src={submission.managerSignature}
                  alt="Manager Signature"
                  className="border rounded-md bg-white w-full max-w-[240px] h-[80px] object-contain"
                />
              ) : (
                <div className="border rounded-md bg-muted/30 w-full max-w-[240px] h-[80px] flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    No signature
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          className="gap-2 flex-1 sm:flex-none sm:min-w-[200px] btn-brand"
          disabled={downloading}
          data-ocid="audit_summary.primary_button"
          onClick={handleDownload}
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {downloading ? "Generating PDF..." : "Download PDF Report"}
        </Button>
        <Button
          variant="outline"
          className="gap-2 flex-1 sm:flex-none"
          data-ocid="audit_summary.secondary_button"
          onClick={() => navigate({ to: "/dashboard" })}
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
