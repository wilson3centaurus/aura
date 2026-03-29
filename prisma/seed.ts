/**
 * Seed script for AURA — Mutare Provincial Hospital
 * Uses Supabase client (same as the app) to insert seed data.
 *
 * Usage:  npm run seed
 * Env:    requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env from project root
config({ path: resolve(process.cwd(), '.env') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)


async function wipe() {
  console.log('🗑️  Clearing existing data...')
  const tables = [
    'queue_entries', 'appointments', 'doctors', 'users',
    'departments', 'medications', 'fees', 'admitted_patients',
    'hospital_info', 'location_pins',
  ]
  for (const t of tables) {
    const { error } = await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error && !error.message.includes('0 rows')) {
      console.warn(`  ⚠️  Could not wipe ${t}: ${error.message}`)
    }
  }
}

async function main() {
  console.log('🌱 Seeding AURA — Mutare Provincial Hospital...')
  await wipe()

  const hashedPassword = await bcrypt.hash('password123', 10)

  // ── Admin ──────────────────────────────────────────────────────
  const { data: admin } = await supabase
    .from('users')
    .insert({ name: 'System Admin', email: 'admin@aura.hospital', password: hashedPassword, role: 'ADMIN' })
    .select().single()
  console.log('  ✅ Admin: admin@aura.hospital / password123')

  // ── Departments ────────────────────────────────────────────────
  // Hospital coordinates: -18.963694, 32.663358
  const depts = await supabase.from('departments').insert([
    { name: 'General Outpatient',       location: 'Main Block, Ground Floor',                   floor: 'Ground', description: 'General outpatient consultations and primary care',      open_time: '08:00', close_time: '17:00', latitude: -18.9638, longitude: 32.6634 },
    { name: 'Accident & Emergency',     location: 'Main Block, Ground Floor — East Wing',       floor: 'Ground', description: '24/7 Emergency and trauma care',                         open_time: '00:00', close_time: '23:59', latitude: -18.9633, longitude: 32.6639 },
    { name: 'Paediatrics',              location: 'Block B, 1st Floor',                         floor: '1st',    description: 'Child health services (under 12)',                        open_time: '08:00', close_time: '17:00', latitude: -18.9640, longitude: 32.6630 },
    { name: 'Maternity & Obstetrics',   location: 'Block C, 2nd Floor',                         floor: '2nd',    description: 'Maternity, prenatal and postnatal care',                 open_time: '00:00', close_time: '23:59', latitude: -18.9636, longitude: 32.6627 },
    { name: 'Internal Medicine',        location: 'Block A, 1st Floor',                         floor: '1st',    description: 'Internal medicine and chronic disease management',        open_time: '08:00', close_time: '17:00', latitude: -18.9641, longitude: 32.6635 },
    { name: 'Surgery',                  location: 'Block D, 3rd Floor',                         floor: '3rd',    description: 'General and specialist surgical services',                open_time: '07:00', close_time: '18:00', latitude: -18.9644, longitude: 32.6633 },
    { name: 'Radiology & Imaging',      location: 'East Wing, Ground Floor',                    floor: 'Ground', description: 'X-Ray, CT, Ultrasound and imaging services',              open_time: '07:30', close_time: '17:00', latitude: -18.9635, longitude: 32.6641 },
    { name: 'Dental & Oral Health',     location: 'Block B, Ground Floor',                      floor: 'Ground', description: 'Dental consultations, extraction and oral health',         open_time: '08:00', close_time: '16:00', latitude: -18.9639, longitude: 32.6629 },
    { name: 'Pharmacy',                 location: 'Main Block, Ground Floor — Near Reception',  floor: 'Ground', description: 'Prescription dispensing and over-the-counter medications', open_time: '08:00', close_time: '17:00', latitude: -18.9637, longitude: 32.6636 },
    { name: 'Laboratory & Pathology',   location: 'East Wing, Ground Floor',                    floor: 'Ground', description: 'Blood tests, urine analysis and pathology services',       open_time: '07:30', close_time: '17:30', latitude: -18.9636, longitude: 32.6638 },
    { name: 'Ophthalmology',            location: 'Block A, Ground Floor',                      floor: 'Ground', description: 'Eye health, vision testing and treatment',                open_time: '08:00', close_time: '16:00', latitude: -18.9640, longitude: 32.6632 },
    { name: 'Orthopaedics',             location: 'Block D, 2nd Floor',                         floor: '2nd',    description: 'Bone and joint disorders, fractures, physiotherapy',       open_time: '08:00', close_time: '17:00', latitude: -18.9643, longitude: 32.6631 },
  ]).select()

  if (depts.error) { console.error('Dept error:', depts.error); process.exit(1) }
  const d = (name: string) => depts.data!.find((x: any) => x.name === name)!

  console.log(`  ✅ ${depts.data!.length} Departments`)

  // ── Doctors ────────────────────────────────────────────────────
  const doctorDefs = [
    { name: 'Dr. Tatenda Moyo',       email: 'moyo@aura.hospital',      specialty: 'General Practitioner',  deptName: 'General Outpatient',     room: 'G-04',  status: 'AVAILABLE' },
    { name: 'Dr. Natalie Chikwanha', email: 'chikwanha@aura.hospital', specialty: 'Internal Medicine',     deptName: 'Internal Medicine',      room: '1-05',  status: 'AVAILABLE' },
    { name: 'Dr. James Ncube',       email: 'ncube@aura.hospital',     specialty: 'Cardiologist',          deptName: 'Internal Medicine',      room: '1-08',  status: 'BUSY' },
    { name: 'Dr. Grace Mutasa',      email: 'mutasa@aura.hospital',    specialty: 'Paediatrician',         deptName: 'Paediatrics',            room: '1-15',  status: 'AVAILABLE' },
    { name: 'Dr. Peter Zhou',        email: 'zhou@aura.hospital',      specialty: 'Paediatrician',         deptName: 'Paediatrics',            room: '1-16',  status: 'ON_BREAK' },
    { name: 'Dr. Sarah Mlambo',      email: 'mlambo@aura.hospital',    specialty: 'Obstetrician',          deptName: 'Maternity & Obstetrics', room: '2-01',  status: 'AVAILABLE' },
    { name: 'Dr. David Chirara',     email: 'chirara@aura.hospital',   specialty: 'General Surgeon',       deptName: 'Surgery',                room: '3-10',  status: 'BUSY' },
    { name: 'Dr. Ruth Nkomo',        email: 'nkomo@aura.hospital',     specialty: 'Radiologist',           deptName: 'Radiology & Imaging',    room: 'G-20',  status: 'AVAILABLE' },
    { name: 'Dr. Emmanuel Sithole',  email: 'sithole@aura.hospital',   specialty: 'Emergency Medicine',    deptName: 'Accident & Emergency',   room: 'ER-1',  status: 'AVAILABLE' },
    { name: 'Dr. Florence Dube',     email: 'dube@aura.hospital',      specialty: 'Dentist',               deptName: 'Dental & Oral Health',   room: 'G-25',  status: 'AVAILABLE' },
    { name: 'Dr. Tinashe Murombedzi',email: 'murombedzi@aura.hospital',specialty: 'Ophthalmologist',       deptName: 'Ophthalmology',          room: 'G-08',  status: 'AVAILABLE' },
    { name: 'Dr. Clara Makoni',      email: 'makoni@aura.hospital',    specialty: 'Orthopaedic Surgeon',   deptName: 'Orthopaedics',           room: '2-12',  status: 'AVAILABLE' },
  ]

  for (const dd of doctorDefs) {
    const { data: u } = await supabase
      .from('users').insert({ name: dd.name, email: dd.email, password: hashedPassword, role: 'DOCTOR' }).select().single()
    if (!u) continue
    await supabase.from('doctors').insert({ user_id: u.id, specialty: dd.specialty, department_id: d(dd.deptName)?.id, room_number: dd.room, status: dd.status })
  }
  console.log(`  ✅ ${doctorDefs.length} Doctors`)

  // ── Medications ────────────────────────────────────────────────
  const meds = [
    { name: 'Paracetamol', form: 'Tablets', dosage: '500mg', price: 0.50, quantity: 800, prescription_required: false, category: 'Pain Relief', in_stock: true },
    { name: 'Paracetamol', form: 'Syrup', dosage: '120mg/5ml', price: 2.00, quantity: 150, prescription_required: false, category: 'Pain Relief', in_stock: true },
    { name: 'Ibuprofen', form: 'Tablets', dosage: '400mg', price: 1.00, quantity: 400, prescription_required: false, category: 'Pain Relief', in_stock: true },
    { name: 'Aspirin', form: 'Tablets', dosage: '75mg', price: 0.80, quantity: 500, prescription_required: false, category: 'Pain Relief', in_stock: true },
    { name: 'Tramadol', form: 'Capsules', dosage: '50mg', price: 4.00, quantity: 200, prescription_required: true, category: 'Pain Relief', in_stock: true },
    { name: 'Diclofenac', form: 'Tablets', dosage: '50mg', price: 1.50, quantity: 0, prescription_required: true, category: 'Pain Relief', in_stock: false },
    { name: 'Amoxicillin', form: 'Capsules', dosage: '500mg', price: 3.50, quantity: 300, prescription_required: true, category: 'Antibiotics', in_stock: true },
    { name: 'Azithromycin', form: 'Tablets', dosage: '500mg', price: 5.00, quantity: 150, prescription_required: true, category: 'Antibiotics', in_stock: true },
    { name: 'Ciprofloxacin', form: 'Tablets', dosage: '500mg', price: 4.50, quantity: 200, prescription_required: true, category: 'Antibiotics', in_stock: true },
    { name: 'Metronidazole', form: 'Tablets', dosage: '400mg', price: 2.00, quantity: 300, prescription_required: true, category: 'Antibiotics', in_stock: true },
    { name: 'Co-trimoxazole', form: 'Tablets', dosage: '480mg', price: 1.50, quantity: 600, prescription_required: true, category: 'Antibiotics', in_stock: true },
    { name: 'Doxycycline', form: 'Capsules', dosage: '100mg', price: 3.00, quantity: 0, prescription_required: true, category: 'Antibiotics', in_stock: false },
    { name: 'Metformin', form: 'Tablets', dosage: '500mg', price: 2.50, quantity: 600, prescription_required: true, category: 'Diabetes', in_stock: true },
    { name: 'Glibenclamide', form: 'Tablets', dosage: '5mg', price: 1.50, quantity: 400, prescription_required: true, category: 'Diabetes', in_stock: true },
    { name: 'Amlodipine', form: 'Tablets', dosage: '5mg', price: 4.00, quantity: 350, prescription_required: true, category: 'Blood Pressure', in_stock: true },
    { name: 'Losartan', form: 'Tablets', dosage: '50mg', price: 3.00, quantity: 250, prescription_required: true, category: 'Blood Pressure', in_stock: true },
    { name: 'Enalapril', form: 'Tablets', dosage: '10mg', price: 2.00, quantity: 300, prescription_required: true, category: 'Blood Pressure', in_stock: true },
    { name: 'Atorvastatin', form: 'Tablets', dosage: '20mg', price: 5.00, quantity: 200, prescription_required: true, category: 'Cholesterol', in_stock: true },
    { name: 'Salbutamol', form: 'Inhaler', dosage: '100mcg', price: 8.00, quantity: 80, prescription_required: true, category: 'Respiratory', in_stock: true },
    { name: 'Beclomethasone', form: 'Inhaler', dosage: '250mcg', price: 12.00, quantity: 50, prescription_required: true, category: 'Respiratory', in_stock: true },
    { name: 'Omeprazole', form: 'Capsules', dosage: '20mg', price: 2.00, quantity: 400, prescription_required: false, category: 'Gastrointestinal', in_stock: true },
    { name: 'Ranitidine', form: 'Tablets', dosage: '150mg', price: 1.50, quantity: 300, prescription_required: false, category: 'Gastrointestinal', in_stock: true },
    { name: 'ORS Sachets', form: 'Sachets', dosage: '20.5g', price: 0.30, quantity: 1500, prescription_required: false, category: 'Rehydration', in_stock: true },
    { name: 'Cetirizine', form: 'Tablets', dosage: '10mg', price: 1.50, quantity: 300, prescription_required: false, category: 'Allergy', in_stock: true },
    { name: 'Chlorphenamine', form: 'Tablets', dosage: '4mg', price: 0.80, quantity: 400, prescription_required: false, category: 'Allergy', in_stock: true },
    { name: 'Hydrocortisone', form: 'Cream', dosage: '1%', price: 3.50, quantity: 200, prescription_required: false, category: 'Skin', in_stock: true },
    { name: 'Artemether/Lumefantrine', form: 'Tablets', dosage: '20/120mg', price: 6.00, quantity: 500, prescription_required: true, category: 'Malaria', in_stock: true },
    { name: 'Quinine', form: 'Tablets', dosage: '300mg', price: 4.00, quantity: 200, prescription_required: true, category: 'Malaria', in_stock: true },
    { name: 'Chloramphenicol', form: 'Eye Drops', dosage: '0.5%', price: 3.00, quantity: 100, prescription_required: false, category: 'Eye & Ear', in_stock: true },
    { name: 'Haloperidol', form: 'Tablets', dosage: '5mg', price: 2.50, quantity: 150, prescription_required: true, category: 'Mental Health', in_stock: true },
    { name: 'Diazepam', form: 'Tablets', dosage: '5mg', price: 1.50, quantity: 100, prescription_required: true, category: 'Mental Health', in_stock: true },
    { name: 'Folic Acid', form: 'Tablets', dosage: '5mg', price: 0.50, quantity: 1000, prescription_required: false, category: 'Vitamins & Supplements', in_stock: true },
    { name: 'Iron Sulfate', form: 'Tablets', dosage: '200mg', price: 1.00, quantity: 700, prescription_required: false, category: 'Vitamins & Supplements', in_stock: true },
    { name: 'Zinc Sulfate', form: 'Tablets', dosage: '20mg', price: 0.50, quantity: 800, prescription_required: false, category: 'Vitamins & Supplements', in_stock: true },
    { name: 'Vitamin B Complex', form: 'Tablets', dosage: 'Standard', price: 1.50, quantity: 500, prescription_required: false, category: 'Vitamins & Supplements', in_stock: true },
  ]
  const { error: medErr } = await supabase.from('medications').insert(meds)
  if (medErr) console.warn('Meds:', medErr.message)
  else console.log(`  ✅ ${meds.length} Medications`)

  // ── Fees ───────────────────────────────────────────────────────
  const fees = [
    { service: 'General Outpatient Consultation', category: 'Consultation', price: 5.00, description: 'Standard OPD visit — card fee included' },
    { service: 'Specialist Consultation', category: 'Consultation', price: 20.00, description: 'Specialist doctor appointment' },
    { service: 'Emergency Consultation (A&E)', category: 'Consultation', price: 30.00, description: '24/7 A&E assessment and treatment' },
    { service: 'Follow-up Visit', category: 'Consultation', price: 3.00, description: 'Return visit within 2 weeks' },
    { service: 'Child Health Consultation (Paeds)', category: 'Consultation', price: 5.00, description: 'Under 5 visit — IMCI guidelines' },
    { service: 'Chest X-Ray', category: 'Radiology', price: 15.00, description: null },
    { service: 'Bone X-Ray (Single View)', category: 'Radiology', price: 12.00, description: null },
    { service: 'Bone X-Ray (Multiple Views)', category: 'Radiology', price: 25.00, description: null },
    { service: 'Dental Periapical X-Ray', category: 'Radiology', price: 10.00, description: null },
    { service: 'Ultrasound (Abdomen/Pelvis)', category: 'Radiology', price: 25.00, description: null },
    { service: 'Obstetric Ultrasound', category: 'Radiology', price: 20.00, description: 'Prenatal scan' },
    { service: 'CT Scan', category: 'Radiology', price: 120.00, description: 'Monday–Friday; referral required' },
    { service: 'Full Blood Count (FBC)', category: 'Laboratory', price: 8.00, description: null },
    { service: 'Blood Glucose (Fasting)', category: 'Laboratory', price: 4.00, description: null },
    { service: 'HbA1c (Diabetes Monitoring)', category: 'Laboratory', price: 12.00, description: null },
    { service: 'Lipid Profile', category: 'Laboratory', price: 15.00, description: null },
    { service: 'Urea & Creatinine (Kidney Function)', category: 'Laboratory', price: 12.00, description: null },
    { service: 'Liver Function Tests (LFTs)', category: 'Laboratory', price: 15.00, description: null },
    { service: 'Urine Dipstick Test', category: 'Laboratory', price: 3.00, description: null },
    { service: 'Urine Microscopy & Culture', category: 'Laboratory', price: 8.00, description: null },
    { service: 'HIV Rapid Test', category: 'Laboratory', price: 0.00, description: 'Free — confidential testing available daily' },
    { service: 'Malaria Rapid Diagnostic Test', category: 'Laboratory', price: 3.00, description: null },
    { service: 'Sputum AFB (TB Test)', category: 'Laboratory', price: 5.00, description: null },
    { service: 'Pregnancy Test', category: 'Laboratory', price: 2.00, description: null },
    { service: 'Stool Analysis', category: 'Laboratory', price: 5.00, description: null },
    { service: 'Antenatal Care (ANC) Visit', category: 'Maternity', price: 5.00, description: 'Monthly prenatal check-up' },
    { service: 'Normal Vaginal Delivery', category: 'Maternity', price: 30.00, description: 'Includes postnatal care up to 6 hours' },
    { service: 'Caesarean Section (C-Section)', category: 'Maternity', price: 150.00, description: 'Includes 3 days ward care' },
    { service: 'Postnatal Check (Mother & Baby)', category: 'Maternity', price: 5.00, description: null },
    { service: 'Dental Consultation', category: 'Dental', price: 8.00, description: null },
    { service: 'Tooth Extraction (Simple)', category: 'Dental', price: 10.00, description: null },
    { service: 'Tooth Extraction (Surgical)', category: 'Dental', price: 25.00, description: null },
    { service: 'Dental Filling (Amalgam)', category: 'Dental', price: 15.00, description: null },
    { service: 'Dental Filling (Composite)', category: 'Dental', price: 25.00, description: null },
    { service: 'Scale & Polish (Cleaning)', category: 'Dental', price: 12.00, description: null },
    { service: 'Root Canal Treatment', category: 'Dental', price: 60.00, description: 'Per tooth — estimate only' },
    { service: 'Minor Surgery / Wound Suturing', category: 'Surgery', price: 20.00, description: 'Cuts, lacerations, small procedures' },
    { service: 'Appendectomy', category: 'Surgery', price: 250.00, description: 'Excludes anaesthesia and ward fees' },
    { service: 'Hernia Repair', category: 'Surgery', price: 200.00, description: null },
    { service: 'Circumcision (Voluntary Medical)', category: 'Surgery', price: 25.00, description: null },
    { service: 'Ward Admission Fee', category: 'Admission', price: 10.00, description: 'One-time processing fee' },
    { service: 'General Ward Bed (per day)', category: 'Admission', price: 15.00, description: null },
    { service: 'Private Room (per day)', category: 'Admission', price: 45.00, description: null },
    { service: 'ICU / High Dependency (per day)', category: 'Admission', price: 120.00, description: 'Subject to availability' },
    { service: 'Eye Examination', category: 'Ophthalmology', price: 10.00, description: null },
    { service: 'Glaucoma Screening', category: 'Ophthalmology', price: 8.00, description: null },
    { service: 'Fracture Setting (Closed)', category: 'Orthopaedics', price: 30.00, description: null },
    { service: 'Plaster of Paris Application', category: 'Orthopaedics', price: 15.00, description: null },
  ]
  const { error: feeErr } = await supabase.from('fees').insert(fees)
  if (feeErr) console.warn('Fees:', feeErr.message)
  else console.log(`  ✅ ${fees.length} Fee items`)

  // ── Admitted Patients ──────────────────────────────────────────
  const patients = [
    { name: 'Mai Sedze', ward: 'Female Medical Ward B', room: '204', bed: '3', daysAgo: 3, visitors_allowed: true, notes: null },
    { name: 'James Sedze', ward: 'Male Surgical Ward', room: '305', bed: '1', daysAgo: 1, visitors_allowed: true, notes: null },
    { name: 'Tendai Mapfumo', ward: 'Male Medical Ward A', room: '102', bed: '2', daysAgo: 5, visitors_allowed: true, notes: null },
    { name: 'Chipo Nziramasanga', ward: 'Maternity & Obstetrics', room: '201', bed: '1', daysAgo: 0, visitors_allowed: true, notes: 'Delivered healthy baby girl — mother and child stable' },
    { name: 'Kudzai Moyo', ward: 'Paediatric Ward', room: '110', bed: '4', daysAgo: 2, visitors_allowed: true, notes: 'Malaria treatment, responding well' },
    { name: 'Farai Chikowero', ward: 'ICU', room: 'ICU-3', bed: '1', daysAgo: 4, visitors_allowed: false, notes: 'Post-operative care — restricted visitors' },
    { name: 'Rudo Mutsvangwa', ward: 'Female Medical Ward A', room: '108', bed: '2', daysAgo: 2, visitors_allowed: true, notes: 'Hypertension management' },
    { name: 'Blessing Chirinda', ward: 'Orthopaedic Ward', room: '310', bed: '3', daysAgo: 6, visitors_allowed: true, notes: 'Fractured femur — post-surgery recovery' },
  ]
  for (const p of patients) {
    const adm = new Date(); adm.setDate(adm.getDate() - p.daysAgo)
    await supabase.from('admitted_patients').insert({ name: p.name, ward: p.ward, room: p.room, bed: p.bed, admission_date: adm.toISOString(), visitors_allowed: p.visitors_allowed, notes: p.notes })
  }
  console.log(`  ✅ ${patients.length} Admitted patients`)

  // ── Hospital Information ───────────────────────────────────────
  const info = [
    { key: 'About Mutare Provincial Hospital', value: 'Mutare Provincial Hospital is the main referral hospital for Manicaland Province, Zimbabwe. It provides comprehensive medical, surgical, maternity and specialist services to Mutare and surrounding districts.\n\nThe hospital serves over 500 outpatients daily across all major medical disciplines.', category: 'Provincial' },
    { key: 'Operating Hours', value: 'Outpatient (OPD): Monday–Friday, 08:00–17:00\nEmergency (A&E): 24 hours, 7 days a week\nPharmacy: Monday–Friday 08:00–17:00; Saturday 08:00–12:00\nLaboratory: Monday–Friday 07:30–17:30\nRadiology: Monday–Friday 07:30–17:00\nDental Clinic: Monday–Friday 08:00–16:00', category: 'Provincial' },
    { key: 'Payment Methods', value: 'Cash (USD preferred)\nZWL (ZiG) at current RBZ rate\nEcoCash: *151*2#\nOneMoney: *111#\nMedical Aid: CIMAS, PSMAS, First Mutual, GEFCO, Nicoz Diamond\nBank Transfer: CBZ, Stanbic, ZB Bank accepted\n\nPlease obtain a receipt for all payments.', category: 'Provincial' },
    { key: 'Parking & Access', value: 'Free parking at the main car park (front entrance).\nOverflow parking on the northern side of the grounds.\nVehicles must not block emergency access lanes.\nMain entrance is wheelchair accessible.', category: 'Provincial' },
    { key: 'Services Available', value: 'General Outpatient (OPD)\nAccident & Emergency (A&E) — 24/7\nInpatient Wards (Medical, Surgical, Orthopaedic, Paediatric, Maternity, ICU)\nSurgical Theatre\nMaternity Suite & Neonatal Unit\nPharmacy\nLaboratory & Pathology\nRadiology (X-Ray, Ultrasound, CT)\nDental & Oral Health\nOphthalmology (Eye Clinic)\nOrthopaedics & Physiotherapy\nMental Health Services\nHIV/AIDS Clinic\nTB (Tuberculosis) Clinic\nPMTCT (Prevention of Mother-to-Child Transmission)', category: 'Provincial' },
    { key: 'Visitor Policy — General Wards', value: 'Monday–Friday: 14:00–16:00\nWeekends & Public Holidays: 10:00–12:00 and 14:00–16:00\nMaximum 2 visitors per patient at a time.\nAll visitors must report to the ward nurses station on arrival.\nChildren under 12 generally not permitted.', category: 'visiting' },
    { key: 'Visitor Policy — ICU / Critical Care', value: '10:00–11:00 and 17:00–18:00 only\nMaximum 2 immediate family members at a time.\nPlease check with nursing station before entering.\nMobile phones must be switched off in ICU.', category: 'visiting' },
    { key: 'Visitor Policy — Maternity Ward', value: 'Partners: Allowed at any time during labour and postpartum\nOther family: 14:00–16:00 daily\nChildren under 12 not permitted (unless siblings of newborn with permission).\nHand sanitizer must be used before entering.', category: 'visiting' },
    { key: 'Visitor Policy — Paediatric Ward', value: 'Parents/guardians: 24/7 access — one parent may remain overnight\nOther visitors: 14:00–16:00 daily\nVisiting siblings must be accompanied by an adult.', category: 'visiting' },
    { key: 'Visitor Requirements', value: 'Valid photo ID required on request.\nHand sanitizer at every ward entrance — please use it.\nFace masks required in ICU, Maternity and Paediatric wards.\nOutside food permitted in general wards only.', category: 'visiting' },
    { key: 'Main Reception & Switchboard', value: 'Tel: +263 20 2064411 / +263 20 2064412\nOpen: Monday–Friday, 07:30–17:00\nAfter hours: A&E reception handles urgent enquiries.', category: 'contacts' },
    { key: 'Accident & Emergency (A&E)', value: 'Tel: +263 20 2064999\nOpen: 24 hours, 7 days a week\nDo not drive yourself in an emergency — call or ask someone to drive you.', category: 'contacts' },
    { key: 'Pharmacy', value: 'Tel: +263 20 2064222\nOpen: Monday–Friday 08:00–17:00; Saturday 08:00–12:00\nPresent prescription at dispensing window — allow 15–30 minutes.', category: 'contacts' },
    { key: 'Maternity Ward', value: 'Tel: +263 20 2064333\nOpen: 24/7 for admissions\nBirth registration: Records office 08:00–15:00 weekdays.', category: 'contacts' },
    { key: 'Laboratory', value: 'Tel: +263 20 2064444\nOpen: Monday–Friday 07:30–17:30\nRoutine results: same day or next morning\nUrgent results: 2–4 hours (notify lab on arrival)', category: 'contacts' },
    { key: 'Ambulance Services', value: 'Hospital: +263 20 2064911\nNational Emergency: 994 or 999\nAvailable 24/7 for life-threatening emergencies.', category: 'contacts' },
    { key: 'Social Welfare & Patient Services', value: 'Tel: +263 20 2064500\nAssistance for patients unable to pay, community support connections, and discharge transport assistance.', category: 'contacts' },
  ]

  for (const item of info) {
    await supabase.from('hospital_info').upsert({ key: item.key, value: item.value, category: item.category }, { onConflict: 'key' })
  }
  console.log(`  ✅ ${info.length} Hospital info entries`)

  // ── Location Pins ─────────────────────────────────────────────
  const pins = [
    { name: 'Main Entrance', category: 'entrance', description: 'Main hospital entrance — Reception and OPD registration inside', latitude: -18.9637, longitude: 32.6634, written_directions: 'You are at the main entrance.\nReception is straight ahead.\nOPD registration is to your left.', floor: 'Ground Floor', icon_name: 'entrance', is_active: true },
    { name: 'Accident & Emergency (A&E)', category: 'emergency', description: '24/7 Emergency care — all trauma and urgent cases', latitude: -18.9633, longitude: 32.6639, written_directions: 'From the main entrance, turn LEFT immediately.\nFollow the RED signs marked "A&E / Emergency".\nLarge red-marked doors on your right.', floor: 'Ground Floor', icon_name: 'emergency', is_active: true },
    { name: 'Main Pharmacy', category: 'pharmacy', description: 'Prescription dispensing and OTC medications', latitude: -18.9637, longitude: 32.6636, written_directions: 'From main entrance, walk past reception.\nAt the junction turn RIGHT.\nPharmacy is the second door on your left — look for the GREEN CROSS sign.', floor: 'Ground Floor', icon_name: 'pharmacy', is_active: true },
    { name: 'Laboratory & Pathology', category: 'lab', description: 'Blood tests, urine analysis and pathology', latitude: -18.9636, longitude: 32.6638, written_directions: 'From reception, go straight past the pharmacy corridor.\nAt the end of the corridor, turn LEFT.\nLaboratory is the second door on your right.', floor: 'Ground Floor', icon_name: 'lab', is_active: true },
    { name: 'Radiology / X-Ray', category: 'lab', description: 'X-Ray, CT, Ultrasound and imaging services', latitude: -18.9635, longitude: 32.6641, written_directions: 'From reception, walk past the pharmacy to the East Wing.\nFollow blue "Radiology" signs.\nAt the end of the East Wing.', floor: 'Ground Floor', icon_name: 'xray', is_active: true },
    { name: 'Paediatric Ward', category: 'ward', description: 'Child health ward — under 12', latitude: -18.9640, longitude: 32.6630, written_directions: 'From main entrance, take stairs or lift to 1st Floor.\nTurn LEFT at the top.\nPaediatric Ward is at the end of the corridor.', floor: '1st Floor', icon_name: 'ward', is_active: true },
    { name: 'Maternity Ward', category: 'ward', description: 'Maternity, labour and postnatal care', latitude: -18.9636, longitude: 32.6627, written_directions: 'Take lift or stairs to 2nd Floor (Block C).\nTurn RIGHT at the top.\nMaternity is through the double doors at the end of the corridor.', floor: '2nd Floor', icon_name: 'ward', is_active: true },
    { name: 'Male Toilets (Block A)', category: 'toilet', description: 'Male restrooms — main block', latitude: -18.9638, longitude: 32.6632, written_directions: 'From reception, walk down the main corridor.\nMale toilets on the LEFT — past the waiting area.', floor: 'Ground Floor', icon_name: 'toilet', is_active: true },
    { name: 'Female Toilets (Block A)', category: 'toilet', description: 'Female restrooms — main block', latitude: -18.9638, longitude: 32.6635, written_directions: 'From reception, walk down the main corridor.\nFemale toilets on the RIGHT — past the OPD waiting area.', floor: 'Ground Floor', icon_name: 'toilet', is_active: true },
    { name: 'Cafeteria', category: 'cafeteria', description: 'Meals, snacks and beverages — 07:00 to 19:00', latitude: -18.9642, longitude: 32.6629, written_directions: 'From main entrance, turn RIGHT and walk to the far end.\nCafeteria is in the free-standing blue building on the right.', floor: 'Ground Floor', icon_name: 'cafeteria', is_active: true },
    { name: 'ATM / Payment Point', category: 'atm', description: 'Cash withdrawal and bill payment — CBZ and Stanbic', latitude: -18.9636, longitude: 32.6633, written_directions: 'From main entrance, turn RIGHT immediately.\nATM is along the outer wall of the reception building.', floor: 'Ground Floor', icon_name: 'atm', is_active: true },
    { name: 'Parking Area', category: 'parking', description: 'Patient and visitor vehicle parking — free', latitude: -18.9630, longitude: 32.6631, written_directions: 'Main parking is in front of the hospital entrance.\nOverflow parking to the north of the main building.', floor: 'Outdoor', icon_name: 'parking', is_active: true },
    { name: 'Dental Clinic', category: 'clinic', description: 'Dental consultations, extractions and fillings', latitude: -18.9639, longitude: 32.6629, written_directions: 'From main entrance, turn LEFT down the corridor.\nDental Clinic is in Block B, Ground Floor — second door on the right.', floor: 'Ground Floor', icon_name: 'clinic', is_active: true },
    { name: 'Eye (Ophthalmology) Clinic', category: 'clinic', description: 'Eye examinations and treatments', latitude: -18.9640, longitude: 32.6632, written_directions: 'From main entrance, walk past reception to Block A, Ground Floor.\nOphthalmology Clinic is at the end of Block A.', floor: 'Ground Floor', icon_name: 'clinic', is_active: true },
    { name: 'AURA Kiosk (You Are Here)', category: 'kiosk', description: 'This AURA Digital Health Kiosk — main entrance lobby', latitude: -18.9637, longitude: 32.6634, written_directions: 'You are at the AURA Kiosk — inside the main entrance lobby.', floor: 'Ground Floor', icon_name: 'kiosk', is_active: true },
  ]
  const { error: pinErr } = await supabase.from('location_pins').insert(pins)
  if (pinErr) console.warn('Pins:', pinErr.message)
  else console.log(`  ✅ ${pins.length} Location pins`)

  console.log('\n🎉 Seed complete — Mutare Provincial Hospital!')
  console.log('   Admin:  admin@aura.hospital / password123')
  console.log('   All doctors: password123')
}

main().catch(e => { console.error(e); process.exit(1) })
