// Frontend-only auth + data store using localStorage
import { deleteImagesBySubmission, getImage, saveImage } from "./imageDb";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "auditor";
  status: "active" | "deactivated";
  createdAt: string;
}

export interface Outlet {
  id: string;
  name: string;
  code: string;
  status: "active" | "deactivated";
  sortOrder: number;
  isTest: boolean;
  createdAt: string;
}

export interface AuditReport {
  id: string;
  outletName: string;
  auditorName: string;
  date: string;
  score: number;
  status: "pass" | "fail" | "pending";
  notes: string;
  isSample: boolean;
  submissionId?: string;
}

export interface AuditItem {
  id: string;
  label: string;
  value: number | "YES" | "NO" | "NA" | null;
  remarks: string;
  followUpAction?: string;
  imageBase64?: string;
}

export interface AuditSection {
  id: string;
  title: string;
  items: AuditItem[];
  allowImage?: boolean;
  isStarRating?: boolean;
}

export interface AuditSubmission {
  id: string;
  auditId: string;
  outletId: string;
  outletName: string;
  auditorId: string;
  auditorName: string;
  submittedAt: string;
  sections: AuditSection[];
  score: number;
  sectionScores: Record<string, number>;
  isSample: boolean;
  overallRemarks?: string;
  auditorSignature?: string;
  managerSignature?: string;
  managerName?: string;
  auditDate?: string;
  fireExtinguisherExpiryDate?: string;
  ductHoodLastServiceDate?: string;
  waterFilterLastServiceDate?: string;
  visicoolerLastServiceDate?: string;
  deepFreezerLastServiceDate?: string;
  pestControlDate?: string;
}

export interface Session {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "auditor";
}

const USERS_KEY = "oho_users";
const OUTLETS_KEY = "oho_outlets";
const AUDITS_KEY = "oho_audits";
const SESSION_KEY = "oho_session";
const SUBMISSIONS_KEY = "oho_audit_submissions";

const DEFAULT_ADMIN: User = {
  id: "default-admin",
  name: "Admin",
  email: "info@ohoshawarma.com",
  password: "Oho@admin",
  role: "admin",
  status: "active",
  createdAt: new Date().toISOString(),
};

const SEED_OUTLETS: Array<{ name: string; code: string; isTest: boolean }> = [
  { name: "New Panvel", code: "NP001", isTest: false },
  { name: "Nerul Sec 23", code: "NR023", isTest: false },
  { name: "Ulwe", code: "UL003", isTest: false },
  { name: "Airoli", code: "AR004", isTest: false },
  { name: "Vashi", code: "VS005", isTest: false },
  { name: "Chembur", code: "CH006", isTest: false },
  { name: "Kothrud", code: "KT007", isTest: false },
  { name: "Mira Road", code: "MR008", isTest: false },
  { name: "Nerul (S-13)", code: "NR013", isTest: false },
  { name: "Ghansoli", code: "GH010", isTest: false },
  { name: "Sanpada", code: "SP011", isTest: false },
  { name: "Kolbad", code: "KB012", isTest: false },
  { name: "Lower Parel", code: "LP013", isTest: false },
  { name: "Andheri", code: "AN014", isTest: false },
  { name: "Ghatkopar", code: "GK015", isTest: false },
  { name: "Badlapur", code: "BD016", isTest: false },
  { name: "Dombivli", code: "DM017", isTest: false },
  { name: "Alibag", code: "AB018", isTest: false },
  { name: "Hinjewadi", code: "HJ019", isTest: false },
  { name: "Kalyan", code: "KL020", isTest: false },
  { name: "Kamothe", code: "KM021", isTest: false },
  { name: "Karanjade", code: "KJ022", isTest: false },
  { name: "Kharghar (S20)", code: "KH020", isTest: false },
  { name: "Kharghar (S35)", code: "KH035", isTest: false },
  { name: "Khoparkhairne", code: "KK025", isTest: false },
  { name: "Kolhapur", code: "KP026", isTest: false },
  { name: "Medavakkam", code: "MD027", isTest: false },
  { name: "Pen", code: "PN028", isTest: false },
  { name: "Taloja", code: "TL029", isTest: false },
  { name: "Bhiwandi", code: "BW030", isTest: false },
  { name: "Test Outlet", code: "TEST001", isTest: true },
];

