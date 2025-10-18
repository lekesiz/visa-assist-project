'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ChevronRight, 
  ChevronLeft,
  Check,
  AlertCircle,
  FileText,
  MapPin,
  Calendar,
  Briefcase,
  Users,
  Globe
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'

interface FormData {
  visa_type: string
  target_country: string
  purpose_of_travel: string
  planned_travel_date: string
  duration_of_stay: string
  notes: string
}

const visaTypes = [
  { value: 'tourist', label: 'Tourist Visa', icon: Globe, description: 'For tourism and short visits' },
  { value: 'business', label: 'Business Visa', icon: Briefcase, description: 'For business meetings and conferences' },
  { value: 'student', label: 'Student Visa', icon: FileText, description: 'For studying at German universities' },
  { value: 'work', label: 'Work Visa', icon: Briefcase, description: 'For employment in Germany' },
  { value: 'family_reunion', label: 'Family Reunion', icon: Users, description: 'For joining family members' }
]

const countries = [
  { value: 'DE', label: 'Germany', flag: '🇩🇪' },
  { value: 'FR', label: 'France', flag: '🇫🇷' },
  { value: 'ES', label: 'Spain', flag: '🇪🇸' },
  { value: 'IT', label: 'Italy', flag: '🇮🇹' },
  { value: 'NL', label: 'Netherlands', flag: '🇳🇱' }
]

const steps = [
  { id: 1, title: 'Visa Type', description: 'Select your visa category' },
  { id: 2, title: 'Destination', description: 'Choose your destination country' },
  { id: 3, title: 'Travel Details', description: 'Provide travel information' },
  { id: 4, title: 'Review', description: 'Review your application' }
]

export function ApplicationForm() {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    visa_type: '',
    target_country: 'DE',
    purpose_of_travel: '',
    planned_travel_date: '',
    duration_of_stay: '',
    notes: ''
  })

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.visa_type) {
          setError('Please select a visa type')
          return false
        }
        break
      case 2:
        if (!formData.target_country) {
          setError('Please select a destination country')
          return false
        }
        break
      case 3:
        if (!formData.purpose_of_travel || !formData.planned_travel_date || !formData.duration_of_stay) {
          setError('Please fill in all required fields')
          return false
        }
        break
    }
    return true
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      const applicationData = {
        ...formData,
        duration_of_stay: parseInt(formData.duration_of_stay)
      }

      if (DemoService.isDemoMode()) {
        const { data, error } = await DemoService.createApplication(applicationData)
        if (error) throw error
        router.push(`/dashboard/applications/${data.id}`)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(applicationData)
        })

        if (!response.ok) throw new Error('Failed to create application')
        
        const { data } = await response.json()
        router.push(`/dashboard/applications/${data.id}`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full
                ${currentStep > step.id ? 'bg-green-500 text-white' : 
                  currentStep === step.id ? 'bg-blue-600 text-white' : 
                  'bg-gray-200 text-gray-600'}
              `}>
                {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-1 mx-2
                  ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm">
          {steps.map(step => (
            <div 
              key={step.id} 
              className={`text-center ${
                currentStep === step.id ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}
            >
              <p className="font-medium">{step.title}</p>
              <p className="text-xs">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Visa Type Selection */}
          {currentStep === 1 && (
            <div className="grid gap-4">
              {visaTypes.map(type => {
                const Icon = type.icon
                return (
                  <div 
                    key={type.value}
                    onClick={() => updateFormData('visa_type', type.value)}
                    className={`
                      p-4 border rounded-lg cursor-pointer transition-all
                      ${formData.visa_type === type.value 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${
                        formData.visa_type === type.value ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <h3 className="font-medium">{type.label}</h3>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                      {formData.visa_type === type.value && (
                        <Check className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Step 2: Country Selection */}
          {currentStep === 2 && (
            <div className="grid gap-4">
              {countries.map(country => (
                <div 
                  key={country.value}
                  onClick={() => updateFormData('target_country', country.value)}
                  className={`
                    p-4 border rounded-lg cursor-pointer transition-all
                    ${formData.target_country === country.value 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{country.flag}</span>
                      <h3 className="font-medium">{country.label}</h3>
                    </div>
                    {formData.target_country === country.value && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Travel Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Travel *</Label>
                <Input
                  id="purpose"
                  placeholder="e.g., Employment as Software Developer"
                  value={formData.purpose_of_travel}
                  onChange={(e) => updateFormData('purpose_of_travel', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Planned Travel Date *</Label>
                <Input
                  id="date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.planned_travel_date}
                  onChange={(e) => updateFormData('planned_travel_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration of Stay (days) *</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="e.g., 90"
                  min="1"
                  max="365"
                  value={formData.duration_of_stay}
                  onChange={(e) => updateFormData('duration_of_stay', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <textarea
                  id="notes"
                  className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                  placeholder="Any additional information..."
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please review your application details before submitting.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Visa Type</span>
                  <span className="font-medium">
                    {visaTypes.find(t => t.value === formData.visa_type)?.label}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Destination</span>
                  <span className="font-medium">
                    {countries.find(c => c.value === formData.target_country)?.flag}{' '}
                    {countries.find(c => c.value === formData.target_country)?.label}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Purpose</span>
                  <span className="font-medium">{formData.purpose_of_travel}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Travel Date</span>
                  <span className="font-medium">
                    {new Date(formData.planned_travel_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{formData.duration_of_stay} days</span>
                </div>
                {formData.notes && (
                  <div className="pt-2">
                    <span className="text-gray-600">Notes</span>
                    <p className="mt-1 text-sm">{formData.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {currentStep > 1 && (
            <Button variant="outline" onClick={prevStep} disabled={loading}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          
          <div className={currentStep === 1 ? 'ml-auto' : ''}>
            {currentStep < steps.length ? (
              <Button onClick={nextStep} disabled={loading}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating...' : 'Create Application'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}