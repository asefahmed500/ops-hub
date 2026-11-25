import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "./api";
import { useAuth } from "./auth";
import type {
  Goal,
  LogEntry,
  MtoState,
  MtoNotification,
  MtoTask,
  Programme,
  Review,
  Rotation,
  SafeUser,
  TraineeSummary,
  ReportsBundle,
  MentorNote,
} from "./types";

const EMPTY: MtoState = {
  me: null as unknown as SafeUser,
  programme: null as unknown as Programme,
  rotations: [],
  logs: [],
  tasks: [],
  goals: [],
  mentorNotes: [],
  reviews: [],
  trainees: [],
  notifications: [],
  reports: null,
};

interface MtoContextValue extends MtoState {
  ready: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveLog: (text: string, tags: string[]) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  addTask: (title: string, due: string) => Promise<void>;
  toggleTask: (id: string, done: boolean) => Promise<void>;
  addGoal: (title: string) => Promise<void>;
  goalProgress: (id: string, delta: number) => Promise<void>;
  toggleObjective: (rotationId: string, objectiveId: string) => Promise<void>;
  decideReview: (id: string, outcome: "approved" | "changes_requested", rating: number | null, comment: string) => Promise<void>;
  createReview: (traineeId: string, dept: string, kind: string, due: string) => Promise<void>;
  sendReminder: (traineeId: string) => Promise<void>;
  addMentorNote: (traineeId: string, text: string) => Promise<void>;
  updateProgramme: (patch: Partial<Programme>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const MtoContext = createContext<MtoContextValue | null>(null);

export function MtoProvider({ children }: { children: React.ReactNode }) {
  const { token, signOut } = useAuth();
  const [state, setState] = useState<MtoState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      setState(await api<MtoState>("/state", { token }));
      setError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) void signOut();
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [token, signOut]);

  useEffect(() => {
    if (token) void refresh();
    else setState(null);
  }, [token, refresh]);

  // Wrap a mutation: call it, then re-sync the whole workspace from the server
  const act = useCallback(
    async (fn: () => Promise<unknown>) => {
      try {
        await fn();
        await refresh();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Action failed";
        setError(message);
        throw e;
      }
    },
    [refresh],
  );

  const value = useMemo<MtoContextValue>(() => {
    const s = state ?? EMPTY;
    const mutate = <T,>(path: string, method: "POST" | "PATCH", body?: unknown) =>
      api<T>(path, { method, body, token });

    return {
      ...s,
      ready: !!state,
      error,
      refresh,
      saveLog: (text, tags) => act(() => mutate("/logs", "POST", { text, tags })),
      deleteLog: (id) => act(() => mutate(`/logs/${id}/delete`, "POST")),
      addTask: (title, due) => act(() => mutate("/mto-tasks", "POST", { title, due })),
      toggleTask: (id, done) => act(() => mutate(`/mto-tasks/${id}`, "PATCH", { done })),
      addGoal: (title) => act(() => mutate("/goals", "POST", { title })),
      goalProgress: (id, delta) => act(() => mutate(`/goals/${id}/progress`, "POST", { delta })),
      toggleObjective: (rotationId, objectiveId) =>
        act(() => mutate(`/rotations/${rotationId}/objectives/${objectiveId}/toggle`, "POST")),
      decideReview: (id, outcome, rating, comment) =>
        act(() => mutate(`/reviews/${id}/decide`, "POST", { outcome, rating, comment })),
      createReview: (traineeId, dept, kind, due) =>
        act(() => mutate("/reviews", "POST", { traineeId, dept, kind, due })),
      sendReminder: (traineeId) => act(() => mutate(`/trainees/${traineeId}/reminder`, "POST")),
      addMentorNote: (traineeId, text) => act(() => mutate("/mentor-notes", "POST", { traineeId, text })),
      updateProgramme: (patch) => act(() => mutate("/programme", "PATCH", patch)),
      markNotificationRead: (id) => act(() => mutate(`/notifications/${id}`, "PATCH", { read: true })),
      markAllNotificationsRead: () => act(() => mutate("/notifications/read-all", "POST")),
    };
  }, [state, error, refresh, act, token]);

  return <MtoContext.Provider value={value}>{children}</MtoContext.Provider>;
}

export function useMto(): MtoContextValue {
  const ctx = useContext(MtoContext);
  if (!ctx) throw new Error("useMto must be used within MtoProvider");
  return ctx;
}

export type { LogEntry, MtoTask, Goal, Review, Rotation, TraineeSummary, ReportsBundle, MentorNote, MtoNotification, Programme, SafeUser };
