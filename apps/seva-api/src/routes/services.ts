import { Router, Request, Response } from 'express';

export const servicesRouter = Router();

export const BANGALORE_BUS_STOPS = [
  'Kempegowda Bus Station (Majestic)',
  'Shivajinagar Bus Station',
  'Banashankari TTMC',
  'Whitefield (Kadugodi)',
  'Electronic City Wipro Gate',
  'Central Silk Board',
  'Hebbal Bus Stop',
  'Kengeri TTMC',
  'Yelahanka Old Town',
  'Jayanagar 4th Block',
  'Vijayanagar TTMC',
  'Malleshwaram 8th Cross',
  'Koramangala Sony World Junction',
  'Indiranagar 100 Feet Road',
  'Marathahalli Bridge',
  'KR Puram Railway Station',
  'Mysore Road Satellite Bus Station',
  'Yeshwantpur TTMC',
  'Domlur TTMC',
  'HSR Layout BDA Complex',
];

export const DEMO_SERVICES = [
  {
    id: 'bmtc-student-pass',
    category: 'Transport & Commute',
    categoryKn: 'ಸಾರಿಗೆ ಮತ್ತು ಪ್ರಯಾಣ',
    name: 'BMTC Student Bus Pass',
    nameKn: 'ಬಿಎಂಟಿಸಿ ವಿದ್ಯಾರ್ಥಿ ಬಸ್ ಪಾಸ್',
    department: 'Bangalore Metropolitan Transport Corporation (BMTC)',
    departmentKn: 'ಬೆಂಗಳೂರು ಮಹಾನಗರ ಸಾರಿಗೆ ಸಂಸ್ಥೆ (ಬಿಎಂಟಿಸಿ)',
    description: 'Concessional bus pass for students commuting between home and educational institutions across Bengaluru.',
    descriptionKn: 'ಬೆಂಗಳೂರಿನಲ್ಲಿ ಮನೆ ಮತ್ತು ಶಾಲಾ-ಕಾಲೇಜುಗಳ ನಡುವೆ ಪ್ರಯಾಣಿಸುವ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ರಿಯಾಯಿತಿ ದರದ ಬಸ್ ಪಾಸ್.',
    fee: 'Concessional (Subsidized by GoK)',
    processingTime: '2-3 working days (Simulated Demo)',
    isActive: true,
  },
  {
    id: 'caste-income-cert',
    category: 'Revenue & Social Welfare',
    categoryKn: 'ಕಂದಾಯ ಇಲಾಖೆ',
    name: 'Caste & Income Certificate',
    nameKn: 'ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ',
    department: 'Revenue Department (ನಾಡಕಚೇರಿ)',
    departmentKn: 'ಕಂದಾಯ ಇಲಾಖೆ (ನಾಡಕಚೇರಿ)',
    description: 'Statutory certificate for scholarship, competitive exam, and welfare benefits.',
    descriptionKn: 'ಶಿಕ್ಷಣ, ವಿದ್ಯಾರ್ಥಿವೇತನ ಮತ್ತು ಸರ್ಕಾರಿ ಸೌಲಭ್ಯಗಳಿಗಾಗಿ ಶಾಸನಬದ್ಧ ಪ್ರಮಾಣ ಪತ್ರ.',
    fee: '₹40',
    processingTime: '7-14 working days',
    isActive: true,
  },
  {
    id: 'gruha-jyothi',
    category: 'Energy & Utilities',
    categoryKn: 'ಇಂಧನ ಇಲಾಖೆ',
    name: 'Gruha Jyothi Electricity Subsidy',
    nameKn: 'ಗೃಹ ಜ್ಯೋತಿ ಯೋಜನೆ',
    department: 'Energy Department (ESCOMs)',
    departmentKn: 'ಇಂಧನ ಇಲಾಖೆ (ಬೆಸ್ಕಾಂ / ಮೆಸ್ಕಾಂ)',
    description: 'Provides up to 200 units of free electricity per month to domestic households.',
    descriptionKn: 'ಗೃಹಬಳಕೆಯ ಗ್ರಾಹಕರಿಗೆ ಮಾಸಿಕ 200 ಯೂನಿಟ್‌ವರೆಗೆ ಉಚಿತ ವಿದ್ಯುತ್ ನೀಡುವ ಯೋಜನೆ.',
    fee: 'Free',
    processingTime: 'Instant activation',
    isActive: true,
  },
];

/**
 * GET /api/services
 * List all available demo public services
 */
servicesRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    count: DEMO_SERVICES.length,
    services: DEMO_SERVICES,
  });
});

/**
 * GET /api/services/bmtc/stops
 * List or filter Bangalore transit stops
 */
servicesRouter.get('/bmtc/stops', (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (q) {
    const filtered = BANGALORE_BUS_STOPS.filter((s) => s.toLowerCase().includes(q.toLowerCase()));
    return res.status(200).json({
      success: true,
      count: filtered.length,
      stops: filtered,
    });
  }
  return res.status(200).json({
    success: true,
    count: BANGALORE_BUS_STOPS.length,
    stops: BANGALORE_BUS_STOPS,
  });
});

/**
 * GET /api/services/bmtc-student-pass
 * Specific metadata, field definitions, and stops for BMTC Student Pass
 */
servicesRouter.get('/bmtc-student-pass', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: DEMO_SERVICES[0],
    stops: BANGALORE_BUS_STOPS,
    requiredFields: [
      { key: 'studentName', label: 'Student Full Name', required: true },
      { key: 'aadhaarNumber', label: '12-Digit Synthetic Aadhaar', required: true, demoTestValue: '4433 5010 5028' },
      { key: 'phoneNumber', label: 'Mobile Number', required: true },
      { key: 'institutionName', label: 'School / College Name', required: true },
      { key: 'courseYear', label: 'Course & Year of Study', required: true },
      { key: 'pickupStop', label: 'Pickup Bus Stop', required: true },
      { key: 'destinationStop', label: 'Destination Bus Stop', required: true },
      { key: 'demoOtp', label: 'Synthetic Demo OTP', required: true, demoTestValue: '3344' },
    ],
    requiredDocuments: [
      { id: 'student_id', title: 'College / School ID Card', mandatory: true },
      { id: 'fee_receipt', title: 'Tuition Fee Receipt / Study Certificate', mandatory: true },
    ],
  });
});
