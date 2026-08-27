import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Strict Transport Security (HSTS) - Force HTTPS
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  // 2. Prevent Clickjacking
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  // 3. Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // 4. Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 5. Restrict permissions (camera, microphone, geolocation)
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // 6. Content Security Policy (CSP)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net https://apis.google.com https://accounts.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob: https://*.googleusercontent.com https://lh3.googleusercontent.com https://*.google.com;
    font-src 'self' https://fonts.gstatic.com data:;
    connect-src 'self' https://api.stripe.com https://*.stripe.com https://*.supabase.co https://*.neon.tech https://*.google.com https://accounts.google.com https://www.googleapis.com https://*.googleusercontent.com https://lh3.googleusercontent.com;
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self' https://accounts.google.com https://*.google.com;
    frame-ancestors 'self';
  `.replace(/\s{2,}/g, " ").trim();

  response.headers.set("Content-Security-Policy", cspHeader);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons / public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
