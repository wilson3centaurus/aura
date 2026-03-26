# AURA — Artificial Universal Reception Assistant
### Intelligent Hospital Service Robot Kiosk System

A full-stack Next.js application powering a hospital service kiosk with three synchronized interfaces:

- **🖥️ Kiosk Interface** (`/kiosk`) — Patient-facing touchscreen with voice input
- **👨‍⚕️ Doctor Dashboard** (`/doctor`) — Doctor queue management & availability
- **⚙️ Admin Dashboard** (`/admin`) — Hospital administration & data management

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite via Prisma ORM
- **Auth**: JWT (jose) + HTTP-only cookies
- **Voice**: Web Speech API (Chrome)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up the database
npm run db:push

# 3. Seed with test data
npm run seed

# 4. Start the dev server (accessible on local network)
npm run dev
```

The app runs on `http://localhost:3000` and is accessible from other devices on the same network at `http://<your-ip>:3000`.

## Access Points

| Interface | URL | Purpose |
|-----------|-----|---------|
| Kiosk | `http://<ip>:3000/kiosk` | Patient touchscreen |
| Doctor Login | `http://<ip>:3000/doctor/login` | Doctor portal |
| Admin Login | `http://<ip>:3000/admin/login` | Admin portal |

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@aura.hospital | password123 |
| Doctor | dr.moyo@aura.hospital | password123 |
| Doctor | dr.chikwanha@aura.hospital | password123 |
| Doctor | dr.ncube@aura.hospital | password123 |

*(All doctor accounts use `password123`)*

## Kiosk Setup (Chromebook)

1. Connect the Chromebook to the same network as the server PC
2. Open Chrome and navigate to `http://<server-ip>:3000/kiosk`
3. Press **F11** for fullscreen, or launch Chrome in kiosk mode:
   ```
   chrome --kiosk http://<server-ip>:3000/kiosk
   ```

## Project Structure

```
src/
├── app/
│   ├── kiosk/          # Patient kiosk interface
│   │   ├── page.tsx    # Welcome & language selection
│   │   ├── menu/       # Main menu
│   │   ├── doctors/    # Doctor availability & queue
│   │   ├── symptoms/   # Symptom check & triage
│   │   ├── medication/ # Medication search
│   │   ├── information/# Hospital info & fees
│   │   ├── visit/      # Find admitted patients
│   │   ├── facilities/ # Facility navigation
│   │   └── queue/      # Queue status board
│   ├── doctor/         # Doctor dashboard
│   │   ├── login/
│   │   └── dashboard/
│   ├── admin/          # Admin dashboard
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── doctors/
│   │   ├── departments/
│   │   ├── medications/
│   │   ├── fees/
│   │   └── patients/
│   └── api/            # API routes
│       ├── auth/
│       ├── doctors/
│       ├── departments/
│       ├── queue/
│       ├── appointments/
│       ├── medications/
│       ├── patients/
│       ├── fees/
│       └── information/
├── components/
│   └── ThemeProvider.tsx
├── lib/
│   ├── db.ts           # Prisma client
│   └── auth.ts         # JWT auth
└── types/
    └── index.ts        # Type definitions

prisma/
├── schema.prisma       # Database schema
└── seed.ts             # Test data
```

## Features

- ✅ Multilingual interface (16 Zimbabwean languages)
- ✅ Voice input (Web Speech API)
- ✅ Touch-optimized kiosk UI
- ✅ Light / Dark theme toggle
- ✅ Real-time doctor availability
- ✅ Patient queue management
- ✅ Symptom assessment & triage
- ✅ Medication availability check
- ✅ Hospital information & fees
- ✅ Admitted patient search
- ✅ Facility navigation
- ✅ Doctor status management
- ✅ Admin CRUD for all entities
- ✅ JWT authentication
- ✅ Local network accessible
