'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { countries } from '@/lib/data/countries'

interface PersonalInfo {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  nationality: string
  placeOfBirth: string
  maritalStatus: string
  passportNumber: string
  passportIssueDate: string
  passportExpiryDate: string
  phoneNumber: string
  email: string
  currentAddress: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}

interface PersonalInfoStepProps {
  data: Partial<PersonalInfo>
  onComplete: (data: PersonalInfo, isValid: boolean) => void
}

export default function PersonalInfoStep({ data, onComplete }: PersonalInfoStepProps) {
  const [formData, setFormData] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    placeOfBirth: '',
    maritalStatus: 'single',
    passportNumber: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    phoneNumber: '',
    email: '',
    currentAddress: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    ...data
  })

  useEffect(() => {
    const isValid = validateForm()
    onComplete(formData, isValid)
  }, [formData])

  const validateForm = () => {
    const required = [
      formData.firstName,
      formData.lastName,
      formData.dateOfBirth,
      formData.gender,
      formData.nationality,
      formData.placeOfBirth,
      formData.passportNumber,
      formData.passportIssueDate,
      formData.passportExpiryDate,
      formData.phoneNumber,
      formData.email,
      formData.currentAddress.street,
      formData.currentAddress.city,
      formData.currentAddress.country
    ]

    return required.every(field => field && field.trim() !== '')
  }

  const updateAddress = (field: keyof typeof formData.currentAddress, value: string) => {
    setFormData(prev => ({
      ...prev,
      currentAddress: {
        ...prev.currentAddress,
        [field]: value
      }
    }))
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="John"
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Doe"
              required
            />
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="placeOfBirth">Place of Birth *</Label>
            <Input
              id="placeOfBirth"
              value={formData.placeOfBirth}
              onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
              placeholder="Istanbul, Turkey"
              required
            />
          </div>
          <div>
            <Label>Gender *</Label>
            <RadioGroup
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
            >
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          <div>
            <Label htmlFor="maritalStatus">Marital Status *</Label>
            <Select
              value={formData.maritalStatus}
              onValueChange={(value) => setFormData({ ...formData, maritalStatus: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="nationality">Nationality *</Label>
            <Select
              value={formData.nationality}
              onValueChange={(value) => setFormData({ ...formData, nationality: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select nationality" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Passport Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Passport Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="passportNumber">Passport Number *</Label>
            <Input
              id="passportNumber"
              value={formData.passportNumber}
              onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
              placeholder="A12345678"
              required
            />
          </div>
          <div>
            <Label htmlFor="passportIssueDate">Issue Date *</Label>
            <Input
              id="passportIssueDate"
              type="date"
              value={formData.passportIssueDate}
              onChange={(e) => setFormData({ ...formData, passportIssueDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="passportExpiryDate">Expiry Date *</Label>
            <Input
              id="passportExpiryDate"
              type="date"
              value={formData.passportExpiryDate}
              onChange={(e) => setFormData({ ...formData, passportExpiryDate: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+90 555 123 4567"
              required
            />
          </div>
        </div>
      </div>

      {/* Current Address */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="street">Street Address *</Label>
            <Input
              id="street"
              value={formData.currentAddress.street}
              onChange={(e) => updateAddress('street', e.target.value)}
              placeholder="123 Main Street"
              required
            />
          </div>
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.currentAddress.city}
              onChange={(e) => updateAddress('city', e.target.value)}
              placeholder="Istanbul"
              required
            />
          </div>
          <div>
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              value={formData.currentAddress.state}
              onChange={(e) => updateAddress('state', e.target.value)}
              placeholder="Istanbul"
            />
          </div>
          <div>
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input
              id="postalCode"
              value={formData.currentAddress.postalCode}
              onChange={(e) => updateAddress('postalCode', e.target.value)}
              placeholder="34000"
            />
          </div>
          <div>
            <Label htmlFor="country">Country *</Label>
            <Select
              value={formData.currentAddress.country}
              onValueChange={(value) => updateAddress('country', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}