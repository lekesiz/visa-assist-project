import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get all notes for an application
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify application belongs to user
    const { data: application } = await supabase
      .from('applications')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Get all notes for the application
    const { data: notes, error } = await supabase
      .from('application_notes')
      .select(`
        *,
        user:created_by (
          id,
          email
        )
      `)
      .eq('application_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      notes: notes || []
    })

  } catch (error) {
    console.error('Failed to fetch notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

// POST - Add a new note to an application
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { note, note_type = 'general' } = await request.json()

    if (!note || note.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      )
    }

    // Verify application belongs to user
    const { data: application } = await supabase
      .from('applications')
      .select('id, status')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Create the note
    const { data: newNote, error } = await supabase
      .from('application_notes')
      .insert({
        application_id: params.id,
        note: note.trim(),
        note_type,
        created_by: user.id,
        is_system_note: false
      })
      .select(`
        *,
        user:created_by (
          id,
          email
        )
      `)
      .single()

    if (error) {
      throw error
    }

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        entity_type: 'application_note',
        entity_id: newNote.id,
        action: 'created',
        details: {
          application_id: params.id,
          note_type
        }
      })

    return NextResponse.json({
      success: true,
      note: newNote,
      message: 'Note added successfully'
    })

  } catch (error) {
    console.error('Failed to add note:', error)
    return NextResponse.json(
      { error: 'Failed to add note' },
      { status: 500 }
    )
  }
}

// PUT - Update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { note_id, note } = await request.json()

    if (!note_id || !note || note.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note ID and content are required' },
        { status: 400 }
      )
    }

    // Verify the note belongs to the user
    const { data: existingNote } = await supabase
      .from('application_notes')
      .select('id, created_by')
      .eq('id', note_id)
      .eq('application_id', params.id)
      .single()

    if (!existingNote || existingNote.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Note not found or unauthorized' },
        { status: 404 }
      )
    }

    // Update the note
    const { data: updatedNote, error } = await supabase
      .from('application_notes')
      .update({
        note: note.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', note_id)
      .select(`
        *,
        user:created_by (
          id,
          email
        )
      `)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      note: updatedNote,
      message: 'Note updated successfully'
    })

  } catch (error) {
    console.error('Failed to update note:', error)
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('note_id')

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      )
    }

    // Verify the note belongs to the user
    const { data: existingNote } = await supabase
      .from('application_notes')
      .select('id, created_by, is_system_note')
      .eq('id', noteId)
      .eq('application_id', params.id)
      .single()

    if (!existingNote || existingNote.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Note not found or unauthorized' },
        { status: 404 }
      )
    }

    if (existingNote.is_system_note) {
      return NextResponse.json(
        { error: 'System notes cannot be deleted' },
        { status: 400 }
      )
    }

    // Delete the note
    const { error } = await supabase
      .from('application_notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete note:', error)
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    )
  }
}