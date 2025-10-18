'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle2,
  AlertTriangle,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  DollarSign,
  Upload,
  Edit,
  AlertCircle
} from 'lucide-react'

interface ReviewData {
  personal: any
  travel: any
  employment: any
  education: any
  financial: any
  documents: any
}

interface ReviewStepProps {
  data: Partial<ReviewData>
  onComplete: (data: ReviewData, isValid: boolean) => void
}

interface ValidationIssue {
  section: string
  field: string
  message: string
  severity: 'error' | 'warning'
}

export default function ReviewStep({ data, onComplete }: ReviewStepProps) {
  const [reviewData, setReviewData] = useState<ReviewData>({
    personal: {},
    travel: {},
    employment: {},
    education: {},
    financial: {},
    documents: {},
    ...data
  })
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [confirmations, setConfirmations] = useState({
    accuracy: false,
    completeness: false,
    consent: false,
    terms: false
  })

  useEffect(() => {
    validateApplication()
    const allConfirmed = Object.values(confirmations).every(v => v)
    const hasNoErrors = validationIssues.filter(i => i.severity === 'error').length === 0
    onComplete(reviewData, allConfirmed && hasNoErrors)
  }, [reviewData, confirmations])

  const validateApplication = () => {
    const issues: ValidationIssue[] = []

    // Validate personal info
    if (!reviewData.personal?.passportExpiryDate) {
      issues.push({
        section: 'personal',
        field: 'passportExpiryDate',
        message: 'Passport expiry date is missing',
        severity: 'error'
      })
    } else {
      const expiryDate = new Date(reviewData.personal.passportExpiryDate)
      const sixMonthsFromNow = new Date()
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
      
      if (expiryDate < sixMonthsFromNow) {
        issues.push({
          section: 'personal',
          field: 'passportExpiryDate',
          message: 'Passport expires in less than 6 months',
          severity: 'warning'
        })
      }
    }

    // Validate travel dates
    if (reviewData.travel?.plannedArrival && reviewData.travel?.plannedDeparture) {
      const arrival = new Date(reviewData.travel.plannedArrival)
      const departure = new Date(reviewData.travel.plannedDeparture)
      const today = new Date()
      
      if (arrival < today) {
        issues.push({
          section: 'travel',
          field: 'plannedArrival',
          message: 'Arrival date is in the past',
          severity: 'error'
        })
      }
      
      if (departure <= arrival) {
        issues.push({
          section: 'travel',
          field: 'plannedDeparture',
          message: 'Departure date must be after arrival date',
          severity: 'error'
        })
      }
    }

    // Validate financial sufficiency
    if (reviewData.financial?.travelBudget) {
      const budget = parseFloat(reviewData.financial.travelBudget)
      const duration = reviewData.travel?.durationOfStay || 0
      const dailyBudget = budget / duration

      if (dailyBudget < 50) {
        issues.push({
          section: 'financial',
          field: 'travelBudget',
          message: 'Daily budget appears low (less than €50/day)',
          severity: 'warning'
        })
      }
    }

    // Validate documents
    const requiredDocs = reviewData.documents?.requirements?.filter((d: any) => d.category === 'required') || []
    const missingDocs = requiredDocs.filter((d: any) => !d.uploaded)
    
    if (missingDocs.length > 0) {
      issues.push({
        section: 'documents',
        field: 'requirements',
        message: `${missingDocs.length} required document(s) not uploaded`,
        severity: 'error'
      })
    }

    setValidationIssues(issues)
  }

  const getSectionIcon = (section: string) => {
    const icons: { [key: string]: any } = {
      personal: User,
      travel: FileText,
      employment: Briefcase,
      education: GraduationCap,
      financial: DollarSign,
      documents: Upload
    }
    return icons[section] || FileText
  }

  const getSectionStatus = (section: string) => {
    const sectionIssues = validationIssues.filter(i => i.section === section)
    if (sectionIssues.some(i => i.severity === 'error')) return 'error'
    if (sectionIssues.some(i => i.severity === 'warning')) return 'warning'
    return 'complete'
  }

  const renderSectionSummary = (section: string, title: string, data: any) => {
    const Icon = getSectionIcon(section)
    const status = getSectionStatus(section)
    const sectionIssues = validationIssues.filter(i => i.section === section)

    return (
      <Card key={section} className={`${
        status === 'error' ? 'border-red-200' : 
        status === 'warning' ? 'border-yellow-200' : 
        'border-green-200'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {title}
            </div>
            <div className="flex items-center gap-2">
              {status === 'complete' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Complete
                </Badge>
              )}
              {status === 'warning' && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Review
                </Badge>
              )}
              {status === 'error' && (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Issues
                </Badge>
              )}
              <Button size="sm" variant="ghost">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Display key information based on section */}
          {section === 'personal' && data && (
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {data.firstName} {data.lastName}</p>
              <p><strong>Passport:</strong> {data.passportNumber}</p>
              <p><strong>Nationality:</strong> {data.nationality}</p>
              <p><strong>Date of Birth:</strong> {data.dateOfBirth}</p>
            </div>
          )}
          
          {section === 'travel' && data && (
            <div className="space-y-2 text-sm">
              <p><strong>Destination:</strong> {data.destinationCountry}</p>
              <p><strong>Visa Type:</strong> {data.visaType}</p>
              <p><strong>Travel Dates:</strong> {data.plannedArrival} to {data.plannedDeparture}</p>
              <p><strong>Duration:</strong> {data.durationOfStay} days</p>
            </div>
          )}
          
          {section === 'employment' && data && (
            <div className="space-y-2 text-sm">
              <p><strong>Status:</strong> {data.currentStatus}</p>
              {data.currentEmployer && (
                <>
                  <p><strong>Employer:</strong> {data.currentEmployer.name}</p>
                  <p><strong>Position:</strong> {data.currentEmployer.position}</p>
                </>
              )}
            </div>
          )}
          
          {section === 'education' && data && (
            <div className="space-y-2 text-sm">
              <p><strong>Highest Education:</strong> {data.highestEducation}</p>
              <p><strong>Languages:</strong> {data.languages?.map((l: any) => l.language).join(', ')}</p>
            </div>
          )}
          
          {section === 'financial' && data && (
            <div className="space-y-2 text-sm">
              <p><strong>Funding Source:</strong> {data.fundingSource}</p>
              <p><strong>Travel Budget:</strong> €{data.travelBudget}</p>
              <p><strong>Emergency Funds:</strong> €{data.emergencyFunds}</p>
            </div>
          )}
          
          {section === 'documents' && data && (
            <div className="space-y-2 text-sm">
              <p><strong>Upload Progress:</strong> {data.uploadProgress}%</p>
              <p><strong>Documents:</strong> {
                data.requirements?.filter((d: any) => d.uploaded).length || 0
              } of {data.requirements?.length || 0} uploaded</p>
            </div>
          )}
          
          {/* Display issues */}
          {sectionIssues.length > 0 && (
            <div className="mt-4 space-y-2">
              <Separator />
              {sectionIssues.map((issue, idx) => (
                <Alert key={idx} className={
                  issue.severity === 'error' ? 'border-red-200' : 'border-yellow-200'
                }>
                  {issue.severity === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <AlertDescription className={
                    issue.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                  }>
                    {issue.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle>Application Review</CardTitle>
          <CardDescription>
            Review your application details before submission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium">
                {validationIssues.filter(i => i.severity === 'error').length === 0
                  ? 'Your application is ready for submission'
                  : 'Please fix the issues before submitting'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {validationIssues.filter(i => i.severity === 'error').length} error(s), 
                {' '}{validationIssues.filter(i => i.severity === 'warning').length} warning(s)
              </p>
            </div>
            <div className="text-4xl">
              {validationIssues.filter(i => i.severity === 'error').length === 0 ? (
                <CheckCircle2 className="text-green-600" />
              ) : (
                <AlertTriangle className="text-red-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Summaries */}
      <div className="space-y-4">
        {renderSectionSummary('personal', 'Personal Information', reviewData.personal)}
        {renderSectionSummary('travel', 'Travel Details', reviewData.travel)}
        {renderSectionSummary('employment', 'Employment', reviewData.employment)}
        {renderSectionSummary('education', 'Education', reviewData.education)}
        {renderSectionSummary('financial', 'Financial Information', reviewData.financial)}
        {renderSectionSummary('documents', 'Documents', reviewData.documents)}
      </div>

      {/* Confirmations */}
      <Card>
        <CardHeader>
          <CardTitle>Declarations & Confirmations</CardTitle>
          <CardDescription>
            Please confirm the following before submitting your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="accuracy"
              checked={confirmations.accuracy}
              onCheckedChange={(checked) => 
                setConfirmations({ ...confirmations, accuracy: checked as boolean })
              }
            />
            <Label htmlFor="accuracy" className="text-sm">
              I confirm that all information provided in this application is true, 
              complete, and accurate to the best of my knowledge.
            </Label>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="completeness"
              checked={confirmations.completeness}
              onCheckedChange={(checked) => 
                setConfirmations({ ...confirmations, completeness: checked as boolean })
              }
            />
            <Label htmlFor="completeness" className="text-sm">
              I have uploaded all required documents and they are genuine and unaltered.
            </Label>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="consent"
              checked={confirmations.consent}
              onCheckedChange={(checked) => 
                setConfirmations({ ...confirmations, consent: checked as boolean })
              }
            />
            <Label htmlFor="consent" className="text-sm">
              I consent to the processing of my personal data for visa application purposes.
            </Label>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={confirmations.terms}
              onCheckedChange={(checked) => 
                setConfirmations({ ...confirmations, terms: checked as boolean })
              }
            />
            <Label htmlFor="terms" className="text-sm">
              I understand that providing false information may result in visa rejection 
              and potential legal consequences.
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> After submission, you cannot edit your application. 
          Please ensure all information is correct before proceeding. The visa decision 
          is at the sole discretion of the embassy/consulate.
        </AlertDescription>
      </Alert>
    </div>
  )
}