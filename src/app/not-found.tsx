'use client';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>404</h1>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1rem 0', color: '#475569' }}>Page Not Found</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', maxWidth: '400px' }}>The page you are looking for does not exist or has been moved.</p>
      <a
        href="/dashboard"
        style={{ padding: '0.625rem 1.25rem', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}
      >
        Return to Dashboard
      </a>
    </div>
  );
}
