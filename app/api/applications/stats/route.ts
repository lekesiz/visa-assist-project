import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get application statistics for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all applications for basic stats
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('id, status, visa_type, created_at, submitted_at, progress_percentage')
      .eq('user_id', user.id)

    if (appsError) {
      throw appsError
    }

    // Calculate statistics
    const stats = {
      total: applications?.length || 0,
      byStatus: {
        draft: 0,
        in_progress: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0
      },
      byVisaType: {} as Record<string, number>,
      averageCompletionTime: 0,
      currentActiveApplication: null as any,
      recentActivity: [] as any[]
    }

    // Count by status and visa type
    applications?.forEach(app => {
      // Count by status
      if (app.status in stats.byStatus) {
        stats.byStatus[app.status as keyof typeof stats.byStatus]++
      }

      // Count by visa type
      if (app.visa_type) {
        stats.byVisaType[app.visa_type] = (stats.byVisaType[app.visa_type] || 0) + 1
      }

      // Find current active application
      if (['draft', 'in_progress', 'submitted'].includes(app.status)) {
        if (!stats.currentActiveApplication || 
            new Date(app.created_at) > new Date(stats.currentActiveApplication.created_at)) {
          stats.currentActiveApplication = app
        }
      }
    })

    // Calculate average completion time for approved applications
    const approvedApps = applications?.filter(app => 
      app.status === 'approved' && app.submitted_at
    )
    
    if (approvedApps && approvedApps.length > 0) {
      const completionTimes = approvedApps.map(app => {
        const created = new Date(app.created_at)
        const submitted = new Date(app.submitted_at!)
        return submitted.getTime() - created.getTime()
      })
      
      const avgTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      stats.averageCompletionTime = Math.round(avgTime / (1000 * 60 * 60 * 24)) // Convert to days
    }

    // Get recent activity (last 10 activities)
    const { data: recentActivities } = await supabase
      .from('activity_logs')
      .select(`
        *,
        application:applications!entity_id (
          id,
          visa_type
        )
      `)
      .eq('user_id', user.id)
      .eq('entity_type', 'application')
      .order('created_at', { ascending: false })
      .limit(10)

    stats.recentActivity = recentActivities || []

    // Get document upload stats
    const { data: documentStats } = await supabase
      .from('documents')
      .select('verification_status')
      .eq('user_id', user.id)

    const docStats = {
      total: documentStats?.length || 0,
      verified: 0,
      pending: 0,
      rejected: 0
    }

    documentStats?.forEach(doc => {
      if (doc.verification_status === 'verified') docStats.verified++
      else if (doc.verification_status === 'rejected') docStats.rejected++
      else docStats.pending++
    })

    // Get appointment stats
    const { data: appointmentStats } = await supabase
      .from('appointments')
      .select('status')
      .eq('user_id', user.id)

    const apptStats = {
      total: appointmentStats?.length || 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0
    }

    appointmentStats?.forEach(appt => {
      if (appt.status === 'scheduled') apptStats.scheduled++
      else if (appt.status === 'completed') apptStats.completed++
      else if (appt.status === 'cancelled') apptStats.cancelled++
    })

    // Get payment stats
    const { data: paymentStats } = await supabase
      .from('payments')
      .select('amount, currency, status')
      .eq('user_id', user.id)

    const payStats = {
      total: paymentStats?.length || 0,
      totalAmount: 0,
      successful: 0,
      pending: 0,
      failed: 0
    }

    paymentStats?.forEach(payment => {
      if (payment.status === 'completed') {
        payStats.successful++
        payStats.totalAmount += payment.amount
      } else if (payment.status === 'pending') {
        payStats.pending++
      } else if (payment.status === 'failed') {
        payStats.failed++
      }
    })

    // Get next steps for active application
    let nextSteps = []
    if (stats.currentActiveApplication) {
      const { data: app } = await supabase
        .from('applications')
        .select('checklist_items')
        .eq('id', stats.currentActiveApplication.id)
        .single()

      if (app?.checklist_items) {
        nextSteps = app.checklist_items
          .filter((item: any) => !item.completed && item.required)
          .slice(0, 3)
          .map((item: any) => ({
            id: item.id,
            label: item.label,
            priority: 'high'
          }))
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        applications: stats,
        documents: docStats,
        appointments: apptStats,
        payments: payStats,
        nextSteps,
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Failed to fetch application stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

// POST - Generate detailed report
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reportType = 'summary', startDate, endDate, format = 'json' } = await request.json()

    // Build date filter
    let dateFilter: any = {}
    if (startDate) {
      dateFilter.created_at = { gte: startDate }
    }
    if (endDate) {
      dateFilter.created_at = { 
        ...dateFilter.created_at, 
        lte: endDate 
      }
    }

    // Generate report based on type
    let reportData: any = {
      reportType,
      generatedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email
      },
      period: {
        start: startDate || 'All time',
        end: endDate || 'Present'
      }
    }

    switch (reportType) {
      case 'detailed':
        // Get all data for detailed report
        const [apps, docs, appts, payments] = await Promise.all([
          supabase.from('applications').select('*').eq('user_id', user.id),
          supabase.from('documents').select('*').eq('user_id', user.id),
          supabase.from('appointments').select('*').eq('user_id', user.id),
          supabase.from('payments').select('*').eq('user_id', user.id)
        ])

        reportData.applications = apps.data || []
        reportData.documents = docs.data || []
        reportData.appointments = appts.data || []
        reportData.payments = payments.data || []
        break

      case 'financial':
        // Focus on payments and costs
        const { data: financialData } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        reportData.payments = financialData || []
        reportData.totalSpent = financialData?.reduce((sum, p) => 
          p.status === 'completed' ? sum + p.amount : sum, 0
        ) || 0
        break

      case 'progress':
        // Focus on application progress
        const { data: progressData } = await supabase
          .from('applications')
          .select(`
            *,
            documents(count),
            appointments(count)
          `)
          .eq('user_id', user.id)

        reportData.applications = progressData || []
        break

      default:
        // Summary report (default)
        const summaryStats = await GET(request)
        const summaryData = await summaryStats.json()
        reportData = { ...reportData, ...summaryData.stats }
    }

    // If format is CSV or PDF, prepare download response
    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(reportData)
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="visa-assist-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      report: reportData
    })

  } catch (error) {
    console.error('Failed to generate report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

// Helper function to convert data to CSV
function convertToCSV(data: any): string {
  // Simple CSV conversion - can be expanded based on needs
  let csv = 'Visa Assist Report\n'
  csv += `Generated at: ${data.generatedAt}\n`
  csv += `Period: ${data.period.start} to ${data.period.end}\n\n`

  if (data.applications) {
    csv += 'Applications\n'
    csv += 'ID,Type,Status,Progress,Created,Updated\n'
    data.applications.forEach((app: any) => {
      csv += `${app.id},${app.visa_type},${app.status},${app.progress_percentage}%,${app.created_at},${app.updated_at}\n`
    })
  }

  return csv
}