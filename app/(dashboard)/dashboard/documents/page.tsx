'use client'

import { useEffect, useState } from 'react'
import { DocumentList } from '@/components/documents/DocumentList'
import { DocumentUploader } from '@/components/documents/DocumentUploader'
import { DocumentStatusSummary } from '@/components/documents/DocumentStatus'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  XCircle,
  FolderOpen
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'
import { mockDocuments } from '@/lib/demo/mock-data'

interface Document {
  id: string
  application_id?: string
  document_type: string
  file_name: string
  file_url: string
  file_size: number
  mime_type: string
  status: 'pending' | 'uploaded' | 'verified' | 'rejected'
  verification_notes?: string
  uploaded_at: string
  verified_at?: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploader, setShowUploader] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchDocuments()
  }, [])

  async function fetchDocuments() {
    try {
      setLoading(true)

      if (DemoService.isDemoMode()) {
        // Use mock data in demo mode
        setDocuments(mockDocuments as Document[])
      } else {
        // Fetch real data from Supabase
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .order('uploaded_at', { ascending: false })

        if (error) throw error
        setDocuments(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentUpload = async (file: File, documentType: string) => {
    try {
      setUploadingDocument(true)

      if (DemoService.isDemoMode()) {
        // Simulate upload in demo mode
        await new Promise(resolve => setTimeout(resolve, 2000))
        const newDoc: Document = {
          id: `doc-${Date.now()}`,
          document_type: documentType,
          file_name: file.name,
          file_url: URL.createObjectURL(file),
          file_size: file.size,
          mime_type: file.type,
          status: 'uploaded',
          uploaded_at: new Date().toISOString()
        }
        setDocuments(prev => [newDoc, ...prev])
        setShowUploader(false)
      } else {
        // Real upload logic would go here
      }
    } catch (error) {
      console.error('Failed to upload document:', error)
    } finally {
      setUploadingDocument(false)
    }
  }

  const handleDocumentDelete = async (documentId: string) => {
    try {
      if (DemoService.isDemoMode()) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      } else {
        await supabase
          .from('documents')
          .delete()
          .eq('id', documentId)
        
        await fetchDocuments()
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  const handleStatusClick = (status: any) => {
    setSelectedStatus(selectedStatus === status ? null : status)
  }

  // Filter documents by selected status
  const filteredDocuments = selectedStatus
    ? documents.filter(doc => doc.status === selectedStatus)
    : documents

  // Calculate storage usage
  const totalSize = documents.reduce((sum, doc) => sum + doc.file_size, 0)
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)
  const storageLimit = 100 // MB
  const storagePercentage = (parseFloat(totalSizeMB) / storageLimit) * 100

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Library</h1>
          <p className="text-gray-600 mt-1">
            Manage all your visa application documents in one place
          </p>
        </div>
        <Button onClick={() => setShowUploader(true)} size="lg">
          <Upload className="h-5 w-5 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Storage Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
          <CardDescription>
            {totalSizeMB} MB of {storageLimit} MB used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>
            {storagePercentage > 80 && (
              <p className="text-sm text-orange-600">
                ⚠️ You're running low on storage space
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Status Summary */}
      <DocumentStatusSummary 
        documents={documents}
        onStatusClick={handleStatusClick}
      />

      {/* Tips Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Document Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <ul className="space-y-2 text-sm">
            <li>• Ensure all documents are clear and legible</li>
            <li>• Upload documents in PDF, JPG, or PNG format</li>
            <li>• Keep file sizes under 10MB per document</li>
            <li>• Use descriptive file names for easy identification</li>
            <li>• Verify documents are not password protected</li>
          </ul>
        </CardContent>
      </Card>

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading documents...</p>
          </div>
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No documents yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Upload your visa application documents to keep them organized and easily accessible.
            </p>
            <Button onClick={() => setShowUploader(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Your First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DocumentList
          documents={filteredDocuments}
          onUpload={() => setShowUploader(true)}
          onDelete={handleDocumentDelete}
          showFilters={documents.length > 5}
          compact={false}
        />
      )}

      {/* Document Categories Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Document Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: 'passport', label: 'Passport', count: documents.filter(d => d.document_type === 'passport').length },
                { type: 'photo', label: 'Biometric Photos', count: documents.filter(d => d.document_type === 'photo').length },
                { type: 'financial', label: 'Financial Documents', count: documents.filter(d => d.document_type === 'financial').length },
                { type: 'accommodation', label: 'Accommodation Proof', count: documents.filter(d => d.document_type === 'accommodation').length },
                { type: 'insurance', label: 'Travel Insurance', count: documents.filter(d => d.document_type === 'insurance').length },
                { type: 'other', label: 'Other Documents', count: documents.filter(d => d.document_type === 'other').length }
              ].map(category => (
                <div key={category.type} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm font-medium">{category.label}</span>
                  <span className="text-sm text-gray-500">{category.count} document{category.count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.slice(0, 5).map(doc => (
                <div key={doc.id} className="flex items-center gap-3 text-sm">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.file_name}</p>
                    <p className="text-gray-500">
                      Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    {doc.status === 'verified' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {doc.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                    {doc.status === 'rejected' && <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Uploader Dialog */}
      {showUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
            <DocumentUploader
              applicationId="general"
              onUploadComplete={(doc) => {
                setShowUploader(false)
                fetchDocuments()
              }}
              acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
              maxFileSize={10}
            />
            <Button 
              onClick={() => setShowUploader(false)}
              className="mt-4"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}