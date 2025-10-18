import { Check, Circle, AlertCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChecklistItemProps {
  item: {
    id: string
    label: string
    completed: boolean
    required: boolean
    locked?: boolean
    description?: string
  }
  onToggle: (id: string) => void
  onAction?: (id: string) => void
  disabled?: boolean
}

export function ChecklistItem({ 
  item, 
  onToggle, 
  onAction,
  disabled = false 
}: ChecklistItemProps) {
  const handleClick = () => {
    if (!disabled && !item.locked) {
      onToggle(item.id)
    }
  }

  return (
    <div 
      className={`
        flex items-start gap-3 p-4 rounded-lg border transition-all
        ${item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}
        ${!disabled && !item.locked ? 'hover:border-gray-300 cursor-pointer' : ''}
        ${item.locked ? 'opacity-60' : ''}
      `}
      onClick={handleClick}
    >
      {/* Checkbox */}
      <div className="pt-0.5">
        {item.locked ? (
          <div className="w-5 h-5 rounded flex items-center justify-center bg-gray-100">
            <Lock className="h-3 w-3 text-gray-400" />
          </div>
        ) : item.completed ? (
          <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded border-2 border-gray-300" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <p className={`font-medium ${item.completed ? 'text-green-700' : 'text-gray-900'}`}>
              {item.label}
              {item.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </p>
            {item.description && (
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            )}
          </div>
          
          {/* Action Button */}
          {onAction && !item.completed && !item.locked && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onAction(item.id)
              }}
              className="ml-4"
            >
              Upload
            </Button>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 mt-2">
          {item.completed ? (
            <span className="inline-flex items-center text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
            </span>
          ) : item.required ? (
            <span className="inline-flex items-center text-xs text-orange-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              Required
            </span>
          ) : (
            <span className="text-xs text-gray-500">Optional</span>
          )}

          {item.locked && (
            <span className="inline-flex items-center text-xs text-gray-500">
              <Lock className="h-3 w-3 mr-1" />
              Complete previous steps first
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface ChecklistSectionProps {
  title: string
  items: ChecklistItemProps['item'][]
  onToggle: (id: string) => void
  onAction?: (id: string) => void
}

export function ChecklistSection({ 
  title, 
  items, 
  onToggle, 
  onAction 
}: ChecklistSectionProps) {
  const completedCount = items.filter(item => item.completed).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <span className="text-sm text-gray-500">
            {completedCount} of {totalCount} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <ChecklistItem
            key={item.id}
            item={item}
            onToggle={onToggle}
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  )
}