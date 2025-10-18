import { Check, Circle } from 'lucide-react'

interface ApplicationProgressProps {
  currentStep: number
  totalSteps: number
  progressPercentage: number
}

const defaultSteps = [
  { id: 1, title: 'Basic Information', description: 'Personal and visa details' },
  { id: 2, title: 'Document Upload', description: 'Required documents' },
  { id: 3, title: 'Document Verification', description: 'AI analysis and review' },
  { id: 4, title: 'Payment', description: 'Processing fees' },
  { id: 5, title: 'Appointment', description: 'Schedule consulate visit' },
  { id: 6, title: 'Submission', description: 'Final application submission' },
  { id: 7, title: 'Processing', description: 'Awaiting decision' },
  { id: 8, title: 'Decision', description: 'Visa approval status' }
]

export function ApplicationProgress({ 
  currentStep, 
  totalSteps, 
  progressPercentage 
}: ApplicationProgressProps) {
  const steps = defaultSteps.slice(0, totalSteps)
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Application Progress</h3>
          <span className="text-2xl font-bold text-blue-600">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-200">
          <div 
            className="absolute top-0 left-0 w-full bg-blue-600 transition-all duration-500"
            style={{ 
              height: `${Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100)}%` 
            }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => {
            const isCompleted = step.id < currentStep
            const isCurrent = step.id === currentStep
            const isPending = step.id > currentStep

            return (
              <div key={step.id} className="flex items-start gap-4 relative">
                {/* Step Icon */}
                <div className={`
                  relative z-10 flex items-center justify-center w-8 h-8 rounded-full
                  ${isCompleted ? 'bg-green-500 text-white' : 
                    isCurrent ? 'bg-blue-600 text-white' : 
                    'bg-gray-200 text-gray-400'}
                `}>
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                  
                  {isCurrent && (
                    <div className="absolute inset-0 -m-1 rounded-full border-2 border-blue-600 animate-pulse" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 pb-4">
                  <h4 className={`font-medium ${
                    isPending ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {step.title}
                  </h4>
                  <p className={`text-sm mt-0.5 ${
                    isPending ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {step.description}
                  </p>
                  
                  {isCurrent && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Current Step
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}