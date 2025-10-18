// Mock data for demo mode

export const mockUser = {
  id: 'demo-user-123',
  email: 'demo@visa-assist.com',
  first_name: 'Demo',
  last_name: 'User',
  phone: '+49 123 456 7890',
  date_of_birth: '1990-01-01',
  nationality: 'TR',
  preferred_language: 'en',
  is_premium: true,
  email_verified: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export const mockApplications = [
  {
    id: 'app-1',
    user_id: mockUser.id,
    visa_type: 'work',
    target_country: 'DE',
    purpose_of_travel: 'Employment as Software Developer',
    planned_travel_date: '2025-03-01',
    duration_of_stay: 365,
    status: 'in_progress',
    current_step: 4,
    total_steps: 8,
    progress_percentage: 50,
    checklist_items: [
      { id: 'passport', label: 'Valid Passport', completed: true, required: true },
      { id: 'photo', label: 'Biometric Photo', completed: true, required: true },
      { id: 'work_contract', label: 'Employment Contract', completed: true, required: true },
      { id: 'qualification_docs', label: 'Qualification Documents', completed: false, required: true },
      { id: 'denklik', label: 'Denklik/Recognition', completed: false, required: false },
      { id: 'financial_proof', label: 'Financial Proof', completed: false, required: true },
      { id: 'accommodation', label: 'Accommodation Proof', completed: false, required: true },
      { id: 'travel_insurance', label: 'Travel Insurance', completed: false, required: true }
    ],
    is_premium: true,
    created_at: new Date('2025-01-10').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'app-2',
    user_id: mockUser.id,
    visa_type: 'student',
    target_country: 'DE',
    purpose_of_travel: 'Masters in Computer Science',
    planned_travel_date: '2025-04-15',
    duration_of_stay: 730,
    status: 'draft',
    current_step: 2,
    total_steps: 8,
    progress_percentage: 25,
    checklist_items: [
      { id: 'passport', label: 'Valid Passport', completed: true, required: true },
      { id: 'photo', label: 'Biometric Photo', completed: true, required: true },
      { id: 'admission_letter', label: 'University Admission Letter', completed: false, required: true },
      { id: 'blocked_account', label: 'Blocked Account Proof', completed: false, required: true },
      { id: 'motivation_letter', label: 'Motivation Letter', completed: false, required: true }
    ],
    is_premium: false,
    created_at: new Date('2025-01-15').toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const mockDocuments = [
  {
    id: 'doc-1',
    application_id: 'app-1',
    user_id: mockUser.id,
    document_type: 'passport',
    file_name: 'passport.pdf',
    file_url: '/demo/passport.pdf',
    file_size: 2048000,
    mime_type: 'application/pdf',
    status: 'verified',
    verification_notes: 'Document verified successfully',
    uploaded_at: new Date('2025-01-11').toISOString(),
    verified_at: new Date('2025-01-12').toISOString()
  },
  {
    id: 'doc-2',
    application_id: 'app-1',
    user_id: mockUser.id,
    document_type: 'photo',
    file_name: 'biometric-photo.jpg',
    file_url: '/demo/photo.jpg',
    file_size: 512000,
    mime_type: 'image/jpeg',
    status: 'verified',
    uploaded_at: new Date('2025-01-11').toISOString(),
    verified_at: new Date('2025-01-11').toISOString()
  },
  {
    id: 'doc-3',
    application_id: 'app-1',
    user_id: mockUser.id,
    document_type: 'employment',
    file_name: 'work-contract.pdf',
    file_url: '/demo/contract.pdf',
    file_size: 1024000,
    mime_type: 'application/pdf',
    status: 'pending',
    uploaded_at: new Date('2025-01-13').toISOString()
  }
]

export const mockAppointments = [
  {
    id: 'apt-1',
    application_id: 'app-1',
    user_id: mockUser.id,
    appointment_date: new Date('2025-02-15T10:00:00').toISOString(),
    appointment_type: 'visa_interview',
    location: 'German Consulate - Istanbul',
    status: 'scheduled',
    confirmation_code: 'IST-2025-0215-1000',
    notes: 'Please arrive 15 minutes early',
    reminder_sent: false,
    created_at: new Date('2025-01-14').toISOString()
  }
]

export const mockNotifications = [
  {
    id: 'notif-1',
    user_id: mockUser.id,
    type: 'success',
    title: 'Document Verified',
    message: 'Your passport has been successfully verified',
    read: true,
    created_at: new Date('2025-01-12').toISOString(),
    read_at: new Date('2025-01-12').toISOString()
  },
  {
    id: 'notif-2',
    user_id: mockUser.id,
    type: 'warning',
    title: 'Document Required',
    message: 'Please upload your qualification documents',
    read: false,
    created_at: new Date('2025-01-16').toISOString()
  },
  {
    id: 'notif-3',
    user_id: mockUser.id,
    type: 'info',
    title: 'Appointment Reminder',
    message: 'Your visa interview is scheduled for February 15, 2025',
    read: false,
    created_at: new Date('2025-01-17').toISOString()
  }
]

export const mockActivities = [
  {
    id: 'act-1',
    user_id: mockUser.id,
    entity_type: 'document',
    entity_id: 'doc-1',
    action: 'uploaded',
    details: { document_type: 'passport', file_name: 'passport.pdf' },
    created_at: new Date('2025-01-11').toISOString()
  },
  {
    id: 'act-2',
    user_id: mockUser.id,
    entity_type: 'document',
    entity_id: 'doc-1',
    action: 'verified',
    details: { document_type: 'passport', verified_by: 'system' },
    created_at: new Date('2025-01-12').toISOString()
  },
  {
    id: 'act-3',
    user_id: mockUser.id,
    entity_type: 'appointment',
    entity_id: 'apt-1',
    action: 'scheduled',
    details: { appointment_type: 'visa_interview', date: '2025-02-15' },
    created_at: new Date('2025-01-14').toISOString()
  }
]

export const mockJobs = [
  {
    id: 'job-1',
    job_id: 'indeed-123456',
    provider: 'indeed',
    title: 'Senior Software Developer',
    company: 'TechCorp GmbH',
    location: 'Berlin, Germany',
    salary_range: '€70,000 - €90,000',
    job_url: 'https://indeed.com/job/123456',
    description: 'We are looking for an experienced software developer...',
    requirements: ['5+ years experience', 'React/Node.js', 'German language preferred'],
    visa_sponsorship: true,
    application_deadline: '2025-02-28',
    saved_at: new Date('2025-01-15').toISOString(),
    applied: false
  },
  {
    id: 'job-2',
    job_id: 'stepstone-789',
    provider: 'stepstone',
    title: 'Full Stack Developer',
    company: 'StartupHub Berlin',
    location: 'Berlin, Germany',
    salary_range: '€60,000 - €75,000',
    job_url: 'https://stepstone.de/job/789',
    description: 'Join our growing team...',
    requirements: ['3+ years experience', 'TypeScript', 'English fluency'],
    visa_sponsorship: true,
    application_deadline: '2025-03-15',
    saved_at: new Date('2025-01-16').toISOString(),
    applied: true,
    applied_at: new Date('2025-01-17').toISOString()
  }
]

export const mockStats = {
  totalApplications: 2,
  activeApplications: 1,
  completedApplications: 0,
  totalDocuments: 3,
  verifiedDocuments: 2,
  upcomingAppointments: 1,
  savedJobs: 2,
  appliedJobs: 1
}