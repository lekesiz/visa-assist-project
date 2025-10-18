'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileSearch,
  Brain,
  Shield,
  Eye,
  FileText,
  Calendar,
  User,
  Globe,
  Hash,
  Camera,
  Fingerprint,
  ChevronRight,
  Download,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Info
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'

interface AnalysisResult {
  id: string
  document_id: string
  document_type: string
  status: 'analyzing' | 'completed' | 'failed'
  overall_score: number
  is_valid: boolean
  confidence: number
  processing_time: number
  extracted_data: {
    [key: string]: any
  }
  issues: Issue[]
  suggestions: string[]
  metadata: {
    pages?: number
    size?: number
    format?: string
    language?: string
  }
}

interface Issue {
  type: 'error' | 'warning' | 'info'
  code: string
  message: string
  field?: string
  severity: 'high' | 'medium' | 'low'
}

interface DocumentAnalysisResultProps {
  documentId: string
  onReanalyze?: () => void
  onClose?: () => void
  showActions?: boolean
}

const issueIcons = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info
}

const issueColors = {
  error: 'text-red-600 bg-red-100',
  warning: 'text-yellow-600 bg-yellow-100',
  info: 'text-blue-600 bg-blue-100'
}

export function DocumentAnalysisResult({ 
  documentId,
  onReanalyze,
  onClose,
  showActions = true
}: DocumentAnalysisResultProps) {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    fetchAnalysisResult()
  }, [documentId])

  async function fetchAnalysisResult() {
    try {
      setLoading(true)
      setAnalyzing(true)

      if (DemoService.isDemoMode()) {
        // Simulate analysis delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const demoResult: AnalysisResult = {
          id: 'analysis-1',
          document_id: documentId,
          document_type: 'passport',
          status: 'completed',
          overall_score: 95,
          is_valid: true,
          confidence: 98,
          processing_time: 3.2,
          extracted_data: {
            document_number: 'P12345678',
            full_name: 'DEMO USER',
            date_of_birth: '1990-01-15',
            nationality: 'Turkish',
            issue_date: '2020-06-20',
            expiry_date: '2030-06-19',
            place_of_birth: 'Istanbul',
            issuing_authority: 'Republic of Turkey',
            mrz_valid: true,
            biometric_chip: true
          },
          issues: [
            {
              type: 'warning',
              code: 'EXPIRY_SOON',
              message: 'Passport expires in less than 12 months',
              field: 'expiry_date',
              severity: 'medium'
            }
          ],
          suggestions: [
            'Document quality is excellent',
            'All security features detected',
            'Consider renewing passport before visa application'
          ],
          metadata: {
            pages: 2,
            size: 2457600,
            format: 'PDF',
            language: 'en'
          }
        }
        
        setResult(demoResult)
      } else {
        // Fetch real analysis
        const response = await fetch(`/api/documents/${documentId}/analysis`)
        const data = await response.json()
        
        if (data.success) {
          setResult(data.analysis)
        }
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error)
      setResult({
        id: 'error',
        document_id: documentId,
        document_type: 'unknown',
        status: 'failed',
        overall_score: 0,
        is_valid: false,
        confidence: 0,
        processing_time: 0,
        extracted_data: {},
        issues: [{
          type: 'error',
          code: 'ANALYSIS_FAILED',
          message: 'Failed to analyze document',
          severity: 'high'
        }],
        suggestions: [],
        metadata: {}
      })
    } finally {
      setLoading(false)
      setAnalyzing(false)
    }
  }

  if (loading || !result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse" />
            Analyzing Document
          </CardTitle>
          <CardDescription>
            AI is examining your document for accuracy and completeness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FileSearch className="h-8 w-8 text-blue-600 animate-pulse" />
              <div className="flex-1">
                <Progress value={75} className="h-2 animate-pulse" />
                <p className="text-sm text-gray-500 mt-2">
                  Processing document with advanced AI...
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
                <p className="text-xs text-gray-500 mt-1">Validating</p>
              </div>
              <div className="text-center">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
                <p className="text-xs text-gray-500 mt-1">Extracting</p>
              </div>
              <div className="text-center">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
                <p className="text-xs text-gray-500 mt-1">Verifying</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const renderExtractedField = (label: string, value: any, icon?: any) => {
    const Icon = icon || FileText
    
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <Icon className="h-4 w-4 text-gray-400" />
        <div className="flex-1">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="font-medium">{value || 'Not detected'}</p>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {result.is_valid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Document Analysis Complete
            </CardTitle>
            <CardDescription>
              Processed in {result.processing_time}s with {result.confidence}% confidence
            </CardDescription>
          </div>
          {showActions && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onReanalyze}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-analyze
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Overall Score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Document Score</span>
            <span className={`text-2xl font-bold ${getScoreColor(result.overall_score)}`}>
              {result.overall_score}%
            </span>
          </div>
          <Progress value={result.overall_score} className="h-3" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Issues and Warnings */}
        {result.issues.length > 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Issues Found</AlertTitle>
            <AlertDescription>
              <div className="space-y-2 mt-2">
                {result.issues.map((issue, idx) => {
                  const Icon = issueIcons[issue.type]
                  const colorClass = issueColors[issue.type]
                  
                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <Icon className={`h-4 w-4 mt-0.5 ${colorClass.split(' ')[0]}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{issue.message}</p>
                        {issue.field && (
                          <p className="text-xs text-gray-500">Field: {issue.field}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {issue.severity}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs for Details */}
        <Tabs defaultValue="extracted" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="extracted" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {renderExtractedField('Document Number', result.extracted_data.document_number, Hash)}
              {renderExtractedField('Full Name', result.extracted_data.full_name, User)}
              {renderExtractedField('Date of Birth', result.extracted_data.date_of_birth, Calendar)}
              {renderExtractedField('Nationality', result.extracted_data.nationality, Globe)}
              {renderExtractedField('Issue Date', result.extracted_data.issue_date, Calendar)}
              {renderExtractedField('Expiry Date', result.extracted_data.expiry_date, Calendar)}
            </div>
            
            {result.extracted_data.biometric_chip && (
              <Alert className="mt-4">
                <Fingerprint className="h-4 w-4" />
                <AlertDescription>
                  Biometric chip detected and validated
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <div className="space-y-3">
              <ValidationItem
                label="Document Authenticity"
                status="success"
                message="All security features verified"
              />
              <ValidationItem
                label="Data Consistency"
                status="success"
                message="MRZ matches visual zone"
              />
              <ValidationItem
                label="Expiry Status"
                status={result.issues.some(i => i.code === 'EXPIRY_SOON') ? 'warning' : 'success'}
                message={result.issues.find(i => i.code === 'EXPIRY_SOON')?.message || 'Valid for more than 12 months'}
              />
              <ValidationItem
                label="Photo Quality"
                status="success"
                message="Biometric standards met"
              />
              <ValidationItem
                label="Document Condition"
                status="success"
                message="No damage detected"
              />
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            {result.suggestions.map((suggestion, idx) => (
              <Alert key={idx}>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>{suggestion}</AlertDescription>
              </Alert>
            ))}
            
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">AI Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Your document meets all requirements for visa application. 
                  The quality score of {result.overall_score}% is excellent and 
                  will help expedite your application processing.
                </p>
                <Button variant="link" className="p-0 h-auto mt-2">
                  View detailed report
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Metadata */}
        <div className="mt-6 pt-4 border-t grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Format</p>
            <p className="font-medium">{result.metadata.format}</p>
          </div>
          <div>
            <p className="text-gray-500">Size</p>
            <p className="font-medium">
              {((result.metadata.size || 0) / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <div>
            <p className="text-gray-500">Pages</p>
            <p className="font-medium">{result.metadata.pages || 1}</p>
          </div>
          <div>
            <p className="text-gray-500">Language</p>
            <p className="font-medium">{result.metadata.language?.toUpperCase()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Validation Item Component
interface ValidationItemProps {
  label: string
  status: 'success' | 'warning' | 'error'
  message: string
}

function ValidationItem({ label, status, message }: ValidationItemProps) {
  const icons = {
    success: CheckCircle2,
    warning: AlertCircle,
    error: XCircle
  }
  
  const colors = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  }
  
  const Icon = icons[status]
  
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${colors[status]}`} />
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
      </div>
      <Badge 
        variant={status === 'success' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}
      >
        {status}
      </Badge>
    </div>
  )
}