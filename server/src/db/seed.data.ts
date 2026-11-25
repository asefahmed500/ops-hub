import { uid } from "./db.service.js";

const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000).toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export const SEED_USERS = [
  { id: "usr_admin", name: "Ayesha Karim", email: "admin@opshub.local", password: "admin123", role: "admin" as const },
  { id: "usr_rafiq", name: "Rafiq Hasan", email: "rafiq@opshub.local", password: "password123", role: "employee" as const },
  { id: "usr_nusrat", name: "Nusrat Jahan", email: "nusrat@opshub.local", password: "password123", role: "employee" as const },
  { id: "usr_kamal", name: "Kamal Uddin", email: "kamal@opshub.local", password: "password123", role: "employee" as const },
  { id: "usr_shafiul", name: "Shafiul Alam", email: "shafiul@opshub.local", password: "password123", role: "employee" as const },
  { id: "usr_mahin", name: "Mahin Rahman", email: "mahin@opshub.local", password: "password123", role: "employee" as const },
];

export const SEEDS: Record<string, () => object[]> = {
  tasks: () => [
    { id: uid("task"), title: "Reconcile weekly stock count for Line 2", description: "Cross-check physical count against system quantities before Friday cutoff.", status: "in_progress", priority: "high", assigneeId: "usr_rafiq", assignee: "Rafiq Hasan", dueDate: daysFromNow(1), createdAt: daysAgo(2) },
    { id: uid("task"), title: "Onboard new logistics vendor", description: "Collect documents, verify trade license, add to vendor list.", status: "todo", priority: "medium", assigneeId: "usr_nusrat", assignee: "Nusrat Jahan", dueDate: daysFromNow(4), createdAt: daysAgo(1) },
    { id: uid("task"), title: "Fix mislabelled bin locations in Zone C", description: "Warehouse audit flagged 12 bins with incorrect labels.", status: "blocked", priority: "high", assigneeId: "usr_rafiq", assignee: "Rafiq Hasan", dueDate: daysFromNow(2), createdAt: daysAgo(3) },
    { id: uid("task"), title: "Prepare monthly ops review deck", description: "Summarise KPIs, incidents, and SOP compliance for leadership.", status: "todo", priority: "medium", assigneeId: "usr_admin", assignee: "Ayesha Karim", dueDate: daysFromNow(6), createdAt: daysAgo(1) },
    { id: uid("task"), title: "Approve overtime requests for weekend shift", description: "Three requests pending from the packing team.", status: "todo", priority: "urgent", assigneeId: "usr_admin", assignee: "Ayesha Karim", dueDate: daysFromNow(0), createdAt: daysAgo(0) },
    { id: uid("task"), title: "Update SOP for forklift pre-checks", description: "Add new checklist item for battery inspection.", status: "done", priority: "low", assigneeId: "usr_nusrat", assignee: "Nusrat Jahan", dueDate: daysAgo(1), createdAt: daysAgo(5) },
    { id: uid("task"), title: "Investigate delayed shipment to Chattogram hub", description: "Carrier reports a 6-hour delay at the checkpoint.", status: "in_progress", priority: "urgent", assigneeId: "usr_rafiq", assignee: "Rafiq Hasan", dueDate: daysFromNow(0), createdAt: daysAgo(0) },
  ],
  inventory: () => [
    { id: uid("item"), name: "Corrugated boxes (M)", sku: "PKG-BOX-M", category: "Packaging", quantity: 420, unit: "pcs", reorderLevel: 300, location: "Zone A / R3", updatedAt: daysAgo(1) },
    { id: uid("item"), name: "Stretch wrap film", sku: "PKG-WRP-01", category: "Packaging", quantity: 38, unit: "rolls", reorderLevel: 50, location: "Zone A / R1", updatedAt: daysAgo(2) },
    { id: uid("item"), name: "Barcode label rolls", sku: "LBL-TH-04", category: "Consumables", quantity: 96, unit: "rolls", reorderLevel: 40, location: "Zone B / R2", updatedAt: daysAgo(0) },
    { id: uid("item"), name: "Pallet jacks", sku: "EQP-PJK-02", category: "Equipment", quantity: 6, unit: "units", reorderLevel: 4, location: "Dock 2", updatedAt: daysAgo(4) },
    { id: uid("item"), name: "Safety gloves (L)", sku: "PPE-GLV-L", category: "Safety", quantity: 22, unit: "pairs", reorderLevel: 30, location: "Zone C / R1", updatedAt: daysAgo(1) },
    { id: uid("item"), name: "Printer toner - Zebra", sku: "PRT-TNR-ZB", category: "Consumables", quantity: 9, unit: "units", reorderLevel: 10, location: "Office store", updatedAt: daysAgo(3) },
    { id: uid("item"), name: "Diesel forklift", sku: "EQP-FLT-01", category: "Equipment", quantity: 3, unit: "units", reorderLevel: 2, location: "Dock 1", updatedAt: daysAgo(6) },
  ],
  inventoryLog: () => [
    { id: uid("log"), itemName: "Barcode label rolls", type: "in", qty: 40, note: "Restock from supplier", at: daysAgo(0) },
    { id: uid("log"), itemName: "Stretch wrap film", type: "out", qty: 12, note: "Used for outbound batch #2291", at: daysAgo(1) },
    { id: uid("log"), itemName: "Safety gloves (L)", type: "out", qty: 8, note: "Issued to packing team", at: daysAgo(1) },
    { id: uid("log"), itemName: "Corrugated boxes (M)", type: "in", qty: 200, note: "Supplier delivery - PO 4471", at: daysAgo(2) },
  ],
  fieldJobs: () => [
    { id: uid("job"), title: "AC unit maintenance - Gulshan branch", client: "Gulshan Branch Office", technicianId: "usr_kamal", technician: "Kamal Uddin", status: "scheduled", scheduledAt: daysFromNow(1), address: "House 14, Road 91, Gulshan 2", notes: "Bring replacement filters.", createdAt: daysAgo(1) },
    { id: uid("job"), title: "POS terminal repair", client: "Bashundhara Outlet", technicianId: "usr_shafiul", technician: "Shafiul Alam", status: "in_progress", scheduledAt: daysAgo(0), address: "Level 4, Bashundhara City", notes: "Terminal not powering on.", createdAt: daysAgo(2) },
    { id: uid("job"), title: "Generator inspection", client: "Uttara Warehouse", technicianId: "usr_kamal", technician: "Kamal Uddin", status: "completed", scheduledAt: daysAgo(2), address: "Sector 11, Uttara", notes: "Routine quarterly check.", createdAt: daysAgo(4) },
    { id: uid("job"), title: "Network cabling - new counter", client: "Dhanmondi Branch", technicianId: "usr_mahin", technician: "Mahin Rahman", status: "scheduled", scheduledAt: daysFromNow(3), address: "Road 27, Dhanmondi", notes: "Coordinate with branch manager for access.", createdAt: daysAgo(1) },
    { id: uid("job"), title: "CCTV camera replacement", client: "Mirpur Distribution Point", technicianId: "usr_shafiul", technician: "Shafiul Alam", status: "cancelled", scheduledAt: daysAgo(1), address: "Mirpur 10", notes: "Client rescheduled to next month.", createdAt: daysAgo(3) },
  ],
  incidents: () => [
    { id: uid("inc"), title: "Forklift near-miss in Dock 2", severity: "high", status: "investigating", reportedById: "usr_rafiq", reportedBy: "Rafiq Hasan", reportedAt: daysAgo(0), description: "Pedestrian nearly struck while walking through loading zone without a marked path.", createdAt: daysAgo(0) },
    { id: uid("inc"), title: "Power outage - 40 minutes", severity: "medium", status: "resolved", reportedById: "usr_nusrat", reportedBy: "Nusrat Jahan", reportedAt: daysAgo(3), description: "Grid outage affected packing line; backup generator started after 6 minutes.", createdAt: daysAgo(3) },
    { id: uid("inc"), title: "Minor slip in wet storage area", severity: "low", status: "resolved", reportedById: "usr_admin", reportedBy: "Ayesha Karim", reportedAt: daysAgo(5), description: "Employee slipped near a leaking pipe joint, no injury reported.", createdAt: daysAgo(5) },
    { id: uid("inc"), title: "Mislabeled hazardous chemical container", severity: "critical", status: "open", reportedById: "usr_rafiq", reportedBy: "Rafiq Hasan", reportedAt: daysAgo(0), description: "Container found without required hazard label in Zone C storage.", createdAt: daysAgo(0) },
  ],
  sops: () => [
    { id: uid("sop"), title: "Forklift pre-operation checklist", category: "Safety", ownerId: "usr_nusrat", owner: "Nusrat Jahan", lastReviewed: daysAgo(4), status: "compliant", createdAt: daysAgo(4) },
    { id: uid("sop"), title: "Cold storage temperature log", category: "Quality", ownerId: "usr_admin", owner: "Ayesha Karim", lastReviewed: daysAgo(40), status: "due", createdAt: daysAgo(40) },
    { id: uid("sop"), title: "Hazardous material handling", category: "Safety", ownerId: "usr_rafiq", owner: "Rafiq Hasan", lastReviewed: daysAgo(95), status: "overdue", createdAt: daysAgo(95) },
    { id: uid("sop"), title: "Shift handover checklist", category: "Operations", ownerId: "usr_admin", owner: "Ayesha Karim", lastReviewed: daysAgo(2), status: "compliant", createdAt: daysAgo(2) },
    { id: uid("sop"), title: "Vendor onboarding compliance", category: "Procurement", ownerId: "usr_nusrat", owner: "Nusrat Jahan", lastReviewed: daysAgo(60), status: "due", createdAt: daysAgo(60) },
  ],
};
