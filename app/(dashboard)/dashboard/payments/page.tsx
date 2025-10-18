'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CreditCard,
  DollarSign,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Receipt,
  AlertCircle,
  ExternalLink,
  Calendar,
  Filter,
  Search,
  Plus
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'

interface Payment {
  id: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed' | 'refunded'
  type: 'visa_fee' | 'service_fee' | 'document_fee' | 'premium_service' | 'consultation'
  description: string
  payment_method?: {
    type: 'card' | 'paypal' | 'bank_transfer'
    last4?: string
    brand?: string
  }
  invoice_url?: string
  receipt_url?: string
  created_at: string
  paid_at?: string
  application_id?: string
}

interface PaymentStats {
  total_paid: number
  pending_payments: number
  this_month: number
  average_payment: number
}

const mockPayments: Payment[] = [
  {
    id: 'pay_1',
    amount: 75,
    currency: 'EUR',
    status: 'succeeded',
    type: 'visa_fee',
    description: 'Germany Work Visa Application Fee',
    payment_method: {
      type: 'card',
      last4: '4242',
      brand: 'visa'
    },
    invoice_url: '#',
    receipt_url: '#',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    paid_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'pay_2',
    amount: 35,
    currency: 'EUR',
    status: 'succeeded',
    type: 'document_fee',
    description: 'Document Translation Service',
    payment_method: {
      type: 'paypal'
    },
    receipt_url: '#',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    paid_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'pay_3',
    amount: 150,
    currency: 'EUR',
    status: 'pending',
    type: 'consultation',
    description: 'Expert Visa Consultation (1 hour)',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'pay_4',
    amount: 50,
    currency: 'EUR',
    status: 'refunded',
    type: 'service_fee',
    description: 'Express Processing Service',
    payment_method: {
      type: 'card',
      last4: '1234',
      brand: 'mastercard'
    },
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    paid_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
]

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchPayments()
  }, [])

  async function fetchPayments() {
    try {
      setLoading(true)

      if (DemoService.isDemoMode()) {
        // Use mock data
        await new Promise(resolve => setTimeout(resolve, 1000))
        setPayments(mockPayments)
        
        // Calculate stats
        const stats: PaymentStats = {
          total_paid: mockPayments
            .filter(p => p.status === 'succeeded')
            .reduce((sum, p) => sum + p.amount, 0),
          pending_payments: mockPayments.filter(p => p.status === 'pending').length,
          this_month: mockPayments
            .filter(p => {
              const paymentDate = new Date(p.created_at)
              const now = new Date()
              return paymentDate.getMonth() === now.getMonth() && 
                     paymentDate.getFullYear() === now.getFullYear()
            })
            .reduce((sum, p) => sum + (p.status === 'succeeded' ? p.amount : 0), 0),
          average_payment: mockPayments
            .filter(p => p.status === 'succeeded')
            .reduce((sum, p, _, arr) => sum + p.amount / arr.length, 0)
        }
        setStats(stats)
      } else {
        // Fetch real payments
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!error && data) {
          setPayments(data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = (payment: Payment) => {
    if (payment.invoice_url) {
      window.open(payment.invoice_url, '_blank')
    }
  }

  const handleDownloadReceipt = (payment: Payment) => {
    if (payment.receipt_url) {
      window.open(payment.receipt_url, '_blank')
    }
  }

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus
    const matchesType = filterType === 'all' || payment.type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  const statusColors = {
    succeeded: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800'
  }

  const statusIcons = {
    succeeded: CheckCircle2,
    pending: Clock,
    failed: XCircle,
    refunded: Receipt
  }

  const typeLabels = {
    visa_fee: 'Visa Fee',
    service_fee: 'Service Fee',
    document_fee: 'Document Fee',
    premium_service: 'Premium Service',
    consultation: 'Consultation'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-8 w-32 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment History</h1>
          <p className="text-gray-600 mt-1">
            View and manage your payment transactions
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold">€{stats.total_paid}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending_payments}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold">€{stats.this_month}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average</p>
                  <p className="text-2xl font-bold">€{Math.round(stats.average_payment)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Receipt className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="succeeded">Succeeded</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Types</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {filteredPayments.length} transaction{filteredPayments.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayments.length > 0 ? (
            <div className="space-y-4">
              {filteredPayments.map(payment => {
                const StatusIcon = statusIcons[payment.status]
                
                return (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${statusColors[payment.status]}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{payment.description}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                          <span>{typeLabels[payment.type]}</span>
                          <span>•</span>
                          <span>{format(new Date(payment.created_at), 'MMM d, yyyy')}</span>
                          {payment.payment_method && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {payment.payment_method.type === 'card' && payment.payment_method.brand} 
                                {payment.payment_method.last4 && ` ****${payment.payment_method.last4}`}
                                {payment.payment_method.type === 'paypal' && 'PayPal'}
                              </span>
                            </>
                          )}
                        </div>
                        {payment.status === 'pending' && (
                          <Alert className="mt-2 p-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              Payment is pending. Complete the payment to proceed.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          €{payment.amount}
                        </p>
                        <Badge className={statusColors[payment.status]}>
                          {payment.status}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        {payment.invoice_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadInvoice(payment)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        {payment.receipt_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReceipt(payment)}
                          >
                            <Receipt className="h-4 w-4" />
                          </Button>
                        )}
                        {payment.status === 'pending' && (
                          <Button size="sm">
                            Pay Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No payments found</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Your payment history will appear here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Manage your saved payment methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Visa ****4242</p>
                  <p className="text-sm text-gray-500">Expires 12/2025</p>
                </div>
              </div>
              <Badge variant="secondary">Default</Badge>
            </div>
            
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Need help with payments?</strong> Contact our support team at payments@visa-assist.com 
          or call +49 123 456 7890 for assistance.
        </AlertDescription>
      </Alert>
    </div>
  )
}