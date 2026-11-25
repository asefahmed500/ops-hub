// Dev-only reset: clears all tenant data so the MTO Compass seeder rebuilds the demo company.
// Usage: node scripts/reset-dev.mjs
import { MongoClient } from "mongodb";

const uri = process.env.DATABASE_URL || "mongodb://localhost:27017/opshub";
const client = new MongoClient(uri);

const DROP = [
  "tasks",
  "inventory",
  "inventoryLog",
  "fieldJobs",
  "incidents",
  "sops",
  "alerts",
  "rotations",
  "logs",
  "mtoTasks",
  "goals",
  "reviews",
  "mentorNotes",
  "programmes",
  "notifications",
  "auditLog",
];

await client.connect();
const db = client.db();

for (const name of DROP) {
  await db.collection(name).deleteMany({});
  console.log(`[reset] cleared ${name}`);
}
const u = await db.collection("users").deleteMany({ role: { $ne: "platform_admin" } });
console.log(`[reset] removed ${u.deletedCount} non-platform users`);
const t = await db.collection("tenants").deleteMany({ id: { $ne: "tnt_platform" } });
console.log(`[reset] removed ${t.deletedCount} tenants`);

await client.close();
console.log("[reset] done — restart the API to re-seed the MTO demo company");
