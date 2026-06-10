// lib/auth/auth-context.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────
export interface AuthUser {
  id:          number;
  name:        string;
  email:       string;
  role:        "STUDENT" | "TEACHER" | "ADMIN";
  avatar?:     string;
  avatarEmoji?:string;
  avatarName?: string;
  difficulty?: string;
  sectionId?:  number | null;
  setupDone?:  boolean;
  xp?:         number;
  level?:      number;
}

interface LoginPayload {
  email:    string;
  password: string;
  role:     "STUDENT" | "TEACHER";
}

interface AuthContextValue {
  user:      AuthUser | null;
  loading:   boolean;
  login:     (payload: LoginPayload) => Promise<{ success: boolean; error?: string }>;
  logout:    () => Promise<void>;
  refresh:   () => Promise<void>;
  isStudent: boolean;
  isTeacher: boolean;
  isAdmin:   boolean;
}

// ─── Context ─────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const router  = useRouter();
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current session on mount
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ─── Login ─────────────────────────────────────────────────
  const login = useCallback(
    async (payload: LoginPayload): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/auth/login", {
          method:      "POST",
          headers:     { "Content-Type": "application/json" },
          credentials: "include",
          body:        JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          return { success: false, error: data.error ?? "Login failed." };
        }

        setUser(data.user);

        // Respect ?redirect= param or use the API-suggested path
        const params   = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect") ?? data.redirectTo ?? "/";
        router.push(redirect);
        router.refresh(); // invalidate RSC cache

        return { success: true };
      } catch {
        return { success: false, error: "Network error. Please try again." };
      }
    },
    [router]
  );

  // ─── Logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  const value: AuthContextValue = {
    user,
    loading,
    login,
    logout,
    refresh,
    isStudent: user?.role === "STUDENT",
    isTeacher: user?.role === "TEACHER",
    isAdmin:   user?.role === "ADMIN",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

// ─── Convenience hooks ───────────────────────────────────────
export function useStudent() {
  const { user, isStudent } = useAuth();
  if (!isStudent || !user) return null;
  return user;
}

export function useTeacher() {
  const { user, isTeacher } = useAuth();
  if (!isTeacher || !user) return null;
  return user;
}