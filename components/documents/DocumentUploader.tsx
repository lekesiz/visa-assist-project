'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle,
  File,
  FileImage,
  Loader2
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'

interface DocumentUploaderProps {
  applicationId: string
  documentType?: string
  onUploadComplete?: (document: any) => void
  onError?: (error: string) => void
  maxFileSize?: number // in MB
  acceptedFileTypes?: string[]
}

const defaultAcceptedTypes = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp']
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

export function DocumentUploader({
  applicationId,
  documentType = 'other',
  onUploadComplete,
  onError,
  maxFileSize = 10, // 10MB default
  acceptedFileTypes = Object.keys(defaultAcceptedTypes)
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null)

    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(file => {
        if (file.file.size > maxFileSize * 1024 * 1024) {
          return `${file.file.name} is too large (max ${maxFileSize}MB)`
        }
        return `${file.file.name} is not an accepted file type`
      })
      setError(errors.join(', '))
      onError?.(errors.join(', '))
      return
    }

    setUploadedFiles(prev => [...prev, ...acceptedFiles])
  }, [maxFileSize, onError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = defaultAcceptedTypes[type] || []
      return acc
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize * 1024 * 1024,
    multiple: false
  })

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i]
        setUploadProgress((i / uploadedFiles.length) * 100)

        if (DemoService.isDemoMode()) {
          // Demo mode upload
          const { data, error } = await DemoService.uploadDocument(
            file,
            applicationId,
            documentType
          )
          if (error) throw error
          onUploadComplete?.(data)
        } else {
          // Real upload to Supabase Storage
          const fileExt = file.name.split('.').pop()
          const fileName = `${applicationId}/${documentType}/${Date.now()}.${fileExt}`
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, file)

          if (uploadError) throw uploadError

          // Create document record in database
          const response = await fetch('/api/documents/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              application_id: applicationId,
              document_type: documentType,
              file_name: file.name,
              file_path: uploadData.path,
              file_size: file.size,
              mime_type: file.type
            })
          })

          if (!response.ok) throw new Error('Failed to save document record')
          
          const { data } = await response.json()
          onUploadComplete?.(data)
        }
      }

      setUploadProgress(100)
      setTimeout(() => {
        setUploadedFiles([])
        setUploadProgress(0)
      }, 1500)
    } catch (err: any) {
      setError(err.message)
      onError?.(err.message)
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="h-8 w-8 text-blue-500" />
    }
    if (file.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />
    }
    return <File className="h-8 w-8 text-gray-500" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{documentTypeLabels[documentType] || 'Document'} Upload</CardTitle>
        <CardDescription>
          Upload files up to {maxFileSize}MB. Accepted formats: PDF, JPG, PNG
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-blue-600 font-medium">Drop the file here...</p>
          ) : (
            <>
              <p className="text-gray-600 font-medium mb-2">
                Drag & drop your file here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Maximum file size: {maxFileSize}MB
              </p>
            </>
          )}
        </div>

        {/* Uploaded Files Preview */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                {getFileIcon(file)}
                <div className="flex-1">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {uploading && uploadProgress === 100 && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Uploading...</span>
              <span className="font-medium">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Upload Button */}
        {uploadedFiles.length > 0 && !uploading && (
          <Button onClick={handleUpload} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Upload {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}
          </Button>
        )}

        {uploading && (
          <Button disabled className="w-full">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </Button>
        )}
      </CardContent>
    </Card>
  )
}