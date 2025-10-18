// Common type definitions for the project

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: 'user' | 'consultant' | 'admin'
  createdAt: string
}

export interface Application {
  id: string
  applicationNumber: string
  type: 'visa' | 'denklik' | 'job_search'
  status: 'draft' | 'submitted' | 'processing' | 'completed' | 'rejected'
  targetCountry: string
  visaType?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  createdAt: string
  updatedAt: string
}

export interface Document {
  id: string
  documentType: DocumentType
  originalFilename: string
  uploadDate: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  aiAnalysisStatus: 'pending' | 'processing' | 'completed' | 'failed'
  fileSize: number
  mimeType: string
}

export type DocumentType = 
  | 'passport'
  | 'diploma'
  | 'transcript'
  | 'cv'
  | 'job_offer'
  | 'language_certificate'
  | 'birth_certificate'
  | 'marriage_certificate'
  | 'criminal_record'
  | 'health_certificate'
  | 'bank_statement'
  | 'other'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page: number
  limit: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface FileUploadResponse {
  id: string
  url: string
  fileName: string
  fileSize: number
}

// Component Props Types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// Form Types
export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  gdprConsent: boolean
}

export interface DocumentUploadFormData {
  file: File
  documentType: DocumentType
  applicationId?: string
  description?: string
}

// API Error Types
export interface ApiError {
  code: string
  message: string
  details?: any
}