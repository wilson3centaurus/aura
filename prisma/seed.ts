import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding AURA database...')

  // Clear existing data
  await prisma.queueEntry.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.doctor.deleteMany()
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()
  await prisma.medication.deleteMany()
  await prisma.fee.deleteMany()
  await prisma.admittedPatient.deleteMany()
  await prisma.hospitalInfo.deleteMany()

  // --- Clear LocationPins too ---
  await prisma.locationPin.deleteMany()

  const hashedPassword = await bcrypt.hash('password123', 10)

  // --- Admin Users ---
  const admin = await prisma.user.create({
    data: { name: 'System Admin', email: 'admin@aura.hospital', password: hashedPassword, role: 'ADMIN' },
  })
  console.log('  ✅ Admin created: admin@aura.hospital / password123')

  // --- Departments ---
  const deptProvincial = await prisma.department.create({
    data: { name: 'Provincial Practice', location: 'Main Block, Ground Floor', floor: 'Ground', description: 'Provincial consultations and primary care' },
  })
  const deptEmergency = await prisma.department.create({
    data: { name: 'Emergency Department', location: 'Main Block, Ground Floor', floor: 'Ground', description: 'Emergency and trauma care', openTime: '00:00', closeTime: '23:59' },
  })
  const deptPediatrics = await prisma.department.create({
    data: { name: 'Pediatrics', location: 'Block B, 1st Floor', floor: '1st', description: 'Child health services' },
  })
  const deptMaternity = await prisma.department.create({
    data: { name: 'Maternity Ward', location: 'Block C, 2nd Floor', floor: '2nd', description: 'Maternity and prenatal care', openTime: '00:00', closeTime: '23:59' },
  })
  const deptInternal = await prisma.department.create({
    data: { name: 'Internal Medicine', location: 'Block A, 1st Floor', floor: '1st', description: 'Internal medicine and chronic conditions' },
  })
  const deptSurgery = await prisma.department.create({
    data: { name: 'Surgery', location: 'Block D, 3rd Floor', floor: '3rd', description: 'Surgical services' },
  })
  const deptRadiology = await prisma.department.create({
    data: { name: 'Radiology', location: 'East Wing, Ground Floor', floor: 'Ground', description: 'X-Ray, CT, MRI imaging' },
  })
  const deptDental = await prisma.department.create({
    data: { name: 'Dental', location: 'Block B, Ground Floor', floor: 'Ground', description: 'Dental and oral health' },
  })
  console.log('  ✅ 8 Departments created')

  // --- Doctors ---
  const doctorsData = [
    { name: 'Tatenda Moyo', email: 'moyo@aura.hospital', specialty: 'Provincial Practitioner', departmentId: deptProvincial.id, roomNumber: 'G-12', status: 'AVAILABLE' },
    { name: 'Natalie Chikwanha', email: 'dr.chikwanha@aura.hospital', specialty: 'Internal Medicine', departmentId: deptInternal.id, roomNumber: '1-05', status: 'AVAILABLE' },
    { name: 'James Ncube', email: 'dr.ncube@aura.hospital', specialty: 'Cardiologist', departmentId: deptInternal.id, roomNumber: '1-08', status: 'BUSY' },
    { name: 'Grace Mutasa', email: 'mutasa@aura.hospital', specialty: 'Pediatrician', departmentId: deptPediatrics.id, roomNumber: '1-15', status: 'AVAILABLE' },
    { name: 'Peter Zhou', email: 'zhou@aura.hospital', specialty: 'Pediatrician', departmentId: deptPediatrics.id, roomNumber: '1-16', status: 'ON_BREAK' },
    { name: 'Sarah Mlambo', email: 'mlambo@aura.hospital', specialty: 'Obstetrician', departmentId: deptMaternity.id, roomNumber: '2-01', status: 'AVAILABLE' },
    { name: 'David Chirara', email: 'chirara@aura.hospital', specialty: 'Provincial Surgeon', departmentId: deptSurgery.id, roomNumber: '3-10', status: 'BUSY' },
    { name: 'Ruth Nkomo', email: 'nkomo@aura.hospital', specialty: 'Radiologist', departmentId: deptRadiology.id, roomNumber: 'G-20', status: 'AVAILABLE' },
    { name: 'Emmanuel Sithole', email: 'dr.sithole@aura.hospital', specialty: 'Emergency Medicine', departmentId: deptEmergency.id, roomNumber: 'ER-1', status: 'AVAILABLE' },
    { name: 'Florence Dube', email: 'dr.dube@aura.hospital', specialty: 'Dentist', departmentId: deptDental.id, roomNumber: 'G-25', status: 'AVAILABLE' },
  ]

  for (const doc of doctorsData) {
    await prisma.user.create({
      data: {
        name: doc.name,
        email: doc.email,
        password: hashedPassword,
        role: 'DOCTOR',
        doctor: {
          create: {
            specialty: doc.specialty,
            departmentId: doc.departmentId,
            roomNumber: doc.roomNumber,
            status: doc.status,
          },
        },
      },
    })
  }
  console.log('  ✅ 10 Doctors created (all passwords: password123)')

  // --- Medications ---
  const medicationsData = [
    { name: 'Paracetamol', form: 'Tablets', dosage: '500mg', price: 0.50, quantity: 500, prescriptionRequired: false, category: 'Pain Relief' },
    { name: 'Paracetamol', form: 'Syrup', dosage: '120mg/5ml', price: 2.00, quantity: 100, prescriptionRequired: false, category: 'Pain Relief' },
    { name: 'Ibuprofen', form: 'Tablets', dosage: '400mg', price: 1.00, quantity: 300, prescriptionRequired: false, category: 'Pain Relief' },
    { name: 'Amoxicillin', form: 'Capsules', dosage: '500mg', price: 3.50, quantity: 200, prescriptionRequired: true, category: 'Antibiotics' },
    { name: 'Azithromycin', form: 'Tablets', dosage: '500mg', price: 5.00, quantity: 150, prescriptionRequired: true, category: 'Antibiotics' },
    { name: 'Metformin', form: 'Tablets', dosage: '500mg', price: 2.50, quantity: 400, prescriptionRequired: true, category: 'Diabetes' },
    { name: 'Amlodipine', form: 'Tablets', dosage: '5mg', price: 4.00, quantity: 250, prescriptionRequired: true, category: 'Blood Pressure' },
    { name: 'Losartan', form: 'Tablets', dosage: '50mg', price: 3.00, quantity: 180, prescriptionRequired: true, category: 'Blood Pressure' },
    { name: 'Omeprazole', form: 'Capsules', dosage: '20mg', price: 2.00, quantity: 300, prescriptionRequired: false, category: 'Stomach' },
    { name: 'Cetirizine', form: 'Tablets', dosage: '10mg', price: 1.50, quantity: 200, prescriptionRequired: false, category: 'Allergy' },
    { name: 'Salbutamol', form: 'Inhaler', dosage: '100mcg', price: 8.00, quantity: 50, prescriptionRequired: true, category: 'Respiratory' },
    { name: 'ORS Sachets', form: 'Sachets', dosage: '20.5g', price: 0.30, quantity: 1000, prescriptionRequired: false, category: 'Rehydration' },
    { name: 'Diclofenac', form: 'Tablets', dosage: '50mg', price: 1.50, quantity: 0, prescriptionRequired: true, category: 'Pain Relief', inStock: false },
    { name: 'Ciprofloxacin', form: 'Tablets', dosage: '500mg', price: 4.50, quantity: 0, prescriptionRequired: true, category: 'Antibiotics', inStock: false },
  ]

  for (const med of medicationsData) {
    await prisma.medication.create({
      data: {
        name: med.name,
        form: med.form,
        dosage: med.dosage,
        price: med.price,
        quantity: med.quantity,
        inStock: med.inStock !== undefined ? med.inStock : med.quantity > 0,
        prescriptionRequired: med.prescriptionRequired,
        category: med.category,
      },
    })
  }
  console.log('  ✅ 14 Medications created')

  // --- Fees ---
  const feesData = [
    { service: 'Provincial Consultation', category: 'Consultation', price: 10.00, description: 'Standard GP visit' },
    { service: 'Specialist Consultation', category: 'Consultation', price: 25.00, description: 'Specialist doctor visit' },
    { service: 'Emergency Consultation', category: 'Consultation', price: 30.00, description: '24/7 emergency care' },
    { service: 'Follow-up Visit', category: 'Consultation', price: 5.00, description: 'Return visit within 2 weeks' },
    { service: 'Chest X-Ray', category: 'Radiology', price: 18.00 },
    { service: 'Bone X-Ray (single)', category: 'Radiology', price: 15.00 },
    { service: 'Bone X-Ray (multiple)', category: 'Radiology', price: 35.00 },
    { service: 'Dental X-Ray', category: 'Radiology', price: 20.00 },
    { service: 'Ultrasound', category: 'Radiology', price: 25.00 },
    { service: 'Blood Test (Basic)', category: 'Laboratory', price: 8.00, description: 'FBC, blood sugar' },
    { service: 'Blood Test (Full Panel)', category: 'Laboratory', price: 20.00, description: 'Comprehensive blood work' },
    { service: 'Urine Test', category: 'Laboratory', price: 5.00 },
    { service: 'HIV Test', category: 'Laboratory', price: 0.00, description: 'Free testing available' },
    { service: 'Malaria Test', category: 'Laboratory', price: 3.00 },
    { service: 'Normal Delivery', category: 'Maternity', price: 50.00 },
    { service: 'Caesarean Section', category: 'Maternity', price: 200.00 },
    { service: 'Prenatal Check-up', category: 'Maternity', price: 8.00 },
    { service: 'Tooth Extraction', category: 'Dental', price: 15.00 },
    { service: 'Dental Filling', category: 'Dental', price: 20.00 },
    { service: 'Dental Cleaning', category: 'Dental', price: 12.00 },
    { service: 'Minor Surgery', category: 'Surgery', price: 100.00 },
    { service: 'Ward Bed (per day)', category: 'Admission', price: 15.00 },
    { service: 'Private Room (per day)', category: 'Admission', price: 40.00 },
  ]

  for (const fee of feesData) {
    await prisma.fee.create({
      data: { service: fee.service, category: fee.category, price: fee.price, description: fee.description || null },
    })
  }
  console.log('  ✅ 23 Fee items created')

  // --- Admitted Patients ---
  const patientsData = [
    { name: 'Mai Sedze', ward: 'Female Medical Ward B', room: '204', bed: '3', daysAgo: 3, visitorsAllowed: true },
    { name: 'James Sedze', ward: 'Male Surgical Ward', room: '305', bed: '1', daysAgo: 1, visitorsAllowed: true },
    { name: 'Tendai Mapfumo', ward: 'Male Medical Ward A', room: '102', bed: '2', daysAgo: 5, visitorsAllowed: true },
    { name: 'Chipo Nziramasanga', ward: 'Maternity Ward', room: '201', bed: '1', daysAgo: 0, visitorsAllowed: true, notes: 'Delivered healthy baby girl' },
    { name: 'Kudzai Moyo', ward: 'Pediatric Ward', room: '110', bed: '4', daysAgo: 2, visitorsAllowed: true, notes: 'Malaria treatment, improving' },
    { name: 'Farai Chikowero', ward: 'ICU', room: 'ICU-3', bed: '1', daysAgo: 4, visitorsAllowed: false, notes: 'Post-surgery, restricted visitors' },
  ]

  for (const p of patientsData) {
    const admDate = new Date()
    admDate.setDate(admDate.getDate() - p.daysAgo)
    await prisma.admittedPatient.create({
      data: {
        name: p.name,
        ward: p.ward,
        room: p.room,
        bed: p.bed,
        admissionDate: admDate,
        visitorsAllowed: p.visitorsAllowed,
        notes: p.notes || null,
      },
    })
  }
  console.log('  ✅ 6 Admitted patients created')

  // --- Hospital Information ---
  const infoData = [
    { key: 'About the Hospital', value: 'Parirenyatwa Hospital is one of Zimbabwe\'s largest referral hospitals, offering comprehensive medical services across all specialties.', category: 'Provincial' },
    { key: 'Operating Hours', value: 'Outpatient Services: Monday - Friday, 8:00 AM - 5:00 PM\nEmergency Department: 24/7\nPharmacy: Monday - Friday, 8:00 AM - 5:00 PM\nLaboratory: Monday - Friday, 7:30 AM - 5:30 PM', category: 'Provincial' },
    { key: 'Payment Methods', value: 'Cash (USD & ZWL)\nEcoCash / OneMoney\nMedical Aid (CIMAS, PSMAS, First Mutual, etc.)\nBank Transfer', category: 'Provincial' },
    { key: 'Parking', value: 'Free parking available at the main entrance. Overflow parking in the east lot. Please do not park in emergency access lanes.', category: 'Provincial' },
    { key: 'Provincial Wards', value: 'Monday - Friday: 2:00 PM - 4:00 PM\nWeekends & Holidays: 10:00 AM - 12:00 PM, 2:00 PM - 4:00 PM\nMaximum 2 visitors per patient at a time.', category: 'visiting' },
    { key: 'ICU / Critical Care', value: '10:00 AM - 11:00 AM, 5:00 PM - 6:00 PM\nMaximum 2 visitors at a time.\nPlease check with nursing station before entering.', category: 'visiting' },
    { key: 'Maternity Ward', value: 'Partners: Anytime access\nOther visitors: 2:00 PM - 4:00 PM\nChildren under 12 not permitted.', category: 'visiting' },
    { key: 'Pediatric Ward', value: 'Parents: 24/7 access (one parent may stay overnight)\nOther visitors: 2:00 PM - 4:00 PM', category: 'visiting' },
    { key: 'Visitor Requirements', value: 'Valid photo ID required for all visitors.\nHand sanitizer must be used on entry.\nFace masks may be required in certain wards.', category: 'visiting' },
    { key: 'Main Reception', value: 'Tel: +263 4 701 111\nOpen: Monday - Friday, 7:30 AM - 5:00 PM', category: 'contacts' },
    { key: 'Emergency Department', value: 'Tel: +263 4 701 999\nOpen: 24/7', category: 'contacts' },
    { key: 'Pharmacy', value: 'Tel: +263 4 701 222\nOpen: Monday - Friday, 8:00 AM - 5:00 PM', category: 'contacts' },
    { key: 'Maternity Ward Contact', value: 'Tel: +263 4 701 333\nOpen: 24/7', category: 'contacts' },
    { key: 'Ambulance Services', value: 'Tel: +263 4 701 911\nAvailable 24/7 for emergencies.', category: 'contacts' },
  ]

  for (const info of infoData) {
    await prisma.hospitalInfo.upsert({ where: { key: info.key }, update: info, create: info })
  }
  console.log('  ✅ 14 Hospital info entries created')

  // --- Sample Queue Entries ---
  const doctors = await prisma.doctor.findMany()
  const gpDoctor = doctors.find((d: { specialty: string }) => d.specialty === 'Provincial Practitioner')
  const pedDoctor = doctors.find((d: { specialty: string }) => d.specialty === 'Pediatrician')

  if (gpDoctor) {
    await prisma.queueEntry.create({
      data: { ticketNumber: 1, patientName: 'Takudzwa Banda', departmentId: deptProvincial.id, doctorId: gpDoctor.id, status: 'IN_PROGRESS', priority: 'ROUTINE' },
    })
    await prisma.queueEntry.create({
      data: { ticketNumber: 2, patientName: 'Memory Chisaira', departmentId: deptProvincial.id, doctorId: gpDoctor.id, status: 'WAITING', priority: 'ROUTINE' },
    })
    await prisma.queueEntry.create({
      data: { ticketNumber: 3, patientName: 'Blessing Nyathi', departmentId: deptProvincial.id, doctorId: gpDoctor.id, status: 'WAITING', priority: 'URGENT' },
    })
  }
  if (pedDoctor) {
    await prisma.queueEntry.create({
      data: { ticketNumber: 4, patientName: 'Mai Takudzwa (child)', departmentId: deptPediatrics.id, doctorId: pedDoctor.id, status: 'WAITING', priority: 'ROUTINE' },
    })
  }
  console.log('  ✅ 4 Sample queue entries created')

  // --- Default Location Pins for Mutare Provincial Hospital ---
  // Coordinates approximate — admin should refine via Map Management tool
  const locationPinsData = [
    {
      name: 'Main Entrance',       category: 'entrance',  description: 'Main hospital entrance — reception desk inside',
      latitude: -18.97180,         longitude: 32.67030,
      writtenDirections: 'You are here at the main entrance.\nThe reception desk is straight ahead as you enter.',
      floor: 'Ground Floor', iconName: 'entrance',
    },
    {
      name: 'Emergency Department', category: 'emergency', description: '24/7 Emergency care & trauma',
      latitude: -18.97150,          longitude: 32.67060,
      writtenDirections: 'From the main entrance, turn LEFT.\nFollow the red EMERGENCY signs.\nThe emergency entrance is the large red-marked doors on your right.',
      floor: 'Ground Floor', iconName: 'emergency',
    },
    {
      name: 'Main Pharmacy',        category: 'pharmacy',  description: 'Prescription & over-the-counter medications',
      latitude: -18.97200,          longitude: 32.67050,
      writtenDirections: 'From the main entrance, walk straight ahead past reception.\nTurn right at the corridor junction.\nPharmacy is the second door on your left — look for the green cross sign.',
      floor: 'Ground Floor', iconName: 'pharmacy',
    },
    {
      name: 'Male Toilets (Block A)', category: 'toilet', description: 'Male restrooms near main block',
      latitude: -18.97195,            longitude: 32.67015,
      writtenDirections: 'From reception, walk down the main corridor.\nMale toilets are on the left side, past the waiting area.\nLook for the blue restroom sign.',
      floor: 'Ground Floor', iconName: 'toilet',
    },
    {
      name: 'Female Toilets (Block A)', category: 'toilet', description: 'Female restrooms near main block',
      latitude: -18.97195,              longitude: 32.67045,
      writtenDirections: 'From reception, walk down the main corridor.\nFemale toilets are on the right side, past the waiting area.\nLook for the pink restroom sign.',
      floor: 'Ground Floor', iconName: 'toilet',
    },
    {
      name: 'Laboratory',           category: 'lab',      description: 'Blood tests, urine tests & lab work',
      latitude: -18.97215,          longitude: 32.67060,
      writtenDirections: 'From the main entrance, go straight past the pharmacy.\nAt the end of the corridor, turn left.\nLaboratory is second door on the right — marked "Pathology & Lab".',
      floor: 'Ground Floor', iconName: 'lab',
    },
    {
      name: 'X-Ray / Radiology',    category: 'lab',      description: 'X-Ray, ultrasound and imaging',
      latitude: -18.97225,          longitude: 32.67070,
      writtenDirections: 'From the main entrance, walk past the pharmacy corridor.\nContinue to the East Wing junction.\nRadiology is at the end of the East Wing — follow the blue imaging signs.',
      floor: 'Ground Floor', iconName: 'xray',
    },
    {
      name: 'Cafeteria',            category: 'cafeteria', description: 'Meals, snacks and beverages',
      latitude: -18.97230,          longitude: 32.67025,
      writtenDirections: 'From the main entrance, turn right.\nWalk to the end of the corridor.\nCafeteria is in the building at the far right corner — open 7AM to 7PM.',
      floor: 'Ground Floor', iconName: 'cafeteria',
    },
    {
      name: 'ATM / Payment Point',  category: 'atm',      description: 'Cash withdrawal & bill payments',
      latitude: -18.97185,          longitude: 32.67070,
      writtenDirections: 'From the main entrance, turn right immediately.\nATM is along the outer wall of the reception building.\nAccepts most banks — cash and EcoCash.',
      floor: 'Ground Floor', iconName: 'atm',
    },
    {
      name: 'Parking Area',         category: 'parking',   description: 'Patient & visitor vehicle parking',
      latitude: -18.97145,          longitude: 32.67010,
      writtenDirections: 'Main parking is located in front of the hospital entrance.\nAdditional overflow parking is available on the left side of the grounds.',
      floor: 'Outdoor / Grounds', iconName: 'parking',
    },
    {
      name: 'AURA Kiosk (You Are Here)', category: 'kiosk', description: 'This AURA service robot kiosk',
      latitude: -18.97180,               longitude: 32.67030,
      writtenDirections: 'You are at the AURA Kiosk inside the main entrance.',
      floor: 'Ground Floor', iconName: 'kiosk',
    },
  ]

  for (const pin of locationPinsData) {
    await prisma.locationPin.create({ data: pin })
  }
  console.log(`  ✅ ${locationPinsData.length} Default location pins created`)

  console.log('\n🎉 Seeding complete!')
  console.log('\n📋 Login Credentials:')
  console.log('   Admin:  admin@aura.hospital / password123')
  console.log('   Doctor: dr.moyo@aura.hospital / password123')
  console.log('   (All doctor accounts use password123)')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
