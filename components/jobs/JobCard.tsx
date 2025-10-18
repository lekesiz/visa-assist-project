'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Building,
  Globe,
  Heart,
  HeartOff,
  ExternalLink,
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Languages,
  Code,
  FileText,
  ArrowRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Job } from './JobList'

interface JobCardProps {
  job: Job
  variant?: 'list' | 'grid' | 'compact'
  onSave?: () => void
  onApply?: () => void
  onClick?: () => void
  showMatchScore?: boolean
}

const experienceLevelLabels = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
  lead: 'Lead/Manager',
  executive: 'Executive'
}

const jobTypeColors = {
  'full-time': 'bg-blue-100 text-blue-800',
  'part-time': 'bg-purple-100 text-purple-800',
  'contract': 'bg-orange-100 text-orange-800',
  'internship': 'bg-green-100 text-green-800',
  'freelance': 'bg-pink-100 text-pink-800'
}

export function JobCard({
  job,
  variant = 'list',
  onSave,
  onApply,
  onClick,
  showMatchScore = true
}: JobCardProps) {
  const formatSalary = (salary: Job['salary']) => {
    if (!salary) return null
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency,
      maximumFractionDigits: 0
    })
    
    if (salary.min === salary.max) {
      return formatter.format(salary.min)
    }
    
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`
  }

  const getSalaryPeriod = (period?: string) => {
    switch (period) {
      case 'yearly': return '/year'
      case 'monthly': return '/month'
      case 'hourly': return '/hour'
      default: return '/year'
    }
  }

  if (variant === 'compact') {
    return (
      <div 
        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Briefcase className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">{job.title}</h4>
            <p className="text-sm text-gray-600">{job.company}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.location}
              </span>
              {job.visaSponsorship && (
                <Badge variant="secondary" className="text-xs">
                  Visa Sponsorship
                </Badge>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>
    )
  }

  if (variant === 'grid') {
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-1">{job.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Building className="h-4 w-4" />
                {job.company}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onSave?.()
              }}
            >
              {job.saved ? (
                <Heart className="h-5 w-5 fill-red-500 text-red-500" />
              ) : (
                <HeartOff className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Match Score */}
          {showMatchScore && job.matchScore && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  Match Score
                </span>
                <span className="font-medium">{job.matchScore}%</span>
              </div>
              <Progress value={job.matchScore} className="h-2" />
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Location & Remote */}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-gray-600">
              <MapPin className="h-4 w-4" />
              {job.location}, {job.country}
            </span>
            {job.remote && (
              <Badge variant="secondary">
                <Globe className="h-3 w-3 mr-1" />
                Remote
              </Badge>
            )}
          </div>

          {/* Salary */}
          {job.salary && (
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="font-medium">
                {formatSalary(job.salary)}{getSalaryPeriod(job.salary.period)}
              </span>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge className={jobTypeColors[job.type]}>
              {job.type.replace('-', ' ')}
            </Badge>
            <Badge variant="outline">
              {experienceLevelLabels[job.experienceLevel]}
            </Badge>
            {job.visaSponsorship && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Visa Sponsorship
              </Badge>
            )}
          </div>

          {/* Posted Date */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(job.posted_at), { addSuffix: true })}
            </span>
            {job.applicants && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {job.applicants} applicants
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant={job.applied ? "secondary" : "default"}
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                onApply?.()
              }}
              disabled={job.applied}
            >
              {job.applied ? 'Applied' : 'Apply Now'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                window.open(job.url, '_blank')
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // List variant (default)
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors">
                  {job.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {job.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location}, {job.country}
                  </span>
                  {job.remote && (
                    <Badge variant="secondary" className="text-xs">
                      <Globe className="h-3 w-3 mr-1" />
                      Remote
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onSave?.()
                }}
              >
                {job.saved ? (
                  <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                ) : (
                  <HeartOff className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {job.description}
            </p>

            {/* Requirements Preview */}
            {job.requirements.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Key Requirements:</p>
                <ul className="text-sm text-gray-600 space-y-0.5">
                  {job.requirements.slice(0, 3).map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span className="line-clamp-1">{req}</span>
                    </li>
                  ))}
                  {job.requirements.length > 3 && (
                    <li className="text-blue-600 font-medium">
                      +{job.requirements.length - 3} more requirements
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Skills & Languages */}
            <div className="flex flex-wrap gap-2 mb-4">
              {job.skills?.slice(0, 4).map(skill => (
                <Badge key={skill} variant="outline" className="text-xs">
                  <Code className="h-3 w-3 mr-1" />
                  {skill}
                </Badge>
              ))}
              {job.languages?.map(lang => (
                <Badge key={lang} variant="outline" className="text-xs">
                  <Languages className="h-3 w-3 mr-1" />
                  {lang}
                </Badge>
              ))}
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                {/* Job Type & Level */}
                <Badge className={jobTypeColors[job.type]}>
                  {job.type.replace('-', ' ')}
                </Badge>
                <span className="text-gray-600">
                  {experienceLevelLabels[job.experienceLevel]}
                </span>

                {/* Salary */}
                {job.salary && (
                  <span className="flex items-center gap-1 font-medium">
                    <DollarSign className="h-4 w-4" />
                    {formatSalary(job.salary)}{getSalaryPeriod(job.salary.period)}
                  </span>
                )}

                {/* Visa Sponsorship */}
                {job.visaSponsorship && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Visa Sponsorship
                  </Badge>
                )}
              </div>

              {/* Posted Date & Applicants */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{formatDistanceToNow(new Date(job.posted_at), { addSuffix: true })}</span>
                {job.applicants && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {job.applicants} applicants
                  </span>
                )}
              </div>
            </div>

            {/* Match Score & Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              {showMatchScore && job.matchScore ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Match Score:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={job.matchScore} className="h-2 w-24" />
                    <span className="text-sm font-bold">{job.matchScore}%</span>
                  </div>
                </div>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <Button
                  variant={job.applied ? "secondary" : "default"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onApply?.()
                  }}
                  disabled={job.applied}
                >
                  {job.applied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Applied
                    </>
                  ) : (
                    <>
                      Apply Now
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
                {job.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(job.url, '_blank')
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}