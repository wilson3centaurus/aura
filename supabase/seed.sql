-- ============================================================
-- AURA Hospital System — Seed Data
-- Run this AFTER schema.sql in the Supabase SQL Editor
-- ============================================================

-- NOTE: The password hash below is bcrypt of 'Wilson2003'
-- Admin password: Wilson2003
-- Doctor default password: doctor123

-- ─── Admin User ───
insert into users (id, email, password, name, role) values
('00000000-0000-0000-0000-000000000001',
 'admin@mutareprovincial.co.zw',
 '$2a$10$xp9bWknU2g6cbvbR/2ib0OiySzaUXVm.MkYYSI7zSK77EHl.V0NKy',
 'System Administrator',
 'ADMIN')
on conflict (email) do nothing;

-- ─── Departments ───
insert into departments (id, name, location, floor, description, open_time, close_time, icon) values
('d0000000-0000-0000-0000-000000000001', 'Emergency Department',     'Block A', 'Ground Floor', 'Emergency and trauma care',                    '00:00', '23:59', 'emergency'),
('d0000000-0000-0000-0000-000000000002', 'Outpatient Department',    'Block B', 'Ground Floor', 'General outpatient consultations',              '07:00', '17:00', 'outpatient'),
('d0000000-0000-0000-0000-000000000003', 'Maternity Ward',           'Block C', '1st Floor',    'Maternal and newborn care',                     '00:00', '23:59', 'maternity'),
('d0000000-0000-0000-0000-000000000004', 'Surgical Ward',            'Block D', '2nd Floor',    'Pre and post-operative care',                   '06:00', '20:00', 'surgery'),
('d0000000-0000-0000-0000-000000000005', 'Paediatric Ward',          'Block C', '2nd Floor',    'Children''s healthcare services',               '00:00', '23:59', 'pediatrics'),
('d0000000-0000-0000-0000-000000000006', 'Pharmacy',                 'Block A', 'Ground Floor', 'Medication dispensary',                         '07:30', '17:00', 'pharmacy'),
('d0000000-0000-0000-0000-000000000007', 'Laboratory',               'Block B', '1st Floor',    'Diagnostic and pathology services',             '07:00', '17:00', 'lab'),
('d0000000-0000-0000-0000-000000000008', 'Radiology',                'Block D', 'Ground Floor', 'X-ray, ultrasound, and imaging services',       '07:00', '17:00', 'radiology')
on conflict (name) do nothing;

-- ─── Wards ───
insert into wards (id, name, floor, ward_type, nurse_in_charge, total_beds) values
('a0000000-0000-0000-0000-000000000001', 'Male Medical Ward',       'Ground Floor', 'Medical',    'Sister Moyo',     30),
('a0000000-0000-0000-0000-000000000002', 'Female Medical Ward',     '1st Floor',    'Medical',    'Sister Ndlovu',   30),
('a0000000-0000-0000-0000-000000000003', 'Maternity Ward',          '1st Floor',    'Maternity',  'Sister Chikwava', 20),
('a0000000-0000-0000-0000-000000000004', 'Surgical Ward',           '2nd Floor',    'Surgical',   'Sister Mlambo',   24),
('a0000000-0000-0000-0000-000000000005', 'Paediatric Ward',         '2nd Floor',    'Paediatric', 'Sister Dube',     20),
('a0000000-0000-0000-0000-000000000006', 'ICU',                     'Ground Floor', 'Intensive',  'Sister Phiri',    8)
on conflict (name) do nothing;