const AUDIT_SECTIONS_TEMPLATE: Array<{
  id: string;
  title: string;
  labels: string[];
  isStarRating?: boolean;
}> = [
  {
    id: "shop-exterior",
    title: "Shop Exterior Audit",
    isStarRating: true,
    labels: [
      "Signage is clean and lit",
      "Shop entrance and surrounding is clean",
      "Customer seating area is clean and chairs/tables are dirt free",
      "Garbage box outside is clean",
    ],
  },
  {
    id: "kitchen-floors-walls",
    title: "Kitchen Floors and Walls",
    isStarRating: true,
    labels: [
      "Live & Back Kitchen floor clean",
      "Live & Back Kitchen wall clean",
      "Washroom clean",
    ],
  },
  {
    id: "equipment-cleanliness",
    title: "Equipment Cleanliness",
    isStarRating: true,
    labels: [
      "Bain Marie Table clean and spill free",
      "Shawarma Machine clean and rust-free",
      "Fryer Table clean",
      "Crispy Chicken Prep Table clean",
      "Mayonnaise Table clean",
      "Sink Table clean",
      "Utensils clean",
      "Fries Cutting Machine clean",
      "Mayonnaise Making Mixer clean",
    ],
  },
  {
    id: "other-operations",
    title: "Other Operations Cleanliness",
    isStarRating: true,
    labels: [
      "Duct and Hood grease free",
      "Visicooler cooling and clean",
      "Deep Freezer hygienic",
      "Cutting Board separate for veg and non-veg",
      "Beetroot Storage Tank clean",
      "Fan wall and exhaust fan clean",
      "Water Filter working",
      "Raw Material Storage FIFO followed",
      "Cash Counter clean and POS dust free",
    ],
  },
  {
    id: "food-handling-safety",
    title: "Food Handling and Safety",
    isStarRating: true,
    labels: [
      "Food safety signages displayed in kitchen",
      "Approved storage containers and packaging used",
      "Raw and cooked food stored separately",
      "Waste oil container available and used properly",
      "Fire extinguisher available and within validity date",
    ],
  },
  {
    id: "employee-hygiene",
    title: "Employee Hygiene",
    isStarRating: true,
    labels: [
      "Employees wearing clean uniform",
      "Employees wearing gloves while handling food",
      "Employees wearing hairnet or cap",
      "Employees wearing closed shoes",
      "Employees beard trimmed or clean shaved",
      "Employees nails trimmed and clean",
    ],
  },
  {
    id: "raw-material-compliance",
    title: "Raw Material Brand Compliance",
    isStarRating: false,
    labels: [
      "Eggless Mayo",
      "Cheese Jalapeno Sauce",
      "Chipotle Sauce",
      "Makhni Gravy",
      "Chilli Garlic Sauce",
      "Goda Cheese Sauce",
      "Burger Mayo",
      "Tomato Ketchup Sachet",
      "BBQ Sauce",
      "Peri Peri",
      "Hot & Spicy Marinade",
      "Cajun Breader Mix",
      "9mm French Fries",
      "Pickled Jalapeno",
      "Black Sliced Olive",
      "Falafel",
      "Processed Cheese Block",
      "Fresh Cream",
      "Sumak",
      "Pomace Olive Oil",
      "Lime & Mint",
      "Blue Curacao",
      "Kala Khatta",
      "Peach Iced Tea",
      "Green Apple",
      "Chilli Guava",
      "Bisleri 500ml",
      "Bisleri Soda 750ml",
    ],
  },
];

// Section weights for compliance scoring
export const SECTION_WEIGHTS: Record<string, number> = {
  "shop-exterior": 0.1,
  "kitchen-floors-walls": 0.1,
  "equipment-cleanliness": 0.3,
  "other-operations": 0.3,
  "food-handling-safety": 0.1,
  "employee-hygiene": 0.05,
  "raw-material-compliance": 0.05,
};

// Star rating conversion: 1→0%, 2→25%, 3→50%, 4→75%, 5→100%
export function starToPercent(star: number): number {
  return (star - 1) * 25;
}

