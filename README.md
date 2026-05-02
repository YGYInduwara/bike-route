# BikeTracker

A Progressive Web App (PWA) to track fuel, maintenance, and costs for your vehicle. Built for personal use on Android (Pixel 9).

## Features

- **Fuel tracking** — log fill-ups, calculate km/L, monitor mileage trends
- **Maintenance** — track service intervals by km and time, get due-soon alerts
- **Renewals** — insurance, revenue license, emission test reminders
- **Expense ledger** — unified cost dashboard across all categories
- **Push notifications** — maintenance and renewal alerts via Web Push
- **Offline support** — works without internet after first load
- **PWA** — installs on Android home screen like a native app

## Stack

- **Framework** — Next.js 14 (App Router) + TypeScript
- **Styling** — Tailwind CSS + shadcn/ui
- **Auth** — Clerk
- **Database** — PostgreSQL (Neon serverless)
- **ORM** — Prisma
- **Charts** — Recharts
- **PWA** — next-pwa (Workbox)
- **Hosting** — Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Clerk](https://clerk.com) application

### Setup

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/YGYInduwara/bike-route.git
cd bike-route
npm install
```

2. Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

3. Push the database schema:

```bash
npx prisma db push
```

4. Start the dev server:

```bash
npm run dev
```

## Deployment

The app is deployed on Vercel. Any push to `main` triggers an automatic redeploy.

Live: [https://bike-route.vercel.app](https://bike-route.vercel.app)

## Install as PWA (Android)

1. Open [https://bike-route.vercel.app](https://bike-route.vercel.app) in Chrome
2. Tap the 3-dot menu → **Add to Home screen**
3. The app installs and opens full screen like a native app
