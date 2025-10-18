export const testUsers = {
  validUser: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'StrongPassword123!',
    phoneNumber: '+1234567890',
    dateOfBirth: '1990-01-01'
  },
  
  invalidUsers: [
    {
      firstName: '',
      lastName: 'Doe',
      email: 'invalid-email',
      password: '123',
      error: 'Invalid email and weak password'
    },
    {
      firstName: 'Jane',
      lastName: '',
      email: 'jane@example.com',
      password: 'ValidPassword123!',
      error: 'Missing last name'
    }
  ]
};

export const visaApplications = {
  tourist: {
    type: 'tourist',
    destinationCountry: 'Germany',
    travelDate: '2024-12-01',
    returnDate: '2024-12-15',
    purpose: 'Tourism and sightseeing',
    accommodation: 'Hotel Berlin Central',
    estimatedBudget: 2000
  },
  
  business: {
    type: 'business',
    destinationCountry: 'Germany',
    travelDate: '2024-11-01',
    returnDate: '2024-11-10',
    purpose: 'Business meetings and conferences',
    company: 'Tech Solutions Inc.',
    invitingCompany: 'German Tech GmbH'
  },
  
  student: {
    type: 'student',
    destinationCountry: 'Germany',
    travelDate: '2024-10-01',
    returnDate: '2025-09-30',
    purpose: 'University studies',
    university: 'Technical University of Munich',
    course: 'Computer Science',
    degree: 'Masters'
  },
  
  work: {
    type: 'work',
    destinationCountry: 'Germany',
    travelDate: '2024-08-01',
    returnDate: '2026-07-31',
    purpose: 'Employment',
    employer: 'German Software AG',
    position: 'Software Engineer',
    salary: 65000
  }
};

export const documentTypes = {
  required: [
    { type: 'passport', filename: 'passport.pdf', mimeType: 'application/pdf' },
    { type: 'photo', filename: 'passport-photo.jpg', mimeType: 'image/jpeg' },
    { type: 'application_form', filename: 'application-form.pdf', mimeType: 'application/pdf' }
  ],
  
  tourist: [
    { type: 'bank_statement', filename: 'bank-statement.pdf', mimeType: 'application/pdf' },
    { type: 'travel_insurance', filename: 'travel-insurance.pdf', mimeType: 'application/pdf' },
    { type: 'hotel_booking', filename: 'hotel-booking.pdf', mimeType: 'application/pdf' },
    { type: 'flight_booking', filename: 'flight-booking.pdf', mimeType: 'application/pdf' }
  ],
  
  business: [
    { type: 'business_invitation', filename: 'invitation-letter.pdf', mimeType: 'application/pdf' },
    { type: 'company_registration', filename: 'company-docs.pdf', mimeType: 'application/pdf' },
    { type: 'employment_letter', filename: 'employment-letter.pdf', mimeType: 'application/pdf' },
    { type: 'tax_documents', filename: 'tax-docs.pdf', mimeType: 'application/pdf' }
  ],
  
  student: [
    { type: 'university_admission', filename: 'admission-letter.pdf', mimeType: 'application/pdf' },
    { type: 'financial_proof', filename: 'financial-statement.pdf', mimeType: 'application/pdf' },
    { type: 'academic_transcripts', filename: 'transcripts.pdf', mimeType: 'application/pdf' },
    { type: 'language_certificate', filename: 'language-cert.pdf', mimeType: 'application/pdf' }
  ],
  
  work: [
    { type: 'job_offer', filename: 'job-offer.pdf', mimeType: 'application/pdf' },
    { type: 'work_permit', filename: 'work-permit.pdf', mimeType: 'application/pdf' },
    { type: 'qualification_certificates', filename: 'qualifications.pdf', mimeType: 'application/pdf' },
    { type: 'employment_contract', filename: 'contract.pdf', mimeType: 'application/pdf' }
  ]
};