-- ─── Beds (generate beds for each ward) ───
-- Male Medical Ward (30 beds)
insert into beds (ward_id, bed_number) select 'a0000000-0000-0000-0000-000000000001', 'M' || generate_series(1, 30);
-- Female Medical Ward (30 beds)
insert into beds (ward_id, bed_number) select 'a0000000-0000-0000-0000-000000000002', 'F' || generate_series(1, 30);
-- Maternity Ward (20 beds)
insert into beds (ward_id, bed_number) select 'a0000000-0000-0000-0000-000000000003', 'MAT' || generate_series(1, 20);
-- Surgical Ward (24 beds)
insert into beds (ward_id, bed_number) select 'a0000000-0000-0000-0000-000000000004', 'S' || generate_series(1, 24);
-- Paediatric Ward (20 beds)
insert into beds (ward_id, bed_number) select 'a0000000-0000-0000-0000-000000000005', 'P' || generate_series(1, 20);
-- ICU (8 beds)
insert into beds (ward_id, bed_number) select 'a0000000-0000-0000-0000-000000000006', 'ICU' || generate_series(1, 8);

-- ─── Doctor Users + Doctor Records ───
-- Password for all doctors: their ID number (lowercase). For seed we use 'doctor123' hashed.
-- In production, admin creates doctors with email as username and ID as password.

insert into users (id, email, password, name, role) values
('b0000000-0000-0000-0000-000000000002', 'dmoyo@mutareprovincial.co.zw',    '$2a$10$I0urnm.RbnW0peyib6clYuPqr98.5yzv0BBevCAchT6jLUA4SznD6', 'Dr. Tendai Moyo',     'DOCTOR'),
('b0000000-0000-0000-0000-000000000003', 'nchirwa@mutareprovincial.co.zw',  '$2a$10$I0urnm.RbnW0peyib6clYuPqr98.5yzv0BBevCAchT6jLUA4SznD6', 'Dr. Nyasha Chirwa',   'DOCTOR'),
('b0000000-0000-0000-0000-000000000004', 'tmutasa@mutareprovincial.co.zw',  '$2a$10$I0urnm.RbnW0peyib6clYuPqr98.5yzv0BBevCAchT6jLUA4SznD6', 'Dr. Tariro Mutasa',   'DOCTOR'),
('b0000000-0000-0000-0000-000000000005', 'cmaposa@mutareprovincial.co.zw',  '$2a$10$I0urnm.RbnW0peyib6clYuPqr98.5yzv0BBevCAchT6jLUA4SznD6', 'Dr. Chipo Maposa',    'DOCTOR'),
('b0000000-0000-0000-0000-000000000006', 'kndlovu@mutareprovincial.co.zw',  '$2a$10$I0urnm.RbnW0peyib6clYuPqr98.5yzv0BBevCAchT6jLUA4SznD6', 'Dr. Kudzai Ndlovu',   'DOCTOR'),
('b0000000-0000-0000-0000-000000000007', 'szvidzai@mutareprovincial.co.zw', '$2a$10$I0urnm.RbnW0peyib6clYuPqr98.5yzv0BBevCAchT6jLUA4SznD6', 'Dr. Shamiso Zvidzai', 'DOCTOR'),
('b0000000-0000-0000-0000-000000000008', 'rgarwe@mutareprovincial.co.zw',   '$2a$10$I0urnm.RbnW0peyib6clYuPqr98.5yzv0BBevCAchT6jLUA4SznD6', 'Dr. Rumbidzai Garwe', 'DOCTOR'),
('b0000000-0000-0000-0000-000000000009', 'fmacheka@mutareprovincial.co.zw', '$2a$10$I0urnm.RbnW0peyib6clYuPqr98.5yzv0BBevCAchT6jLUA4SznD6', 'Dr. Farai Macheka',   'DOCTOR'),
('b0000000-0000-0000-0000-000000000010', 'bngoni@mutareprovincial.co.zw',   '$2a$10$I0urnm.RbnW0peyib6clYuPqr98.5yzv0BBevCAchT6jLUA4SznD6', 'Dr. Blessing Ngoni',  'DOCTOR'),
('b0000000-0000-0000-0000-000000000011', 'lchamu@mutareprovincial.co.zw',   '$2a$10$I0urnm.RbnW0peyib6clYuPqr98.5yzv0BBevCAchT6jLUA4SznD6', 'Dr. Loveness Chamu',  'DOCTOR')
on conflict (email) do nothing;

