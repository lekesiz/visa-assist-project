'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Video,
  Building,
  AlertCircle,
  CheckCircle2,
  Info,
  Plus
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays
} from 'date-fns'

interface Appointment {
  id: string
  date: string
  time: string
  type: 'consulate' | 'biometrics' | 'interview' | 'document_submission'
  location?: string
  address?: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  notes?: string
  reminder_sent?: boolean
}

interface TimeSlot {
  time: string
  available: boolean
  capacity?: number
  booked?: number
}

interface AppointmentCalendarProps {
  applicationId?: string
  onDateSelect?: (date: Date) => void
  onTimeSelect?: (date: Date, time: string) => void
  showHeader?: boolean
  variant?: 'full' | 'compact' | 'mini'
}

const appointmentTypeColors = {
  consulate: 'bg-blue-100 text-blue-800',
  biometrics: 'bg-purple-100 text-purple-800',
  interview: 'bg-green-100 text-green-800',
  document_submission: 'bg-orange-100 text-orange-800'
}

const appointmentTypeIcons = {
  consulate: Building,
  biometrics: User,
  interview: Video,
  document_submission: CalendarIcon
}

export function AppointmentCalendar({ 
  applicationId,
  onDateSelect,
  onTimeSelect,
  showHeader = true,
  variant = 'full'
}: AppointmentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchAppointments()
  }, [currentMonth, applicationId])

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate)
    }
  }, [selectedDate])

  async function fetchAppointments() {
    try {
      setLoading(true)

      if (DemoService.isDemoMode()) {
        // Demo appointments
        const demoAppointments: Appointment[] = [
          {
            id: '1',
            date: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
            time: '10:00',
            type: 'biometrics',
            location: 'Visa Application Center',
            address: '123 Embassy Row, Berlin',
            status: 'scheduled'
          },
          {
            id: '2',
            date: format(addDays(new Date(), 12), 'yyyy-MM-dd'),
            time: '14:30',
            type: 'interview',
            location: 'German Consulate',
            address: '456 Diplomat Ave, Istanbul',
            status: 'scheduled'
          }
        ]
        setAppointments(demoAppointments)
      } else {
        // Fetch real appointments
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .gte('date', startOfMonth(currentMonth).toISOString())
          .lte('date', endOfMonth(currentMonth).toISOString())
          .order('date', { ascending: true })

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

  async function fetchAvailableSlots(date: Date) {
    try {
      if (DemoService.isDemoMode()) {
        // Demo available slots
        const slots: TimeSlot[] = [
          { time: '09:00', available: true, capacity: 5, booked: 2 },
          { time: '09:30', available: true, capacity: 5, booked: 4 },
          { time: '10:00', available: false, capacity: 5, booked: 5 },
          { time: '10:30', available: true, capacity: 5, booked: 1 },
          { time: '11:00', available: true, capacity: 5, booked: 0 },
          { time: '11:30', available: true, capacity: 5, booked: 3 },
          { time: '14:00', available: true, capacity: 5, booked: 2 },
          { time: '14:30', available: false, capacity: 5, booked: 5 },
          { time: '15:00', available: true, capacity: 5, booked: 1 },
          { time: '15:30', available: true, capacity: 5, booked: 0 },
          { time: '16:00', available: true, capacity: 5, booked: 4 },
          { time: '16:30', available: true, capacity: 5, booked: 2 }
        ]
        setAvailableSlots(slots)
      } else {
        // Fetch real available slots
        const response = await fetch('/api/appointments/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: format(date, 'yyyy-MM-dd') })
        })
        
        const data = await response.json()
        if (data.success) {
          setAvailableSlots(data.slots)
        }
      }
    } catch (error) {
      console.error('Failed to fetch available slots:', error)
    }
  }

  const handleDateClick = (date: Date) => {
    if (isBefore(date, new Date()) && !isSameDay(date, new Date())) {
      return
    }
    
    setSelectedDate(date)
    onDateSelect?.(date)
  }

  const handleTimeSelect = (time: string) => {
    if (selectedDate && onTimeSelect) {
      onTimeSelect(selectedDate, time)
    }
  }

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => 
      apt.date === format(date, 'yyyy-MM-dd')
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(direction === 'prev' 
      ? subMonths(currentMonth, 1) 
      : addMonths(currentMonth, 1)
    )
  }

  if (variant === 'mini') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
            {getDaysInMonth().map((date, i) => {
              const hasAppointment = getAppointmentsForDate(date).length > 0
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const isCurrentMonth = isSameMonth(date, currentMonth)
              
              return (
                <div
                  key={i}
                  className={`
                    relative py-1 rounded cursor-pointer transition-colors
                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                    ${isToday(date) ? 'font-bold' : ''}
                    ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
                    ${isBefore(date, new Date()) && !isToday(date) ? 'opacity-50' : ''}
                  `}
                  onClick={() => handleDateClick(date)}
                >
                  {format(date, 'd')}
                  {hasAppointment && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={variant === 'compact' ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}>
      {/* Calendar */}
      <Card className={variant === 'compact' ? '' : 'lg:col-span-2'}>
        {showHeader && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Appointment Calendar</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium min-w-[120px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-600">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((date, idx) => {
                const dayAppointments = getAppointmentsForDate(date)
                const isSelected = selectedDate && isSameDay(date, selectedDate)
                const isCurrentMonth = isSameMonth(date, currentMonth)
                const isPast = isBefore(date, new Date()) && !isToday(date)
                
                return (
                  <div
                    key={idx}
                    className={`
                      relative min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all
                      ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                      ${isToday(date) ? 'border-blue-500 border-2' : 'border-gray-200'}
                      ${isSelected ? 'ring-2 ring-blue-500' : ''}
                      ${isPast ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                    `}
                    onClick={() => !isPast && handleDateClick(date)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${isToday(date) ? 'text-blue-600' : ''}`}>
                        {format(date, 'd')}
                      </span>
                      {dayAppointments.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-1">
                          {dayAppointments.length}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 2).map(apt => {
                        const Icon = appointmentTypeIcons[apt.type]
                        return (
                          <div
                            key={apt.id}
                            className={`text-xs p-1 rounded flex items-center gap-1 ${appointmentTypeColors[apt.type]}`}
                          >
                            <Icon className="h-3 w-3" />
                            <span className="truncate">{apt.time}</span>
                          </div>
                        )
                      })}
                      {dayAppointments.length > 2 && (
                        <p className="text-xs text-gray-500">+{dayAppointments.length - 2} more</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {variant !== 'compact' && (
        <div className="space-y-4">
          {/* Date Info */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </CardTitle>
                <CardDescription>
                  Available appointment slots
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableSlots.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {availableSlots.map(slot => (
                      <Button
                        key={slot.time}
                        variant={slot.available ? 'outline' : 'ghost'}
                        className="w-full justify-between"
                        disabled={!slot.available}
                        onClick={() => handleTimeSelect(slot.time)}
                      >
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {slot.time}
                        </span>
                        {slot.capacity && (
                          <span className="text-xs text-gray-500">
                            {slot.available 
                              ? `${slot.capacity - (slot.booked || 0)} spots left`
                              : 'Fully booked'
                            }
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No slots available for this date</p>
                    <p className="text-sm mt-2">Please select another date</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appointments
                  .filter(apt => apt.status === 'scheduled')
                  .slice(0, 3)
                  .map(apt => {
                    const Icon = appointmentTypeIcons[apt.type]
                    return (
                      <div key={apt.id} className="p-3 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${appointmentTypeColors[apt.type]}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm capitalize">
                              {apt.type.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(apt.date), 'MMM d')} at {apt.time}
                            </p>
                            {apt.location && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {apt.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                {appointments.filter(apt => apt.status === 'scheduled').length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <CalendarIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No upcoming appointments</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Booking Tips:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Morning slots typically have shorter wait times</li>
                <li>• Arrive 15 minutes before your appointment</li>
                <li>• Bring all required documents</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}