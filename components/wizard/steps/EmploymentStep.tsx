'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Briefcase } from 'lucide-react'

interface Employment {
  currentStatus: string
  currentEmployer?: {
    name: string
    position: string
    startDate: string
    address: string
    phone: string
    monthlyIncome: string
    currency: string
    duties: string
  }
  previousEmployers: Array<{
    id: string
    name: string
    position: string
    startDate: string
    endDate: string
    location: string
  }>
  unemploymentReason?: string
  totalWorkExperience: number
}

interface EmploymentStepProps {
  data: Partial<Employment>
  onComplete: (data: Employment, isValid: boolean) => void
}

const employmentStatuses = [
  { value: 'employed', label: 'Employed' },
  { value: 'self-employed', label: 'Self-Employed' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' },
  { value: 'unemployed', label: 'Unemployed' }
]

const currencies = [
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'TRY', label: 'TRY - Turkish Lira' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' }
]

export default function EmploymentStep({ data, onComplete }: EmploymentStepProps) {
  const [formData, setFormData] = useState<Employment>({
    currentStatus: '',
    previousEmployers: [],
    totalWorkExperience: 0,
    ...data
  })

  useEffect(() => {
    const isValid = validateForm()
    onComplete(formData, isValid)
  }, [formData])

  const validateForm = () => {
    if (!formData.currentStatus) return false

    if (formData.currentStatus === 'employed' || formData.currentStatus === 'self-employed') {
      if (!formData.currentEmployer) return false
      
      const employer = formData.currentEmployer
      const required = [
        employer.name,
        employer.position,
        employer.startDate,
        employer.address,
        employer.monthlyIncome,
        employer.currency,
        employer.duties
      ]
      
      return required.every(field => field && field.trim() !== '')
    }

    if (formData.currentStatus === 'unemployed' && !formData.unemploymentReason) {
      return false
    }

    return true
  }

  const updateCurrentEmployer = (field: keyof typeof formData.currentEmployer, value: string) => {
    setFormData(prev => ({
      ...prev,
      currentEmployer: {
        ...prev.currentEmployer!,
        [field]: value
      }
    }))
  }

  const addPreviousEmployer = () => {
    const newEmployer = {
      id: Date.now().toString(),
      name: '',
      position: '',
      startDate: '',
      endDate: '',
      location: ''
    }

    setFormData(prev => ({
      ...prev,
      previousEmployers: [...prev.previousEmployers, newEmployer]
    }))
  }

  const updatePreviousEmployer = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      previousEmployers: prev.previousEmployers.map(emp =>
        emp.id === id ? { ...emp, [field]: value } : emp
      )
    }))
  }

  const removePreviousEmployer = (id: string) => {
    setFormData(prev => ({
      ...prev,
      previousEmployers: prev.previousEmployers.filter(emp => emp.id !== id)
    }))
  }

  return (
    <div className="space-y-6">
      {/* Employment Status */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Employment Status</h3>
        <div>
          <Label>Current Employment Status *</Label>
          <RadioGroup
            value={formData.currentStatus}
            onValueChange={(value) => setFormData({ ...formData, currentStatus: value })}
            className="mt-2"
          >
            {employmentStatuses.map(status => (
              <div key={status.value} className="flex items-center space-x-2">
                <RadioGroupItem value={status.value} id={status.value} />
                <Label htmlFor={status.value}>{status.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* Current Employment Details */}
      {(formData.currentStatus === 'employed' || formData.currentStatus === 'self-employed') && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Current Employment Details
          </h3>
          {!formData.currentEmployer && setFormData(prev => ({
            ...prev,
            currentEmployer: {
              name: '',
              position: '',
              startDate: '',
              address: '',
              phone: '',
              monthlyIncome: '',
              currency: 'EUR',
              duties: ''
            }
          }))}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employerName">Employer/Company Name *</Label>
              <Input
                id="employerName"
                value={formData.currentEmployer?.name || ''}
                onChange={(e) => updateCurrentEmployer('name', e.target.value)}
                placeholder={formData.currentStatus === 'self-employed' ? 'Your company name' : 'Company name'}
                required
              />
            </div>
            <div>
              <Label htmlFor="position">Position/Title *</Label>
              <Input
                id="position"
                value={formData.currentEmployer?.position || ''}
                onChange={(e) => updateCurrentEmployer('position', e.target.value)}
                placeholder="e.g., Software Engineer"
                required
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.currentEmployer?.startDate || ''}
                onChange={(e) => updateCurrentEmployer('startDate', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Company Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.currentEmployer?.phone || ''}
                onChange={(e) => updateCurrentEmployer('phone', e.target.value)}
                placeholder="+90 212 123 4567"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Company Address *</Label>
              <Textarea
                id="address"
                value={formData.currentEmployer?.address || ''}
                onChange={(e) => updateCurrentEmployer('address', e.target.value)}
                placeholder="Full company address"
                rows={2}
                required
              />
            </div>
            <div>
              <Label htmlFor="monthlyIncome">Monthly Income *</Label>
              <Input
                id="monthlyIncome"
                type="number"
                value={formData.currentEmployer?.monthlyIncome || ''}
                onChange={(e) => updateCurrentEmployer('monthlyIncome', e.target.value)}
                placeholder="5000"
                required
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={formData.currentEmployer?.currency || 'EUR'}
                onValueChange={(value) => updateCurrentEmployer('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(currency => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="duties">Job Duties/Responsibilities *</Label>
              <Textarea
                id="duties"
                value={formData.currentEmployer?.duties || ''}
                onChange={(e) => updateCurrentEmployer('duties', e.target.value)}
                placeholder="Describe your main responsibilities..."
                rows={3}
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* Unemployment Details */}
      {formData.currentStatus === 'unemployed' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Unemployment Details</h3>
          <div>
            <Label htmlFor="unemploymentReason">Reason for Unemployment *</Label>
            <Textarea
              id="unemploymentReason"
              value={formData.unemploymentReason || ''}
              onChange={(e) => setFormData({ ...formData, unemploymentReason: e.target.value })}
              placeholder="Please explain your current situation..."
              rows={3}
              required
            />
          </div>
        </div>
      )}

      {/* Previous Employment History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Previous Employment History</h3>
        <p className="text-sm text-gray-600 mb-4">
          List your previous employers for the last 5 years (if applicable)
        </p>
        
        {formData.previousEmployers.map((employer, index) => (
          <Card key={employer.id} className="mb-4">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium">Previous Employer #{index + 1}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePreviousEmployer(employer.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={employer.name}
                    onChange={(e) => updatePreviousEmployer(employer.id, 'name', e.target.value)}
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <Label>Position</Label>
                  <Input
                    value={employer.position}
                    onChange={(e) => updatePreviousEmployer(employer.id, 'position', e.target.value)}
                    placeholder="Your position"
                  />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={employer.startDate}
                    onChange={(e) => updatePreviousEmployer(employer.id, 'startDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={employer.endDate}
                    onChange={(e) => updatePreviousEmployer(employer.id, 'endDate', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Location</Label>
                  <Input
                    value={employer.location}
                    onChange={(e) => updatePreviousEmployer(employer.id, 'location', e.target.value)}
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <Button
          variant="outline"
          onClick={addPreviousEmployer}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Previous Employer
        </Button>
      </div>

      {/* Total Work Experience */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Total Work Experience</h3>
        <div>
          <Label htmlFor="totalExperience">Years of Professional Experience</Label>
          <Input
            id="totalExperience"
            type="number"
            value={formData.totalWorkExperience}
            onChange={(e) => setFormData({ ...formData, totalWorkExperience: parseInt(e.target.value) || 0 })}
            placeholder="0"
            min="0"
          />
        </div>
      </div>
    </div>
  )
}