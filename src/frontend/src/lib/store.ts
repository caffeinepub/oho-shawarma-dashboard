// Frontend-only auth + data store using localStorage
import { createActorWithConfig } from "@/config";
import { deleteImagesBySubmission, getImage, saveImage } from "./imageDb";

export interface StoredAuditSubmission {
  id: string;
  auditId: string;
  outletName: string;
  auditorId: string;
  auditorName: string;
  submittedAt: string;
  score: bigint;
  payload: string;
}

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
  auditId?: string;
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

// Extended actor type that includes the new audit submission methods
// (backend.ts is auto-generated and can't be directly modified)
interface AuditBackend {
  submitAuditSubmission(sub: StoredAuditSubmission): Promise<void>;
  getAllAuditSubmissions(): Promise<Array<StoredAuditSubmission>>;
  getAuditSubmissionById(id: string): Promise<StoredAuditSubmission | null>;
  deleteAuditSubmission(id: string): Promise<void>;
  deleteAuditSubmissionsByOutlet(outletName: string): Promise<void>;
}

// Singleton actor
let _actor:
  | (Awaited<ReturnType<typeof createActorWithConfig>> & AuditBackend)
  | null = null;
async function getActor() {
  if (!_actor) {
    const base = await createActorWithConfig();
    _actor = base as typeof base & AuditBackend;
  }
  return _actor;
}

function serializeSubmission(sub: AuditSubmission): StoredAuditSubmission {
  // Strip imageBase64 from items before serializing to keep payload under the
  // ICP 2MB ingress message limit. Images are stored separately in IndexedDB.
  const sectionsWithoutImages = sub.sections.map((s) => ({
    ...s,
    items: s.items.map((item) => {
      const { imageBase64: _img, ...rest } = item;
      void _img;
      return rest;
    }),
  }));
  // Build payload, strip signatures if total payload would exceed ~1.8MB
  const payloadObj = { ...sub, sections: sectionsWithoutImages };
  let payloadStr = JSON.stringify(payloadObj);
  if (payloadStr.length > 1_800_000) {
    // Strip signatures to keep under ICP 2MB limit
    const {
      auditorSignature: _as,
      managerSignature: _ms,
      ...rest
    } = payloadObj;
    void _as;
    void _ms;
    payloadStr = JSON.stringify(rest);
  }

  return {
    id: sub.id,
    auditId: sub.auditId,
    outletName: sub.outletName,
    auditorId: sub.auditorId,
    auditorName: sub.auditorName,
    submittedAt: sub.submittedAt,
    score: BigInt(Math.round(sub.score)),
    payload: payloadStr,
  };
}

function deserializeSubmission(stored: StoredAuditSubmission): AuditSubmission {
  const sub = JSON.parse(stored.payload) as AuditSubmission;
  return { ...sub, score: Number(stored.score) };
}

const USERS_KEY = "oho_users";
const OUTLETS_KEY = "oho_outlets";
const SESSION_KEY = "oho_session";

const DEFAULT_ADMIN: User = {
  id: "default-admin",
  name: "Admin",
  email: "info@ohoshawarma.com",
  password: "Oho@admin",
  role: "admin",
  status: "active",
  createdAt: new Date().toISOString(),
};

