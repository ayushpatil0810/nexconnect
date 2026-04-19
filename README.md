# NexConnect

NexConnect is a trust-first professional networking platform built with **Next.js 16**, **TypeScript**, **MongoDB**, and **Better Auth**.  
It combines social networking, hiring, B2B opportunities, company verification, event ticketing, and referral rewards in one app.

## Features

- **Authentication**: email/password + Google/GitHub OAuth via Better Auth.
- **Guided onboarding**: multi-step onboarding with profile setup and face-liveness verification step.
- **Professional profiles**: public profile pages, skills/experience/education, trust signals.
- **Social feed**: posts, reposts, comments, reactions, connection requests, recommendations.
- **Jobs**: job listings, applications, application tracking, basic profile-job match analysis.
- **Company system**: create companies, manage representatives, verify ownership/domain claims.
- **B2B marketplace**: post and respond to partnership/funding/acquisition/service opportunities.
- **Business inbox**: discussion threads and proposal workflow between users and companies.
- **Events**: event listings, registration, ticket generation, and ticket email delivery.
- **Payments**: Razorpay integration for paid events with escrow-style status handling.
- **Trust & verification**: work-email verification via magic links, trust score related records.
- **Referrals & rewards**: referral tracking and milestone/reward pages.
- **Notifications**: in-app notifications with unread counts and mark-as-read support.

## Tech Stack

- **Framework**: Next.js (App Router), React 19, TypeScript
- **UI**: Tailwind CSS v4, shadcn/ui, Radix UI, Lucide icons, Sonner
- **Auth**: Better Auth + MongoDB adapter
- **Database**: MongoDB
- **Email**: Nodemailer (SMTP or Ethereal fallback in development)
- **Payments**: Razorpay

## Prerequisites

- **Node.js** 20+ (recommended)
- **npm** 10+
- **MongoDB** instance (local or cloud)
- (Optional) OAuth apps for Google/GitHub
- (Optional) SMTP provider credentials
- (Optional) Razorpay account for paid events

## Installation & Setup

1. **Clone and install dependencies**

```bash
git clone <your-repo-url>
cd nexconnect
npm install
```

2. **Create environment file**

Create `.env.local` in the project root:

```env
# Core
DATABASE_URL=mongodb://localhost:27017/nexconnect
MONGODB_DB_NAME=nexconnect
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-long-random-secret

# OAuth (optional, enables provider buttons)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# SMTP (optional, if empty app falls back to Ethereal in dev)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=

# Payments (optional for paid event flows)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# API CORS (optional, comma-separated)
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

> If you use standalone scripts like `test-email.ts`, add the same values to `.env` as well.

3. **Run the development server**

```bash
npm run dev
```

4. **Open the app**

Go to: `http://localhost:3000`

## Available Scripts

```bash
npm run dev        # start dev server (Turbopack)
npm run build      # production build
npm run start      # run production server
npm run lint       # run ESLint
npm run typecheck  # TypeScript type check
npm run format     # format TS/TSX files with Prettier
```

## Main Routes

- `/` – landing page
- `/auth/sign-in`, `/auth/sign-up` – authentication
- `/onboarding` – first-time setup
- `/feed` – main network feed
- `/profile/[username]` – public profile
- `/jobs`, `/jobs/[id]`, `/jobs/applications` – jobs and applications
- `/marketplace`, `/marketplace/[id]` – B2B opportunity marketplace
- `/company/create`, `/company/[id]` – company management
- `/business`, `/business/[id]` – business discussions/inbox
- `/events`, `/events/[id]`, `/events/ticket/[ticketId]` – events and tickets
- `/rewards` – referral and rewards area
- `/verify/work-email` – magic-link verification page

## Key API Groups

- **Auth**: `/api/auth/[...all]`, `/api/auth/post-login`
- **Profile**: `/api/profile`, `/api/profile/[username]`
- **Feed**: `/api/posts`, `/api/posts/[id]/comments`, `/api/posts/[id]/react`
- **Connections**: `/api/connections`, `/api/connections/pending`, `/api/connections/recommendations`
- **Notifications**: `/api/notifications`, `/api/notifications/[id]/read`
- **Jobs & applications**: `/api/jobs`, `/api/applications`
- **Company & opportunities**: `/api/company/...`, `/api/opportunities/...`, `/api/invest/...`
- **Events**: `/api/events`, `/api/events/register`, `/api/events/feedback`
- **Payments**: `/api/payments/create-order`, `/api/payments/verify`
- **Verification**: `/api/verify/work-email/request`, `/api/verify/work-email/confirm`
- **Analytics/reports/coupons**: `/api/analytics/...`, `/api/reports`, `/api/coupon/...`

## Authentication & Access Flow

- Public routes include landing and auth pages.
- Most app routes require a valid session.
- Users who are authenticated but not onboarded are redirected to `/onboarding`.
- Authenticated users visiting sign-in/sign-up are redirected to `/feed`.

## Development Notes

- Database access helpers are under `lib/db/*` and `lib/mongodb.ts`.
- Auth config lives in `lib/auth.ts` and client helpers in `lib/auth-client.ts`.
- Email templates/senders are in `lib/email.ts`.
- Middleware-like routing and CORS handling are implemented in `proxy.ts`.
- UI components are under `components/` and `components/ui/`.

## Troubleshooting

- **Mongo connection errors**: verify `DATABASE_URL` and MongoDB availability.
- **OAuth buttons not working**: ensure provider IDs/secrets are set and callback URLs are configured with your auth providers.
- **Emails not arriving**: set SMTP credentials; otherwise check Ethereal preview logs in console during development.
- **Payment flow issues**: verify Razorpay keys and ensure event price is greater than `0` for paid-flow testing.