export const paymentData = {
  stripe: {
    cardNumber: '4242424242424242',
    expiry: '12/25',
    cvc: '123',
    name: 'John Doe',
    email: 'john.doe@example.com'
  },
  
  paypal: {
    email: 'test@paypal.com',
    password: 'PayPalPassword123!'
  },
  
  fees: {
    tourist: 80,
    business: 120,
    student: 75,
    work: 150
  }
};

export const countries = [
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Netherlands',
  'Austria',
  'Belgium',
  'Switzerland',
  'Poland',
  'Czech Republic'
];

export const errorMessages = {
  validation: {
    emailRequired: 'Email is required',
    emailInvalid: 'Please enter a valid email address',
    passwordRequired: 'Password is required',
    passwordWeak: 'Password must be at least 8 characters long',
    passwordMismatch: 'Passwords do not match',
    nameRequired: 'Name is required',
    termsRequired: 'You must accept the terms of service'
  },
  
  authentication: {
    invalidCredentials: 'Invalid email or password',
    accountLocked: 'Account has been locked',
    emailNotVerified: 'Please verify your email address',
    sessionExpired: 'Your session has expired'
  },
  
  application: {
    incompleteApplication: 'Application is incomplete',
    missingDocuments: 'Required documents are missing',
    invalidDate: 'Please enter a valid date',
    pastDate: 'Travel date cannot be in the past',
    invalidReturnDate: 'Return date must be after travel date'
  },
  
  payment: {
    paymentFailed: 'Payment processing failed',
    invalidCard: 'Invalid card number',
    cardExpired: 'Card has expired',
    insufficientFunds: 'Insufficient funds',
    paymentRequired: 'Payment is required to submit application'
  },
  
  upload: {
    fileTooLarge: 'File is too large',
    invalidFileType: 'Invalid file type',
    uploadFailed: 'File upload failed',
    virusDetected: 'File contains a virus'
  },
  
  server: {
    internalError: 'Internal server error',
    serviceUnavailable: 'Service temporarily unavailable',
    networkError: 'Network connection error',
    timeoutError: 'Request timed out'
  }
};

export const urls = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  applications: '/dashboard/applications',
  newApplication: '/dashboard/applications/new',
  documents: '/dashboard/documents',
  appointments: '/dashboard/appointments',
  payments: '/dashboard/payments',
  profile: '/dashboard/profile',
  terms: '/terms',
  privacy: '/privacy',
  faq: '/faq',
  contact: '/contact'
};

export const selectors = {
  forms: {
    registration: {
      firstName: '#firstName',
      lastName: '#lastName',
      email: '#email',
      password: '#password',
      confirmPassword: '#confirmPassword',
      terms: '#terms',
      newsletter: '#newsletter',
      submit: 'button[type="submit"]'
    },
    login: {
      email: 'input[type="email"]',
      password: 'input[type="password"]',
      submit: 'button[type="submit"]',
      rememberMe: '#rememberMe'
    },
    application: {
      visaType: '#visaType',
      destinationCountry: '#destinationCountry',
      travelDate: '#travelDate',
      returnDate: '#returnDate',
      purpose: '#purpose',
      next: 'button:has-text("Next")',
      previous: 'button:has-text("Previous")',
      submit: 'button:has-text("Submit")',
      saveAsDraft: 'button:has-text("Save as Draft")'
    }
  },
  
  navigation: {
    applications: 'text=Applications',
    documents: 'text=Documents',
    appointments: 'text=Appointments',
    payments: 'text=Payments',
    profile: 'text=Profile',
    logout: 'text=Logout'
  },
  
  states: {
    loading: '.animate-spin, text=Loading',
    error: '.error, [role="alert"], .text-red-600',
    success: '.success, text=Success, .text-green-600',
    validation: '.field-error, .invalid-feedback, [aria-invalid="true"]'
  }
};

export const testConfig = {
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
    upload: 60000
  },
  
  retries: {
    flaky: 2,
    network: 3,
    upload: 1
  },
  
  viewport: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 },
    wide: { width: 1920, height: 1080 }
  }
};