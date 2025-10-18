'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { DocumentUploader } from '@/components/documents/DocumentUploader'
import { 
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  File
} from 'lucide-react'

interface DocumentRequirement {
  id: string
  name: string
  description: string
  category: 'required' | 'optional'
  maxSize: number // MB
  acceptedFormats: string[]
  uploaded: boolean
  fileName?: string
  fileSize?: number
  uploadedAt?: string
}

interface Documents {
  requirements: DocumentRequirement[]
  additionalNotes: string
  uploadProgress: number
}

interface DocumentsStepProps {
  data: Partial<Documents>
  onComplete: (data: Documents, isValid: boolean) => void
}

const baseDocumentRequirements: Omit<DocumentRequirement, 'uploaded' | 'fileName' | 'fileSize' | 'uploadedAt'>[] = [
  {
    id: 'passport',
    name: 'Passport Copy',
    description: 'Clear copy of passport bio page and any pages with stamps',
    category: 'required',
    maxSize: 5,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png']
  },
  {
    id: 'photo',
    name: 'Passport Photo',
    description: 'Recent passport-sized photo (35mm x 45mm) with white background',
    category: 'required',
    maxSize: 2,
    acceptedFormats: ['jpg', 'jpeg', 'png']
  },
  {
    id: 'application_form',
    name: 'Visa Application Form',
    description: 'Completed and signed visa application form',
    category: 'required',
    maxSize: 10,
    acceptedFormats: ['pdf']
  },
  {
    id: 'travel_insurance',
    name: 'Travel Insurance',
    description: 'Valid travel insurance covering minimum €30,000',
    category: 'required',
    maxSize: 5,
    acceptedFormats: ['pdf']
  },
  {
    id: 'accommodation',
    name: 'Accommodation Proof',
    description: 'Hotel booking, invitation letter, or rental agreement',
    category: 'required',
    maxSize: 5,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png']
  },
  {
    id: 'flight_booking',
    name: 'Flight Reservation',
    description: 'Round-trip flight reservation (not purchased ticket)',
    category: 'required',
    maxSize: 5,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png']
  },
  {
    id: 'bank_statement',
    name: 'Bank Statements',
    description: 'Last 3-6 months bank statements showing sufficient funds',
    category: 'required',
    maxSize: 10,
    acceptedFormats: ['pdf']
  },
  {
    id: 'employment_letter',
    name: 'Employment Letter',
    description: 'Letter from employer confirming employment and leave approval',
    category: 'required',
    maxSize: 5,
    acceptedFormats: ['pdf']
  },
  {
    id: 'invitation_letter',
    name: 'Invitation Letter',
    description: 'If visiting someone, invitation letter from host',
    category: 'optional',
    maxSize: 5,
    acceptedFormats: ['pdf']
  },
  {
    id: 'marriage_certificate',
    name: 'Marriage Certificate',
    description: 'If traveling with spouse or for family reunion',
    category: 'optional',
    maxSize: 5,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png']
  },
  {
    id: 'birth_certificate',
    name: 'Birth Certificate',
    description: 'For minors or family applications',
    category: 'optional',
    maxSize: 5,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png']
  },
  {
    id: 'property_deed',
    name: 'Property Ownership',
    description: 'Property deeds as proof of ties to home country',
    category: 'optional',
    maxSize: 10,
    acceptedFormats: ['pdf']
  }
]

