'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Building,
  User,
  Video,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Download,
  Send,
  MoreVertical,
  Filter,
  Search
} from 'lucide-react'
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'

interface Appointment {
  id: string
  application_id?: string
  date: string
  time: string
  type: 'consulate' | 'biometrics' | 'interview' | 'document_submission'
  location: string
  address?: string
  phone?: string
  email?: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show'
  confirmation_number?: string
  notes?: string
  reminder_sent?: boolean
  created_at: string
  updated_at?: string
  rescheduled_from?: string
  rescheduled_to?: string
}

interface AppointmentListProps {
  userId?: string
  applicationId?: string
  showFilters?: boolean
  compact?: boolean
  limit?: number
  onEdit?: (appointment: Appointment) => void
  onCancel?: (appointmentId: string) => void
  onReschedule?: (appointmentId: string) => void
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rescheduled: 'bg-yellow-100 text-yellow-800',
  no_show: 'bg-gray-100 text-gray-800'
}

const typeIcons = {
  consulate: Building,
  biometrics: User,
  interview: Video,
  document_submission: FileText
}

const typeLabels = {
  consulate: 'Consulate Visit',
  biometrics: 'Biometrics Collection',
  interview: 'Visa Interview',
  document_submission: 'Document Submission'
}

export function AppointmentList({
  userId,
  applicationId,
  showFilters = true,
  compact = false,
  limit,
  onEdit,
  onCancel,
  onReschedule
}: AppointmentListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('upcoming')
  const supabase = createClient()

  useEffect(() => {
    fetchAppointments()
  }, [userId, applicationId])

  async function fetchAppointments() {
    try {
      setLoading(true)

      if (DemoService.isDemoMode()) {
        // Demo appointments
        const demoAppointments: Appointment[] = [
          {
            id: '1',
            date: format(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            time: '10:00',
            type: 'biometrics',
            location: 'VFS Global Istanbul',
            address: 'Levent, Istanbul',
            phone: '+90 212 123 4567',
            email: 'istanbul@vfsglobal.com',
            status: 'scheduled',
            confirmation_number: 'VFS-2024-001',
            reminder_sent: false,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            time: '14:30',
            type: 'interview',
            location: 'German Consulate',
            address: 'Gümüşsuyu, Istanbul',
            status: 'scheduled',
            confirmation_number: 'DE-2024-002',
            reminder_sent: true,
            created_at: new Date().toISOString()
          },
          {
            id: '3',
            date: format(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            time: '11:00',
            type: 'document_submission',
            location: 'VFS Global Istanbul',
            status: 'completed',
            confirmation_number: 'VFS-2024-003',
            created_at: new Date().toISOString()
          },
          {
            id: '4',
            date: format(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            time: '09:30',
            type: 'consulate',
            location: 'German Consulate',
            status: 'cancelled',
            confirmation_number: 'DE-2024-004',
            notes: 'Rescheduled due to document issues',
            created_at: new Date().toISOString()
          }
        ]
        setAppointments(limit ? demoAppointments.slice(0, limit) : demoAppointments)
      } else {
        // Fetch real appointments
        let query = supabase
          .from('appointments')
          .select('*')
          .order('date', { ascending: true })

        if (userId) {
          query = query.eq('user_id', userId)
        }
        
        if (applicationId) {
          query = query.eq('application_id', applicationId)
        }

        if (limit) {
          query = query.limit(limit)
        }

        const { data, error } = await query

        if (!error && data) {
          setAppointments(data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      if (DemoService.isDemoMode()) {
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt
        ))
      } else {
        await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', appointmentId)
        
        await fetchAppointments()
      }
      
      onCancel?.(appointmentId)
    } catch (error) {
      console.error('Failed to cancel appointment:', error)
    }
  }

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         apt.confirmation_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || apt.type === filterType
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  // Categorize appointments
  const upcomingAppointments = filteredAppointments.filter(apt => 
    apt.status === 'scheduled' && !isPast(new Date(`${apt.date} ${apt.time}`))
  )
  const pastAppointments = filteredAppointments.filter(apt => 
    apt.status !== 'scheduled' || isPast(new Date(`${apt.date} ${apt.time}`))
  )

  const getTimeUntilAppointment = (date: string, time: string) => {
    const appointmentDate = new Date(`${date} ${time}`)
    const now = new Date()
    
    if (isToday(appointmentDate)) {
      return { text: 'Today', urgent: true }
    } else if (isTomorrow(appointmentDate)) {
      return { text: 'Tomorrow', urgent: true }
    } else {
      const days = differenceInDays(appointmentDate, now)
      return { 
        text: `In ${days} days`, 
        urgent: days <= 3 
      }
    }
  }

  const renderAppointmentCard = (appointment: Appointment) => {
    const Icon = typeIcons[appointment.type]
    const timeInfo = appointment.status === 'scheduled' 
      ? getTimeUntilAppointment(appointment.date, appointment.time)
      : null

    if (compact) {
      return (
        <div 
          key={appointment.id}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusColors[appointment.status]}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-sm">{typeLabels[appointment.type]}</p>
              <p className="text-xs text-gray-500">
                {format(new Date(appointment.date), 'MMM d')} at {appointment.time}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {appointment.status}
          </Badge>
        </div>
      )
    }

    return (
      <Card key={appointment.id}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className={`p-3 rounded-lg ${statusColors[appointment.status]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{typeLabels[appointment.type]}</h4>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(appointment.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {appointment.time}
                      {timeInfo && (
                        <span className={`ml-2 text-xs font-medium ${
                          timeInfo.urgent ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                          ({timeInfo.text})
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {appointment.location}
                      {appointment.address && (
                        <span className="text-gray-400">• {appointment.address}</span>
                      )}
                    </p>
                  </div>
                </div>

                {appointment.confirmation_number && (
                  <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Confirmation Number</p>
                    <p className="font-mono text-sm">{appointment.confirmation_number}</p>
                  </div>
                )}

                {appointment.notes && (
                  <Alert className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {appointment.notes}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center gap-2 mt-4">
                  {appointment.status === 'scheduled' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReschedule?.(appointment.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Reschedule
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelAppointment(appointment.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  {appointment.phone && (
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <Badge variant={appointment.status === 'scheduled' ? 'default' : 'secondary'}>
              {appointment.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>Loading your appointments...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && appointments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search appointments..."
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
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments */}
      {appointments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No appointments scheduled</p>
            <p className="text-sm text-gray-400 mt-2">
              Book your first appointment to get started
            </p>
            <Button className="mt-4">
              Book Appointment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map(renderAppointmentCard)
            ) : (
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  No upcoming appointments. All your appointments are in the past.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3 mt-4">
            {pastAppointments.length > 0 ? (
              pastAppointments.map(renderAppointmentCard)
            ) : (
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  No past appointments yet.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

// Appointment Summary Card
interface AppointmentSummaryProps {
  appointments: Appointment[]
}

export function AppointmentSummary({ appointments }: AppointmentSummaryProps) {
  const scheduled = appointments.filter(a => a.status === 'scheduled').length
  const completed = appointments.filter(a => a.status === 'completed').length
  const cancelled = appointments.filter(a => a.status === 'cancelled').length
  
  const nextAppointment = appointments
    .filter(a => a.status === 'scheduled' && !isPast(new Date(`${a.date} ${a.time}`)))
    .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointment Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{scheduled}</p>
            <p className="text-xs text-gray-500">Scheduled</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{completed}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{cancelled}</p>
            <p className="text-xs text-gray-500">Cancelled</p>
          </div>
        </div>
        
        {nextAppointment && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Next appointment:</strong> {typeLabels[nextAppointment.type]} on{' '}
              {format(new Date(nextAppointment.date), 'MMM d')} at {nextAppointment.time}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}