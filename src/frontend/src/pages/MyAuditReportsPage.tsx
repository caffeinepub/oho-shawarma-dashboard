import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  type AuditSubmission,
  getMyAuditSubmissions,
  getSession,
} from "@/lib/store";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
} from "lucide-react";
import { useState } from "react";

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export default function MyAuditReportsPage() {
  const session = getSession();
  const navigate = useNavigate();
  const [audits] = useState<AuditSubmission[]>(() =>
    session ? getMyAuditSubmissions(session.userId) : [],
  );
  const [downloading, setDownloading] = useState<string | null>(null);

  const sorted = [...audits].sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );

  const handleDownload = async (audit: AuditSubmission) => {
    setDownloading(audit.id);
    try {
      await generateAuditPDF(audit);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-semibold text-lg">My Audit Reports</h2>
        <p className="text-sm text-muted-foreground">
          {sorted.length} audit{sorted.length !== 1 ? "s" : ""} submitted by you
        </p>
      </div>

      {sorted.length === 0 ? (
        <Card data-ocid="my_audits.empty_state" className="border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">
              No audit reports yet
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Your submitted audits will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table data-ocid="my_audits.table">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold">Audit ID</TableHead>
                <TableHead className="font-semibold">Outlet</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Score</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((audit, idx) => (
                <TableRow
                  key={audit.id}
                  data-ocid={`my_audits.item.${idx + 1}`}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {audit.auditId}
                  </TableCell>
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
                    <span
                      className={`font-bold text-lg ${scoreColor(audit.score)}`}
                    >
                      {audit.score}
                    </span>
                    <span className="text-muted-foreground text-xs">%</span>
                  </TableCell>
                  <TableCell>
                    {audit.score >= 70 ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Pass
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Fail
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`my_audits.secondary_button.${idx + 1}`}
                        onClick={() =>
                          navigate({ to: `/audit-summary/${audit.id}` })
                        }
                        className="h-8 w-8 hover:bg-accent"
                        title="View Report"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`my_audits.primary_button.${idx + 1}`}
                        onClick={() => handleDownload(audit)}
                        disabled={downloading === audit.id}
                        className="h-8 w-8 hover:bg-accent"
                        title="Download PDF Report"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
