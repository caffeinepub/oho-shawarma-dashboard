import type { AuditSubmission } from "@/lib/store";
import { SECTION_WEIGHTS, starToPercent } from "@/lib/store";

// jsPDF is loaded via CDN (index.html). Access via window.jspdf.jsPDF
function getJsPDF() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.jspdf?.jsPDF) return w.jspdf.jsPDF;
  if (w.jsPDF) return w.jsPDF;
  throw new Error("jsPDF not loaded");
}

type JsPDFInstance = {
  addPage(): JsPDFInstance;
  save(filename: string): void;
  setFontSize(size: number): void;
  setFont(fontName: string, fontStyle?: string): void;
  setTextColor(r: number, g?: number, b?: number): void;
  setFillColor(r: number, g?: number, b?: number): void;
  setDrawColor(r: number, g?: number, b?: number): void;
  setLineWidth(width: number): void;
  text(
    text: string | string[],
    x: number,
    y: number,
    options?: { align?: string; maxWidth?: number },
  ): void;
  rect(x: number, y: number, w: number, h: number, style?: string): void;
  roundedRect(
    x: number,
    y: number,
    w: number,
    h: number,
    rx: number,
    ry: number,
    style?: string,
  ): void;
  circle(x: number, y: number, r: number, style?: string): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  addImage(
    imageData: string,
    format: string,
    x: number,
    y: number,
    w: number,
    h: number,
    alias?: string,
    compression?: string,
  ): void;
  splitTextToSize(text: string, maxWidth: number): string[];
};

const BRAND_YELLOW = "#fdbc0c";
const BRAND_DARK = "#361e14";
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
// Images at 25% of content width
const IMG_MAX_W = Math.round(CONTENT_WIDTH * 0.25);
const IMG_MAX_H = 80;

// Per-star colors for PDF: 1=red, 2=orange, 3=yellow, 4=light-green, 5=dark-green
const STAR_COLOR_RGB: [number, number, number][] = [
  [239, 68, 68],
  [249, 115, 22],
  [234, 179, 8],
  [132, 204, 18],
  [22, 163, 74],
];

