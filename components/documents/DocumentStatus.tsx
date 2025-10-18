import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Upload,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentStatusProps {
  status: 'pending' | 'uploaded' | 'verified' | 'rejected'
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending Review',
    color: 'text-yellow-600 bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  uploaded: {
    icon: Upload,
    label: 'Uploaded',
    color: 'text-blue-600 bg-blue-100',
    borderColor: 'border-blue-200'
  },
  verified: {
    icon: CheckCircle2,
    label: 'Verified',
    color: 'text-green-600 bg-green-100',
    borderColor: 'border-green-200'
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    color: 'text-red-600 bg-red-100',
    borderColor: 'border-red-200'
  }
}

export function DocumentStatus({ 
  status, 
  showLabel = false,
  size = 'md',
  className 
}: DocumentStatusProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const sizeClasses = {
    sm: {
      container: 'px-2 py-0.5',
      icon: 'h-3 w-3',
      text: 'text-xs'
    },
    md: {
      container: 'px-2.5 py-1',
      icon: 'h-4 w-4',
      text: 'text-sm'
    },
    lg: {
      container: 'px-3 py-1.5',
      icon: 'h-5 w-5',
      text: 'text-base'
    }
  }

  const sizeClass = sizeClasses[size]

  if (!showLabel) {
    return (
      <div className={cn(
        'inline-flex items-center justify-center rounded-full',
        config.color,
        sizeClass.container,
        className
      )}>
        <Icon className={sizeClass.icon} />
      </div>
    )
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 rounded-full border',
      config.color,
      config.borderColor,
      sizeClass.container,
      className
    )}>
      <Icon className={sizeClass.icon} />
      <span className={cn('font-medium', sizeClass.text)}>
        {config.label}
      </span>
    </div>
  )
}

interface DocumentStatusBadgeProps {
  status: DocumentStatusProps['status']
  count?: number
  onClick?: () => void
}

export function DocumentStatusBadge({ 
  status, 
  count,
  onClick 
}: DocumentStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
        'border hover:shadow-sm',
        config.borderColor,
        onClick && 'cursor-pointer hover:bg-gray-50'
      )}
      disabled={!onClick}
    >
      <Icon className={cn('h-5 w-5', config.color.split(' ')[0])} />
      <div className="text-left">
        <p className="text-sm font-medium">{config.label}</p>
        {count !== undefined && (
          <p className="text-xs text-gray-500">{count} document{count !== 1 ? 's' : ''}</p>
        )}
      </div>
    </button>
  )
}

interface DocumentStatusSummaryProps {
  documents: Array<{ status: DocumentStatusProps['status'] }>
  onStatusClick?: (status: DocumentStatusProps['status']) => void
}

export function DocumentStatusSummary({ 
  documents,
  onStatusClick 
}: DocumentStatusSummaryProps) {
  const statusCounts = documents.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statuses: DocumentStatusProps['status'][] = ['verified', 'pending', 'uploaded', 'rejected']

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statuses.map(status => (
        <DocumentStatusBadge
          key={status}
          status={status}
          count={statusCounts[status] || 0}
          onClick={onStatusClick ? () => onStatusClick(status) : undefined}
        />
      ))}
    </div>
  )
}

interface DocumentStatusTimelineProps {
  currentStatus: DocumentStatusProps['status']
  rejectionReason?: string
}

export function DocumentStatusTimeline({ 
  currentStatus,
  rejectionReason 
}: DocumentStatusTimelineProps) {
  const timeline = [
    { status: 'uploaded', label: 'Document Uploaded' },
    { status: 'pending', label: 'Under Review' },
    { status: currentStatus === 'rejected' ? 'rejected' : 'verified', 
      label: currentStatus === 'rejected' ? 'Rejected' : 'Verified' }
  ]

  const currentIndex = timeline.findIndex(item => item.status === currentStatus)

  return (
    <div className="space-y-4">
      {timeline.map((item, index) => {
        const config = statusConfig[item.status as DocumentStatusProps['status']]
        const Icon = config.icon
        const isCompleted = index <= currentIndex
        const isCurrent = index === currentIndex

        return (
          <div key={item.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                'rounded-full p-2',
                isCompleted ? config.color : 'text-gray-400 bg-gray-100'
              )}>
                <Icon className="h-5 w-5" />
              </div>
              {index < timeline.length - 1 && (
                <div className={cn(
                  'w-0.5 h-8 mt-2',
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                )} />
              )}
            </div>
            <div className="flex-1 pb-8">
              <p className={cn(
                'font-medium',
                isCompleted ? 'text-gray-900' : 'text-gray-400'
              )}>
                {item.label}
              </p>
              {isCurrent && (
                <p className="text-sm text-gray-500 mt-1">Current status</p>
              )}
              {item.status === 'rejected' && rejectionReason && isCompleted && (
                <div className="mt-2 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700">
                    <span className="font-medium">Reason:</span> {rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}