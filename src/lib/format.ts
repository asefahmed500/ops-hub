export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function isOverdue(iso?: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < startOfToday().getTime();
}

export function isToday(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const eod = new Date(new Date().setHours(23, 59, 59, 999));
  return d.getTime() <= eod.getTime() && d.getTime() >= startOfToday().getTime();
}

/** ISO date string -> "YYYY-MM-DD" in local time (for date input prefill). */
export function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** "YYYY-MM-DD" -> ISO at local noon (avoids timezone edge shifts). Returns null when invalid. */
export function fromDateInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00`);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function startOfToday(): Date {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}