insert into doctors (id, user_id, specialty, department_id, status, room_number, phone) values
('dc000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'General Practice',      'd0000000-0000-0000-0000-000000000002', 'AVAILABLE', 'OPD-1',  '+263771000001'),
('dc000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'Emergency Medicine',    'd0000000-0000-0000-0000-000000000001', 'AVAILABLE', 'ER-1',   '+263771000002'),
('dc000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'Obstetrics/Gynaecology','d0000000-0000-0000-0000-000000000003', 'AVAILABLE', 'MAT-1',  '+263771000003'),
('dc000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 'Paediatrics',           'd0000000-0000-0000-0000-000000000005', 'AVAILABLE', 'PAED-1', '+263771000004'),
('dc000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000006', 'Surgery',               'd0000000-0000-0000-0000-000000000004', 'AVAILABLE', 'SURG-1', '+263771000005'),
('dc000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000007', 'Internal Medicine',     'd0000000-0000-0000-0000-000000000002', 'OFFLINE',   'OPD-2',  '+263771000006'),
('dc000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000008', 'Radiology',             'd0000000-0000-0000-0000-000000000008', 'AVAILABLE', 'RAD-1',  '+263771000007'),
('dc000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000009', 'Pathology',             'd0000000-0000-0000-0000-000000000007', 'AVAILABLE', 'LAB-1',  '+263771000008'),
('dc000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000010', 'Pharmacy',              'd0000000-0000-0000-0000-000000000006', 'ON_BREAK',  'PHR-1',  '+263771000009'),
('dc000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000011', 'General Practice',      'd0000000-0000-0000-0000-000000000002', 'AVAILABLE', 'OPD-3',  '+263771000010')
on conflict do nothing;

-- ─── Medications ───
insert into medications (name, form, dosage, price, in_stock, quantity, prescription_required, category, icon) values
('Paracetamol',            'Tablet',    '500mg',   0.50,  true,  500,  false, 'Pain Relief',       'pill'),
('Ibuprofen',              'Tablet',    '400mg',   0.75,  true,  300,  false, 'Pain Relief',       'pill'),
('Amoxicillin',            'Capsule',   '500mg',   1.50,  true,  200,  true,  'Antibiotics',       'capsule'),
('Metformin',              'Tablet',    '500mg',   1.00,  true,  400,  true,  'Diabetes',          'pill'),
('Amlodipine',             'Tablet',    '5mg',     2.00,  true,  250,  true,  'Cardiovascular',    'heart'),
('Omeprazole',             'Capsule',   '20mg',    1.25,  true,  350,  true,  'Gastrointestinal',  'capsule'),
('Ciprofloxacin',          'Tablet',    '500mg',   2.50,  true,  150,  true,  'Antibiotics',       'pill'),
('Diazepam',               'Tablet',    '5mg',     3.00,  true,  80,   true,  'Neurological',      'pill'),
('Salbutamol Inhaler',     'Inhaler',   '100mcg',  5.00,  true,  100,  true,  'Respiratory',       'inhaler'),
('Oral Rehydration Salts', 'Sachet',    '200ml',   0.25,  true,  1000, false, 'Gastrointestinal',  'sachet'),
('Ferrous Sulphate',       'Tablet',    '200mg',   0.30,  true,  600,  false, 'Supplements',       'pill'),
('Cotrimoxazole',          'Tablet',    '960mg',   0.80,  true,  300,  true,  'Antibiotics',       'pill'),
('Quinine',                'Injection', '600mg/2ml', 4.00, true, 50,   true,  'Antimalarials',     'syringe'),
('ARV (TLD)',              'Tablet',    'Fixed-dose', 0.00, true, 500, true,  'Antiretrovirals',   'pill')
on conflict do nothing;

-- ─── Fees ───
insert into fees (service, category, price, description, icon) values
('General Consultation',     'Consultation',  5.00,   'Standard OPD consultation',          'stethoscope'),
('Specialist Consultation',  'Consultation',  15.00,  'Specialist referral consultation',    'user-doctor'),
('Emergency Consultation',   'Emergency',     25.00,  'Emergency department visit',          'ambulance'),
('X-Ray',                    'Diagnostics',   10.00,  'Basic X-ray imaging',                'x-ray'),
('Ultrasound',               'Diagnostics',   20.00,  'Ultrasound scan',                    'wave'),
('Blood Test (Full)',        'Laboratory',    8.00,   'Full blood count',                   'vial'),
('Blood Test (HIV)',         'Laboratory',    0.00,   'HIV testing (free)',                  'vial'),
('Urinalysis',               'Laboratory',    3.00,   'Urine examination',                  'flask'),
('Maternity Package',        'Maternity',     30.00,  'Basic maternity/delivery package',   'baby'),
('Caesar Section',           'Maternity',     100.00, 'Caesarean section delivery',          'scalpel'),
('Minor Surgery',            'Surgery',       50.00,  'Minor surgical procedure',            'scalpel'),
('Major Surgery',            'Surgery',       200.00, 'Major surgical procedure',            'scalpel'),
('Ward Bed (per day)',       'Admission',     10.00,  'General ward bed per day',            'bed'),
('ICU Bed (per day)',        'Admission',     50.00,  'Intensive care unit bed per day',     'bed'),
('Dental Extraction',        'Dental',        8.00,   'Tooth extraction',                    'tooth'),
('Dental Filling',           'Dental',        12.00,  'Tooth filling',                       'tooth'),
('Eye Examination',          'Ophthalmology', 10.00,  'Basic eye examination',               'eye'),
('Physiotherapy Session',    'Rehabilitation', 15.00, 'Physiotherapy per session',            'person-walking'),
('Ambulance (within city)',  'Transport',     20.00,  'Ambulance service within Mutare',     'ambulance'),
('Mortuary (per day)',       'Mortuary',      5.00,   'Mortuary services per day',           'building'),
('Medical Certificate',      'Admin',         3.00,   'Medical certificate issuance',        'file-medical'),
('Death Certificate',        'Admin',         2.00,   'Death certificate issuance',          'file'),
('Birth Certificate',        'Admin',         2.00,   'Birth notification',                  'file')
on conflict do nothing;

-- ─── Admitted Patients ───
insert into admitted_patients (name, ward, room, bed, status, visitors_allowed, notes) values
('John Mutasa',      'Male Medical Ward',   'Block A, Room 3', 'M5',   'ADMITTED',   true,  'Recovering from pneumonia'),
('Mary Chirwa',      'Female Medical Ward', 'Block B, Room 1', 'F12',  'ADMITTED',   true,  'Post-operative recovery'),
('Tendai Moyo',      'Maternity Ward',      'Block C, Room 4', 'MAT3', 'ADMITTED',   true,  'Awaiting delivery'),
('Peter Ndlovu',     'Surgical Ward',       'Block D, Room 2', 'S8',   'ADMITTED',   false, 'Post major surgery - no visitors'),
('Grace Maposa',     'Paediatric Ward',     'Block C, Room 6', 'P2',   'ADMITTED',   true,  'Malaria treatment, age 6'),
('Robert Dube',      'ICU',                 'ICU',             'ICU1', 'ADMITTED',   false, 'Critical care - severe accident')
on conflict do nothing;

-- ─── Hospital Info ───
insert into hospital_info (key, value, category) values
('hospital_name',    'Mutare Provincial Hospital',           'general'),
('address',          'Christmas Pass Rd, Mutare, Zimbabwe',  'general'),
('phone',            '+263 20 2060051',                      'contact'),
('email',            'info@mutareprovincial.co.zw',          'contact'),
('emergency_phone',  '+263 20 2060099',                      'contact'),
('visiting_hours',   'Mon-Fri 14:00-16:00, Sat-Sun 10:00-12:00 & 14:00-16:00', 'visiting'),
('visiting_rules',   'Max 2 visitors per patient. No children under 12. No food from outside.', 'visiting'),
('about',            'Mutare Provincial Hospital is a government referral hospital serving the Manicaland province of Zimbabwe. Established in 1920, it provides comprehensive medical services.', 'general'),
('bed_capacity',     '350',                                  'capacity'),
('departments_count','8',                                    'capacity'),
('doctors_count',    '10',                                   'capacity'),
('parking',          'Free parking available at main entrance and Block D', 'facilities'),
('wifi',             'Free Wi-Fi available in waiting areas',  'facilities'),
('chapel',           'Chapel located in Block A, 1st Floor',   'facilities')
on conflict (key) do nothing;

-- ─── Location Pins (Mutare Provincial Hospital area) ───
insert into location_pins (name, category, description, latitude, longitude, written_directions, floor, icon_name) values
('Main Entrance',           'entrance',    'Main hospital entrance',                     -18.9706, 32.6546, 'Enter from Christmas Pass Road, main gate', 'Ground Floor', 'entrance'),
('Emergency Department',    'department',  'Emergency and trauma center',                -18.9708, 32.6544, 'From main gate, turn left, red signs',       'Ground Floor', 'emergency'),
('Outpatient Department',   'department',  'General outpatient consultations',            -18.9705, 32.6548, 'From main gate, straight ahead, Block B',    'Ground Floor', 'outpatient'),
('Maternity Ward',          'department',  'Maternal and newborn care',                   -18.9703, 32.6542, 'Block C, 1st Floor, follow blue signs',      '1st Floor',    'maternity'),
('Pharmacy',                'facility',    'Medication dispensary',                       -18.9707, 32.6545, 'Block A, Ground Floor, near entrance',       'Ground Floor', 'pharmacy'),
('Laboratory',              'facility',    'Diagnostic and pathology services',           -18.9704, 32.6549, 'Block B, 1st Floor, take stairs/lift',       '1st Floor',    'lab'),
('Radiology',               'facility',    'X-ray and imaging',                           -18.9709, 32.6547, 'Block D, Ground Floor, follow signs',        'Ground Floor', 'radiology'),
('Parking Area',            'facility',    'Free visitor parking',                        -18.9712, 32.6550, 'Available at main entrance',                 'Ground Floor', 'parking'),
('Chapel',                  'facility',    'Hospital chapel for prayer and reflection',   -18.9706, 32.6543, 'Block A, 1st Floor',                         '1st Floor',    'chapel'),
('Cafeteria',               'facility',    'Hospital cafeteria',                          -18.9710, 32.6548, 'Block B, Ground Floor, behind OPD',          'Ground Floor', 'restaurant'),
('Administration',          'admin',       'Hospital administration offices',             -18.9704, 32.6546, 'Block A, 2nd Floor',                         '2nd Floor',    'admin')
on conflict do nothing;

-- ─── Queue Entries (sample) ───
insert into queue_entries (ticket_number, patient_name, department_id, status, priority, symptoms) values
(1, 'Tatenda Muzorewa', 'd0000000-0000-0000-0000-000000000002', 'WAITING',     'ROUTINE',   'Headache and fever'),
(2, 'Rumbidzai Nyathi', 'd0000000-0000-0000-0000-000000000002', 'WAITING',     'ROUTINE',   'Chronic cough'),
(3, 'Simba Chikwanha',  'd0000000-0000-0000-0000-000000000001', 'IN_PROGRESS', 'EMERGENCY', 'Severe chest pain'),
(4, 'Anesu Gumbo',      'd0000000-0000-0000-0000-000000000006', 'WAITING',     'ROUTINE',   'Prescription refill')
on conflict do nothing;
