'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft,
  ArrowRight,
  Check,
  Save,
  AlertCircle,
  Loader2,
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Home,
  DollarSign,
  Upload,
  CheckCircle2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'

// Import step components
import PersonalInfoStep from './steps/PersonalInfoStep'
import TravelDetailsStep from './steps/TravelDetailsStep'
import EmploymentStep from './steps/EmploymentStep'
import EducationStep from './steps/EducationStep'
import FinancialStep from './steps/FinancialStep'
import DocumentsStep from './steps/DocumentsStep'
import ReviewStep from './steps/ReviewStep'

interface WizardStep {
  id: string
  title: string
  description: string
  icon: any
  component: any
  required: boolean
}

const steps: WizardStep[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Basic details about yourself',
    icon: User,
    component: PersonalInfoStep,
    required: true
  },
  {
    id: 'travel',
    title: 'Travel Details',
    description: 'Your travel plans and visa type',
    icon: FileText,
    component: TravelDetailsStep,
    required: true
  },
  {
    id: 'employment',
    title: 'Employment History',
    description: 'Current and previous employment',
    icon: Briefcase,
    component: EmploymentStep,
    required: true
  },
  {
    id: 'education',
    title: 'Education',
    description: 'Academic qualifications',
    icon: GraduationCap,
    component: EducationStep,
    required: true
  },
  {
    id: 'financial',
    title: 'Financial Information',
    description: 'Proof of financial means',
    icon: DollarSign,
    component: FinancialStep,
    required: true
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'Upload required documents',
    icon: Upload,
    component: DocumentsStep,
    required: true
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Review your application',
    icon: CheckCircle2,
    component: ReviewStep,
    required: true
  }
]

interface ApplicationWizardProps {
  applicationId?: string
  onComplete?: (applicationId: string) => void
}

export default function ApplicationWizard({ applicationId, onComplete }: ApplicationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<any>({})
  const [stepValidation, setStepValidation] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !applicationId) return

    const autoSaveInterval = setInterval(() => {
      saveProgress()
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [formData, autoSaveEnabled, applicationId])

  const saveProgress = async () => {
    if (!applicationId) return

    try {
      setSaving(true)

      if (DemoService.isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setLastSaved(new Date())
      } else {
        const { error } = await supabase
          .from('applications')
          .update({
            form_data: formData,
            current_step: currentStep,
            updated_at: new Date().toISOString()
          })
          .eq('id', applicationId)

        if (!error) {
          setLastSaved(new Date())
        }
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleStepComplete = (stepId: string, data: any, isValid: boolean) => {
    setFormData((prev: any) => ({ ...prev, [stepId]: data }))
    setStepValidation((prev) => ({ ...prev, [stepId]: isValid }))
  }

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)

      if (DemoService.isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        onComplete?.(applicationId || 'demo-app-123')
      } else {
        // Final save and submit
        const { error } = await supabase
          .from('applications')
          .update({
            form_data: formData,
            status: 'submitted',
            submitted_at: new Date().toISOString()
          })
          .eq('id', applicationId)

        if (!error) {
          onComplete?.(applicationId!)
        }
      }
    } catch (error) {
      console.error('Submit failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const CurrentStepComponent = steps[currentStep].component
  const progress = ((currentStep + 1) / steps.length) * 100
  const isCurrentStepValid = stepValidation[steps[currentStep].id] || false

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Step {currentStep + 1} of {steps.length}</h3>
                <p className="text-sm text-gray-500">{steps[currentStep].title}</p>
              </div>
              {autoSaveEnabled && lastSaved && (
                <div className="text-right text-sm text-gray-500">
                  {saving ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                  )}
                </div>
              )}
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step Indicators */}
            <div className="flex justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isCompleted = stepValidation[step.id]
                const isCurrent = index === currentStep
                const isPast = index < currentStep

                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(index)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                      isCurrent ? 'bg-blue-50' : isPast ? 'hover:bg-gray-50' : ''
                    }`}
                    disabled={!isPast && !isCurrent}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-600 text-white' :
                      isCurrent ? 'bg-blue-600 text-white' :
                      isPast ? 'bg-gray-300' : 'bg-gray-100'
                    }`}>
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`text-xs ${
                      isCurrent ? 'font-medium' : 'text-gray-500'
                    } hidden sm:block`}>
                      {step.title}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <CurrentStepComponent
            data={formData[steps[currentStep].id] || {}}
            onComplete={(data: any, isValid: boolean) => 
              handleStepComplete(steps[currentStep].id, data, isValid)
            }
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={saveProgress}
            disabled={saving || !applicationId}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Progress
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!isCurrentStepValid || saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Submit Application
            </Button>
          ) : (
            <Button
              onClick={goToNextStep}
              disabled={!isCurrentStepValid}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Tips */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tip:</strong> Your progress is automatically saved every 30 seconds. 
          You can also leave and return to complete your application later.
        </AlertDescription>
      </Alert>
    </div>
  )
}