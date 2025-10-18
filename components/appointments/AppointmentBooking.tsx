'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  Building,
  Video,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Info,
  Globe,
  CreditCard
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AppointmentBookingProps {
  selectedDate?: Date
  selectedTime?: string
  appointmentType?: 'consulate' | 'biometrics' | 'interview' | 'document_submission'
  applicationId?: string
  onSuccess?: (appointmentId: string) => void
  onCancel?: () => void
}

const appointmentTypes = [
  {
    id: 'consulate',
    title: 'Consulate Visit',
    description: 'In-person appointment at the consulate',
    icon: Building,
    duration: '45-60 minutes',
    requirements: ['Valid passport', 'All documents', 'Application fee receipt']
  },
  {
    id: 'biometrics',
    title: 'Biometrics Collection',
    description: 'Fingerprints and photograph collection',
    icon: User,
    duration: '15-30 minutes',
    requirements: ['Appointment confirmation', 'Valid ID', 'Previous biometrics receipt (if any)']
  },
  {
    id: 'interview',
    title: 'Visa Interview',
    description: 'Interview with consular officer',
    icon: Video,
    duration: '20-30 minutes',
    requirements: ['All documents', 'Prepared answers', 'Proof of ties']
  },
  {
    id: 'document_submission',
    title: 'Document Submission',
    description: 'Submit additional documents',
    icon: FileText,
    duration: '10-15 minutes',
    requirements: ['Requested documents', 'Application reference']
  }
]

const locations = [
  {
    id: 'loc1',
    name: 'German Consulate - Istanbul',
    address: 'Inönü Cad. No: 10, 34437 Gümüşsuyu, Istanbul',
    phone: '+90 212 334 61 00',
    email: 'info@istanbul.diplo.de'
  },
  {
    id: 'loc2',
    name: 'VFS Global - Ankara',
    address: 'Ehlibeyt, Ceyhun Atuf Kansu Cd. No:66, Ankara',
    phone: '+90 312 219 11 00',
    email: 'info.turkey@vfshelpline.com'
  },
  {
    id: 'loc3',
    name: 'German Consulate - Izmir',
    address: '1387. Sk. No:5, 35220 Alsancak, Izmir',
    phone: '+90 232 488 88 88',
    email: 'info@izmir.diplo.de'
  }
]

