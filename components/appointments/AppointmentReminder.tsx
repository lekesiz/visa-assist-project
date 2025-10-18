'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell,
  BellOff,
  Clock,
  Calendar,
  Mail,
  MessageSquare,
  Smartphone,
  Settings,
  CheckCircle2,
  AlertCircle,
  Info,
  Send,
  ChevronRight
} from 'lucide-react'
import { format, addDays, subDays, isBefore, isAfter } from 'date-fns'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'

interface ReminderSettings {
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  reminder_times: number[] // hours before appointment
  quiet_hours_start?: string
  quiet_hours_end?: string
}

interface Appointment {
  id: string
  date: string
  time: string
  type: string
  location: string
  reminder_sent: boolean
}

interface AppointmentReminderProps {
  appointmentId?: string
  userId?: string
  showSettings?: boolean
  onSettingsChange?: (settings: ReminderSettings) => void
}

const defaultReminderTimes = [
  { hours: 1, label: '1 hour before' },
  { hours: 3, label: '3 hours before' },
  { hours: 24, label: '1 day before' },
  { hours: 72, label: '3 days before' },
  { hours: 168, label: '1 week before' }
]

export function AppointmentReminder({
  appointmentId,
  userId,
  showSettings = true,
  onSettingsChange
}: AppointmentReminderProps) {
  const [settings, setSettings] = useState<ReminderSettings>({
    email_enabled: true,
    sms_enabled: true,
    push_enabled: false,
    reminder_times: [24, 72]
  })
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [testingSend, setTestingSend] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
    fetchUpcomingReminders()
  }, [userId])

  async function loadSettings() {
    try {
      if (DemoService.isDemoMode()) {
        // Use default settings in demo mode
        return
      }

      // Load real settings from database
      const { data, error } = await supabase
        .from('reminder_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (data) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to load reminder settings:', error)
    }
  }

  async function fetchUpcomingReminders() {
    try {
      setLoading(true)

      if (DemoService.isDemoMode()) {
        // Demo upcoming reminders
        const demoReminders = [
          {
            appointment: {
              id: '1',
              date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
              time: '10:00',
              type: 'Biometrics Collection',
              location: 'VFS Global Istanbul'
            },
            scheduled_for: addDays(new Date(), 2).toISOString(),
            type: 'email',
            status: 'pending'
          },
          {
            appointment: {
              id: '2',
              date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
              time: '14:30',
              type: 'Visa Interview',
              location: 'German Consulate'
            },
            scheduled_for: new Date().toISOString(),
            type: 'sms',
            status: 'pending'
          }
        ]
        setUpcomingReminders(demoReminders)
      } else {
        // Fetch real upcoming reminders
        const { data } = await supabase
          .from('appointment_reminders')
          .select(`
            *,
            appointment:appointments(*)
          `)
          .eq('user_id', userId)
          .eq('status', 'pending')
          .order('scheduled_for', { ascending: true })
          .limit(5)

        if (data) {
          setUpcomingReminders(data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch upcoming reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingsUpdate = async (newSettings: Partial<ReminderSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    
    if (!DemoService.isDemoMode()) {
      // Save to database
      await supabase
        .from('reminder_settings')
        .upsert({
          user_id: userId,
          settings: updatedSettings
        })
    }

    onSettingsChange?.(updatedSettings)
  }

  const handleTestReminder = async (type: 'email' | 'sms' | 'push') => {
    try {
      setTestingSend(true)

      if (DemoService.isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        // Show success message
        return
      }

      // Send test reminder
      await fetch('/api/reminders/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, userId })
      })
    } catch (error) {
      console.error('Failed to send test reminder:', error)
    } finally {
      setTestingSend(false)
    }
  }

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'email':
        return Mail
      case 'sms':
        return MessageSquare
      case 'push':
        return Smartphone
      default:
        return Bell
    }
  }

  return (
    <div className="space-y-4">
      {/* Reminder Settings */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Reminder Settings
            </CardTitle>
            <CardDescription>
              Configure how and when you want to be reminded
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notification Channels */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Notification Channels</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <Label htmlFor="email-reminders" className="text-base cursor-pointer">
                        Email Reminders
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receive reminders via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="email-reminders"
                    checked={settings.email_enabled}
                    onCheckedChange={(checked) => 
                      handleSettingsUpdate({ email_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-gray-500" />
                    <div>
                      <Label htmlFor="sms-reminders" className="text-base cursor-pointer">
                        SMS Reminders
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receive text message reminders
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="sms-reminders"
                    checked={settings.sms_enabled}
                    onCheckedChange={(checked) => 
                      handleSettingsUpdate({ sms_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-gray-500" />
                    <div>
                      <Label htmlFor="push-reminders" className="text-base cursor-pointer">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-gray-500">
                        Coming soon
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="push-reminders"
                    checked={false}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Reminder Times */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">When to Remind</h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {defaultReminderTimes.map(time => (
                  <label
                    key={time.hours}
                    className={`
                      flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors
                      ${settings.reminder_times.includes(time.hours)
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={settings.reminder_times.includes(time.hours)}
                      onChange={(e) => {
                        const newTimes = e.target.checked
                          ? [...settings.reminder_times, time.hours]
                          : settings.reminder_times.filter(h => h !== time.hours)
                        handleSettingsUpdate({ reminder_times: newTimes })
                      }}
                      className="sr-only"
                    />
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{time.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Test Reminders */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Test Reminders</h4>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!settings.email_enabled || testingSend}
                  onClick={() => handleTestReminder('email')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!settings.sms_enabled || testingSend}
                  onClick={() => handleTestReminder('sms')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Test SMS
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Reminders */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Reminders</CardTitle>
          <CardDescription>
            Scheduled reminders for your appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : upcomingReminders.length > 0 ? (
            <div className="space-y-3">
              {upcomingReminders.map((reminder, idx) => {
                const Icon = getReminderIcon(reminder.type)
                const scheduledDate = new Date(reminder.scheduled_for)
                
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {reminder.appointment.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(reminder.appointment.date), 'MMM d')} at {reminder.appointment.time}
                        • {reminder.appointment.location}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Reminder scheduled for {format(scheduledDate, 'MMM d at HH:mm')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {reminder.type}
                    </Badge>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BellOff className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium">No upcoming reminders</p>
              <p className="text-sm mt-2">
                Reminders will appear here when you have appointments
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reminder Tips */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Reminder Tips:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Set multiple reminders to ensure you don't miss appointments</li>
            <li>• SMS reminders work best for last-minute notifications</li>
            <li>• Email reminders include appointment details and documents needed</li>
            <li>• All reminders respect your local timezone</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}

// Reminder Status Component
interface ReminderStatusProps {
  appointmentId: string
  compact?: boolean
}

export function ReminderStatus({ appointmentId, compact = false }: ReminderStatusProps) {
  const [status, setStatus] = useState<'pending' | 'sent' | 'failed' | null>(null)
  const [sentAt, setSentAt] = useState<Date | null>(null)

  useEffect(() => {
    // In demo mode, simulate reminder status
    if (DemoService.isDemoMode()) {
      setStatus('sent')
      setSentAt(subDays(new Date(), 1))
    }
  }, [appointmentId])

  if (!status) return null

  if (compact) {
    return (
      <Badge 
        variant={status === 'sent' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}
        className="text-xs"
      >
        <Bell className="h-3 w-3 mr-1" />
        Reminder {status}
      </Badge>
    )
  }

  return (
    <Alert className={
      status === 'sent' ? 'border-green-200' : 
      status === 'failed' ? 'border-red-200' : 
      'border-blue-200'
    }>
      <Bell className="h-4 w-4" />
      <AlertDescription>
        {status === 'sent' ? (
          <>
            Reminder sent successfully
            {sentAt && ` on ${format(sentAt, 'MMM d at HH:mm')}`}
          </>
        ) : status === 'failed' ? (
          'Failed to send reminder. Please check your contact details.'
        ) : (
          'Reminder scheduled and will be sent based on your preferences'
        )}
      </AlertDescription>
    </Alert>
  )
}