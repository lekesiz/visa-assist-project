'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  X, 
  Download, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut,
  RotateCw,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface DocumentViewerProps {
  document: {
    id: string
    file_name: string
    file_url: string
    file_size: number
    mime_type: string
    document_type: string
  }
  isOpen: boolean
  onClose: () => void
  onDownload?: () => void
}

export function DocumentViewer({ 
  document, 
  isOpen, 
  onClose,
  onDownload
}: DocumentViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  const handleDownload = async () => {
    if (onDownload) {
      onDownload()
      return
    }

    // Default download behavior
    try {
      const response = await fetch(document.file_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = document.file_name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError('Failed to download document')
    }
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const isPDF = document.mime_type === 'application/pdf'
  const isImage = document.mime_type.startsWith('image/')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-medium">
              {document.file_name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              {isImage && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[50px] text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRotate}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-gray-200" />
                </>
              )}
              
              {/* Action Buttons */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-gray-100">
          {loading && !error && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full p-8">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* PDF Viewer */}
          {isPDF && (
            <iframe
              src={`${document.file_url}#toolbar=0`}
              className="w-full h-full border-0"
              onLoad={() => setLoading(false)}
              onError={() => {
                setError('Failed to load PDF. The document might not be available.')
                setLoading(false)
              }}
            />
          )}

          {/* Image Viewer */}
          {isImage && (
            <div className="h-full overflow-auto flex items-center justify-center p-8">
              <img
                src={document.file_url}
                alt={document.file_name}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center'
                }}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setError('Failed to load image')
                  setLoading(false)
                }}
              />
            </div>
          )}

          {/* Unsupported File Type */}
          {!isPDF && !isImage && (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium mb-2">
                Preview not available for this file type
              </p>
              <p className="text-sm text-gray-500 mb-6">
                File type: {document.mime_type}
              </p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between text-sm text-gray-600">
          <span>
            Type: {document.document_type} • Size: {(document.file_size / 1024 / 1024).toFixed(2)} MB
          </span>
          {!error && (isPDF || isImage) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(document.file_url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Mini preview component for document lists
interface DocumentPreviewProps {
  document: {
    file_name: string
    mime_type: string
    file_size: number
  }
  onClick?: () => void
}

export function DocumentPreview({ document, onClick }: DocumentPreviewProps) {
  const isPDF = document.mime_type === 'application/pdf'
  const isImage = document.mime_type.startsWith('image/')

  return (
    <div
      className="relative group cursor-pointer"
      onClick={onClick}
    >
      <div className="w-20 h-20 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden">
        {isPDF && (
          <FileText className="h-10 w-10 text-red-500" />
        )}
        {isImage && (
          <div className="text-xs text-gray-500">IMG</div>
        )}
        {!isPDF && !isImage && (
          <FileText className="h-10 w-10 text-gray-400" />
        )}
      </div>
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all" />
      <p className="text-xs text-gray-600 mt-1 truncate w-20" title={document.file_name}>
        {document.file_name}
      </p>
    </div>
  )
}