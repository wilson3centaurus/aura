-- ============================================================
-- AURA — Doctor Account Activation Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Add GPS office coordinates to doctors table
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS latitude  float8;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS longitude float8;

-- Track whether a doctor has changed their default password
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed boolean DEFAULT false;
