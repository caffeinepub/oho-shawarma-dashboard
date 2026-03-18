import SignaturePad from "@/components/SignaturePad";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type AuditSection,
  calculateFinalScore,
  calculateSectionScore,
  createAuditSubmission,
  createDefaultAuditSections,
  getOutlets,
  getSession,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  CalendarIcon,
  CheckCircle2,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type AnswerValue = "YES" | "NO" | "NA";

function AnswerButton({
  value,
  selected,
  onClick,
}: {
  value: AnswerValue;
  selected: boolean;
  onClick: () => void;
}) {
  const colors: Record<AnswerValue, string> = {
    YES: selected
      ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
      : "border-border text-muted-foreground hover:bg-green-50 hover:border-green-400 hover:text-green-700 dark:hover:bg-green-950/30",
    NO: selected
      ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
      : "border-border text-muted-foreground hover:bg-red-50 hover:border-red-400 hover:text-red-700 dark:hover:bg-red-950/30",
    NA: selected
      ? "bg-muted text-foreground border-muted-foreground/40"
      : "border-border text-muted-foreground hover:bg-muted/60",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${colors[value]}`}
    >
      {value}
    </button>
  );
}

export default function StartAuditPage() {
  const navigate = useNavigate();
  const session = getSession();
  const outlets = getOutlets().sort((a, b) => a.name.localeCompare(b.name));

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedOutletId, setSelectedOutletId] = useState("");
  const [sections, setSections] = useState<AuditSection[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Audit Summary state
  const [overallRemarks, setOverallRemarks] = useState("");
  const [auditorSignature, setAuditorSignature] = useState<string | undefined>(
    undefined,
  );
  const [managerSignature, setManagerSignature] = useState<string | undefined>(
    undefined,
  );
  const [managerName, setManagerName] = useState("");
  const [auditDate, setAuditDate] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [fireExtExpiryDate, setFireExtExpiryDate] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const selectedOutlet = outlets.find((o) => o.id === selectedOutletId);

  const handleStartAudit = () => {
    if (!selectedOutletId) return;
    setSections(createDefaultAuditSections());
    setStep(2);
  };

  const updateItemValue = (
    sectionId: string,
    itemId: string,
    value: AnswerValue,
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map((item) =>
                item.id === itemId ? { ...item, value } : item,
              ),
            }
          : s,
      ),
    );
  };

  const updateItemRemarks = (
    sectionId: string,
    itemId: string,
    remarks: string,
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map((item) =>
                item.id === itemId ? { ...item, remarks } : item,
              ),
            }
          : s,
      ),
    );
  };

  const updateItemFollowUpAction = (
    sectionId: string,
    itemId: string,
    followUpAction: string,
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map((item) =>
                item.id === itemId ? { ...item, followUpAction } : item,
              ),
            }
          : s,
      ),
    );
  };

  const updateItemImage = (
    sectionId: string,
    itemId: string,
    imageBase64: string | undefined,
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map((item) =>
                item.id === itemId ? { ...item, imageBase64 } : item,
              ),
            }
          : s,
      ),
    );
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        // No size cap -- preserve original resolution for quality
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleImageUpload = async (
    sectionId: string,
    itemId: string,
    file: File,
  ) => {
    try {
      const compressed = await compressImage(file);
      updateItemImage(sectionId, itemId, compressed);
    } catch {
      toast.error("Failed to process image. Please try another photo.");
    }
  };

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
  const answeredItems = sections.reduce(
    (acc, s) => acc + s.items.filter((i) => i.value !== null).length,
    0,
  );
  const progressPct =
    totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0;
  const allAnswered = answeredItems === totalItems && totalItems > 0;

  // Live score using weighted formula
  const liveScore = sections.length > 0 ? calculateFinalScore(sections) : 0;

  const scoreColorClass =
    liveScore >= 70
      ? "text-green-600 dark:text-green-400"
      : liveScore >= 40
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const scoreBarColor =
    liveScore >= 70
      ? "bg-green-500"
      : liveScore >= 40
        ? "bg-amber-500"
        : "bg-red-500";

  const handleSubmit = async () => {
    if (!session || !selectedOutlet) return;

    // Validation
    const missing: string[] = [];
    if (!allAnswered) {
      const remaining = totalItems - answeredItems;
      missing.push(
        `${remaining} parameter${remaining !== 1 ? "s" : ""} unanswered`,
      );
    }
    if (!overallRemarks.trim()) missing.push("Overall Remarks");
    if (!auditorSignature) missing.push("Auditor Signature");
    if (!managerSignature) missing.push("Manager Signature");

    if (missing.length > 0) {
      toast.error(
        `Please complete the following before submitting: ${missing.join(", ")}.`,
      );
      // Scroll to top so user can see the toast
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      const submission = await createAuditSubmission({
        outletId: selectedOutlet.id,
        outletName: selectedOutlet.name,
        auditorId: session.userId,
        auditorName: session.name,
        submittedAt: new Date().toISOString(),
        sections,
        isSample: false,
        overallRemarks,
        auditorSignature,
        managerSignature,
        managerName,
        auditDate,
        fireExtinguisherExpiryDate: fireExtExpiryDate,
      });

      toast.success(`Audit ${submission.auditId} submitted successfully!`);
      navigate({ to: "/audit-summary/$id", params: { id: submission.id } });
    } catch (err) {
      console.error("Submission failed:", err);
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 1) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl">Start New Audit</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Select the outlet you want to audit.
          </p>
        </div>

        <Card className="border">
          <CardHeader>
            <CardTitle className="font-display font-semibold text-base">
              Select Outlet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={selectedOutletId}
              onValueChange={setSelectedOutletId}
            >
              <SelectTrigger data-ocid="start_audit.outlet.select">
                <SelectValue placeholder="Choose an outlet..." />
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                {outlets.map((outlet) => (
                  <SelectItem key={outlet.id} value={outlet.id}>
                    {outlet.name}
                    <span className="ml-2 text-muted-foreground text-xs">
                      ({outlet.code})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              className="w-full gap-2 btn-brand"
              disabled={!selectedOutletId}
              data-ocid="start_audit.primary_button"
              onClick={handleStartAudit}
            >
              <CheckCircle2 className="w-4 h-4" />
              Start Audit
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl">Audit Form</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Outlet:{" "}
          <span className="font-semibold text-foreground">
            {selectedOutlet?.name}
          </span>
        </p>
      </div>

      {/* Progress */}
      <Card className="border">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-bold text-primary">
              {answeredItems} / {totalItems} answered ({progressPct}%)
            </span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </CardContent>
      </Card>

      {/* Sections */}
      <Accordion
        type="multiple"
        defaultValue={sections.map((s) => s.id)}
        className="space-y-3"
      >
        {sections.map((section) => {
          const answered = section.items.filter((i) => i.value !== null).length;
          const total = section.items.length;
          const complete = answered === total;
          const sectionScore = calculateSectionScore(section);
          return (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger
                data-ocid="start_audit.section.toggle"
                className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]>svg]:rotate-180"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="font-display font-semibold text-sm">
                    {section.title}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      complete
                        ? "border-green-400 text-green-600 dark:text-green-400"
                        : "border-amber-400 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {answered}/{total} answered
                  </Badge>
                  {answered > 0 && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        sectionScore >= 70
                          ? "border-green-400 text-green-600 dark:text-green-400"
                          : sectionScore >= 40
                            ? "border-amber-400 text-amber-600 dark:text-amber-400"
                            : "border-red-400 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {sectionScore}%
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                <div className="divide-y">
                  {section.items.map((item) => {
                    const imgKey = `${section.id}-${item.id}`;
                    return (
                      <div
                        key={item.id}
                        className="px-4 py-3 space-y-2"
                        data-ocid="start_audit.item.row"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm font-medium flex-1">
                            {item.label}
                          </p>
                          <div className="flex gap-1.5 flex-shrink-0">
                            {(["YES", "NO", "NA"] as AnswerValue[]).map((v) => (
                              <AnswerButton
                                key={v}
                                value={v}
                                selected={item.value === v}
                                onClick={() =>
                                  updateItemValue(section.id, item.id, v)
                                }
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 items-start">
                          <Textarea
                            placeholder="Add remarks..."
                            value={item.remarks}
                            onChange={(e) =>
                              updateItemRemarks(
                                section.id,
                                item.id,
                                e.target.value,
                              )
                            }
                            className="text-xs min-h-[60px] resize-none flex-1"
                            data-ocid="start_audit.item.textarea"
                          />
                          <div className="flex flex-col gap-1.5">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={(el) => {
                                fileInputRefs.current[imgKey] = el;
                              }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file)
                                  handleImageUpload(section.id, item.id, file);
                              }}
                            />
                            {item.imageBase64 ? (
                              <div className="relative">
                                <img
                                  src={item.imageBase64}
                                  alt="Upload preview"
                                  className="w-14 h-14 object-cover rounded-md border"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateItemImage(
                                      section.id,
                                      item.id,
                                      undefined,
                                    )
                                  }
                                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                                  data-ocid="start_audit.item.delete_button"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                data-ocid="start_audit.item.upload_button"
                                onClick={() =>
                                  fileInputRefs.current[imgKey]?.click()
                                }
                                className="w-14 h-14 rounded-md border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-all"
                                title="Upload image"
                              >
                                <ImagePlus className="w-5 h-5 text-muted-foreground" />
                              </button>
                            )}
                          </div>
                        </div>
                        {item.value === "NO" && (
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-red-600 dark:text-red-400">
                              Follow-up Action Required
                            </span>
                            <Textarea
                              placeholder="Describe the corrective action required..."
                              value={item.followUpAction ?? ""}
                              onChange={(e) =>
                                updateItemFollowUpAction(
                                  section.id,
                                  item.id,
                                  e.target.value,
                                )
                              }
                              className="text-xs min-h-[60px] resize-none border-red-200 dark:border-red-900/50 focus-visible:ring-red-400"
                              data-ocid="start_audit.item.textarea"
                            />
                          </div>
                        )}
                        {item.label ===
                          "Fire extinguisher available and within validity date" && (
                          <div className="mt-2 space-y-1">
                            <Label className="text-sm font-semibold">
                              Fire Extinguisher Expiry Date
                            </Label>
                            <Input
                              type="date"
                              value={fireExtExpiryDate}
                              onChange={(e) =>
                                setFireExtExpiryDate(e.target.value)
                              }
                              className="mt-1 max-w-xs"
                              data-ocid="start_audit.fire_ext_expiry.input"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Audit Summary Section */}
      <Card className="border" data-ocid="audit_summary.card">
        <CardHeader className="pb-4">
          <CardTitle className="font-display font-bold text-base flex items-center gap-2">
            <span className="w-2 h-5 rounded-sm bg-primary inline-block" />
            Audit Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Score */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide text-xs">
              Total Score (Auto-calculated)
            </Label>
            <div className="flex items-end gap-3 mb-1">
              <span
                className={`text-4xl font-bold leading-none ${scoreColorClass}`}
              >
                {liveScore}%
              </span>
              <span className="text-sm text-muted-foreground pb-1">
                Weighted compliance score
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreBarColor}`}
                style={{ width: `${liveScore}%` }}
              />
            </div>
          </div>

          {/* Overall Remarks */}
          <div className="space-y-2">
            <Label htmlFor="overall-remarks">
              Overall Remarks <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="overall-remarks"
              placeholder="Write general comments about the outlet..."
              value={overallRemarks}
              onChange={(e) => setOverallRemarks(e.target.value)}
              className="min-h-[120px] resize-none"
              data-ocid="audit_summary.overall_remarks.textarea"
            />
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auditor column: signature first, then name below */}
            <div data-ocid="audit_summary.auditor_signature.canvas_target">
              <SignaturePad
                label="Auditor Signature *"
                onChange={setAuditorSignature}
              />
              <p
                className="text-sm font-medium mt-2"
                style={{ color: "#361e14" }}
              >
                {session?.name}
              </p>
            </div>
            {/* Manager column: signature first, then name input below */}
            <div
              data-ocid="audit_summary.manager_signature.canvas_target"
              className="space-y-3"
            >
              <SignaturePad
                label="Manager Signature *"
                onChange={setManagerSignature}
              />
              <div className="space-y-1 mt-2">
                <Label htmlFor="manager-name-input">Manager Name</Label>
                <Input
                  id="manager-name-input"
                  data-ocid="audit_summary.manager_name.input"
                  placeholder="Enter manager name"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2 max-w-xs">
            <Label>Date</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-ocid="audit_summary.date.input"
                  className={cn(
                    "w-full flex items-center justify-start gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    !auditDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  {auditDate ? auditDate : "Pick a date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (date) {
                      const day = String(date.getDate()).padStart(2, "0");
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0",
                      );
                      const year = date.getFullYear();
                      setAuditDate(`${day}/${month}/${year}`);
                    }
                    setDatePickerOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-between gap-4 pb-6">
        <button
          type="button"
          data-ocid="start_audit.cancel_button"
          onClick={() => setStep(1)}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Back
        </button>
        <Button
          className="gap-2 min-w-[160px] btn-brand"
          disabled={submitting}
          data-ocid="start_audit.submit_button"
          onClick={handleSubmit}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {submitting ? "Submitting..." : "Submit Audit"}
        </Button>
      </div>
    </div>
  );
}