export default function DocumentsStep({ data, onComplete }: DocumentsStepProps) {
  const [formData, setFormData] = useState<Documents>({
    requirements: baseDocumentRequirements.map(req => ({
      ...req,
      uploaded: false
    })),
    additionalNotes: '',
    uploadProgress: 0,
    ...data
  })

  useEffect(() => {
    const isValid = validateForm()
    onComplete(formData, isValid)
  }, [formData])

  const validateForm = () => {
    // All required documents must be uploaded
    const requiredDocs = formData.requirements.filter(doc => doc.category === 'required')
    return requiredDocs.every(doc => doc.uploaded)
  }

  const handleFileUpload = (docId: string, file: File) => {
    // Simulate file upload
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map(req => 
        req.id === docId 
          ? {
              ...req,
              uploaded: true,
              fileName: file.name,
              fileSize: file.size / (1024 * 1024), // Convert to MB
              uploadedAt: new Date().toISOString()
            }
          : req
      )
    }))

    // Update progress
    updateUploadProgress()
  }

  const handleFileRemove = (docId: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map(req => 
        req.id === docId 
          ? {
              ...req,
              uploaded: false,
              fileName: undefined,
              fileSize: undefined,
              uploadedAt: undefined
            }
          : req
      )
    }))

    updateUploadProgress()
  }

  const updateUploadProgress = () => {
    setTimeout(() => {
      const total = formData.requirements.length
      const uploaded = formData.requirements.filter(doc => doc.uploaded).length
      const progress = Math.round((uploaded / total) * 100)
      
      setFormData(prev => ({
        ...prev,
        uploadProgress: progress
      }))
    }, 100)
  }

  const getUploadedCount = () => {
    return formData.requirements.filter(doc => doc.uploaded).length
  }

  const getRequiredCount = () => {
    return formData.requirements.filter(doc => doc.category === 'required').length
  }

  const getRequiredUploadedCount = () => {
    return formData.requirements.filter(doc => doc.category === 'required' && doc.uploaded).length
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Upload Progress</span>
            <span className="text-sm font-normal">
              {getUploadedCount()} of {formData.requirements.length} documents uploaded
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={formData.uploadProgress} className="h-3" />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{getRequiredUploadedCount()} of {getRequiredCount()} required documents</span>
            <span>{formData.uploadProgress}% complete</span>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> All documents should be clear, readable, and recent. 
          Documents in languages other than English or the destination country's language may need translation.
        </AlertDescription>
      </Alert>

      {/* Required Documents */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Required Documents
        </h3>
        <div className="grid gap-4">
          {formData.requirements
            .filter(doc => doc.category === 'required')
            .map(doc => (
              <Card key={doc.id} className={doc.uploaded ? 'border-green-200' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {doc.uploaded ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-400" />
                        )}
                        <h4 className="font-medium">{doc.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                      
                      {doc.uploaded && doc.fileName ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                          <File className="h-4 w-4" />
                          <span>{doc.fileName}</span>
                          <span>({doc.fileSize?.toFixed(2)} MB)</span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          <p>Max size: {doc.maxSize} MB</p>
                          <p>Formats: {doc.acceptedFormats.join(', ')}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      <DocumentUploader
                        accept={doc.acceptedFormats.map(f => `.${f}`).join(',')}
                        maxSize={doc.maxSize * 1024 * 1024}
                        onUploadComplete={(file) => handleFileUpload(doc.id, file)}
                        onRemove={() => handleFileRemove(doc.id)}
                        uploaded={doc.uploaded}
                        compact
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Optional Documents */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Optional Documents
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          These documents may strengthen your application but are not mandatory
        </p>
        <div className="grid gap-4">
          {formData.requirements
            .filter(doc => doc.category === 'optional')
            .map(doc => (
              <Card key={doc.id} className={doc.uploaded ? 'border-green-200' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {doc.uploaded ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Upload className="h-5 w-5 text-gray-400" />
                        )}
                        <h4 className="font-medium">{doc.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                      
                      {doc.uploaded && doc.fileName ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                          <File className="h-4 w-4" />
                          <span>{doc.fileName}</span>
                          <span>({doc.fileSize?.toFixed(2)} MB)</span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          <p>Max size: {doc.maxSize} MB</p>
                          <p>Formats: {doc.acceptedFormats.join(', ')}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      <DocumentUploader
                        accept={doc.acceptedFormats.map(f => `.${f}`).join(',')}
                        maxSize={doc.maxSize * 1024 * 1024}
                        onUploadComplete={(file) => handleFileUpload(doc.id, file)}
                        onRemove={() => handleFileRemove(doc.id)}
                        uploaded={doc.uploaded}
                        compact
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Additional Notes</h3>
        <textarea
          value={formData.additionalNotes}
          onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
          placeholder="Any additional information about your documents..."
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
        />
      </div>
    </div>
  )
}