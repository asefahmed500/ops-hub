import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { api } from "./api";
import type { SafeUser } from "./types";

const TOKEN_KEY = "opshub_session";

type UseStateHook<T> = [[boolean, T | null], (value: T | null) => void];

function useAsyncState<T>(initialValue: [boolean, T | null] = [true, null]): UseStateHook<T> {
  return useReducer(
    (state: [boolean, T | null], action: T | null = null): [boolean, T | null] => [false, action],
    initialValue,
  ) as UseStateHook<T>;
}

async function setStorageItemAsync(key: string, value: string | null) {
  if (Platform.OS === "web") {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (e) {
      console.error("Local storage is unavailable:", e);
    }
  } else if (value == null) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

function useStorageState(key: string): UseStateHook<string> {
  const [state, setState] = useAsyncState<string>();

  useEffect(() => {
    if (Platform.OS === "web") {
      try {
        if (typeof localStorage !== "undefined") setState(localStorage.getItem(key));
      } catch (e) {
        console.error("Local storage is unavailable:", e);
      }
    } else {
      SecureStore.getItemAsync(key)
        .then((value) => setState(value))
        .catch(() => setState(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (value: string | null) => {
      setState(value);
      setStorageItemAsync(key, value);
    },
    [key, setState],
  );

  return [state, setValue];
}

interface AuthSession {
  token: string;
  user: SafeUser;
  inviteCode?: string;
}

interface AuthContextValue {
  ready: boolean;
  token: string | null;
  user: SafeUser | null;
  /** Unified login — the account's role decides where the app lands. */
  signIn: (email: string, password: string) => Promise<void>;
  /** HR registers a company programme; returns the session + invite code WITHOUT signing in. */
  registerCompany: (companyName: string, name: string, email: string, password: string) => Promise<AuthSession>;
  /** Trainee joins with the company code. Signs in immediately. */
  joinProgramme: (inviteCode: string, name: string, email: string, password: string, dept: string) => Promise<void>;
  /** Commit a session prepared by registerCompany. */
  applySession: (session: AuthSession) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [[loadingSession, token], setToken] = useStorageState(TOKEN_KEY);
  const [user, setUser] = useState<SafeUser | null>(null);
  const [restoring, setRestoring] = useState(true);

  // Restore the logged-in user from a saved token on cold start
  useEffect(() => {
    if (loadingSession) return;
    let cancelled = false;
    if (!token || user) {
      setRestoring(false);
      return;
    }
    api<SafeUser>("/auth/me", { token })
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setToken(null);
        }
      })
      .finally(() => {
        if (!cancelled) setRestoring(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadingSession, token, user, setToken]);

  const applySession = useCallback(
    (session: AuthSession) => {
      setToken(session.token);
      setUser(session.user);
    },
    [setToken],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const session = await api<AuthSession>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      applySession(session);
    },
    [applySession],
  );

  const registerCompany = useCallback(
    async (companyName: string, name: string, email: string, password: string): Promise<AuthSession> => {
      return api<AuthSession>("/auth/register", {
        method: "POST",
        body: { companyName, name, email, password },
      });
    },
    [],
  );

  const joinProgramme = useCallback(
    async (inviteCode: string, name: string, email: string, password: string, dept: string) => {
      const session = await api<AuthSession>("/auth/join", {
        method: "POST",
        body: { inviteCode, name, email, password, dept },
      });
      applySession(session);
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    setToken(null);
    setUser(null);
  }, [setToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready: !loadingSession && !restoring,
      token,
      user,
      signIn,
      registerCompany,
      joinProgramme,
      applySession,
      signOut,
    }),
    [loadingSession, restoring, token, user, signIn, registerCompany, joinProgramme, applySession, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
