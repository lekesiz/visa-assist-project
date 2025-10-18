import React from 'react'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { DocumentUploader } from '@/components/documents/DocumentUploader'
import { DemoService } from '@/lib/demo/demo-service'
import { 
  render, 
  mockSuccessfulApiResponse,
  mockFailedApiResponse,
  expectToRenderWithoutCrashing
} from '../utils/test-utils'

// Mock react-dropzone
const mockUseDropzone = jest.fn()
jest.mock('react-dropzone', () => ({
  useDropzone: (config: any) => mockUseDropzone(config)
}))

// Mock the UI components to avoid styling dependencies
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'card', ...props }, children),
  CardContent: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'card-content', ...props }, children),
  CardDescription: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'card-description', ...props }, children),
  CardHeader: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'card-header', ...props }, children),
  CardTitle: ({ children, ...props }: any) => React.createElement('h3', { 'data-testid': 'card-title', ...props }, children),
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => 
    React.createElement('button', { 
      onClick, 
      disabled, 
      className,
      'data-testid': 'button',
      ...props 
    }, children)
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, ...props }: any) => 
    React.createElement('div', { 
      'data-testid': 'alert', 
      'data-variant': variant,
      ...props 
    }, children),
  AlertDescription: ({ children, ...props }: any) => 
    React.createElement('div', { 'data-testid': 'alert-description', ...props }, children),
}))

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className, ...props }: any) => 
    React.createElement('div', { 
      'data-testid': 'progress',
      'data-value': value,
      className,
      ...props 
    })
}))

// Mock Supabase storage
const mockSupabaseStorage = {
  upload: jest.fn()
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => mockSupabaseStorage)
    }
  }))
}))

// Mock Demo Service
jest.mock('@/lib/demo/demo-service', () => ({
  DemoService: {
    isDemoMode: jest.fn(),
    uploadDocument: jest.fn()
  }
}))

// Mock File constructor for testing
global.File = class File {
  constructor(
    public bits: BlobPart[],
    public name: string,
    public options: FilePropertyBag = {}
  ) {
    this.size = options.size || 1024 * 1024 // 1MB default
    this.type = options.type || 'application/pdf'
    this.lastModified = options.lastModified || Date.now()
  }
  
  size: number
  type: string
  lastModified: number
} as any

