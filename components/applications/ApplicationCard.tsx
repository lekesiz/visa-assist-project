import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  AlertCircle,
  Calendar,
  MapPin
} from 'lucide-react'

interface ApplicationCardProps {
  application: {
    id: string
    visa_type: string
    status: string
    progress_percentage: number
    purpose_of_travel: string
    planned_travel_date?: string
    target_country: string
    created_at: string
    updated_at: string
  }
  onClick?: () => void
  compact?: boolean
}

const statusConfig = {
  draft: { color: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Draft' },
  in_progress: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'In Progress' },
  submitted: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Submitted' },
  approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
  cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' }
}

const visaTypeLabels: Record<string, string> = {
  tourist: 'Tourist Visa',
  business: 'Business Visa',
  student: 'Student Visa',
  work: 'Work Visa',
  family_reunion: 'Family Reunion Visa',
  other: 'Other'
}

const countryLabels: Record<string, string> = {
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands'
}

export function ApplicationCard({ application, onClick, compact = false }: ApplicationCardProps) {
  const statusInfo = statusConfig[application.status as keyof typeof statusConfig]
  const StatusIcon = statusInfo?.icon || FileText
  const visaTypeLabel = visaTypeLabels[application.visa_type] || application.visa_type
  const countryLabel = countryLabels[application.target_country] || application.target_country

  const cardContent = (
    <>
      <CardHeader className={compact ? "pb-3" : ""}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className={compact ? "text-lg" : "text-xl"}>
                {visaTypeLabel}
              </CardTitle>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo?.color}`}>
                <StatusIcon className="h-3 w-3" />
                {statusInfo?.label}
              </span>
            </div>
            <CardDescription className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {countryLabel}
              </span>
              {application.purpose_of_travel && (
                <span className="text-xs">• {application.purpose_of_travel}</span>
              )}
            </CardDescription>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </CardHeader>
      
      {!compact && (
        <CardContent>
          <div className="space-y-3">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{application.progress_percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${application.progress_percentage}%` }}
                />
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Travel Date</p>
                  <p className="font-medium">
                    {application.planned_travel_date 
                      ? new Date(application.planned_travel_date).toLocaleDateString()
                      : 'Not set'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-medium">
                    {new Date(application.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons for certain statuses */}
            {application.status === 'draft' && (
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  Continue where you left off
                </p>
                <Link href={`/dashboard/applications/${application.id}`}>
                  <Button size="sm" className="w-full">
                    Continue Application
                  </Button>
                </Link>
              </div>
            )}

            {application.status === 'rejected' && (
              <div className="pt-2 border-t">
                <Alert className="mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Your application was rejected. Review the feedback and try again.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </>
  )

  if (onClick) {
    return (
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer" 
        onClick={onClick}
      >
        {cardContent}
      </Card>
    )
  }

  return (
    <Link href={`/dashboard/applications/${application.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        {cardContent}
      </Card>
    </Link>
  )
}