function hexToRgb(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function checkPageBreak(
  doc: JsPDFInstance,
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

function addPageFooter(doc: JsPDFInstance, pageNum: number) {
  const y = PAGE_HEIGHT - 8;
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Oho Shawarma Internal Audit Dashboard  \u2022  Page ${pageNum}`,
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

function drawAnalyticsSummaryPage(
  doc: JsPDFInstance,
  submission: AuditSubmission,
  pageNum: { value: number },
) {
  doc.addPage();
  pageNum.value += 1;
  addPageFooter(doc, pageNum.value);

  const [dr, dg, db] = hexToRgb(BRAND_DARK);
  const [yr, yg, yb] = hexToRgb(BRAND_YELLOW);

  let y = MARGIN;

  // ---- Page Header ----
  doc.setFillColor(dr, dg, db);
  doc.rect(0, 0, PAGE_WIDTH, 22, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(yr, yg, yb);
  doc.text("ANALYTICS SUMMARY", MARGIN, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text(submission.outletName, PAGE_WIDTH - MARGIN, 14, { align: "right" });

  y = 30;

  // ---- Compute grouped scores ----
  const ss = submission.sectionScores;
  const foodHygiene = ss["food-handling-safety"] ?? 0;
  const employeeHygiene = ss["employee-hygiene"] ?? 0;

  const outletKeys = [
    "shop-exterior",
    "kitchen-floors-walls",
    "equipment-cleanliness",
    "other-operations",
  ];
  const outletVals = outletKeys
    .map((k) => ss[k])
    .filter((v) => v !== undefined) as number[];
  const outletHygiene =
    outletVals.length > 0
      ? Math.round(outletVals.reduce((a, b) => a + b, 0) / outletVals.length)
      : 0;

  const score = submission.score;

  // Helper: score color
  function scoreColor(s: number): [number, number, number] {
    if (s >= 75) return [22, 163, 74];
    if (s >= 50) return [234, 88, 12];
    return [185, 28, 28];
  }

  // ---- 1. Overall Compliance Rating ----
  y = checkPageBreak(doc, y, 38, pageNum);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(54, 30, 20);
  doc.text("1. Overall Compliance Rating", MARGIN, y);
  y += 7;

  let ratingLabel: string;
  let ratingColor: [number, number, number];
  let ratingBg: [number, number, number];
  let ratingDesc: string;

  if (score >= 90) {
    ratingLabel = "Excellent";
    ratingColor = [22, 163, 74];
    ratingBg = [220, 252, 231];
    ratingDesc = "90–100%: Outstanding compliance across all areas.";
  } else if (score >= 75) {
    ratingLabel = "Good";
    ratingColor = [37, 99, 235];
    ratingBg = [219, 234, 254];
    ratingDesc = "75–89%: Strong performance with minor improvement areas.";
  } else if (score >= 60) {
    ratingLabel = "Needs Improvement";
    ratingColor = [234, 88, 12];
    ratingBg = [255, 237, 213];
    ratingDesc = "60–74%: Corrective actions required in several sections.";
  } else {
    ratingLabel = "Critical";
    ratingColor = [185, 28, 28];
    ratingBg = [254, 226, 226];
    ratingDesc = "Below 60%: Immediate corrective action urgently required.";
  }

  // Badge pill
  const badgeW = 90;
  const badgeH = 14;
  doc.setFillColor(...ratingBg);
  doc.roundedRect(MARGIN, y, badgeW, badgeH, 4, 4, "F");
  doc.setDrawColor(...ratingColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(MARGIN, y, badgeW, badgeH, 4, 4, "S");
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ratingColor);
  doc.text(ratingLabel, MARGIN + badgeW / 2, y + 9.5, { align: "center" });

  // Score box next to badge
  const scoreBoxX = MARGIN + badgeW + 6;
  doc.setFillColor(...ratingColor);
  doc.roundedRect(scoreBoxX, y, 28, badgeH, 4, 4, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`${score}%`, scoreBoxX + 14, y + 9.5, { align: "center" });

  y += badgeH + 4;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(ratingDesc, MARGIN, y);
  y += 10;

  // ---- 2. Section-wise Insights ----
  y = checkPageBreak(doc, y, 65, pageNum);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(54, 30, 20);
  doc.text("2. Section-wise Insights", MARGIN, y);
  y += 7;

  const insights = [
    { name: "Food Hygiene", score: foodHygiene },
    { name: "Employee Hygiene", score: employeeHygiene },
    { name: "Outlet Hygiene", score: outletHygiene },
  ];

  for (const insight of insights) {
    y = checkPageBreak(doc, y, 18, pageNum);
    const [cr, cg, cb] = scoreColor(insight.score);

    // Category name
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(insight.name, MARGIN, y + 4);

    // Score label on right
    doc.setFont("helvetica", "bold");
    doc.setTextColor(cr, cg, cb);
    doc.text(`${insight.score}%`, MARGIN + CONTENT_WIDTH, y + 4, {
      align: "right",
    });

    y += 7;

    // Progress bar background
    const barH = 5;
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, barH, 2, 2, "F");

    // Progress bar fill
    const fillW = Math.max(0, (insight.score / 100) * CONTENT_WIDTH);
    if (fillW > 0) {
      doc.setFillColor(cr, cg, cb);
      doc.roundedRect(MARGIN, y, fillW, barH, 2, 2, "F");
    }

    y += barH + 6;
  }

  y += 2;

  // ---- 3. Overall Insight ----
  y = checkPageBreak(doc, y, 40, pageNum);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(54, 30, 20);
  doc.text("3. Overall Insight", MARGIN, y);
  y += 7;

  let insightText: string;
  if (score >= 90) {
    insightText =
      "The outlet demonstrated excellent hygiene and compliance standards during this audit. All key areas were well-maintained, reflecting strong operational discipline. Continue current practices and maintain these high standards consistently.";
  } else if (score >= 75) {
    insightText =
      "The outlet showed good overall compliance with hygiene and brand standards. Most areas are well-managed, with minor opportunities for improvement in specific sections. Focus on the highlighted areas to achieve excellence.";
  } else if (score >= 60) {
    insightText =
      "The outlet requires improvement in several compliance areas. While some sections meet acceptable standards, targeted corrective actions are needed to bring performance up to required levels. Please review the actionable insights below and implement changes promptly.";
  } else {
    insightText =
      "The outlet shows critical deficiencies in multiple hygiene and compliance areas. Immediate corrective action is required across several sections. Management should prioritize addressing the listed action items urgently to meet minimum compliance standards.";
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(38, 38, 38);
  const insightLines = doc.splitTextToSize(insightText, CONTENT_WIDTH);
  for (const line of insightLines) {
    y = checkPageBreak(doc, y, 6, pageNum);
    doc.text(line, MARGIN, y);
    y += 5;
  }

  y += 6;

  // ---- 4. Actionable Insights ----
  y = checkPageBreak(doc, y, 30, pageNum);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(54, 30, 20);
  doc.text("4. Actionable Insights", MARGIN, y);
  y += 7;

  const bullets: string[] = [];

  if (foodHygiene < 75) {
    bullets.push(
      "\u2022 Strengthen food handling procedures \u2014 review temperature control, cross-contamination prevention, and food storage practices.",
    );
  }
  if (employeeHygiene < 75) {
    bullets.push(
      "\u2022 Improve employee hygiene compliance \u2014 reinforce handwashing protocols, uniform standards, and personal hygiene training.",
    );
  }
  if (outletHygiene < 75) {
    bullets.push(
      "\u2022 Enhance outlet cleanliness \u2014 prioritize deep cleaning schedules for kitchen floors, walls, equipment, and public-facing areas.",
    );
  }
  if (bullets.length === 0) {
    bullets.push(
      "\u2022 All key sections meet the required compliance threshold. Maintain current standards and conduct regular monitoring.",
    );
  }

  if (score >= 90) {
    bullets.push(
      "\u2022 Schedule the next audit in 3 months to maintain excellence rating.",
    );
  } else if (score >= 75) {
    bullets.push(
      "\u2022 Schedule a follow-up review in 6 weeks to track improvement progress.",
    );
  } else {
    bullets.push(
      "\u2022 Conduct a re-audit within 30 days after implementing corrective actions.",
    );
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);

  for (const bullet of bullets) {
    const bulletLines = doc.splitTextToSize(bullet, CONTENT_WIDTH);
    const bulletH = bulletLines.length * 5 + 3;
    y = checkPageBreak(doc, y, bulletH, pageNum);
    for (let bi = 0; bi < bulletLines.length; bi++) {
      doc.text(bulletLines[bi], MARGIN, y);
      y += 5;
    }
    y += 3;
  }
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateAuditPDF(
  submission: AuditSubmission,
): Promise<void> {
  const JsPDF = getJsPDF();
  const doc: JsPDFInstance = new JsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
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
  const scoreColor: [number, number, number] =
    submission.score >= 70 ? [22, 101, 52] : [153, 27, 27];
  const scoreBg: [number, number, number] =
    submission.score >= 70 ? [220, 252, 231] : [254, 226, 226];
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
      label: "Submitted",
      value: new Date(submission.submittedAt).toLocaleDateString("en-IN"),
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

  doc.setFillColor(38, 40, 59);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("COMPLIANCE SCORE SUMMARY", MARGIN + 3, y + 5);
  y += 9;

  // Final score bar
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 8, 2, 2, "F");
  const barFill = (submission.score / 100) * CONTENT_WIDTH;
  const barColor: [number, number, number] =
    submission.score >= 70
      ? [34, 197, 94]
      : submission.score >= 40
        ? [245, 158, 11]
        : [239, 68, 68];
  doc.setFillColor(...barColor);
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

  doc.setFillColor(240, 240, 240);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 6, "F");
  let cx = MARGIN;
  for (let i = 0; i < tableHeaders.length; i++) {
    doc.setFontSize(8);
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
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.text(sectionLabel(sid), cx + 2, y + 4.5, {
      maxWidth: tableColW[0] - 4,
    });
    cx += tableColW[0];

    doc.text(`${Math.round(weight * 100)}%`, cx + 2, y + 4.5);
    cx += tableColW[1];

    const sectionColor: [number, number, number] =
      secScore >= 70
        ? [22, 101, 52]
        : secScore >= 40
          ? [146, 64, 14]
          : [153, 27, 27];
    doc.setTextColor(...sectionColor);
    doc.setFont("helvetica", "bold");
    doc.text(`${secScore}%`, cx + 2, y + 4.5);
    cx += tableColW[2];

    // Mini bar
    doc.setFillColor(235, 235, 235);
    doc.roundedRect(cx + 2, y + 1.5, tableColW[3] - 6, 3.5, 1, 1, "F");
    const miniFill = (secScore / 100) * (tableColW[3] - 6);
    doc.setFillColor(...sectionColor);
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
    doc.setFillColor(38, 40, 59);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(section.title, MARGIN + 3, y + 5);
    const secScoreVal = submission.sectionScores[section.id] ?? 0;
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`${secScoreVal}%`, MARGIN + CONTENT_WIDTH - 4, y + 5, {
      align: "right",
    });
    y += 9;

    for (const item of section.items) {
      const isNaValue = item.value === "NA";
      const isStarItem = section.isStarRating && typeof item.value === "number";
      const hasImage = !!item.imageBase64 || !!item.imageUrl;
      // Follow-up: star sections ≤3 stars, YES/NO/NA sections when NO
      const hasFollowUp = section.isStarRating
        ? isStarItem && (item.value as number) <= 3 && !!item.followUpAction
        : item.value === "NO" && !!item.followUpAction;
      const estimatedH =
        12 +
        (item.remarks ? 5 : 0) +
        (hasFollowUp ? 10 : 0) +
        (hasImage ? IMG_MAX_H + 5 : 0);

      y = checkPageBreak(doc, y, estimatedH, pageNum);

      // Row background
      doc.setFillColor(252, 252, 252);
      doc.rect(MARGIN, y, CONTENT_WIDTH, 0.2, "F");

      // Parameter label — increased to 10pt
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      const labelLines = doc.splitTextToSize(item.label, 118);
      for (let li = 0; li < labelLines.length; li++) {
        doc.text(labelLines[li], MARGIN + 2, y + 6 + li * 5);
      }
      const labelH = labelLines.length * 5;

      // Rating display
      const ratingX = MARGIN + 124;
      if (section.isStarRating) {
        if (isNaValue) {
          // NA badge for star section
          doc.setFillColor(229, 231, 235);
          doc.roundedRect(ratingX, y + 1, 18, 6, 1.5, 1.5, "F");
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(107, 114, 128);
          doc.text("N/A", ratingX + 9, y + 5.5, { align: "center" });
        } else if (isStarItem) {
          const starVal = item.value as number;
          const sy = y + 5;
          for (let i = 0; i < 5; i++) {
            const [cr, cg, cb] = STAR_COLOR_RGB[i];
            if (i < starVal) {
              doc.setFillColor(cr, cg, cb);
              doc.roundedRect(
                ratingX + i * 5 - 1.8,
                sy - 1.8,
                3.6,
                3.6,
                1.8,
                1.8,
                "F",
              );
            } else {
              doc.setDrawColor(cr, cg, cb);
              doc.setLineWidth(0.3);
              doc.roundedRect(
                ratingX + i * 5 - 1.8,
                sy - 1.8,
                3.6,
                3.6,
                1.8,
                1.8,
                "S",
              );
            }
          }
          // Show "X/5" label instead of percentage
          const [pr, pg, pb] = STAR_COLOR_RGB[starVal - 1];
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(pr, pg, pb);
          doc.text(`${starVal}/5`, ratingX + 5 * 5 + 2, y + 6);
          doc.setLineWidth(0.2);
        }
      } else if (item.value && typeof item.value === "string" && !isNaValue) {
        // YES/NO badge
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
        const val = item.value as string;
        doc.setFillColor(...(resultBgs[val] ?? resultBgs.NA));
        doc.roundedRect(ratingX, y + 1, 18, 6, 1.5, 1.5, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...(resultColors[val] ?? resultColors.NA));
        doc.text(val, ratingX + 9, y + 5.5, { align: "center" });
      } else if (isNaValue) {
        // NA badge (for YES/NO/NA sections)
        doc.setFillColor(243, 244, 246);
        doc.roundedRect(ratingX, y + 1, 18, 6, 1.5, 1.5, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text("NA", ratingX + 9, y + 5.5, { align: "center" });
      }

      y += labelH + 4;

      // Remarks — bold label 11pt, content 11pt, darker text
      if (item.remarks) {
        y = checkPageBreak(doc, y, 10, pageNum);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text("Remarks:", MARGIN + 2, y + 5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(25, 25, 25);
        const remarkLines = doc.splitTextToSize(item.remarks, 120);
        for (let ri = 0; ri < remarkLines.length; ri++) {
          y = checkPageBreak(doc, y, 6, pageNum);
          doc.text(remarkLines[ri], MARGIN + 28, y + 5);
          if (ri < remarkLines.length - 1) y += 6;
        }
        y += 6 + 4;
      }

      // Service date for tracked parameters
      const serviceDateLabel =
        item.label === "Duct and Hood grease free"
          ? submission.ductHoodLastServiceDate
          : item.label === "Water Filter working"
            ? submission.waterFilterLastServiceDate
            : item.label === "Visicooler cooling and clean"
              ? submission.visicoolerLastServiceDate
              : item.label === "Deep Freezer hygienic"
                ? submission.deepFreezerLastServiceDate
                : undefined;

      if (serviceDateLabel) {
        y = checkPageBreak(doc, y, 8, pageNum);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text("Last Service Date:", MARGIN + 2, y + 5);
        doc.setFont("helvetica", "normal");
        doc.setFillColor(220, 252, 231);
        doc.roundedRect(MARGIN + 38, y + 1, 50, 6, 1, 1, "F");
        doc.setTextColor(22, 101, 52);
        doc.text(serviceDateLabel, MARGIN + 40, y + 5.5);
        y += 8;
      }

      // Fire extinguisher expiry date inline display
      if (
        item.label === "Fire extinguisher available and within validity date" &&
        submission.fireExtinguisherExpiryDate
      ) {
        y = checkPageBreak(doc, y, 8, pageNum);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text("Expiry Date:", MARGIN + 2, y + 5);
        doc.setFont("helvetica", "normal");
        doc.setFillColor(255, 243, 205);
        doc.roundedRect(MARGIN + 28, y + 1, 50, 6, 1, 1, "F");
        doc.setTextColor(120, 80, 0);
        doc.text(submission.fireExtinguisherExpiryDate, MARGIN + 30, y + 5.5);
        y += 8;
      }

      // Follow-up action — bold label 11pt, content 11pt
      if (hasFollowUp) {
        const followUpLines = doc.splitTextToSize(
          item.followUpAction ?? "",
          CONTENT_WIDTH - 50,
        );
        const followUpH = 12 + (followUpLines.length - 1) * 6;
        y = checkPageBreak(doc, y, followUpH + 4, pageNum);
        doc.setFillColor(254, 242, 242);
        doc.rect(MARGIN + 2, y, CONTENT_WIDTH - 4, followUpH + 2, "F");
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(153, 27, 27);
        doc.text("Follow-up Action:", MARGIN + 4, y + 7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 30, 30);
        for (let fi = 0; fi < followUpLines.length; fi++) {
          doc.text(followUpLines[fi], MARGIN + 46, y + 7 + fi * 6);
        }
        y += followUpH + 5;
      }

      // Image — preserve original aspect ratio, 25% of content width
      if (hasImage) {
        try {
          const imgData = item.imageUrl
            ? ((await fetchImageAsDataUrl(item.imageUrl)) ?? item.imageBase64)
            : item.imageBase64;
          if (imgData) {
            const fmt = imgData.startsWith("data:image/png") ? "PNG" : "JPEG";
            const dims = await getImageDimensions(imgData);
            let displayW = IMG_MAX_W;
            let displayH = (dims.height / dims.width) * displayW;
            if (displayH > IMG_MAX_H) {
              displayH = IMG_MAX_H;
              displayW = (dims.width / dims.height) * displayH;
            }
            y = checkPageBreak(doc, y, displayH + 5, pageNum);
            doc.addImage(
              imgData,
              fmt,
              MARGIN + 2,
              y,
              displayW,
              displayH,
              undefined,
              "FAST",
            );
            y += displayH + 3;
          }
        } catch {
          // skip image on error
        }
      }

      // Divider
      doc.setDrawColor(235, 235, 235);
      doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
      y += 3;
    }

    y += 4;
  }

  // ---- PEST Section ----
  if (submission.pestControlDate) {
    y = checkPageBreak(doc, y, 20, pageNum);
    doc.setFillColor(38, 40, 59);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("PEST CONTROL", MARGIN + 3, y + 5);
    y += 10;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text("Next Pest Control Service Date:", MARGIN + 2, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFillColor(240, 240, 255);
    doc.roundedRect(MARGIN + 60, y + 1, 50, 6, 1, 1, "F");
    doc.setTextColor(50, 50, 150);
    doc.text(submission.pestControlDate, MARGIN + 62, y + 5.5);
    y += 12;
  }

  // ---- Audit Summary ----
  y = checkPageBreak(doc, y, 40, pageNum);

  doc.setFillColor(38, 40, 59);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("AUDIT SUMMARY", MARGIN + 3, y + 5);
  y += 10;

  // Overall Remarks — with clear line gap after heading
  if (submission.overallRemarks) {
    y = checkPageBreak(doc, y, 18, pageNum);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text("Overall Remarks", MARGIN + 2, y + 5);
    y += 10;
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

  // Fire Extinguisher Expiry Date in summary
  if (submission.fireExtinguisherExpiryDate) {
    y = checkPageBreak(doc, y, 12, pageNum);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text("Fire Extinguisher Expiry Date:", MARGIN + 2, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(35, 35, 35);
    doc.text(submission.fireExtinguisherExpiryDate, MARGIN + 60, y + 5);
    y += 10;
  }

  // Signatures
  y = checkPageBreak(doc, y, 45, pageNum);
  const sigW = (CONTENT_WIDTH - 8) / 2;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("Auditor Signature", MARGIN + 2, y + 5);
  const managerSigLabel = submission.managerName
    ? `Manager Signature \u2014 ${submission.managerName}`
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

  // Submitted date
  {
    const ROW_H = 8;
    y = checkPageBreak(doc, y, ROW_H + 2, pageNum);
    doc.setFillColor(248, 248, 248);
    doc.rect(MARGIN, y, PAGE_WIDTH - 2 * MARGIN, ROW_H, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(38, 40, 59);
    doc.text("Submitted:", MARGIN + 2, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text(
      new Date(submission.submittedAt).toLocaleDateString("en-IN"),
      MARGIN + 22,
      y + 5,
    );
    y += ROW_H + 2;
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
    `Generated by Oho Shawarma Internal Dashboard  \u2022  ${new Date().toLocaleString()}`,
    PAGE_WIDTH / 2,
    y,
    { align: "center" },
  );

  // ---- Analytics Summary Page ----
  drawAnalyticsSummaryPage(doc, submission, pageNum);

  doc.save(`audit-${submission.auditId}.pdf`);
}

// Keep starToPercent referenced to avoid unused import warning
void starToPercent;
