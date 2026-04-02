# AURA — Artificial Universal Reception Assistant
### Intelligent Hospital Kiosk & Management System

A full-stack Next.js application powering a hospital kiosk with three synchronized interfaces for patients, doctors, and administrators.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 18, Tailwind CSS |
| Backend | Next.js API Routes (Edge-compatible) |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (jose) + HTTP-only cookies |
| AI | Google Gemini (chat + voice navigation) |
| Voice | Web Speech API (Chrome/Edge) |

---

## Quick Start

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in your Supabase URL, service role key, and Gemini API key. The app runs on `http://localhost:3000` and is reachable from other devices on the same network at `http://<your-ip>:3000`.

---

## Access Points

| Interface | URL | Credentials |
|-----------|-----|-------------|
| Kiosk | `/kiosk` | Public — no login |
| Doctor Login | `/doctor/login` | See seed data |
| Admin Login | `/admin/login` | See seed data |

---

## System Flow

### Patient / Kiosk
1. **Welcome** (`/kiosk`) — Language selection (16 languages), voice or touch entry
2. **Menu** (`/kiosk/menu`) — 8 service options, navigable by voice or tap
3. From menu, patients can:
   - **Browse Doctors** → select a doctor → optionally run symptom check → book appointment → receive QR code
   - **Symptom Checker** → triage assessment (ROUTINE / MODERATE / URGENT / EMERGENCY) → pre-fills booking urgency
   - **Track Appointment** → scan or enter QR code → see live status, cancel if needed
   - **Queue Board** → real-time walk-in queue with auto-refresh
   - **Medication Search** → check stock and prescription requirements
   - **Hospital Info** → visiting hours, fee schedule, contact details
   - **Find a Patient** → search admitted patients, get ward directions
   - **Facilities Map** → tap a pin to get directions (map, QR, or written)
4. **AI Assistant** (`/kiosk/assistant`) — multi-modal: text chat, voice, or phone call; powered by Gemini with function calling for appointment lookup and directions

### Doctor
1. **Login** (`/doctor/login`) → JWT session
2. **Setup** (`/doctor/setup`) — first-time: profile photo, room location on map, password change
3. **Dashboard** (`/doctor/dashboard`) — unified queue (walk-ins + scheduled appointments), accept/decline/complete appointments, manual status toggle (AVAILABLE / BUSY / ON_BREAK / OFFLINE), auto-status based on schedule

### Admin
1. **Login** (`/admin/login`) → JWT session (ADMIN role required)
2. **Dashboard** (`/admin/dashboard`) — live stats: doctors, queue, beds, appointments (single optimised API call)
3. **Manage Doctors** — create, edit, delete; auto-assign hospital email; department assignment
4. **Manage Departments** — CRUD with Google Maps room pin
5. **Wards & Beds** — create wards, auto-generate beds, admit/discharge patients per bed
6. **Appointments** — full list with filters, QR display, status management
7. **Medications** — inventory CRUD with prescription flags and stock levels
8. **Fees & Pricing** — inline price editing per service category
9. **Map Pins** — drop pins for any facility (pharmacy, lab, toilets, etc.) shown on kiosk map
10. **Reports** — summary analytics
11. **Settings** — operating hours and lunch break configuration

---

## Features

- Multilingual interface — 16 Zimbabwean languages (Shona, Ndebele, and more)
- Voice navigation — utter any menu item to navigate; AI handles unrecognised phrases
- AI assistant — Gemini-powered chat with appointment lookup and directions function calling
- Presence detection — optional camera motion to auto-wake kiosk
- Touch-optimised kiosk UI with light / dark theme
- Real-time doctor availability and status
- Patient queue management with live board
- Symptom triage — severity + duration → urgency level pre-filled on booking form
- Walk-in + appointment unified queue on doctor dashboard
- Wards & bed management with admit / discharge per bed
- QR-code appointment tracking (LAN-aware URL via `/api/host`)
- Facility navigation with Google Maps embed, QR, or written directions
- Hospital info: visiting hours, fees, contacts — all admin-configurable
- JWT authentication with ADMIN and DOCTOR roles; HTTP-only cookies
- All write endpoints (fees, settings, departments) require ADMIN auth

---

## Kiosk Deployment (Chromebook)

```bash
# Full-screen kiosk mode
chrome --kiosk http://<server-ip>:3000/kiosk
```

Set `NEXT_PUBLIC_DISABLE_VIDEO=true` in `.env` to disable the camera presence detector if no webcam is attached.

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
GEMINI_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_KEY=
NEXT_PUBLIC_DISABLE_VIDEO=false   # set true to skip camera
```

