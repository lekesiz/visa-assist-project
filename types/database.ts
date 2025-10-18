// This file is auto-generated from your Supabase schema
// Run `npm run db:types` to regenerate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          birth_date: string | null
          nationality: string | null
          role: 'user' | 'consultant' | 'admin'
          language_preference: string
          gdpr_consent: boolean
          gdpr_consent_date: string | null
          marketing_consent: boolean
          created_at: string
          updated_at: string
          last_login_at: string | null
          is_active: boolean
          deleted_at: string | null
        }
        Insert: {
          id?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          birth_date?: string | null
          nationality?: string | null
          role?: 'user' | 'consultant' | 'admin'
          language_preference?: string
          gdpr_consent?: boolean
          gdpr_consent_date?: string | null
          marketing_consent?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          is_active?: boolean
          deleted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          birth_date?: string | null
          nationality?: string | null
          role?: 'user' | 'consultant' | 'admin'
          language_preference?: string
          gdpr_consent?: boolean
          gdpr_consent_date?: string | null
          marketing_consent?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          is_active?: boolean
          deleted_at?: string | null
        }
      }
      applications: {
        Row: {
          id: string
          user_id: string
          application_number: string
          type: 'visa' | 'denklik' | 'job_search'
          status: 'draft' | 'submitted' | 'processing' | 'completed' | 'rejected'
          target_country: string
          visa_type: string | null
          priority: string
          assigned_consultant_id: string | null
          submission_date: string | null
          completion_date: string | null
          ai_analysis_completed: boolean
          ai_recommendations: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          application_number: string
          type: 'visa' | 'denklik' | 'job_search'
          status?: 'draft' | 'submitted' | 'processing' | 'completed' | 'rejected'
          target_country?: string
          visa_type?: string | null
          priority?: string
          assigned_consultant_id?: string | null
          submission_date?: string | null
          completion_date?: string | null
          ai_analysis_completed?: boolean
          ai_recommendations?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          application_number?: string
          type?: 'visa' | 'denklik' | 'job_search'
          status?: 'draft' | 'submitted' | 'processing' | 'completed' | 'rejected'
          target_country?: string
          visa_type?: string | null
          priority?: string
          assigned_consultant_id?: string | null
          submission_date?: string | null
          completion_date?: string | null
          ai_analysis_completed?: boolean
          ai_recommendations?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          application_id: string | null
          user_id: string
          document_type: string
          original_filename: string
          storage_path: string
          file_size: number | null
          file_hash: string | null
          mime_type: string | null
          upload_date: string
          verification_status: 'pending' | 'verified' | 'rejected'
          verified_by: string | null
          verified_at: string | null
          ai_analysis_status: string
          ai_analysis_result: Json | null
          virus_scan_status: string
          virus_scan_date: string | null
          is_encrypted: boolean
          expiry_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          application_id?: string | null
          user_id: string
          document_type: string
          original_filename: string
          storage_path: string
          file_size?: number | null
          file_hash?: string | null
          mime_type?: string | null
          upload_date?: string
          verification_status?: 'pending' | 'verified' | 'rejected'
          verified_by?: string | null
          verified_at?: string | null
          ai_analysis_status?: string
          ai_analysis_result?: Json | null
          virus_scan_status?: string
          virus_scan_date?: string | null
          is_encrypted?: boolean
          expiry_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string | null
          user_id?: string
          document_type?: string
          original_filename?: string
          storage_path?: string
          file_size?: number | null
          file_hash?: string | null
          mime_type?: string | null
          upload_date?: string
          verification_status?: 'pending' | 'verified' | 'rejected'
          verified_by?: string | null
          verified_at?: string | null
          ai_analysis_status?: string
          ai_analysis_result?: Json | null
          virus_scan_status?: string
          virus_scan_date?: string | null
          is_encrypted?: boolean
          expiry_date?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}