// Section Score calculation
export function calculateSectionScore(section: AuditSection): number {
  const total = section.items.length;
  if (total === 0) return 0;

  if (section.isStarRating) {
    const answered = section.items.filter((i) => typeof i.value === "number");
    if (answered.length === 0) return 0;
    const sum = answered.reduce(
      (acc, i) => acc + starToPercent(i.value as number),
      0,
    );
    return Math.round(sum / answered.length);
  }

  // YES/NO/NA logic for raw-material-compliance
  const compliant = section.items.filter(
    (i) => i.value === "YES" || i.value === "NA",
  ).length;
  return Math.round((compliant / total) * 100);
}

// Final Score = weighted sum of section scores
export function calculateFinalScore(sections: AuditSection[]): number {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const section of sections) {
    const weight = SECTION_WEIGHTS[section.id] ?? 0;
    if (weight > 0) {
      weightedSum += calculateSectionScore(section) * weight;
      totalWeight += weight;
    }
  }
  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
}

export function createDefaultAuditSections(): AuditSection[] {
  return AUDIT_SECTIONS_TEMPLATE.map((section) => ({
    id: section.id,
    title: section.title,
    isStarRating: section.isStarRating ?? false,
    items: section.labels.map((label, i) => ({
      id: `${section.id}-item-${i}`,
      label,
      value: null,
      remarks: "",
      followUpAction: "",
    })),
  }));
}

// ---- Users ----

function initUsers(): User[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    const users = [DEFAULT_ADMIN];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return users;
  }
  return JSON.parse(raw) as User[];
}

export function getAllUsers(): User[] {
  return initUsers();
}

