import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type BootstrapData = {
  authenticated: boolean;
  email: string;
  profile: Record<string, unknown>;
  settings: Record<string, unknown>;
  achievements: unknown[];
  notifications: unknown[];
  chats: unknown[];
  activityLog: Record<string, unknown>;
  roadmaps: unknown[];
};

export type AuthContextValue = {
  status: "loading" | "authenticated" | "unauthenticated";
  session: Session | null;
  user: User | null;
  bootstrap: BootstrapData | null;
  bootstrapLoading: boolean;
  bootstrapError: string | null;
  bootstrapStale: boolean;
  bootstrapSavedAt: string | null;
  authConfigError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshBootstrap: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
