"use client";

import React, { useState, useEffect, useCallback } from "react";
import { WifiOff, RefreshCw, AlertTriangle, CheckCircle2, X } from "lucide-react";

export function NetworkConnectionBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isCaptivePortal, setIsCaptivePortal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [lastCheckSuccess, setLastCheckSuccess] = useState<boolean | null>(null);

  const checkConnectivity = useCallback(async () => {
    if (typeof window === "undefined") return;

    if (!navigator.onLine) {
      setIsOffline(true);
      setIsCaptivePortal(false);
      return;
    }

    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`/api/health/ping?t=${Date.now()}`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);

      const text = await res.text().catch(() => "");

      if (res.ok && text.includes("PONG")) {
        setIsOffline(false);
        setIsCaptivePortal(false);
        setLastCheckSuccess(true);
        setTimeout(() => setLastCheckSuccess(null), 3000);
      } else {
        setIsCaptivePortal(true);
        setIsOffline(false);
        setDismissed(false);
      }
    } catch (err: any) {
      setIsOffline(true);
      setIsCaptivePortal(false);
      setDismissed(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      checkConnectivity();
    };

    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", checkConnectivity);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", checkConnectivity);
    };
  }, [checkConnectivity]);

  if (dismissed && !lastCheckSuccess) return null;
  if (!isOffline && !isCaptivePortal && !lastCheckSuccess) return null;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 9999,
        background: lastCheckSuccess
          ? "#16a34a"
          : isCaptivePortal
          ? "#d97706"
          : "#dc2626",
        color: "#ffffff",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        fontSize: "12px",
        fontWeight: 600,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
        {lastCheckSuccess ? (
          <>
            <CheckCircle2 size={16} />
            <span>Connection Restored! You are back online.</span>
          </>
        ) : isCaptivePortal ? (
          <>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>
              <b>Public Wi-Fi Login Required:</b> Your Wi-Fi network may have a captive portal splash page. Please sign in to the Wi-Fi or switch to cellular data.
            </span>
          </>
        ) : (
          <>
            <WifiOff size={16} style={{ flexShrink: 0 }} />
            <span>
              <b>No Internet Connection:</b> Check your network or Wi-Fi connection. Offline workout logging is preserved.
            </span>
          </>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {!lastCheckSuccess && (
          <button
            type="button"
            onClick={checkConnectivity}
            disabled={isChecking}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#ffffff",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: isChecking ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <RefreshCw size={11} className={isChecking ? "spin-pulse" : ""} />
            <span>{isChecking ? "Testing..." : "Test Connection"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.8)",
            cursor: "pointer",
            padding: "2px",
          }}
          title="Dismiss banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default NetworkConnectionBanner;
