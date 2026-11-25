export type Role = "trainee" | "hr" | "platform_admin";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  inviteCode: string;
  status: "active" | "suspended";
  createdAt: string;
}

export interface SafeUser {
  id: string;
  tenantId: string;
  companyName?: string;
  name: string;
  email: string;
  phone?: string;
  dept?: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export type RotationStatus = "done" | "active" | "upcoming";

export interface RotationObjective {
  id: string;
  title: string;
  done: boolean;
}

export interface Rotation {
  id: string;
  tenantId: string;
  name: string;
  window: string;
  status: RotationStatus;
  order: number;
  objectives: RotationObjective[];
  createdAt: string;
}

export interface LogEntry {
  id: string;
  tenantId: string;
  authorId: string;
  authorName: string;
  text: string;
  tags: string[];
  at: string;
  createdAt: string;
}

export interface MtoTask {
  id: string;
  tenantId: string;
  ownerId: string;
  title: string;
  due: string;
  done: boolean;
  createdAt: string;
}

export interface Goal {
  id: string;
  tenantId: string;
  ownerId: string;
  title: string;
  progress: number;
  createdAt: string;
}

export interface MentorNote {
  id: string;
  tenantId: string;
  traineeId: string;
  authorName: string;
  text: string;
  at: string;
}

export type ReviewStatus = "pending" | "approved" | "changes_requested";

export interface Review {
  id: string;
  tenantId: string;
  traineeId: string;
  traineeName: string;
  dept: string;
  kind: string;
  due: string;
  status: ReviewStatus;
  rating: number | null;
  comment: string;
  createdAt: string;
  decidedAt: string | null;
}

export interface Programme {
  id: string;
  tenantId: string;
  lengthMonths: number;
  startDate: string;
  language: "en" | "bn";
  supervisorsViewLogs: boolean;
  traineesExport: boolean;
  createdAt: string;
}

export interface MtoNotification {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  at: string;
}

export interface TraineeSummary {
  id: string;
  name: string;
  email: string;
  dept: string;
  week: number;
  progress: number;
  active: boolean;
}

export interface WeeklyLogsPoint {
  label: string;
  count: number;
}

export interface DeptProgressPoint {
  dept: string;
  progress: number;
}

export interface ReportsBundle {
  weeklyLogs: WeeklyLogsPoint[];
  deptProgress: DeptProgressPoint[];
  logsThisWeek: number;
}

export interface MtoState {
  me: SafeUser;
  programme: Programme;
  rotations: Rotation[];
  logs: LogEntry[];
  tasks: MtoTask[];
  goals: Goal[];
  mentorNotes: MentorNote[];
  reviews: Review[];
  trainees: TraineeSummary[];
  notifications: MtoNotification[];
  reports: ReportsBundle | null;
}

export interface PlatformOverview {
  tenants: { total: number; active: number; suspended: number };
  users: number;
  logs: number;
  rotations: number;
  reviews: number;
  pendingReviews: number;
}

export interface TenantWithCounts extends Tenant {
  users: number;
  logs: number;
  rotations: number;
  reviews: number;
}
