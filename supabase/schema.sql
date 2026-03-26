-- ============================================================
-- AURA Hospital System — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── Users ───
create table if not exists users (
  id         uuid primary key default uuid_generate_v4(),
  email      text unique not null,
  password   text not null,
  name       text not null,
  role       text not null check (role in ('ADMIN', 'DOCTOR')),
  profile_image text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Departments ───
create table if not exists departments (
  id                 uuid primary key default uuid_generate_v4(),
  name               text unique not null,
  location           text not null,
  floor              text not null,
  description        text,
  open_time          text default '08:00',
  close_time         text default '17:00',
  latitude           float8,
  longitude          float8,
  written_directions text,
  icon               text default 'hospital',
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ─── Doctors ───
create table if not exists doctors (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid unique not null references users(id) on delete cascade,
  specialty     text not null,
  department_id uuid not null references departments(id) on delete cascade,
  status        text default 'AVAILABLE' check (status in ('AVAILABLE','BUSY','OFFLINE','ON_BREAK')),
  room_number   text,
  phone         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── Wards ───
create table if not exists wards (
  id                 uuid primary key default uuid_generate_v4(),
  name               text unique not null,
  floor              text not null,
  ward_type          text default 'General',
  nurse_in_charge    text,
  latitude           float8,
  longitude          float8,
  written_directions text,
  total_beds         int default 0,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ─── Beds ───
create table if not exists beds (
  id          uuid primary key default uuid_generate_v4(),
  ward_id     uuid not null references wards(id) on delete cascade,
  bed_number  text not null,
  is_occupied boolean default false,
  patient_id  uuid,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(ward_id, bed_number)
);

-- ─── Location Pins ───
create table if not exists location_pins (
  id                 uuid primary key default uuid_generate_v4(),
  name               text not null,
  category           text not null,
  description        text,
  latitude           float8 not null,
  longitude          float8 not null,
  written_directions text,
  floor              text default 'Ground Floor',
  is_active          boolean default true,
  icon_name          text default 'location',
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ─── Appointments ───
create table if not exists appointments (
  id            uuid primary key default uuid_generate_v4(),
  patient_name  text not null,
  patient_phone text,
  symptoms      text,
  doctor_id     uuid references doctors(id) on delete set null,
  status        text default 'PENDING' check (status in ('PENDING','ACCEPTED','DECLINED','IN_PROGRESS','COMPLETED','CANCELLED')),
  decline_reason text,
  scheduled_at  timestamptz,
  accepted_at   timestamptz,
  qr_code       text,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── Queue Entries ───
create table if not exists queue_entries (
  id            uuid primary key default uuid_generate_v4(),
  ticket_number int not null,
  patient_name  text not null,
  department_id uuid references departments(id) on delete cascade,
  doctor_id     uuid references doctors(id) on delete set null,
  status        text default 'WAITING' check (status in ('WAITING','CALLED','IN_PROGRESS','COMPLETED')),
  priority      text default 'ROUTINE' check (priority in ('EMERGENCY','URGENT','ROUTINE')),
  symptoms      text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── Medications ───
create table if not exists medications (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  form                  text not null,
  dosage                text not null,
  price                 float8 not null,
  in_stock              boolean default true,
  quantity              int default 0,
  prescription_required boolean default false,
  category              text,
  icon                  text default 'pill',
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ─── Fees ───
create table if not exists fees (
  id          uuid primary key default uuid_generate_v4(),
  service     text not null,
  category    text not null,
  price       float8 not null,
  description text,
  icon        text default 'receipt',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── Admitted Patients ───
create table if not exists admitted_patients (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  date_of_birth    text,
  ward_id          uuid references wards(id) on delete set null,
  bed_id           uuid references beds(id) on delete set null,
  ward             text,
  room             text,
  bed              text,
  admission_date   timestamptz default now(),
  status           text default 'ADMITTED' check (status in ('ADMITTED','DISCHARGED')),
  visitors_allowed boolean default true,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─── Hospital Info ───
create table if not exists hospital_info (
  id       uuid primary key default uuid_generate_v4(),
  key      text unique not null,
  value    text not null,
  category text not null
);

-- ─── Indexes ───
create index if not exists idx_doctors_dept on doctors(department_id);
create index if not exists idx_doctors_user on doctors(user_id);
create index if not exists idx_queue_dept on queue_entries(department_id);
create index if not exists idx_queue_doctor on queue_entries(doctor_id);
create index if not exists idx_queue_status on queue_entries(status);
create index if not exists idx_appointments_doctor on appointments(doctor_id);
create index if not exists idx_appointments_status on appointments(status);
create index if not exists idx_beds_ward on beds(ward_id);
create index if not exists idx_admitted_ward on admitted_patients(ward_id);
create index if not exists idx_admitted_bed on admitted_patients(bed_id);

-- ─── Enable RLS (Row Level Security) ───
-- For now we use the service_role key server-side so RLS is permissive
alter table users enable row level security;
alter table doctors enable row level security;
alter table departments enable row level security;
alter table wards enable row level security;
alter table beds enable row level security;
alter table location_pins enable row level security;
alter table appointments enable row level security;
alter table queue_entries enable row level security;
alter table medications enable row level security;
alter table fees enable row level security;
alter table admitted_patients enable row level security;
alter table hospital_info enable row level security;

-- Allow service_role full access
create policy "service_role_all" on users for all using (true) with check (true);
create policy "service_role_all" on doctors for all using (true) with check (true);
create policy "service_role_all" on departments for all using (true) with check (true);
create policy "service_role_all" on wards for all using (true) with check (true);
create policy "service_role_all" on beds for all using (true) with check (true);
create policy "service_role_all" on location_pins for all using (true) with check (true);
create policy "service_role_all" on appointments for all using (true) with check (true);
create policy "service_role_all" on queue_entries for all using (true) with check (true);
create policy "service_role_all" on medications for all using (true) with check (true);
create policy "service_role_all" on fees for all using (true) with check (true);
create policy "service_role_all" on admitted_patients for all using (true) with check (true);
create policy "service_role_all" on hospital_info for all using (true) with check (true);
