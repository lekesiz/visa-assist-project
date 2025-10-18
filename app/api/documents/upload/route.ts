import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string
    const applicationId = formData.get('applicationId') as string | null

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'File and document type are required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPEG, and PNG are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${documentType}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${fileExt}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Calculate file hash for integrity
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex')

    // Save document metadata to database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        application_id: applicationId,
        document_type: documentType,
        original_filename: file.name,
        storage_path: fileName,
        file_size: file.size,
        file_hash: fileHash,
        mime_type: file.type,
        verification_status: 'pending',
        ai_analysis_status: 'pending',
        virus_scan_status: 'pending',
        is_encrypted: true
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to delete the uploaded file
      await supabase.storage.from('documents').remove([fileName])
      
      return NextResponse.json(
        { error: 'Failed to save document metadata' },
        { status: 500 }
      )
    }

    // TODO: Trigger AI analysis in background
    // TODO: Trigger virus scan in background

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        documentType: document.document_type,
        fileName: document.original_filename,
        uploadedAt: document.upload_date,
        status: document.verification_status
      }
    })

  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to list documents
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')

    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (applicationId) {
      query = query.eq('application_id', applicationId)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      documents: documents || []
    })

  } catch (error) {
    console.error('Document list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}