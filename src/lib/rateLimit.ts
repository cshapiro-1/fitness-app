import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory sliding-window store for rate limiting
const store = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 300000);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 300000);
}

export interface RateLimitConfig {
  limit: number; // Max allowed requests
  windowMs: number; // Window size in milliseconds
  identifier?: string; // Optional custom key prefix
}

export const RATE_LIMIT_PRESETS = {
  AUTH: { limit: 10, windowMs: 60 * 1000, identifier: "auth" }, // 10 req/min for auth/login attempts
  AI: { limit: 20, windowMs: 60 * 1000, identifier: "ai" }, // 20 req/min for AI routine generation
  MUTATION: { limit: 60, windowMs: 60 * 1000, identifier: "mutation" }, // 60 req/min for creating/updating resources
  QUERY: { limit: 180, windowMs: 60 * 1000, identifier: "query" }, // 180 req/min for reads
};

/**
 * Checks if the request exceeds the rate limit.
 * If exceeded, returns a 429 NextResponse.
 * If allowed, returns null.
 */
export function checkRateLimit(
  req: NextRequest | Request,
  config: RateLimitConfig = RATE_LIMIT_PRESETS.MUTATION
): { limited: boolean; response?: NextResponse; remaining: number; resetTime: number } {
  // Extract client IP address
  let clientIp = "127.0.0.1";

  if ("headers" in req) {
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    if (forwarded) {
      clientIp = forwarded.split(",")[0].trim();
    } else if (realIp) {
      clientIp = realIp.trim();
    }
  }

  const prefix = config.identifier || "general";
  const key = `${prefix}:${clientIp}`;
  const now = Date.now();

  let record = store.get(key);
  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Filter out timestamps older than the window
  record.timestamps = record.timestamps.filter((ts) => now - ts < config.windowMs);

  if (record.timestamps.length >= config.limit) {
    const oldestTs = record.timestamps[0];
    const resetTime = Math.ceil((oldestTs + config.windowMs - now) / 1000);

    const response = NextResponse.json(
      {
        error: "Too many requests. Please slow down.",
        retryAfterSeconds: Math.max(1, resetTime),
      },
      {
        status: 429,
        headers: {
          "Retry-After": Math.max(1, resetTime).toString(),
          "X-RateLimit-Limit": config.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": (oldestTs + config.windowMs).toString(),
        },
      }
    );

    return { limited: true, response, remaining: 0, resetTime };
  }

  // Record this request timestamp
  record.timestamps.push(now);
  const remaining = config.limit - record.timestamps.length;
  const resetTime = Math.ceil(config.windowMs / 1000);

  return { limited: false, remaining, resetTime };
}

/**
 * Resets the rate limit store (used in unit tests).
 */
export function resetRateLimitStore(): void {
  store.clear();
}
