'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  Calendar,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Bell,
  Target,
  Flag
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns'

interface Task {
  id: string
  title: string
  description?: string
  type: 'document' | 'application' | 'appointment' | 'payment' | 'general'
  priority: 'high' | 'medium' | 'low'
  due_date?: string
  completed: boolean
  application_id?: string
  metadata?: any
}

interface UpcomingTasksProps {
  userId?: string
  limit?: number
  showHeader?: boolean
  compact?: boolean
  onTaskClick?: (task: Task) => void
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200'
}

const taskIcons = {
  document: Upload,
  application: FileText,
  appointment: Calendar,
  payment: AlertCircle,
  general: Target
}

export function UpcomingTasks({ 
  userId, 
  limit = 5,
  showHeader = true,
  compact = false,
  onTaskClick
}: UpcomingTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchTasks()
  }, [userId, limit])

  async function fetchTasks() {
    try {
      setLoading(true)

      if (DemoService.isDemoMode()) {
        // Demo tasks
        const demoTasks: Task[] = [
          {
            id: '1',
            title: 'Upload biometric photo',
            description: 'Required for visa application processing',
            type: 'document',
            priority: 'high',
            due_date: addDays(new Date(), 3).toISOString(),
            completed: false,
            application_id: 'app-1'
          },
          {
            id: '2',
            title: 'Submit financial statements',
            description: 'Bank statements for the last 3 months',
            type: 'document',
            priority: 'high',
            due_date: addDays(new Date(), 5).toISOString(),
            completed: false,
            application_id: 'app-1'
          },
          {
            id: '3',
            title: 'Complete health insurance form',
            description: 'Travel insurance documentation',
            type: 'application',
            priority: 'medium',
            due_date: addDays(new Date(), 7).toISOString(),
            completed: false
          },
          {
            id: '4',
            title: 'Pay visa processing fee',
            description: 'Processing fee of €75',
            type: 'payment',
            priority: 'medium',
            due_date: addDays(new Date(), 10).toISOString(),
            completed: false
          },
          {
            id: '5',
            title: 'Book biometrics appointment',
            description: 'Schedule appointment at visa center',
            type: 'appointment',
            priority: 'low',
            due_date: addDays(new Date(), 14).toISOString(),
            completed: false
          }
        ]
        setTasks(demoTasks.slice(0, limit))
      } else {
        // Fetch real tasks - would come from a tasks table
        setTasks([])
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskComplete = async (taskId: string) => {
    try {
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ))

      if (!DemoService.isDemoMode()) {
        // Update task in database
        await supabase
          .from('tasks')
          .update({ completed: true })
          .eq('id', taskId)
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const getTaskIcon = (type: Task['type']) => {
    const Icon = taskIcons[type] || Target
    return Icon
  }

  const getTimeRemaining = (dueDate?: string) => {
    if (!dueDate) return null
    
    const due = new Date(dueDate)
    const now = new Date()
    
    if (isBefore(due, now)) {
      return { text: 'Overdue', urgent: true }
    }
    
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue <= 1) {
      return { text: 'Due today', urgent: true }
    } else if (daysUntilDue <= 3) {
      return { text: `${daysUntilDue} days left`, urgent: true }
    } else {
      return { text: formatDistanceToNow(due, { addSuffix: true }), urgent: false }
    }
  }

  const incompleteTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)
  const completionPercentage = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0

  if (loading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Tasks and deadlines to complete</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Tasks and deadlines to complete</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No tasks pending</p>
            <p className="text-sm text-gray-400 mt-2">You're all caught up!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {incompleteTasks.slice(0, 3).map(task => {
          const Icon = getTaskIcon(task.type)
          const timeRemaining = getTimeRemaining(task.due_date)
          
          return (
            <div 
              key={task.id} 
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onTaskClick?.(task)}
            >
              <Icon className="h-4 w-4 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                {timeRemaining && (
                  <p className={`text-xs ${timeRemaining.urgent ? 'text-red-600' : 'text-gray-500'}`}>
                    {timeRemaining.text}
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upcoming Tasks</CardTitle>
              <CardDescription>
                {incompleteTasks.length} pending, {completedTasks.length} completed
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Reminders
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-medium">{Math.round(completionPercentage)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {tasks.map(task => {
            const Icon = getTaskIcon(task.type)
            const timeRemaining = getTimeRemaining(task.due_date)
            
            return (
              <div 
                key={task.id} 
                className={`p-4 border rounded-lg transition-colors ${
                  task.completed ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => handleTaskComplete(task.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-400" />
                      <p className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                        {task.title}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${priorityColors[task.priority]}`}
                      >
                        <Flag className="h-3 w-3 mr-1" />
                        {task.priority}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {timeRemaining && (
                        <span className={`flex items-center gap-1 ${
                          timeRemaining.urgent && !task.completed ? 'text-red-600 font-medium' : ''
                        }`}>
                          <Clock className="h-3 w-3" />
                          {timeRemaining.text}
                        </span>
                      )}
                      {task.application_id && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Related to application
                        </span>
                      )}
                    </div>
                  </div>
                  {onTaskClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onTaskClick(task)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {tasks.filter(t => t.priority === 'high' && !t.completed).length}
            </p>
            <p className="text-xs text-gray-500">High Priority</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {tasks.filter(t => {
                const time = getTimeRemaining(t.due_date)
                return time?.urgent && !t.completed
              }).length}
            </p>
            <p className="text-xs text-gray-500">Due Soon</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {completedTasks.length}
            </p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}