describe('DocumentUploader', () => {
  const defaultProps = {
    applicationId: 'test-app-1',
    documentType: 'passport',
    onUploadComplete: jest.fn(),
    onError: jest.fn()
  }

  // Mock dropzone behavior
  const mockDropzoneMethods = {
    getRootProps: jest.fn(() => ({ 'data-testid': 'dropzone' })),
    getInputProps: jest.fn(() => ({ 'data-testid': 'file-input' })),
    isDragActive: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDropzone.mockReturnValue(mockDropzoneMethods)
    ;(DemoService.isDemoMode as jest.Mock).mockReturnValue(false)
    global.fetch = jest.fn()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expectToRenderWithoutCrashing(DocumentUploader, defaultProps)
    })

    it('displays correct document type title', () => {
      render(<DocumentUploader {...defaultProps} />)
      expect(screen.getByText('Passport Upload')).toBeInTheDocument()
    })

    it('displays default title for unknown document type', () => {
      render(<DocumentUploader {...defaultProps} documentType="unknown" />)
      expect(screen.getByText('Document Upload')).toBeInTheDocument()
    })

    it('displays file size and format information', () => {
      render(<DocumentUploader {...defaultProps} maxFileSize={5} />)
      expect(screen.getByText(/Upload files up to 5MB/)).toBeInTheDocument()
      expect(screen.getByText(/Accepted formats: PDF, JPG, PNG/)).toBeInTheDocument()
    })

    it('renders drop zone with proper styling', () => {
      render(<DocumentUploader {...defaultProps} />)
      const dropzone = screen.getByTestId('dropzone')
      expect(dropzone).toBeInTheDocument()
    })

    it('shows upload icon and instructions', () => {
      render(<DocumentUploader {...defaultProps} />)
      expect(screen.getByText('Drag & drop your file here, or click to browse')).toBeInTheDocument()
      expect(screen.getByText(/Maximum file size:/)).toBeInTheDocument()
    })
  })

  describe('Drag and Drop States', () => {
    it('displays active drag state', () => {
      mockUseDropzone.mockReturnValue({
        ...mockDropzoneMethods,
        isDragActive: true
      })
      
      render(<DocumentUploader {...defaultProps} />)
      expect(screen.getByText('Drop the file here...')).toBeInTheDocument()
    })

    it('applies correct CSS classes during drag', () => {
      mockUseDropzone.mockReturnValue({
        ...mockDropzoneMethods,
        isDragActive: true
      })
      
      render(<DocumentUploader {...defaultProps} />)
      const dropzone = screen.getByTestId('dropzone')
      expect(dropzone).toHaveClass('border-blue-500', 'bg-blue-50')
    })

    it('uses default styling when not dragging', () => {
      render(<DocumentUploader {...defaultProps} />)
      const dropzone = screen.getByTestId('dropzone')
      expect(dropzone).toHaveClass('border-gray-300')
    })
  })

  describe('File Selection and Preview', () => {
    it('displays selected files', () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf', size: 1024 })
      
      // Simulate file selection
      mockUseDropzone.mockImplementation((config) => {
        // Simulate file drop
        setTimeout(() => config.onDrop([mockFile], []), 0)
        return mockDropzoneMethods
      })

      render(<DocumentUploader {...defaultProps} />)

      waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
        expect(screen.getByText('0.00 MB')).toBeInTheDocument()
      })
    })

    it('shows correct file icons for different file types', () => {
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      
      // Test PDF icon
      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([pdfFile], []), 0)
        return mockDropzoneMethods
      })

      const { rerender } = render(<DocumentUploader {...defaultProps} />)

      // Test image icon
      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([imageFile], []), 0)
        return mockDropzoneMethods
      })

      rerender(<DocumentUploader {...defaultProps} />)
    })

    it('allows removing selected files', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      
      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([mockFile], []), 0)
        return mockDropzoneMethods
      })

      const { user } = render(<DocumentUploader {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getAllByText('test.pdf')).toHaveLength(1)
      })

      const removeButtons = screen.getAllByRole('button')
      const removeButton = removeButtons.find(btn => btn.getAttribute('variant') === 'ghost')
      await user.click(removeButton!)

      await waitFor(() => {
        expect(screen.queryByText('test.pdf')).not.toBeInTheDocument()
      })
    })
  })

  describe('File Validation', () => {
    it('handles rejected files due to size', () => {
      const rejectedFile = {
        file: new File(['content'], 'large.pdf', { size: 20 * 1024 * 1024 }), // 20MB
        errors: [{ code: 'file-too-large' }]
      }

      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([], [rejectedFile]), 0)
        return mockDropzoneMethods
      })

      render(<DocumentUploader {...defaultProps} maxFileSize={10} />)

      waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument()
        expect(screen.getByText(/is too large \(max 10MB\)/)).toBeInTheDocument()
      })
    })

    it('handles rejected files due to type', () => {
      const rejectedFile = {
        file: new File(['content'], 'document.txt', { type: 'text/plain' }),
        errors: [{ code: 'file-invalid-type' }]
      }

      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([], [rejectedFile]), 0)
        return mockDropzoneMethods
      })

      render(<DocumentUploader {...defaultProps} />)

      waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument()
        expect(screen.getByText(/is not an accepted file type/)).toBeInTheDocument()
      })
    })

    it('calls onError callback for validation errors', () => {
      const rejectedFile = {
        file: new File(['content'], 'large.pdf', { size: 20 * 1024 * 1024 }),
        errors: [{ code: 'file-too-large' }]
      }

      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([], [rejectedFile]), 0)
        return mockDropzoneMethods
      })

      render(<DocumentUploader {...defaultProps} />)

      waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith(
          expect.stringContaining('is too large')
        )
      })
    })
  })

  describe('Upload Process - Demo Mode', () => {
    beforeEach(() => {
      ;(DemoService.isDemoMode as jest.Mock).mockReturnValue(true)
    })

    it('successfully uploads file in demo mode', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const mockDocumentData = { id: 'doc-1', name: 'test.pdf' }

      ;(DemoService.uploadDocument as jest.Mock).mockResolvedValue({
        data: mockDocumentData,
        error: null
      })

      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([mockFile], []), 0)
        return mockDropzoneMethods
      })

      const { user } = render(<DocumentUploader {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })

      const uploadButton = screen.getByText(/Upload 1 file/)
      await user.click(uploadButton)

      await waitFor(() => {
        expect(DemoService.uploadDocument).toHaveBeenCalledWith(
          mockFile,
          'test-app-1',
          'passport'
        )
        expect(defaultProps.onUploadComplete).toHaveBeenCalledWith(mockDocumentData)
      })
    })

    it('handles demo mode upload error', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const errorMessage = 'Demo upload failed'

      ;(DemoService.uploadDocument as jest.Mock).mockResolvedValue({
        data: null,
        error: errorMessage
      })

      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([mockFile], []), 0)
        return mockDropzoneMethods
      })

      const { user } = render(<DocumentUploader {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })

      const uploadButton = screen.getByText(/Upload 1 file/)
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument()
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
        expect(defaultProps.onError).toHaveBeenCalledWith(errorMessage)
      })
    })
  })

  describe('Upload Process - Real Mode', () => {
    beforeEach(() => {
      ;(DemoService.isDemoMode as jest.Mock).mockReturnValue(false)
    })

    it('successfully uploads file in real mode', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const mockUploadData = { path: 'uploads/test.pdf' }
      const mockDocumentData = { id: 'doc-1', name: 'test.pdf' }

      mockSupabaseStorage.upload.mockResolvedValue({
        data: mockUploadData,
        error: null
      })

      mockSuccessfulApiResponse({ data: mockDocumentData })

      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([mockFile], []), 0)
        return mockDropzoneMethods
      })

      const { user } = render(<DocumentUploader {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })

      const uploadButton = screen.getByText(/Upload 1 file/)
      await user.click(uploadButton)

      await waitFor(() => {
        expect(mockSupabaseStorage.upload).toHaveBeenCalled()
        expect(global.fetch).toHaveBeenCalledWith('/api/documents/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            application_id: 'test-app-1',
            document_type: 'passport',
            file_name: 'test.pdf',
            file_path: 'uploads/test.pdf',
            file_size: mockFile.size,
            mime_type: 'application/pdf'
          })
        })
        expect(defaultProps.onUploadComplete).toHaveBeenCalledWith(mockDocumentData)
      })
    })

    it('handles storage upload error', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const storageError = new Error('Storage upload failed')

      mockSupabaseStorage.upload.mockResolvedValue({
        data: null,
        error: storageError
      })

      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([mockFile], []), 0)
        return mockDropzoneMethods
      })

      const { user } = render(<DocumentUploader {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })

      const uploadButton = screen.getByText(/Upload 1 file/)
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument()
        expect(screen.getByText('Storage upload failed')).toBeInTheDocument()
        expect(defaultProps.onError).toHaveBeenCalledWith('Storage upload failed')
      })
    })

    it('handles API error after successful storage upload', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const mockUploadData = { path: 'uploads/test.pdf' }

      mockSupabaseStorage.upload.mockResolvedValue({
        data: mockUploadData,
        error: null
      })

      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: false,
          status: 500
        })
      ) as jest.Mock

      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([mockFile], []), 0)
        return mockDropzoneMethods
      })

      const { user } = render(<DocumentUploader {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })

      const uploadButton = screen.getByText(/Upload 1 file/)
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument()
        expect(screen.getByText('Failed to save document record')).toBeInTheDocument()
      })
    })
  })

  describe('Upload Progress', () => {
    it('shows progress during upload', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      ;(DemoService.isDemoMode as jest.Mock).mockReturnValue(true)
      ;(DemoService.uploadDocument as jest.Mock).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: { id: 'doc-1' }, error: null }), 100)
        )
      )

      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([mockFile], []), 0)
        return mockDropzoneMethods
      })

      const { user } = render(<DocumentUploader {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })

      const uploadButton = screen.getByText(/Upload 1 file/)
      await user.click(uploadButton)

      // Should show uploading state
      expect(screen.getByText('Uploading...')).toBeInTheDocument()
      expect(screen.getByTestId('progress')).toBeInTheDocument()
      await waitFor(() => {
        const uploadingButton = screen.getAllByRole('button').find(btn => 
          btn.textContent?.includes('Uploading')
        )
        expect(uploadingButton).toBeDisabled()
      })

      await waitFor(() => {
        expect(defaultProps.onUploadComplete).toHaveBeenCalled()
      })
    })

    it('disables dropzone during upload', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      ;(DemoService.isDemoMode as jest.Mock).mockReturnValue(true)
      ;(DemoService.uploadDocument as jest.Mock).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: { id: 'doc-1' }, error: null }), 100)
        )
      )

      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([mockFile], []), 0)
        return mockDropzoneMethods
      })

      const { user } = render(<DocumentUploader {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })

      const uploadButton = screen.getByText(/Upload 1 file/)
      await user.click(uploadButton)

      const dropzone = screen.getByTestId('dropzone')
      expect(dropzone).toHaveClass('pointer-events-none', 'opacity-50')
    })

    it('clears files after successful upload', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      ;(DemoService.isDemoMode as jest.Mock).mockReturnValue(true)
      ;(DemoService.uploadDocument as jest.Mock).mockResolvedValue({
        data: { id: 'doc-1' },
        error: null
      })

      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([mockFile], []), 0)
        return mockDropzoneMethods
      })

      const { user } = render(<DocumentUploader {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })

      const uploadButton = screen.getByText(/Upload 1 file/)
      await user.click(uploadButton)

      await waitFor(() => {
        expect(defaultProps.onUploadComplete).toHaveBeenCalled()
      })

      // Files should be cleared after a delay
      await waitFor(() => {
        expect(screen.queryByText('test.pdf')).not.toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  describe('Props Configuration', () => {
    it('accepts custom accepted file types', () => {
      const customAcceptedTypes = ['application/pdf']
      
      render(
        <DocumentUploader 
          {...defaultProps} 
          acceptedFileTypes={customAcceptedTypes} 
        />
      )

      expect(mockUseDropzone).toHaveBeenCalledWith(
        expect.objectContaining({
          accept: { 'application/pdf': ['.pdf'] }
        })
      )
    })

    it('accepts custom max file size', () => {
      render(
        <DocumentUploader 
          {...defaultProps} 
          maxFileSize={5} 
        />
      )

      expect(mockUseDropzone).toHaveBeenCalledWith(
        expect.objectContaining({
          maxSize: 5 * 1024 * 1024
        })
      )
    })

    it('disables multiple file selection', () => {
      render(<DocumentUploader {...defaultProps} />)

      expect(mockUseDropzone).toHaveBeenCalledWith(
        expect.objectContaining({
          multiple: false
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('clears previous errors when new files are selected', () => {
      // First, trigger an error
      const rejectedFile = {
        file: new File(['content'], 'large.pdf', { size: 20 * 1024 * 1024 }),
        errors: [{ code: 'file-too-large' }]
      }

      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([], [rejectedFile]), 0)
        return mockDropzoneMethods
      })

      const { rerender } = render(<DocumentUploader {...defaultProps} />)

      waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument()
      })

      // Then select a valid file
      const validFile = new File(['content'], 'valid.pdf', { type: 'application/pdf' })

      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([validFile], []), 0)
        return mockDropzoneMethods
      })

      rerender(<DocumentUploader {...defaultProps} />)

      waitFor(() => {
        expect(screen.queryByTestId('alert')).not.toBeInTheDocument()
      })
    })

    it('displays generic error for unexpected errors', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      ;(DemoService.isDemoMode as jest.Mock).mockReturnValue(true)
      ;(DemoService.uploadDocument as jest.Mock).mockRejectedValue(new Error('Unexpected error'))

      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([mockFile], []), 0)
        return mockDropzoneMethods
      })

      const { user } = render(<DocumentUploader {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })

      const uploadButton = screen.getByText(/Upload 1 file/)
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument()
        expect(screen.getByText('Unexpected error')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('provides proper file input', () => {
      render(<DocumentUploader {...defaultProps} />)
      expect(screen.getByTestId('file-input')).toBeInTheDocument()
    })

    it('has descriptive upload button text', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([mockFile], []), 0)
        return mockDropzoneMethods
      })

      render(<DocumentUploader {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Upload 1 file/)).toBeInTheDocument()
      })
    })

    it('maintains focus management during upload', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      ;(DemoService.isDemoMode as jest.Mock).mockReturnValue(true)
      ;(DemoService.uploadDocument as jest.Mock).mockResolvedValue({
        data: { id: 'doc-1' },
        error: null
      })

      mockUseDropzone.mockImplementation((config) => {
        setTimeout(() => config.onDrop([mockFile], []), 0)
        return mockDropzoneMethods
      })

      const { user } = render(<DocumentUploader {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })

      const uploadButton = screen.getByText(/Upload 1 file/)
      await user.click(uploadButton)

      // Button should be disabled during upload
      await waitFor(() => {
        const uploadingButton = screen.getAllByRole('button').find(btn => 
          btn.textContent?.includes('Uploading')
        )
        expect(uploadingButton).toBeDisabled()
      })
    })
  })
})