export function getUsers(): User[] {
  return initUsers().filter((u) => u.status === "active");
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function createUser(
  data: Omit<User, "id" | "createdAt" | "status">,
): User {
  const users = getAllUsers();
  const user: User = {
    ...data,
    id: crypto.randomUUID(),
    status: "active",
    createdAt: new Date().toISOString(),
  };
  saveUsers([...users, user]);
  return user;
}

export function updateUser(
  id: string,
  data: Partial<Omit<User, "id" | "createdAt">>,
): void {
  saveUsers(getAllUsers().map((u) => (u.id === id ? { ...u, ...data } : u)));
}

export function deleteUser(id: string): void {
  saveUsers(getAllUsers().filter((u) => u.id !== id));
}

export function deactivateUser(id: string): void {
  updateUser(id, { status: "deactivated" });
}

export function reactivateUser(id: string): void {
  updateUser(id, { status: "active" });
}

export function resetUserPassword(id: string, newPassword: string): void {
  updateUser(id, { password: newPassword });
}

// ---- Outlets ----

function initOutlets(): Outlet[] {
  const raw = localStorage.getItem(OUTLETS_KEY);
  if (!raw) {
    const outlets: Outlet[] = SEED_OUTLETS.map((o, i) => ({
      id: crypto.randomUUID(),
      name: o.name,
      code: o.code,
      status: "active" as const,
      sortOrder: i,
      isTest: o.isTest,
      createdAt: new Date().toISOString(),
    }));
    localStorage.setItem(OUTLETS_KEY, JSON.stringify(outlets));
    return outlets;
  }
  return JSON.parse(raw) as Outlet[];
}

export function getAllOutlets(): Outlet[] {
  return initOutlets();
}

export function getOutlets(): Outlet[] {
  return initOutlets()
    .filter((o) => o.status === "active")
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function saveOutlets(outlets: Outlet[]): void {
  localStorage.setItem(OUTLETS_KEY, JSON.stringify(outlets));
}

export function createOutlet(
  data: Omit<Outlet, "id" | "createdAt" | "status" | "sortOrder" | "isTest">,
): Outlet {
  const all = getAllOutlets();
  const maxOrder = all.reduce((m, o) => Math.max(m, o.sortOrder), -1);
  const outlet: Outlet = {
    ...data,
    id: crypto.randomUUID(),
    status: "active",
    sortOrder: maxOrder + 1,
    isTest: false,
    createdAt: new Date().toISOString(),
  };
  saveOutlets([...all, outlet]);
  return outlet;
}

export function updateOutlet(
  id: string,
  data: Partial<Omit<Outlet, "id" | "createdAt">>,
): void {
  saveOutlets(
    getAllOutlets().map((o) => (o.id === id ? { ...o, ...data } : o)),
  );
}

export function deactivateOutlet(id: string): void {
  updateOutlet(id, { status: "deactivated" });
}

export function reactivateOutlet(id: string): void {
  updateOutlet(id, { status: "active" });
}

export function deleteOutlet(id: string): void {
  const outlet = getAllOutlets().find((o) => o.id === id);
  if (!outlet?.isTest) return; // Only test outlets can be deleted
  saveOutlets(getAllOutlets().filter((o) => o.id !== id));
}

// ---- Audit Reports ----

function initAudits(): AuditReport[] {
  const raw = localStorage.getItem(AUDITS_KEY);
  if (!raw) {
    localStorage.setItem(AUDITS_KEY, JSON.stringify([]));
    return [];
  }
  const all = JSON.parse(raw) as AuditReport[];
  // Auto-remove any sample data
  const nonSample = all.filter((a) => !a.isSample);
  if (nonSample.length !== all.length) {
    localStorage.setItem(AUDITS_KEY, JSON.stringify(nonSample));
  }
  return nonSample;
}

export function getAuditReports(): AuditReport[] {
  return initAudits();
}

function saveAudits(audits: AuditReport[]): void {
  localStorage.setItem(AUDITS_KEY, JSON.stringify(audits));
}

export function createAuditReport(data: Omit<AuditReport, "id">): AuditReport {
  const report: AuditReport = { ...data, id: crypto.randomUUID() };
  saveAudits([...getAuditReports(), report]);
  return report;
}

export function deleteAuditReport(id: string): void {
  saveAudits(getAuditReports().filter((r) => r.id !== id));
}

export function clearSampleData(): void {
  saveAudits(getAuditReports().filter((r) => !r.isSample));
  saveSubmissions(getAuditSubmissions().filter((s) => !s.isSample));
  saveOutlets(getAllOutlets().filter((o) => !o.isTest));
}

// Remove all audit data linked to the Test Outlet
export async function clearTestOutletData(): Promise<void> {
  const testOutlets = getAllOutlets().filter((o) => o.isTest);
  const testNames = new Set(testOutlets.map((o) => o.name));
  const removedSubmissions = getAuditSubmissions().filter((s) =>
    testNames.has(s.outletName),
  );
  saveAudits(getAuditReports().filter((r) => !testNames.has(r.outletName)));
  saveSubmissions(
    getAuditSubmissions().filter((s) => !testNames.has(s.outletName)),
  );
  // Clean up images for removed submissions
  await Promise.all(
    removedSubmissions.map((s) => deleteImagesBySubmission(s.id)),
  );
}

// ---- Audit Submissions ----

function initSubmissions(): AuditSubmission[] {
  const raw = localStorage.getItem(SUBMISSIONS_KEY);
  if (!raw) {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify([]));
    return [];
  }
  const all = JSON.parse(raw) as AuditSubmission[];
  // Auto-remove any sample data
  const nonSample = all.filter((s) => !s.isSample);
  if (nonSample.length !== all.length) {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(nonSample));
  }
  return nonSample;
}

function saveSubmissions(submissions: AuditSubmission[]): void {
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
}

export function getAuditSubmissions(): AuditSubmission[] {
  return initSubmissions();
}

export function getMyAuditSubmissions(auditorId: string): AuditSubmission[] {
  return initSubmissions().filter((s) => s.auditorId === auditorId);
}

export function getAuditSubmissionById(
  id: string,
): AuditSubmission | undefined {
  return initSubmissions().find((s) => s.id === id);
}

/**
 * Load images from IndexedDB and rehydrate them into a submission's sections.
 * Call this before generating a PDF or displaying photos.
 */
export async function loadImagesForSubmission(
  submission: AuditSubmission,
): Promise<AuditSubmission> {
  const sections = await Promise.all(
    submission.sections.map(async (section) => ({
      ...section,
      items: await Promise.all(
        section.items.map(async (item) => {
          const key = `${submission.id}::${section.id}::${item.id}`;
          const imageBase64 = await getImage(key);
          return imageBase64 ? { ...item, imageBase64 } : item;
        }),
      ),
    })),
  );
  return { ...submission, sections };
}

/**
 * Save images from sections to IndexedDB and return sections with images stripped.
 * This keeps localStorage free of large base64 blobs.
 */
