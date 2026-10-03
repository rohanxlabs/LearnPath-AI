import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { useAuth } from "../hooks/useAuth";
import { userCacheStorageKey } from "../lib/mobileCache";

type ActivePathContextValue = {
  activeRoadmapId: string | null;
  ready: boolean;
  setActiveRoadmapId: (id: string | null) => Promise<void>;
};
const ActivePathContext = createContext<ActivePathContextValue | null>(null);
const storageKey = (userId: string) =>
  userCacheStorageKey(userId, "active-path");

export function ActivePathProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [activeRoadmapId, setActiveRoadmapIdState] = useState<string | null>(
    null,
  );
  const [loadedForUser, setLoadedForUser] = useState<string | null | undefined>(
    undefined,
  );
  const ready = loadedForUser === user?.id;

  useEffect(() => {
    let mounted = true;
    const userKey = user?.id ? storageKey(user.id) : null;
    void Promise.resolve(userKey ? AsyncStorage.getItem(userKey) : null)
      .then((saved) => {
        if (!mounted) return;
        setActiveRoadmapIdState(saved);
        setLoadedForUser(user?.id ?? null);
      })
      .catch(() => {
        if (mounted) {
          setActiveRoadmapIdState(null);
          setLoadedForUser(user?.id ?? null);
        }
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  const setActiveRoadmapId = useCallback(
    async (id: string | null) => {
      setActiveRoadmapIdState(id);
      if (!user?.id) return;
      try {
        if (id) await AsyncStorage.setItem(storageKey(user.id), id);
        else await AsyncStorage.removeItem(storageKey(user.id));
      } catch {
        // Keep the in-memory choice for this app session if device storage is unavailable.
      }
    },
    [user],
  );

  const value = useMemo(
    () => ({
      activeRoadmapId: ready ? activeRoadmapId : null,
      ready,
      setActiveRoadmapId,
    }),
    [activeRoadmapId, ready, setActiveRoadmapId],
  );
  return (
    <ActivePathContext.Provider value={value}>
      {children}
    </ActivePathContext.Provider>
  );
}

export function useActivePath() {
  const value = useContext(ActivePathContext);
  if (!value)
    throw new Error("useActivePath must be used inside ActivePathProvider");
  return value;
}
