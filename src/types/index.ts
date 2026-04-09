export type UserRole = 'ADMIN' | 'DOCTOR'

export type DoctorStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'ON_BREAK'

export type QueueStatus = 'WAITING' | 'CALLED' | 'IN_PROGRESS' | 'COMPLETED'

export type Priority = 'EMERGENCY' | 'URGENT' | 'ROUTINE'

export type AppointmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type PatientStatus = 'ADMITTED' | 'DISCHARGED'

export interface Language {
  code: string
  name: string
  nativeName: string
}

export const LANGUAGES: Language[] = [
  { code: 'sn', name: 'Shona', nativeName: 'Shona' },
  { code: 'nd', name: 'Ndebele', nativeName: 'isiNdebele' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'to', name: 'Tonga', nativeName: 'chiTonga' },
  { code: 'cb', name: 'Chibarwe', nativeName: 'Chibarwe' },
  { code: 'kl', name: 'Kalanga', nativeName: 'Kalanga' },
  { code: 'ko', name: 'Koisan', nativeName: 'Koisan' },
  { code: 'nm', name: 'Nambya', nativeName: 'Nambya' },
  { code: 'na', name: 'Ndau', nativeName: 'Ndau' },
  { code: 'sh', name: 'Shangani', nativeName: 'Shangani' },
  { code: 'st', name: 'Sotho', nativeName: 'Sotho' },
  { code: 've', name: 'Venda', nativeName: 'Tshivenda' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' },
  { code: 'ch', name: 'Chewa', nativeName: 'Chichewa' },
  { code: 'ts', name: 'Tswana', nativeName: 'Setswana' },
  { code: 'sl', name: 'Sign Language', nativeName: 'Sign Language' },
]

export const SYMPTOM_CATEGORIES = [
  { id: 'fever', name: 'Fever / High Temperature', icon: '🤒' },
  { id: 'pain', name: 'Pain (Head, Chest, Stomach...)', icon: '🤕' },
  { id: 'cold', name: 'Cold / Flu Symptoms', icon: '🤧' },
  { id: 'injury', name: 'Injury / Wound', icon: '🩹' },
  { id: 'chronic', name: 'Chronic Condition Follow-up', icon: '💊' },
  { id: 'maternity', name: 'Maternity / Pregnancy', icon: '🤰' },
  { id: 'child', name: 'Child Health Issue', icon: '👶' },
  { id: 'skin', name: 'Skin / Rash / Allergy', icon: '🔴' },
  { id: 'eye', name: 'Eye Problem', icon: '👁️' },
  { id: 'ear', name: 'Ear / Nose / Throat', icon: '👂' },
  { id: 'dental', name: 'Dental / Tooth Pain', icon: '🦷' },
  { id: 'mental', name: 'Mental Health / Anxiety', icon: '🧠' },
  { id: 'stomach', name: 'Stomach / Digestive', icon: '🤢' },
  { id: 'sti', name: 'STI / Sexual Health', icon: '🩺' },
  { id: 'other', name: 'Other / Not Listed', icon: '📋' },
]

export const FACILITIES = [
  { id: 'toilet', name: 'Restrooms / Toilets', icon: '🚻', description: 'Nearest restrooms' },
  { id: 'pharmacy', name: 'Pharmacy', icon: '💊', description: 'Medication dispensary' },
  { id: 'lab', name: 'Laboratory', icon: '🔬', description: 'Blood tests & lab work' },
  { id: 'xray', name: 'X-Ray / Radiology', icon: '📷', description: 'Imaging services' },
  { id: 'maternity', name: 'Maternity Ward', icon: '🤰', description: 'Maternity services' },
  { id: 'emergency', name: 'Emergency Department', icon: '🚨', description: 'Emergency care' },
  { id: 'cafeteria', name: 'Cafeteria', icon: '☕', description: 'Food & drinks' },
  { id: 'atm', name: 'ATM / Payment Point', icon: '💳', description: 'Cash & payments' },
  { id: 'parking', name: 'Parking Area', icon: '🅿️', description: 'Vehicle parking' },
  { id: 'exit', name: 'Main Exit', icon: '🚪', description: 'Building exit' },
]