const DEFAULT_AUDITOR: User = {
  id: "default-auditor-pravin",
  name: "Pravin Dubey",
  email: "ohoshawarma.auditor@gmail.com",
  password: "Oho@audit",
  role: "auditor",
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
    const users = [DEFAULT_ADMIN, DEFAULT_AUDITOR];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return users;
  }
  let users = JSON.parse(raw) as User[];
  // Ensure default auditor always exists with up-to-date credentials
  const idx = users.findIndex((u) => u.id === "default-auditor-pravin");
  if (idx !== -1) {
    if (
      users[idx].email !== DEFAULT_AUDITOR.email ||
      users[idx].password !== DEFAULT_AUDITOR.password
    ) {
      users[idx] = {
        ...users[idx],
        email: DEFAULT_AUDITOR.email,
        password: DEFAULT_AUDITOR.password,
      };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  } else {
    users = [...users, DEFAULT_AUDITOR];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  return users;
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

// ---- Audit Submissions (backend-based) ----

export async function getAuditSubmissions(): Promise<AuditSubmission[]> {
  try {
    const actor = await getActor();
    const stored = await actor.getAllAuditSubmissions();
    return stored.map(deserializeSubmission);
  } catch (e) {
    console.error("Failed to fetch audit submissions from backend:", e);
    return [];
  }
}

export async function getMyAuditSubmissions(
  auditorId: string,
): Promise<AuditSubmission[]> {
  const all = await getAuditSubmissions();
  return all.filter((s) => s.auditorId === auditorId);
}

export async function getAuditSubmissionById(
  id: string,
): Promise<AuditSubmission | undefined> {
  try {
    const actor = await getActor();
    const result = await actor.getAuditSubmissionById(id);
    const item = Array.isArray(result) ? result[0] : result;
    if (!item) return undefined;
    return deserializeSubmission(item);
  } catch (e) {
    console.error("Failed to fetch audit submission:", e);
    return undefined;
  }
}

export async function getAuditReports(): Promise<AuditReport[]> {
  const submissions = await getAuditSubmissions();
  return submissions.map((sub) => ({
    id: sub.id,
    outletName: sub.outletName,
    auditorName: sub.auditorName,
    date: sub.auditDate || sub.submittedAt.slice(0, 10),
    score: sub.score,
    status: (sub.score >= 70 ? "pass" : "fail") as "pass" | "fail" | "pending",
    notes: `Audit ${sub.auditId}`,
    isSample: sub.isSample ?? false,
    submissionId: sub.id,
    auditId: sub.auditId,
  }));
}

export async function getMaintenanceTrackerData(): Promise<MaintenanceRow[]> {
  const submissions = await getAuditSubmissions();
  const rows: MaintenanceRow[] = submissions.map((s) => ({
    outletName: s.outletName,
    auditDate: s.auditDate || s.submittedAt?.slice(0, 10) || undefined,
    fireExtinguisherExpiryDate: s.fireExtinguisherExpiryDate || undefined,
    ductHoodLastServiceDate: s.ductHoodLastServiceDate || undefined,
    waterFilterLastServiceDate: s.waterFilterLastServiceDate || undefined,
    visicoolerLastServiceDate: s.visicoolerLastServiceDate || undefined,
    deepFreezerLastServiceDate: s.deepFreezerLastServiceDate || undefined,
    pestControlDate: s.pestControlDate || undefined,
  }));
  return rows.sort((a, b) => {
    const da = a.auditDate ?? "";
    const db = b.auditDate ?? "";
    return db.localeCompare(da);
  });
}

export async function clearTestOutletData(): Promise<void> {
  const testOutlets = getAllOutlets().filter((o) => o.isTest);
  const actor = await getActor();
  await Promise.all(
    testOutlets.map((o) => actor.deleteAuditSubmissionsByOutlet(o.name)),
  );
}

export async function deleteAuditReport(id: string): Promise<void> {
  const actor = await getActor();
  await actor.deleteAuditSubmission(id);
}

/**
 * Resize and compress an image for backend storage.
 * Max 800px wide/tall, JPEG 70% quality.
 */
async function resizeImageForStorage(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height / width) * MAX);
          width = MAX;
        } else {
          width = Math.round((width / height) * MAX);
          height = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

/**
 * Save images from sections to IndexedDB as cache.
 * Images are NOT included in the backend payload to stay under the ICP 2MB limit.
 */
async function saveImagesToDb(
  submissionId: string,
  sections: AuditSection[],
): Promise<AuditSection[]> {
  return Promise.all(
    sections.map(async (section) => ({
      ...section,
      items: await Promise.all(
        section.items.map(async (item) => {
          if (item.imageBase64) {
            const compressed = await resizeImageForStorage(item.imageBase64);
            const key = `${submissionId}::${section.id}::${item.id}`;
            await saveImage(key, compressed); // local cache only
            return { ...item, imageBase64: compressed };
          }
          return item;
        }),
      ),
    })),
  );
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

  // Save images to IndexedDB (local cache) — images are NOT sent to backend
  const sectionsWithImages = await saveImagesToDb(uuid, data.sections);

  const submission: AuditSubmission = {
    ...data,
    sections: sectionsWithImages,
    id: uuid,
    auditId,
    sectionScores,
    score,
  };

  // Store in ICP backend canister (images stripped to stay under 2MB limit)
  const actor = await getActor();
  await actor.submitAuditSubmission(serializeSubmission(submission));

  return submission;
}

/**
 * Load images for a submission. Checks backend payload first, falls back to IndexedDB
 * for legacy submissions that had images stripped before this fix.
 */
export async function loadImagesForSubmission(
  submission: AuditSubmission,
): Promise<AuditSubmission> {
  // Check if images are already embedded in the submission (from backend payload)
  const hasBackendImages = submission.sections.some((s) =>
    s.items.some((i) => !!i.imageBase64),
  );
  if (hasBackendImages) {
    return submission; // Images already present, no need to load from IndexedDB
  }

  // Fallback: try to load from IndexedDB (images are always stored locally)
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

export interface MaintenanceRow {
  outletName: string;
  auditDate?: string;
  fireExtinguisherExpiryDate?: string;
  ductHoodLastServiceDate?: string;
  waterFilterLastServiceDate?: string;
  visicoolerLastServiceDate?: string;
  deepFreezerLastServiceDate?: string;
  pestControlDate?: string;
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

// Legacy no-op for backward compat (was used before backend migration)
export async function deleteImagesBySubmissionId(
  submissionId: string,
): Promise<void> {
  await deleteImagesBySubmission(submissionId);
}
