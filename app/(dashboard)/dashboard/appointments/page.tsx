'use client'

import { useState } from 'react'
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar'
import { AppointmentList } from '@/components/appointments/AppointmentList'
import { AppointmentBooking } from '@/components/appointments/AppointmentBooking'
import { AppointmentReminder } from '@/components/appointments/AppointmentReminder'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar,
  Plus,
  Bell,
  Clock,
  MapPin,
  Video,
  Building,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'

export default function AppointmentsPage() {
  const [showBooking, setShowBooking] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const supabase = createClient()

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleTimeSelect = (date: Date, time: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
    setShowBooking(true)
  }

  const handleBookingSuccess = (appointmentId: string) => {
    setShowBooking(false)
    setSelectedDate(null)
    setSelectedTime(null)
    // Refresh appointments list
    window.location.reload()
  }

  const handleCancelBooking = () => {
    setShowBooking(false)
    setSelectedDate(null)
    setSelectedTime(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-gray-600 mt-1">
            Schedule and manage your visa appointment visits
          </p>
        </div>
        <Button onClick={() => setShowBooking(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Book Appointment
        </Button>
      </div>

      {/* Important Notice */}
      {DemoService.isDemoMode() && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Demo Mode:</strong> Appointments shown here are for demonstration only. 
            In production, this will sync with real consulate appointment systems.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {showBooking ? (
        <Card>
          <AppointmentBooking
            selectedDate={selectedDate || undefined}
            selectedTime={selectedTime || undefined}
            onSuccess={handleBookingSuccess}
            onCancel={handleCancelBooking}
          />
        </Card>
      ) : (
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="list">My Appointments</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <AppointmentCalendar
              onDateSelect={handleDateSelect}
              onTimeSelect={handleTimeSelect}
            />
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <AppointmentList
              showFilters={true}
              onReschedule={(id) => {
                // Handle reschedule
                setShowBooking(true)
              }}
            />
          </TabsContent>

          <TabsContent value="reminders" className="space-y-6">
            <AppointmentReminder />
          </TabsContent>
        </Tabs>
      )}

      {/* Quick Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Arrive Early
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Arrive at least 15 minutes before your scheduled appointment time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Required Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Bring all required documents in both original and photocopies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Cancellation Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Cancel or reschedule at least 24 hours before your appointment
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}