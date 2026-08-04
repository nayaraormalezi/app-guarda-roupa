import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "@/store/auth-store";
import { useWardrobe } from "@/store/wardrobe-store";
import { pushStateToCloud } from "@/lib/sync";

const FULL_SYNC_MIN_GAP_MS = 20_000;
const PERIODIC_SYNC_MS = 2 * 60_000;
const PUSH_DEBOUNCE_MS = 2_500;

/**
 * Keeps the logged-in account in sync automatically:
 * - full sync on launch, foreground, and reconnect
 * - periodic full sync while online
 * - debounced cloud push after local data changes
 */
export function SyncBridge() {
  const { user, syncNow } = useAuth();
  const {
    ready,
    getPersistedSnapshot,
    replacePersistedState,
    wardrobe,
    weekPlan,
    savedLooks,
    chatMessages,
    wishList,
    favoriteStores,
    preferences,
  } = useWardrobe();

  const lastFullSync = useRef(0);
  const syncingRef = useRef(false);
  const userId = user?.id;

  const runFullSync = async (force = false) => {
    if (!ready || !userId || syncingRef.current) return;
    const now = Date.now();
    if (!force && now - lastFullSync.current < FULL_SYNC_MIN_GAP_MS) return;

    const net = await NetInfo.fetch();
    if (!net.isConnected) return;

    syncingRef.current = true;
    lastFullSync.current = now;
    try {
      const merged = await syncNow(getPersistedSnapshot());
      if (merged) await replacePersistedState(merged);
    } catch {
      // keep offline cache
    } finally {
      syncingRef.current = false;
    }
  };

  // Full sync: launch, auth, foreground, reconnect, periodic
  useEffect(() => {
    if (!ready || !userId) return;

    void runFullSync(true);

    const onAppState = (next: AppStateStatus) => {
      if (next === "active") void runFullSync();
    };
    const appSub = AppState.addEventListener("change", onAppState);

    const unsubNet = NetInfo.addEventListener((state) => {
      if (state.isConnected) void runFullSync();
    });

    const interval = setInterval(() => void runFullSync(), PERIODIC_SYNC_MS);

    return () => {
      appSub.remove();
      unsubNet();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runFullSync uses latest refs/callbacks via closure on ready/userId
  }, [ready, userId, syncNow, getPersistedSnapshot, replacePersistedState]);

  // Debounced upload when local wardrobe data changes (keeps cloud fresh without pull races)
  useEffect(() => {
    if (!ready || !userId) return;

    const handle = setTimeout(() => {
      void (async () => {
        const net = await NetInfo.fetch();
        if (!net.isConnected) return;
        try {
          await pushStateToCloud(getPersistedSnapshot(), userId);
        } catch {
          // retry on next change / periodic sync
        }
      })();
    }, PUSH_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [
    ready,
    userId,
    wardrobe,
    weekPlan,
    savedLooks,
    chatMessages,
    wishList,
    favoriteStores,
    preferences,
    getPersistedSnapshot,
  ]);

  return null;
}
