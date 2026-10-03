import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import * as Linking from "expo-linking";
import type { Session } from "@supabase/supabase-js";

import { ApiError, apiRequest, getApiBaseUrl } from "../lib/api";
import {
  clearUserCache,
  readCached,
  stripLessonBodies,
  writeCached,
} from "../lib/mobileCache";
import { supabase, supabaseConfigError } from "../lib/supabase";
import { AuthContext, type BootstrapData } from "../hooks/useAuth";

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >(supabase ? "loading" : "unauthenticated");
  const [session, setSession] = useState<Session | null>(null);
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bootstrapStale, setBootstrapStale] = useState(false);
  const [bootstrapSavedAt, setBootstrapSavedAt] = useState<string | null>(null);
  const bootstrapUser = useRef<string | null>(null);
  const bootstrapInFlight = useRef<{
    userId: string;
    promise: Promise<void>;
  } | null>(null);
  const activeUserId = useRef<string | null>(null);

  const loadBootstrap = useCallback(
    async (accessToken: string, userId: string, force = false) => {
      if (!force && bootstrapUser.current === userId) return;
      if (bootstrapInFlight.current?.userId === userId && !force)
        return bootstrapInFlight.current.promise;

      setBootstrapLoading(true);
      setBootstrapError(null);
      const request = apiRequest<BootstrapData>("/api/bootstrap", {
        accessToken,
      })
        .then((data) => {
          if (activeUserId.current === userId) {
            bootstrapUser.current = userId;
            setBootstrap(data);
            setBootstrapStale(false);
            setBootstrapSavedAt(new Date().toISOString());
            const profile = data.profile ?? {};
            const safeSnapshot: BootstrapData = {
              authenticated: true,
              email: "",
              profile: {
                displayName: profile.displayName,
                name: profile.name,
                xp: profile.xp,
                streak: profile.streak,
              },
              settings: {},
              achievements: [],
              notifications: [],
              chats: [],
              activityLog: data.activityLog,
              roadmaps: stripLessonBodies(data.roadmaps),
            };
            void writeCached(userId, "bootstrap", safeSnapshot);
          }
        })
        .catch(async (error: unknown) => {
          if (activeUserId.current === userId) {
            if (
              error instanceof ApiError &&
              (error.status === 401 ||
                error.status === 403 ||
                error.status === 404 ||
                error.status === 429 ||
                error.code === "API_NOT_CONFIGURED")
            ) {
              setBootstrapError(error.message);
              return;
            }
            const cached = await readCached<BootstrapData>(userId, "bootstrap");
            if (activeUserId.current !== userId) return;
            if (cached) {
              bootstrapUser.current = userId;
              setBootstrap(cached.data);
              setBootstrapStale(true);
              setBootstrapSavedAt(cached.savedAt);
              setBootstrapError(null);
            } else {
              const message =
                error instanceof Error
                  ? error.message
                  : "Could not load your account data.";
              setBootstrapError(message);
            }
          }
        })
        .finally(() => {
          if (bootstrapInFlight.current?.promise === request) {
            setBootstrapLoading(false);
            bootstrapInFlight.current = null;
          }
        });
      bootstrapInFlight.current = { userId, promise: request };
      return request;
    },
    [],
  );

  const applySession = useCallback(
    async (nextSession: Session | null) => {
      const previousUserId = activeUserId.current;
      const nextUserId = nextSession?.user.id ?? null;
      if (previousUserId && previousUserId !== nextUserId)
        await clearUserCache(previousUserId);
      setSession(nextSession);
      activeUserId.current = nextUserId;
      if (!nextSession) {
        setStatus("unauthenticated");
        setBootstrap(null);
        setBootstrapError(null);
        setBootstrapStale(false);
        setBootstrapSavedAt(null);
        setBootstrapLoading(false);
        bootstrapUser.current = null;
        bootstrapInFlight.current = null;
        return;
      }
      setStatus("authenticated");
      await loadBootstrap(nextSession.access_token, nextSession.user.id);
    },
    [loadBootstrap],
  );

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Defer Supabase calls until after its auth callback has returned.
      setTimeout(() => {
        if (mounted) void applySession(nextSession);
      }, 0);
    });

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setBootstrapError(
            "Your saved sign-in could not be restored. Please sign in again.",
          );
          setStatus("unauthenticated");
          return;
        }
        void applySession(data.session);
      })
      .catch(() => {
        if (mounted) {
          setBootstrapError(
            "Your saved sign-in could not be restored. Please sign in again.",
          );
          setStatus("unauthenticated");
        }
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const requireClient = useCallback(() => {
    if (!supabase)
      throw new Error(supabaseConfigError || "Authentication is unavailable.");
    return supabase;
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const client = requireClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (data.session) await applySession(data.session);
    },
    [applySession, requireClient],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const client = requireClient();
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: Linking.createURL("callback") },
      });
      if (error) throw error;
      if (data.session) await applySession(data.session);
      return Boolean(data.session);
    },
    [applySession, requireClient],
  );

  const sendPasswordReset = useCallback(
    async (email: string) => {
      const client = requireClient();
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: Linking.createURL("reset-password"),
      });
      if (error) throw error;
    },
    [requireClient],
  );

  const updatePassword = useCallback(
    async (password: string) => {
      const client = requireClient();
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
    },
    [requireClient],
  );

  const signOut = useCallback(async () => {
    const client = requireClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    await applySession(null);
  }, [applySession, requireClient]);

  const refreshBootstrap = useCallback(async () => {
    if (!session) return;
    await loadBootstrap(session.access_token, session.user.id, true);
  }, [loadBootstrap, session]);

  const refreshSession = useCallback(async () => {
    const client = requireClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    await applySession(data.session);
  }, [applySession, requireClient]);

  const value = useMemo(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      bootstrap,
      bootstrapLoading,
      bootstrapError,
      authConfigError:
        supabaseConfigError ||
        (!getApiBaseUrl()
          ? "The LearnPath API URL is not configured for this app build."
          : null),
      bootstrapStale,
      bootstrapSavedAt,
      signIn,
      signUp,
      sendPasswordReset,
      updatePassword,
      signOut,
      refreshBootstrap,
      refreshSession,
    }),
    [
      status,
      session,
      bootstrap,
      bootstrapLoading,
      bootstrapError,
      bootstrapStale,
      bootstrapSavedAt,
      signIn,
      signUp,
      sendPasswordReset,
      updatePassword,
      signOut,
      refreshBootstrap,
      refreshSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
