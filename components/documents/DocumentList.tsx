'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DocumentViewer, DocumentPreview } from './DocumentViewer'
import { DocumentStatus } from './DocumentStatus'
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  MoreVertical,
  Upload,
  Filter,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react'

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

interface DocumentListProps {
  documents: Document[]
  onUpload?: () => void
  onDelete?: (documentId: string) => void
  onDownload?: (document: Document) => void
  showFilters?: boolean
  compact?: boolean
}

const documentTypeLabels: Record<string, string> = {
  passport: 'Passport',
  photo: 'Biometric Photo',
  financial: 'Financial Documents',
  accommodation: 'Accommodation Proof',
  insurance: 'Travel Insurance',
  invitation: 'Invitation Letter',
  education: 'Educational Certificates',
  employment: 'Employment Documents',
  other: 'Other Documents'
}

export function DocumentList({ 
  documents, 
  onUpload,
  onDelete,
  onDownload,
  showFilters = true,
  compact = false
}: DocumentListProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || doc.document_type === filterType
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const handleDownload = async (document: Document) => {
    if (onDownload) {
      onDownload(document)
    } else {
      // Default download behavior
      window.open(document.file_url, '_blank')
    }
  }

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Upload className="h-4 w-4 text-gray-500" />
    }
  }

  // Get unique document types for filter
  const documentTypes = Array.from(new Set(documents.map(d => d.document_type)))

  if (compact) {
    return (
      <div className="space-y-2">
        {filteredDocuments.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-sm">{doc.file_name}</p>
                <p className="text-xs text-gray-500">
                  {documentTypeLabels[doc.document_type] || doc.document_type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DocumentStatus status={doc.status} size="sm" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDocument(doc)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                {documents.length} document(s) • {filteredDocuments.length} showing
              </CardDescription>
            </div>
            {onUpload && (
              <Button onClick={onUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          {showFilters && documents.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Types</option>
                {documentTypes.map(type => (
                  <option key={type} value={type}>
                    {documentTypeLabels[type] || type}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="uploaded">Uploaded</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          )}

          {/* Document List */}
          {filteredDocuments.length > 0 ? (
            <div className="space-y-3">
              {filteredDocuments.map(doc => (
                <div 
                  key={doc.id} 
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Preview Thumbnail */}
                  <DocumentPreview
                    document={doc}
                    onClick={() => setSelectedDocument(doc)}
                  />

                  {/* Document Info */}
                  <div className="flex-1">
                    <h4 className="font-medium">{doc.file_name}</h4>
                    <p className="text-sm text-gray-500">
                      {documentTypeLabels[doc.document_type] || doc.document_type} • 
                      {(doc.file_size / 1024 / 1024).toFixed(2)} MB • 
                      Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                    {doc.verification_notes && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Note:</span> {doc.verification_notes}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <DocumentStatus status={doc.status} showLabel />

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedDocument(doc)}
                      title="View document"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(doc)}
                      title="Download document"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {onDelete && doc.status !== 'verified' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(doc.id)}
                        title="Delete document"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              {documents.length === 0 ? (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No documents uploaded yet</p>
                  {onUpload && (
                    <Button onClick={onUpload}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload First Document
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No documents match your filters</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          isOpen={!!selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onDownload={() => handleDownload(selectedDocument)}
        />
      )}
    </>
  )
}