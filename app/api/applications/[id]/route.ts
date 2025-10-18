import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get a single application by ID
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

    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        documents:documents(*),
        appointments:appointments(*),
        payments:payments(
          id,
          amount,
          currency,
          status,
          payment_type,
          created_at
        ),
        ai_analyses:ai_analyses(
          analysis_type,
          result,
          confidence_score,
          created_at
        ),
        notes:application_notes(
          id,
          note,
          created_at,
          created_by
        )
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        )
      }
      throw error
    }

    // Calculate completion percentage based on checklist
    if (application.checklist_items) {
      const requiredItems = application.checklist_items.filter((item: any) => item.required)
      const completedRequired = requiredItems.filter((item: any) => item.completed)
      application.completion_percentage = Math.round(
        (completedRequired.length / requiredItems.length) * 100
      )
    }

    return NextResponse.json({
      success: true,
      application
    })

  } catch (error) {
    console.error('Failed to fetch application:', error)
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    )
  }
}

// PUT - Update an application
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

    const body = await request.json()

    // Remove fields that shouldn't be updated directly
    const { user_id, created_at, id, ...updateData } = body

    // Validate the application belongs to the user
    const { data: existingApp, error: fetchError } = await supabase
      .from('applications')
      .select('id, status')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingApp) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Prevent updates to submitted applications
    if (existingApp.status === 'submitted' || existingApp.status === 'approved') {
      return NextResponse.json(
        { error: 'Cannot modify submitted or approved applications' },
        { status: 400 }
      )
    }

    // Update progress if checklist items are being updated
    if (updateData.checklist_items) {
      const requiredItems = updateData.checklist_items.filter((item: any) => item.required)
      const completedRequired = requiredItems.filter((item: any) => item.completed)
      updateData.progress_percentage = Math.round(
        (completedRequired.length / requiredItems.length) * 100
      )
      
      // Update current step based on progress
      updateData.current_step = Math.floor((updateData.progress_percentage / 100) * 8) + 1
    }

    // Update the application
    const { data: application, error: updateError } = await supabase
      .from('applications')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        entity_type: 'application',
        entity_id: params.id,
        action: 'updated',
        details: {
          fields_updated: Object.keys(updateData),
          status: updateData.status
        }
      })

    return NextResponse.json({
      success: true,
      application,
      message: 'Application updated successfully'
    })

  } catch (error) {
    console.error('Failed to update application:', error)
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel/Delete an application
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

    // Check if application exists and belongs to user
    const { data: existingApp, error: fetchError } = await supabase
      .from('applications')
      .select('id, status')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingApp) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of draft applications
    if (existingApp.status !== 'draft') {
      // For non-draft applications, update status to cancelled instead
      const { data, error } = await supabase
        .from('applications')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Log the activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          entity_type: 'application',
          entity_id: params.id,
          action: 'cancelled',
          details: {
            previous_status: existingApp.status
          }
        })

      return NextResponse.json({
        success: true,
        message: 'Application cancelled successfully',
        application: data
      })
    }

    // For draft applications, actually delete them
    const { error: deleteError } = await supabase
      .from('applications')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (deleteError) {
      throw deleteError
    }

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        entity_type: 'application',
        entity_id: params.id,
        action: 'deleted',
        details: {
          status: existingApp.status
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete application:', error)
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    )
  }
}

// PATCH - Partial update (for specific actions like submit, approve, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, ...data } = await request.json()

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Get current application
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}
    
    switch (action) {
      case 'submit':
        // Validate all required documents are uploaded
        if (application.progress_percentage < 100) {
          return NextResponse.json(
            { error: 'Please complete all required steps before submitting' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'submitted',
          submitted_at: new Date().toISOString()
        }
        break

      case 'withdraw':
        if (application.status !== 'submitted') {
          return NextResponse.json(
            { error: 'Can only withdraw submitted applications' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'draft',
          submitted_at: null
        }
        break

      case 'archive':
        if (!['approved', 'rejected', 'cancelled'].includes(application.status)) {
          return NextResponse.json(
            { error: 'Can only archive completed applications' },
            { status: 400 }
          )
        }
        updateData = {
          is_archived: true
        }
        break

      case 'unarchive':
        updateData = {
          is_archived: false
        }
        break

      case 'update_checklist':
        if (!data.checklist_item_id || data.completed === undefined) {
          return NextResponse.json(
            { error: 'Checklist item ID and completed status are required' },
            { status: 400 }
          )
        }
        
        // Update specific checklist item
        const updatedChecklist = application.checklist_items.map((item: any) => 
          item.id === data.checklist_item_id 
            ? { ...item, completed: data.completed }
            : item
        )
        
        // Calculate new progress
        const requiredItems = updatedChecklist.filter((item: any) => item.required)
        const completedRequired = requiredItems.filter((item: any) => item.completed)
        const newProgress = Math.round((completedRequired.length / requiredItems.length) * 100)
        
        updateData = {
          checklist_items: updatedChecklist,
          progress_percentage: newProgress,
          current_step: Math.floor((newProgress / 100) * 8) + 1
        }
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    // Update the application
    const { data: updatedApp, error: updateError } = await supabase
      .from('applications')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Log the activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        entity_type: 'application',
        entity_id: params.id,
        action: action,
        details: data
      })

    return NextResponse.json({
      success: true,
      application: updatedApp,
      message: `Application ${action} successful`
    })

  } catch (error) {
    console.error('Failed to perform action:', error)
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    )
  }
}