async function saveImagesToDb(
  submissionId: string,
  sections: AuditSection[],
): Promise<AuditSection[]> {
  const stripped = await Promise.all(
    sections.map(async (section) => ({
      ...section,
      items: await Promise.all(
        section.items.map(async (item) => {
          if (item.imageBase64) {
            const key = `${submissionId}::${section.id}::${item.id}`;
            await saveImage(key, item.imageBase64);
            // Return item without the base64 blob
            const { imageBase64: _, ...rest } = item;
            return rest as AuditItem;
          }
          return item;
        }),
      ),
    })),
  );
  return stripped;
}

export async function createAuditSubmission(
  data: Omit<AuditSubmission, "id" | "auditId" | "sectionScores" | "score">,
): Promise<AuditSubmission> {
  const uuid = crypto.randomUUID();
  const dateObj = new Date(data.submittedAt);
  const datePart = dateObj.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = uuid.replace(/-/g, "").slice(-4).toUpperCase();
  const auditId = `OHO-${datePart}-${suffix}`;

  const sectionScores: Record<string, number> = {};
  for (const section of data.sections) {
    sectionScores[section.id] = calculateSectionScore(section);
  }

  const score = calculateFinalScore(data.sections);

  // Save images to IndexedDB and strip them from the localStorage entry
  const strippedSections = await saveImagesToDb(uuid, data.sections);

  const submissionForStorage: AuditSubmission = {
    ...data,
    sections: strippedSections,
    id: uuid,
    auditId,
    sectionScores,
    score,
  };
  saveSubmissions([...getAuditSubmissions(), submissionForStorage]);

  // Also create an AuditReport entry for admin view
  const dateStr = dateObj.toISOString().split("T")[0];
  createAuditReport({
    outletName: data.outletName,
    auditorName: data.auditorName,
    date: dateStr,
    score,
    status: score >= 70 ? "pass" : "fail",
    notes: `Audit ${auditId} submitted by ${data.auditorName}`,
    isSample: false,
    submissionId: uuid,
  });

  // Return the full submission with images still in memory (for immediate use)
  return {
    ...data,
    sections: data.sections,
    id: uuid,
    auditId,
    sectionScores,
    score,
  };
}

export interface MaintenanceRow {
  outletName: string;
  fireExtinguisherExpiryDate?: string;
  ductHoodLastServiceDate?: string;
  waterFilterLastServiceDate?: string;
  visicoolerLastServiceDate?: string;
  deepFreezerLastServiceDate?: string;
  pestControlDate?: string;
}

export function getMaintenanceTrackerData(): MaintenanceRow[] {
  const submissions = getAuditSubmissions();
  const byOutletAll = new Map<string, AuditSubmission[]>();
  for (const s of submissions) {
    const arr = byOutletAll.get(s.outletName) ?? [];
    arr.push(s);
    byOutletAll.set(s.outletName, arr);
  }
  const rows: MaintenanceRow[] = [];
  for (const [outletName, allSubs] of byOutletAll) {
    const sorted = [...allSubs].sort((a, b) =>
      b.submittedAt.localeCompare(a.submittedAt),
    );
    const pick = (field: keyof AuditSubmission): string | undefined => {
      for (const s of sorted) {
        const v = s[field];
        if (typeof v === "string" && v.trim()) return v;
      }
      return undefined;
    };
    rows.push({
      outletName,
      fireExtinguisherExpiryDate: pick("fireExtinguisherExpiryDate"),
      ductHoodLastServiceDate: pick("ductHoodLastServiceDate"),
      waterFilterLastServiceDate: pick("waterFilterLastServiceDate"),
      visicoolerLastServiceDate: pick("visicoolerLastServiceDate"),
      deepFreezerLastServiceDate: pick("deepFreezerLastServiceDate"),
      pestControlDate: pick("pestControlDate"),
    });
  }
  return rows.sort((a, b) => a.outletName.localeCompare(b.outletName));
}

// ---- Session ----

export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export function login(email: string, password: string): Session | null {
  const users = getAllUsers();
  const user = users.find(
    (u) =>
      u.email === email && u.password === password && u.status === "active",
  );
  if (!user) return null;
  const session: Session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}
