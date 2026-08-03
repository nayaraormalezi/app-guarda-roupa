import { useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "@/store/auth-store";
import { useWardrobe } from "@/store/wardrobe-store";

/** When online + logged in, merge local cache with cloud once per session reconnect. */
export function SyncBridge() {
  const { user, syncNow } = useAuth();
  const { ready, getPersistedSnapshot, replacePersistedState } = useWardrobe();
  const last = useRef(0);

  useEffect(() => {
    if (!ready || !user) return;
    const unsub = NetInfo.addEventListener((state) => {
      if (!state.isConnected) return;
      const now = Date.now();
      if (now - last.current < 60_000) return;
      last.current = now;
      void (async () => {
        try {
          const merged = await syncNow(getPersistedSnapshot());
          if (merged) await replacePersistedState(merged);
        } catch {
          // offline cache remains
        }
      })();
    });
    return () => unsub();
  }, [ready, user, syncNow, getPersistedSnapshot, replacePersistedState]);

  return null;
}
