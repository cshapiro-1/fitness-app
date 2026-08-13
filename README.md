# Fitness App

Next.js trainer dashboard with:

- Google sign-in via NextAuth
- Neon Postgres via Prisma driver adapter
- Vercel deployment

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template and fill values:

```bash
cp .env.example .env.local
```

Required variables:

- `DATABASE_URL` (Neon connection string)
- `NEXTAUTH_URL` (`http://localhost:3000` locally)
- `NEXTAUTH_SECRET` (long random string)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

3. Generate Prisma client:

```bash
npm run build
```

4. Run dev server:

```bash
npm run dev
```

## Google OAuth Configuration

In Google Cloud Console, create an OAuth client and set:

- Authorized JavaScript origins:
	- `http://localhost:3000`
	- `https://<your-vercel-domain>`
- Authorized redirect URIs:
	- `http://localhost:3000/api/auth/callback/google`
	- `https://<your-vercel-domain>/api/auth/callback/google`

## Vercel Deployment

Set the same environment variables in Vercel Project Settings, then deploy.

Build command:

```bash
npm run build
```

The app uses Next.js App Router API routes and server sessions for route protection.
