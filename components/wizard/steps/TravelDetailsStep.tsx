'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'

interface TravelDetails {
  destinationCountry: string
  visaType: string
  purposeOfVisit: string
  detailedPurpose: string
  plannedArrival: string
  plannedDeparture: string
  durationOfStay: number
  previousVisits: boolean
  previousVisitDetails?: string
  hasInvitation: boolean
  inviterName?: string
  inviterAddress?: string
  inviterRelationship?: string
  accommodationType: string
  accommodationAddress?: string
  citiesVisiting: string
}

interface TravelDetailsStepProps {
  data: Partial<TravelDetails>
  onComplete: (data: TravelDetails, isValid: boolean) => void
}

const visaTypes = {
  tourism: 'Tourism/Visit',
  business: 'Business',
  work: 'Work/Employment',
  study: 'Study/Education',
  family: 'Family Reunion',
  medical: 'Medical Treatment',
  transit: 'Transit',
  other: 'Other'
}

export default function TravelDetailsStep({ data, onComplete }: TravelDetailsStepProps) {
  const [formData, setFormData] = useState<TravelDetails>({
    destinationCountry: '',
    visaType: '',
    purposeOfVisit: '',
    detailedPurpose: '',
    plannedArrival: '',
    plannedDeparture: '',
    durationOfStay: 0,
    previousVisits: false,
    hasInvitation: false,
    accommodationType: '',
    citiesVisiting: '',
    ...data
  })

  useEffect(() => {
    // Calculate duration when dates change
    if (formData.plannedArrival && formData.plannedDeparture) {
      const arrival = new Date(formData.plannedArrival)
      const departure = new Date(formData.plannedDeparture)
      const duration = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24))
      setFormData(prev => ({ ...prev, durationOfStay: duration > 0 ? duration : 0 }))
    }
  }, [formData.plannedArrival, formData.plannedDeparture])

  useEffect(() => {
    const isValid = validateForm()
    onComplete(formData, isValid)
  }, [formData])

  const validateForm = () => {
    const required = [
      formData.destinationCountry,
      formData.visaType,
      formData.purposeOfVisit,
      formData.detailedPurpose,
      formData.plannedArrival,
      formData.plannedDeparture,
      formData.accommodationType,
      formData.citiesVisiting
    ]

    const basicValid = required.every(field => field && field.trim() !== '')
    
    if (!basicValid) return false

    // Additional validation for invitation details
    if (formData.hasInvitation) {
      return !!(formData.inviterName && formData.inviterAddress && formData.inviterRelationship)
    }

    return true
  }

  return (
    <div className="space-y-6">
      {/* Destination and Visa Type */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Visa Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="destinationCountry">Destination Country *</Label>
            <Select
              value={formData.destinationCountry}
              onValueChange={(value) => setFormData({ ...formData, destinationCountry: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DE">Germany</SelectItem>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="GB">United Kingdom</SelectItem>
                <SelectItem value="FR">France</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
                <SelectItem value="NL">Netherlands</SelectItem>
                <SelectItem value="ES">Spain</SelectItem>
                <SelectItem value="IT">Italy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="visaType">Visa Type *</Label>
            <Select
              value={formData.visaType}
              onValueChange={(value) => setFormData({ ...formData, visaType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visa type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(visaTypes).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Purpose of Visit */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Purpose of Visit</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="purposeOfVisit">Primary Purpose *</Label>
            <Input
              id="purposeOfVisit"
              value={formData.purposeOfVisit}
              onChange={(e) => setFormData({ ...formData, purposeOfVisit: e.target.value })}
              placeholder="e.g., Tourism, Business meeting, Conference"
              required
            />
          </div>
          <div>
            <Label htmlFor="detailedPurpose">Detailed Purpose *</Label>
            <Textarea
              id="detailedPurpose"
              value={formData.detailedPurpose}
              onChange={(e) => setFormData({ ...formData, detailedPurpose: e.target.value })}
              placeholder="Please provide a detailed explanation of your visit purpose..."
              rows={4}
              required
            />
          </div>
        </div>
      </div>

      {/* Travel Dates */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Travel Dates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="plannedArrival">Planned Arrival *</Label>
            <Input
              id="plannedArrival"
              type="date"
              value={formData.plannedArrival}
              onChange={(e) => setFormData({ ...formData, plannedArrival: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="plannedDeparture">Planned Departure *</Label>
            <Input
              id="plannedDeparture"
              type="date"
              value={formData.plannedDeparture}
              onChange={(e) => setFormData({ ...formData, plannedDeparture: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="durationOfStay">Duration (days)</Label>
            <Input
              id="durationOfStay"
              type="number"
              value={formData.durationOfStay}
              readOnly
              className="bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Previous Visits */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Previous Visits</h3>
        <div className="space-y-4">
          <div>
            <Label>Have you visited this country before? *</Label>
            <RadioGroup
              value={formData.previousVisits ? 'yes' : 'no'}
              onValueChange={(value) => setFormData({ ...formData, previousVisits: value === 'yes' })}
            >
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="prev-yes" />
                  <Label htmlFor="prev-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="prev-no" />
                  <Label htmlFor="prev-no">No</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          {formData.previousVisits && (
            <div>
              <Label htmlFor="previousVisitDetails">Previous Visit Details</Label>
              <Textarea
                id="previousVisitDetails"
                value={formData.previousVisitDetails || ''}
                onChange={(e) => setFormData({ ...formData, previousVisitDetails: e.target.value })}
                placeholder="Please provide dates and purpose of previous visits..."
                rows={3}
              />
            </div>
          )}
        </div>
      </div>

      {/* Invitation Details */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Invitation Details</h3>
        <div className="space-y-4">
          <div>
            <Label>Do you have an invitation letter? *</Label>
            <RadioGroup
              value={formData.hasInvitation ? 'yes' : 'no'}
              onValueChange={(value) => setFormData({ ...formData, hasInvitation: value === 'yes' })}
            >
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="inv-yes" />
                  <Label htmlFor="inv-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="inv-no" />
                  <Label htmlFor="inv-no">No</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          {formData.hasInvitation && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inviterName">Inviter Name *</Label>
                <Input
                  id="inviterName"
                  value={formData.inviterName || ''}
                  onChange={(e) => setFormData({ ...formData, inviterName: e.target.value })}
                  placeholder="Full name of inviter"
                />
              </div>
              <div>
                <Label htmlFor="inviterRelationship">Relationship *</Label>
                <Input
                  id="inviterRelationship"
                  value={formData.inviterRelationship || ''}
                  onChange={(e) => setFormData({ ...formData, inviterRelationship: e.target.value })}
                  placeholder="e.g., Friend, Business partner"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="inviterAddress">Inviter Address *</Label>
                <Textarea
                  id="inviterAddress"
                  value={formData.inviterAddress || ''}
                  onChange={(e) => setFormData({ ...formData, inviterAddress: e.target.value })}
                  placeholder="Full address of the inviter"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accommodation */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Accommodation</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="accommodationType">Accommodation Type *</Label>
            <Select
              value={formData.accommodationType}
              onValueChange={(value) => setFormData({ ...formData, accommodationType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select accommodation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hotel">Hotel/Hostel</SelectItem>
                <SelectItem value="family">Family/Friends</SelectItem>
                <SelectItem value="rental">Rental/Airbnb</SelectItem>
                <SelectItem value="company">Company Provided</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="accommodationAddress">Accommodation Address</Label>
            <Textarea
              id="accommodationAddress"
              value={formData.accommodationAddress || ''}
              onChange={(e) => setFormData({ ...formData, accommodationAddress: e.target.value })}
              placeholder="Address where you will be staying"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="citiesVisiting">Cities Planning to Visit *</Label>
            <Input
              id="citiesVisiting"
              value={formData.citiesVisiting}
              onChange={(e) => setFormData({ ...formData, citiesVisiting: e.target.value })}
              placeholder="e.g., Berlin, Munich, Frankfurt"
              required
            />
          </div>
        </div>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Ensure all travel dates align with your supporting documents. 
          Your visa duration will be based on these dates.
        </AlertDescription>
      </Alert>
    </div>
  )
}