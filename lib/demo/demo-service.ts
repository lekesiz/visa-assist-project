import { 
  mockUser, 
  mockApplications, 
  mockDocuments, 
  mockAppointments, 
  mockNotifications,
  mockActivities,
  mockJobs,
  mockStats
} from './mock-data'

// Demo mode service that returns mock data instead of calling real APIs
export class DemoService {
  static isDemoMode() {
    return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  }

  // Auth methods
  static async signIn(email: string, password: string) {
    await this.delay(1000) // Simulate network delay
    
    if (email === 'demo@example.com' && password === 'demo123456') {
      return { user: mockUser, error: null }
    }
    
    return { 
      user: null, 
      error: { message: 'Invalid credentials. Try demo@example.com / demo123456' } 
    }
  }

  static async signUp(data: any) {
    await this.delay(1000)
    return { 
      user: { ...mockUser, ...data }, 
      error: null 
    }
  }

  static async signOut() {
    await this.delay(500)
    return { error: null }
  }

  static async getUser() {
    await this.delay(200)
    return { user: mockUser, error: null }
  }

  // Applications
  static async getApplications(userId: string) {
    await this.delay(500)
    return { data: mockApplications, error: null }
  }

  static async getApplication(id: string) {
    await this.delay(300)
    const app = mockApplications.find(a => a.id === id)
    return { data: app || null, error: app ? null : { message: 'Application not found' } }
  }

  static async createApplication(data: any) {
    await this.delay(800)
    const newApp = {
      id: `app-${Date.now()}`,
      user_id: mockUser.id,
      ...data,
      status: 'draft',
      current_step: 1,
      total_steps: 8,
      progress_percentage: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    mockApplications.push(newApp)
    return { data: newApp, error: null }
  }

  static async updateApplication(id: string, updates: any) {
    await this.delay(500)
    const index = mockApplications.findIndex(a => a.id === id)
    if (index >= 0) {
      mockApplications[index] = { ...mockApplications[index], ...updates }
      return { data: mockApplications[index], error: null }
    }
    return { data: null, error: { message: 'Application not found' } }
  }

  // Documents
  static async getDocuments(applicationId?: string) {
    await this.delay(400)
    const docs = applicationId 
      ? mockDocuments.filter(d => d.application_id === applicationId)
      : mockDocuments
    return { data: docs, error: null }
  }

  static async uploadDocument(file: File, applicationId: string, documentType: string) {
    await this.delay(1500) // Simulate upload time
    const newDoc = {
      id: `doc-${Date.now()}`,
      application_id: applicationId,
      user_id: mockUser.id,
      document_type: documentType,
      file_name: file.name,
      file_url: `/demo/${file.name}`,
      file_size: file.size,
      mime_type: file.type,
      status: 'pending',
      uploaded_at: new Date().toISOString()
    }
    mockDocuments.push(newDoc)
    return { data: newDoc, error: null }
  }

  // Appointments
  static async getAppointments() {
    await this.delay(300)
    return { data: mockAppointments, error: null }
  }

  static async bookAppointment(data: any) {
    await this.delay(700)
    const newAppointment = {
      id: `apt-${Date.now()}`,
      user_id: mockUser.id,
      ...data,
      status: 'scheduled',
      created_at: new Date().toISOString()
    }
    mockAppointments.push(newAppointment)
    return { data: newAppointment, error: null }
  }

  // Notifications
  static async getNotifications() {
    await this.delay(200)
    return { data: mockNotifications, error: null }
  }

  static async markNotificationRead(id: string) {
    await this.delay(100)
    const notif = mockNotifications.find(n => n.id === id)
    if (notif) {
      notif.read = true
      notif.read_at = new Date().toISOString()
    }
    return { data: notif, error: null }
  }

  // Activities
  static async getActivities() {
    await this.delay(300)
    return { data: mockActivities, error: null }
  }

  // Jobs
  static async getSavedJobs() {
    await this.delay(400)
    return { data: mockJobs, error: null }
  }

  static async saveJob(job: any) {
    await this.delay(300)
    const savedJob = {
      id: `job-${Date.now()}`,
      user_id: mockUser.id,
      ...job,
      saved_at: new Date().toISOString(),
      applied: false
    }
    mockJobs.push(savedJob)
    return { data: savedJob, error: null }
  }

  static async applyToJob(jobId: string) {
    await this.delay(500)
    const job = mockJobs.find(j => j.id === jobId)
    if (job) {
      job.applied = true
      job.applied_at = new Date().toISOString()
    }
    return { data: job, error: null }
  }

  // Stats
  static async getUserStats() {
    await this.delay(200)
    return { data: mockStats, error: null }
  }

  // AI Analysis
  static async analyzeDocument(documentId: string) {
    await this.delay(2000) // Simulate AI processing
    return {
      data: {
        id: `analysis-${Date.now()}`,
        document_id: documentId,
        analysis_type: 'document_verification',
        results: {
          valid: true,
          score: 0.95,
          issues: [],
          suggestions: ['Document appears to be valid and complete']
        },
        confidence_score: 0.95,
        created_at: new Date().toISOString()
      },
      error: null
    }
  }

  static async getVisaRecommendations(profile: any) {
    await this.delay(1500)
    return {
      data: {
        recommendations: [
          {
            visa_type: 'work',
            suitability_score: 0.9,
            reasons: ['You have a job offer', 'Your qualifications match requirements'],
            next_steps: ['Complete Denklik process', 'Gather financial documents']
          },
          {
            visa_type: 'job_seeker',
            suitability_score: 0.7,
            reasons: ['Your field is in demand', 'You meet qualification requirements'],
            next_steps: ['Prepare motivation letter', 'Show financial resources']
          }
        ]
      },
      error: null
    }
  }

  // Payment
  static async createPaymentSession(amount: number, description: string) {
    await this.delay(1000)
    return {
      data: {
        sessionId: `demo-session-${Date.now()}`,
        paymentUrl: '/demo/payment',
        amount,
        description
      },
      error: null
    }
  }

  // Helper method to simulate network delay
  private static delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}