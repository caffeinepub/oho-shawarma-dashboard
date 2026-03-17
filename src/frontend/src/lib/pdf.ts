import type { AuditSubmission } from "@/lib/store";
import { SECTION_WEIGHTS } from "@/lib/store";
import { jsPDF } from "jspdf";

const BRAND_YELLOW = "#fdbc0c";
const BRAND_DARK = "#361e14";
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
// Images at 70% of content width, capped at 120mm height to avoid very tall pages
const IMG_MAX_W = Math.round(CONTENT_WIDTH * 0.5);
const IMG_MAX_H = 120;

function hexToRgb(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function checkPageBreak(
  doc: jsPDF,
  y: number,
  needed: number,
  pageNum: { value: number },
): number {
  if (y + needed > PAGE_HEIGHT - 16) {
    doc.addPage();
    pageNum.value += 1;
    addPageFooter(doc, pageNum.value);
    return MARGIN + 4;
  }
  return y;
}

function addPageFooter(doc: jsPDF, pageNum: number) {
  const y = PAGE_HEIGHT - 8;
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Oho Shawarma Internal Audit Dashboard  •  Page ${pageNum}`,
    PAGE_WIDTH / 2,
    y,
    { align: "center" },
  );
}

function sectionLabel(id: string): string {
  const labels: Record<string, string> = {
    "shop-exterior": "Shop Exterior Audit",
    "kitchen-floors-walls": "Kitchen Floors and Walls",
    "equipment-cleanliness": "Equipment Cleanliness",
    "other-operations": "Other Operations Cleanliness",
    "food-handling-safety": "Food Handling and Safety",
    "employee-hygiene": "Employee Hygiene",
    "raw-material-compliance": "Raw Material Brand Compliance",
  };
  return labels[id] ?? id;
}

function getImageDimensions(
  base64: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 1, height: 1 });
    img.src = base64;
  });
}

export async function generateAuditPDF(
  submission: AuditSubmission,
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageNum = { value: 1 };
  addPageFooter(doc, pageNum.value);

  let y = MARGIN;

  // ---- Header ----
  const [dr, dg, db] = hexToRgb(BRAND_DARK);
  const [yr, yg, yb] = hexToRgb(BRAND_YELLOW);

  doc.setFillColor(dr, dg, db);
  doc.rect(0, 0, PAGE_WIDTH, 28, "F");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(yr, yg, yb);
  doc.text("Oho Shawarma", MARGIN, 11);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text("Hygiene & Brand Compliance Audit Report", MARGIN, 18);

  // Score badge top right
  const scoreColor =
    submission.score >= 70
      ? ([22, 101, 52] as [number, number, number])
      : ([153, 27, 27] as [number, number, number]);
  const scoreBg =
    submission.score >= 70
      ? ([220, 252, 231] as [number, number, number])
      : ([254, 226, 226] as [number, number, number]);
  doc.setFillColor(...scoreBg);
  doc.roundedRect(PAGE_WIDTH - 38, 4, 24, 20, 3, 3, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...scoreColor);
  doc.text(`${submission.score}%`, PAGE_WIDTH - 26, 13.5, { align: "center" });
  doc.setFontSize(7);
  doc.text(submission.score >= 70 ? "PASS" : "FAIL", PAGE_WIDTH - 26, 20, {
    align: "center",
  });

  y = 34;

  // ---- Audit Meta ----
  doc.setFillColor(248, 248, 248);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 22, "F");
  doc.setDrawColor(220, 220, 220);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 22, "S");

  const metaFields = [
    { label: "Audit ID", value: submission.auditId },
    { label: "Outlet", value: submission.outletName },
    { label: "Auditor", value: submission.auditorName },
    {
      label: "Audit Date",
      value:
        submission.auditDate ||
        new Date(submission.submittedAt).toLocaleDateString("en-IN"),
    },
  ];

  const colW = CONTENT_WIDTH / metaFields.length;
  for (let i = 0; i < metaFields.length; i++) {
    const x = MARGIN + i * colW + 4;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(130, 130, 130);
    doc.text(metaFields[i].label.toUpperCase(), x, y + 7);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(metaFields[i].value, x, y + 15, { maxWidth: colW - 6 });
  }
  y += 28;

  // ---- Score Summary ----
  y = checkPageBreak(doc, y, 40, pageNum);

  doc.setFillColor(dr, dg, db);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(yr, yg, yb);
  doc.text("COMPLIANCE SCORE SUMMARY", MARGIN + 3, y + 5);
  y += 9;

  // Final score bar
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 8, 2, 2, "F");
  const barFill = (submission.score / 100) * CONTENT_WIDTH;
  const [br, bg, bb] =
    submission.score >= 70
      ? ([34, 197, 94] as [number, number, number])
      : submission.score >= 40
        ? ([245, 158, 11] as [number, number, number])
        : ([239, 68, 68] as [number, number, number]);
  doc.setFillColor(br, bg, bb);
  doc.roundedRect(MARGIN, y, barFill, 8, 2, 2, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  if (submission.score > 15) {
    doc.text(`${submission.score}%`, MARGIN + barFill / 2, y + 5.5, {
      align: "center",
    });
  } else {
    doc.setTextColor(60, 60, 60);
    doc.text(`${submission.score}%`, MARGIN + barFill + 4, y + 5.5);
  }
  y += 12;

  // Section scores table
  const sectionIds = Object.keys(SECTION_WEIGHTS);
  const tableColW = [90, 30, 30, CONTENT_WIDTH - 150];
  const tableHeaders = ["Section", "Weight", "Score", "Visual"];

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 6, "F");
  let cx = MARGIN;
  for (let i = 0; i < tableHeaders.length; i++) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 80);
    doc.text(tableHeaders[i], cx + 2, y + 4.5);
    cx += tableColW[i];
  }
  y += 6;

  for (const sid of sectionIds) {
    y = checkPageBreak(doc, y, 7, pageNum);
    const secScore = submission.sectionScores[sid] ?? 0;
    const weight = SECTION_WEIGHTS[sid] ?? 0;

    doc.setFillColor(255, 255, 255);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 6.5, "F");
    doc.setDrawColor(235, 235, 235);
    doc.line(MARGIN, y + 6.5, MARGIN + CONTENT_WIDTH, y + 6.5);

    cx = MARGIN;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.text(sectionLabel(sid), cx + 2, y + 4.5, {
      maxWidth: tableColW[0] - 4,
    });
    cx += tableColW[0];

    doc.text(`${Math.round(weight * 100)}%`, cx + 2, y + 4.5);
    cx += tableColW[1];

    const [sr, sg, sb] =
      secScore >= 70
        ? ([22, 101, 52] as [number, number, number])
        : secScore >= 40
          ? ([146, 64, 14] as [number, number, number])
          : ([153, 27, 27] as [number, number, number]);
    doc.setTextColor(sr, sg, sb);
    doc.setFont("helvetica", "bold");
    doc.text(`${secScore}%`, cx + 2, y + 4.5);
    cx += tableColW[2];

    // Mini bar
    doc.setFillColor(235, 235, 235);
    doc.roundedRect(cx + 2, y + 1.5, tableColW[3] - 6, 3.5, 1, 1, "F");
    const miniFill = (secScore / 100) * (tableColW[3] - 6);
    doc.setFillColor(sr, sg, sb);
    if (miniFill > 0) {
      doc.roundedRect(cx + 2, y + 1.5, miniFill, 3.5, 1, 1, "F");
    }

    y += 6.5;
  }
  y += 4;

  // ---- Sections ----
  for (const section of submission.sections) {
    y = checkPageBreak(doc, y, 16, pageNum);

    // Section header
    doc.setFillColor(dr, dg, db);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(yr, yg, yb);
    doc.text(section.title, MARGIN + 3, y + 5);
    const secScoreVal = submission.sectionScores[section.id] ?? 0;
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`${secScoreVal}%`, MARGIN + CONTENT_WIDTH - 4, y + 5, {
      align: "right",
    });
    y += 9;

    for (const item of section.items) {
      const hasImage = !!item.imageBase64;
      const hasFollowUp = item.value === "NO" && !!item.followUpAction;
      const estimatedH =
        10 +
        (item.remarks ? 5 : 0) +
        (hasFollowUp ? 10 : 0) +
        (hasImage ? IMG_MAX_H + 5 : 0);

      y = checkPageBreak(doc, y, estimatedH, pageNum);

      // Row background
      doc.setFillColor(252, 252, 252);
      doc.rect(MARGIN, y, CONTENT_WIDTH, 0.2, "F");

      // Parameter label
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(item.label, MARGIN + 2, y + 5, { maxWidth: 120 });

      // Result badge
      const resultColors: Record<string, [number, number, number]> = {
        YES: [22, 101, 52],
        NO: [153, 27, 27],
        NA: [100, 100, 100],
      };
      const resultBgs: Record<string, [number, number, number]> = {
        YES: [220, 252, 231],
        NO: [254, 226, 226],
        NA: [243, 244, 246],
      };
      const resultVal = item.value ?? "—";
      if (item.value) {
        doc.setFillColor(...resultBgs[item.value]);
        doc.roundedRect(MARGIN + 126, y + 1, 18, 6, 1.5, 1.5, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...resultColors[item.value]);
        doc.text(resultVal, MARGIN + 135, y + 5.5, { align: "center" });
      }

      // Remarks — bold label, darker text
      if (item.remarks) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text("Remarks:", MARGIN + 2, y + 12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(35, 35, 35);
        const remarkLines = doc.splitTextToSize(item.remarks, 128);
        for (let ri = 0; ri < remarkLines.length; ri++) {
          doc.text(remarkLines[ri], MARGIN + 24, y + 12 + ri * 5);
        }
        y += 7 + (remarkLines.length - 1) * 5;
      }

      y += 8;

      // Follow-up action
      if (hasFollowUp) {
        const followUpLines = doc.splitTextToSize(
          item.followUpAction ?? "",
          CONTENT_WIDTH - 46,
        );
        const followUpH = 10 + (followUpLines.length - 1) * 5;
        y = checkPageBreak(doc, y, followUpH + 4, pageNum);
        doc.setFillColor(254, 242, 242);
        doc.rect(MARGIN + 2, y, CONTENT_WIDTH - 4, followUpH + 2, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(153, 27, 27);
        doc.text("Follow-up Action:", MARGIN + 4, y + 6);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 30, 30);
        for (let fi = 0; fi < followUpLines.length; fi++) {
          doc.text(followUpLines[fi], MARGIN + 40, y + 6 + fi * 5);
        }
        y += followUpH + 5;
      }

      // Image — preserve original aspect ratio, 70% of content width
      if (hasImage && item.imageBase64) {
        try {
          const fmt = item.imageBase64.startsWith("data:image/png")
            ? "PNG"
            : "JPEG";
          const dims = await getImageDimensions(item.imageBase64);
          let displayW = IMG_MAX_W;
          let displayH = (dims.height / dims.width) * displayW;
          if (displayH > IMG_MAX_H) {
            displayH = IMG_MAX_H;
            displayW = (dims.width / dims.height) * displayH;
          }
          y = checkPageBreak(doc, y, displayH + 5, pageNum);
          doc.addImage(
            item.imageBase64,
            fmt,
            MARGIN + 2,
            y,
            displayW,
            displayH,
            undefined,
            "FAST",
          );
          y += displayH + 3;
        } catch {
          // skip image on error
        }
      }

      // Divider
      doc.setDrawColor(235, 235, 235);
      doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
      y += 2;
    }

    y += 4;
  }

  // ---- Audit Summary ----
  y = checkPageBreak(doc, y, 40, pageNum);

  doc.setFillColor(dr, dg, db);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(yr, yg, yb);
  doc.text("AUDIT SUMMARY", MARGIN + 3, y + 5);
  y += 10;

  // Overall Remarks — with clear line gap after heading
  if (submission.overallRemarks) {
    y = checkPageBreak(doc, y, 18, pageNum);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text("Overall Remarks", MARGIN + 2, y + 5);
    y += 10; // clear gap between heading and content
    doc.setFont("helvetica", "normal");
    doc.setTextColor(35, 35, 35);
    const lines = doc.splitTextToSize(
      submission.overallRemarks,
      CONTENT_WIDTH - 4,
    );
    for (const line of lines) {
      y = checkPageBreak(doc, y, 6, pageNum);
      doc.text(line, MARGIN + 2, y);
      y += 5;
    }
    y += 4;
  }

  // Signatures
  y = checkPageBreak(doc, y, 45, pageNum);
  const sigW = (CONTENT_WIDTH - 8) / 2;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("Auditor Signature", MARGIN + 2, y + 5);
  const managerSigLabel = submission.managerName
    ? `Manager Signature — ${submission.managerName}`
    : "Manager Signature";
  doc.text(managerSigLabel, MARGIN + sigW + 8, y + 5, { maxWidth: sigW });
  y += 7;

  const sigH = 28;

  if (submission.auditorSignature) {
    try {
      doc.addImage(
        submission.auditorSignature,
        "PNG",
        MARGIN + 2,
        y,
        sigW,
        sigH,
        undefined,
        "FAST",
      );
    } catch {
      doc.setFillColor(248, 248, 248);
      doc.rect(MARGIN + 2, y, sigW, sigH, "F");
    }
  } else {
    doc.setFillColor(248, 248, 248);
    doc.rect(MARGIN + 2, y, sigW, sigH, "F");
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text("No signature", MARGIN + 2 + sigW / 2, y + sigH / 2, {
      align: "center",
    });
  }

  if (submission.managerSignature) {
    try {
      doc.addImage(
        submission.managerSignature,
        "PNG",
        MARGIN + sigW + 8,
        y,
        sigW,
        sigH,
        undefined,
        "FAST",
      );
    } catch {
      doc.setFillColor(248, 248, 248);
      doc.rect(MARGIN + sigW + 8, y, sigW, sigH, "F");
    }
  } else {
    doc.setFillColor(248, 248, 248);
    doc.rect(MARGIN + sigW + 8, y, sigW, sigH, "F");
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text("No signature", MARGIN + sigW + 8 + sigW / 2, y + sigH / 2, {
      align: "center",
    });
  }

  y += sigH + 8;

  // Audit Date
  if (submission.auditDate) {
    y = checkPageBreak(doc, y, 10, pageNum);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(`Audit Date: ${submission.auditDate}`, MARGIN + 2, y + 5);
    y += 10;
  }

  // Footer brand line
  y = checkPageBreak(doc, y, 12, pageNum);
  doc.setDrawColor(yr, yg, yb);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  y += 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Generated by Oho Shawarma Internal Dashboard  •  ${new Date().toLocaleString()}`,
    PAGE_WIDTH / 2,
    y,
    { align: "center" },
  );

  doc.save(`audit-${submission.auditId}.pdf`);
}
