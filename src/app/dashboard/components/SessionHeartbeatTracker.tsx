"use client";

import { useEffect, useRef } from "react";

const SESSION_STORAGE_KEY = "strkyr_active_session_id";
const LAST_ACTIVE_KEY = "strkyr_last_active_ts";
const SESSION_ACTIVE_SECS_KEY = "strkyr_session_active_secs";
const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes inactivity ends session
const IDLE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes of no interaction = IDLE
const MAX_SESSION_ACTIVE_SECONDS = 7200; // 2 hours hard cap on single session active time
const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds periodic heartbeat while active

export function SessionHeartbeatTracker() {
  const activeSecondsRef = useRef<number>(0);
  const lastSentActiveSecondsRef = useRef<number>(0);
  const lastInteractionTimeRef = useRef<number>(Date.now());
  const isIdleRef = useRef<boolean>(false);
  const hasInitializedRef = useRef<boolean>(false);
  const isNewSessionRef = useRef<boolean>(false);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    const now = Date.now();
    lastInteractionTimeRef.current = now;

    // Check if this is a new browser/app visit session
    try {
      const storedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
      const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
      const lastActiveTime = lastActiveStr ? parseInt(lastActiveStr, 10) : 0;
      const isExpired = !lastActiveTime || now - lastActiveTime > SESSION_TIMEOUT_MS;

      if (!storedSessionId || isExpired) {
        // Start a new session
        isNewSessionRef.current = true;
        sessionIdRef.current = `sess_${now}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem(SESSION_STORAGE_KEY, sessionIdRef.current);
        sessionStorage.setItem(SESSION_ACTIVE_SECS_KEY, "0");
        activeSecondsRef.current = 0;
      } else {
        sessionIdRef.current = storedSessionId;
        const storedActiveSecs = sessionStorage.getItem(SESSION_ACTIVE_SECS_KEY);
        activeSecondsRef.current = storedActiveSecs ? Math.min(parseInt(storedActiveSecs, 10) || 0, MAX_SESSION_ACTIVE_SECONDS) : 0;
      }
      lastSentActiveSecondsRef.current = activeSecondsRef.current;
      localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
    } catch {
      sessionIdRef.current = `sess_${now}`;
      activeSecondsRef.current = 0;
    }

    const sendHeartbeat = (isStarting: boolean = false, forceIdle?: boolean) => {
      const isCurrentlyIdle = forceIdle !== undefined ? forceIdle : isIdleRef.current;
      const currentActive = Math.min(activeSecondsRef.current, MAX_SESSION_ACTIVE_SECONDS);
      const deltaActive = Math.max(0, Math.min(currentActive - lastSentActiveSecondsRef.current, 60));
      lastSentActiveSecondsRef.current = currentActive;

      try {
        localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
        sessionStorage.setItem(SESSION_ACTIVE_SECS_KEY, currentActive.toString());

        const payload = {
          durationSeconds: Math.max(1, currentActive), // Backwards compatibility
          activeDurationSeconds: Math.max(1, currentActive),
          deltaActiveSeconds: deltaActive,
          isIdle: isCurrentlyIdle,
          isVisible: document.visibilityState === "visible",
          pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
          isNewSession: isStarting && isNewSessionRef.current,
          sessionId: sessionIdRef.current,
        };

        if (isStarting) {
          isNewSessionRef.current = false;
        }

        fetch("/api/user/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    };

    // User Interaction Listener to track actual engagement
    let lastThrottledInteraction = 0;
    const handleUserInteraction = () => {
      const t = Date.now();
      lastInteractionTimeRef.current = t;

      // Throttle state check to at most once per 2 seconds
      if (t - lastThrottledInteraction > 2000) {
        lastThrottledInteraction = t;
        if (isIdleRef.current) {
          // User returned from idle!
          isIdleRef.current = false;
          sendHeartbeat(false, false);
        }
      }
    };

    const interactionEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"];
    interactionEvents.forEach((ev) => {
      window.addEventListener(ev, handleUserInteraction, { passive: true });
    });

    // 1-second active accumulator ticker
    const secondTicker = setInterval(() => {
      const isVisible = typeof document !== "undefined" && document.visibilityState === "visible";
      const timeSinceInteraction = Date.now() - lastInteractionTimeRef.current;
      const isUserActive = isVisible && timeSinceInteraction < IDLE_THRESHOLD_MS;

      if (isUserActive) {
        if (isIdleRef.current) {
          isIdleRef.current = false;
        }
        if (activeSecondsRef.current < MAX_SESSION_ACTIVE_SECONDS) {
          activeSecondsRef.current += 1;
        }
      } else if (!isIdleRef.current && timeSinceInteraction >= IDLE_THRESHOLD_MS) {
        // Transition to idle
        isIdleRef.current = true;
        sendHeartbeat(false, true);
      }
    }, 1000);

    // Initial heartbeat after 3 seconds of engagement
    const initialTimer = setTimeout(() => {
      hasInitializedRef.current = true;
      activeSecondsRef.current = Math.max(3, activeSecondsRef.current);
      sendHeartbeat(true, false);
    }, 3000);

    // Periodic heartbeat every 30 seconds, ONLY if not idle and visible
    const periodicInterval = setInterval(() => {
      const isVisible = typeof document !== "undefined" && document.visibilityState === "visible";
      if (!isIdleRef.current && isVisible) {
        sendHeartbeat(false, false);
      }
    }, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Paused in background: flush accumulated active time immediately
        sendHeartbeat(false, true);
      } else {
        lastInteractionTimeRef.current = Date.now();
      }
    };

    const handleUnload = () => {
      sendHeartbeat(false, isIdleRef.current);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(secondTicker);
      clearInterval(periodicInterval);
      interactionEvents.forEach((ev) => {
        window.removeEventListener(ev, handleUserInteraction);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
      sendHeartbeat(false, true);
    };
  }, []);

  return null;
}
