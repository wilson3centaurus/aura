SELECT 'doctors' AS tbl, COUNT(*)::text AS cnt FROM aura.doctors
UNION ALL SELECT 'departments', COUNT(*)::text FROM aura.departments
UNION ALL SELECT 'location_pins', COUNT(*)::text FROM aura.location_pins
UNION ALL SELECT 'fees', COUNT(*)::text FROM aura.fees
UNION ALL SELECT 'hospital_info', COUNT(*)::text FROM aura.hospital_info
UNION ALL SELECT 'medications', COUNT(*)::text FROM aura.medications
UNION ALL SELECT 'wards', COUNT(*)::text FROM aura.wards
UNION ALL SELECT 'admitted_patients', COUNT(*)::text FROM aura.admitted_patients
UNION ALL SELECT 'users', COUNT(*)::text FROM aura.users;
