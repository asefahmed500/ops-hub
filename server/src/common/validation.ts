import { BadRequestException } from "@nestjs/common";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const TASK_STATUSES = ["todo", "in_progress", "blocked", "done"] as const;
export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const SEVERITIES = ["low", "medium", "high", "critical"] as const;
export const INCIDENT_STATUSES = ["open", "investigating", "resolved"] as const;
export const JOB_STATUSES = ["scheduled", "in_progress", "completed", "cancelled"] as const;
export const SOP_STATUSES = ["compliant", "due", "overdue"] as const;

/** Throws unless value is undefined/null or one of the allowed strings. */
export function validateEnum(value: unknown, allowed: readonly string[], field: string): void {
  if (value === undefined || value === null) return;
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw new BadRequestException(`${field} must be one of: ${allowed.join(", ")}`);
  }
}

/** Coerces to a finite non-negative number or throws. undefined/null pass through as undefined. */
export function coerceCount(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new BadRequestException(`${field} must be a non-negative number`);
  }
  return n;
}

/** Throws unless value is undefined/null or a parseable date string. */
export function validateDate(value: unknown, field: string): void {
  if (value === undefined || value === null) return;
  if (typeof value !== "string" || isNaN(Date.parse(value))) {
    throw new BadRequestException(`${field} must be an ISO date string or null`);
  }
}

/** Throws unless value is undefined/null or a string. */
export function validateOptionalString(value: unknown, field: string): void {
  if (value === undefined || value === null) return;
  if (typeof value !== "string") {
    throw new BadRequestException(`${field} must be a string`);
  }
}

/** Builds a new object containing only whitelisted keys that are present on body. */
export function pickFields(body: unknown, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (body && typeof body === "object") {
    const raw = body as Record<string, unknown>;
    for (const key of keys) {
      if (raw[key] !== undefined) out[key] = raw[key];
    }
  }
  return out;
}