export function AppointmentBooking({
  selectedDate,
  selectedTime,
  appointmentType: initialType,
  applicationId,
  onSuccess,
  onCancel
}: AppointmentBookingProps) {
  const [step, setStep] = useState(1)
  const [appointmentType, setAppointmentType] = useState(initialType || 'consulate')
  const [selectedLocation, setSelectedLocation] = useState(locations[0].id)
  const [contactDetails, setContactDetails] = useState({
    phone: '',
    email: '',
    additionalNotes: ''
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [confirmationNumber, setConfirmationNumber] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const totalSteps = 4
  const currentType = appointmentTypes.find(t => t.id === appointmentType)
  const currentLocation = locations.find(l => l.id === selectedLocation)

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleBookAppointment = async () => {
    try {
      setLoading(true)

      if (DemoService.isDemoMode()) {
        // Simulate booking
        await new Promise(resolve => setTimeout(resolve, 2000))
        const confirmationNum = `APT-${Date.now()}`
        setConfirmationNumber(confirmationNum)
        setBookingComplete(true)
        onSuccess?.(confirmationNum)
      } else {
        // Real booking logic
        const { data, error } = await supabase
          .from('appointments')
          .insert({
            application_id: applicationId,
            date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
            time: selectedTime,
            type: appointmentType,
            location_id: selectedLocation,
            phone: contactDetails.phone,
            email: contactDetails.email,
            notes: contactDetails.additionalNotes,
            status: 'scheduled'
          })
          .select()

        if (error) throw error
        
        if (data && data[0]) {
          setConfirmationNumber(data[0].id)
          setBookingComplete(true)
          onSuccess?.(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to book appointment:', error)
    } finally {
      setLoading(false)
    }
  }

  if (bookingComplete) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Appointment Confirmed!</h3>
              <p className="text-gray-600 mt-2">
                Your appointment has been successfully booked
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3">
              <div>
                <p className="text-sm text-gray-500">Confirmation Number</p>
                <p className="font-mono font-medium">{confirmationNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium">
                  {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{currentType?.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{currentLocation?.name}</p>
                <p className="text-sm text-gray-600">{currentLocation?.address}</p>
              </div>
            </div>

            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                A confirmation email has been sent to {contactDetails.email}
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => window.print()}>
                Print Confirmation
              </Button>
              <Button onClick={() => router.push('/dashboard/appointments')}>
                View All Appointments
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Appointment</CardTitle>
        <CardDescription>
          Step {step} of {totalSteps}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {['Type', 'Location', 'Contact', 'Confirm'].map((label, idx) => (
              <span
                key={idx}
                className={`text-xs ${
                  idx + 1 <= step ? 'text-blue-600 font-medium' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Appointment Type */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Select Appointment Type</Label>
              <RadioGroup
                value={appointmentType}
                onValueChange={setAppointmentType}
                className="mt-3 space-y-3"
              >
                {appointmentTypes.map(type => {
                  const Icon = type.icon
                  return (
                    <div key={type.id}>
                      <label
                        htmlFor={type.id}
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                          appointmentType === type.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <RadioGroupItem value={type.id} id={type.id} />
                        <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{type.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {type.duration}
                            </span>
                          </div>
                        </div>
                      </label>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>

            {currentType && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Required Documents:</strong>
                  <ul className="mt-2 space-y-1">
                    {currentType.requirements.map((req, idx) => (
                      <li key={idx} className="text-sm">• {req}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step 2: Location Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Select Location</Label>
              <RadioGroup
                value={selectedLocation}
                onValueChange={setSelectedLocation}
                className="mt-3 space-y-3"
              >
                {locations.map(location => (
                  <div key={location.id}>
                    <label
                      htmlFor={location.id}
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedLocation === location.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <RadioGroupItem value={location.id} id={location.id} />
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{location.name}</p>
                        <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {location.phone}
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {selectedDate && selectedTime && (
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  <strong>Selected Date & Time:</strong><br />
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step 3: Contact Details */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+90 555 123 4567"
                  value={contactDetails.phone}
                  onChange={e => setContactDetails(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={contactDetails.email}
                  onChange={e => setContactDetails(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special requirements or information..."
                value={contactDetails.additionalNotes}
                onChange={e => setContactDetails(prev => ({ ...prev, additionalNotes: e.target.value }))}
                className="mt-1"
                rows={3}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                We'll send appointment reminders to your email and phone number
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Step 4: Review & Confirm */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Appointment Summary</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium">{currentType?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date & Time:</span>
                  <span className="font-medium">
                    {selectedDate && format(selectedDate, 'MMM d, yyyy')} at {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location:</span>
                  <span className="font-medium">{currentLocation?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-medium">{currentType?.duration}</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Contact Information</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Phone:</span> {contactDetails.phone}</p>
                <p><span className="text-gray-500">Email:</span> {contactDetails.email}</p>
                {contactDetails.additionalNotes && (
                  <p><span className="text-gray-500">Notes:</span> {contactDetails.additionalNotes}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={setAgreedToTerms}
              />
              <Label htmlFor="terms" className="text-sm">
                I understand that missing this appointment may delay my visa processing
              </Label>
            </div>

            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertDescription>
                No payment required for booking. Visa fees will be collected at the appointment.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={step === 1 ? onCancel : handleBack}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          {step < totalSteps ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleBookAppointment}
              disabled={!agreedToTerms || loading}
              className="min-w-[150px]"
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}