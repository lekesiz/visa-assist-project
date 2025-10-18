'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { DollarSign, CreditCard, Building, InfoIcon } from 'lucide-react'

interface Financial {
  fundingSource: string
  personalSavings?: {
    amount: string
    currency: string
    bankName: string
    accountType: string
  }
  sponsorDetails?: {
    name: string
    relationship: string
    occupation: string
    income: string
    currency: string
    willProvideAffidavit: boolean
  }
  monthlyExpenses: string
  hasDebts: boolean
  debtDetails?: string
  hasAssets: boolean
  assetDetails?: {
    property: boolean
    propertyValue?: string
    vehicle: boolean
    vehicleValue?: string
    investments: boolean
    investmentValue?: string
    other?: string
  }
  travelBudget: string
  emergencyFunds: string
  proofOfFunds: string[]
}

interface FinancialStepProps {
  data: Partial<Financial>
  onComplete: (data: Financial, isValid: boolean) => void
}

const fundingSources = [
  { value: 'personal', label: 'Personal Savings' },
  { value: 'sponsor', label: 'Family/Sponsor Support' },
  { value: 'employer', label: 'Employer Sponsorship' },
  { value: 'scholarship', label: 'Scholarship/Grant' },
  { value: 'mixed', label: 'Multiple Sources' }
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

const proofDocuments = [
  { value: 'bank_statement', label: 'Bank Statements (3-6 months)' },
  { value: 'salary_slip', label: 'Salary Slips' },
  { value: 'tax_return', label: 'Tax Returns' },
  { value: 'property_deed', label: 'Property Ownership Documents' },
  { value: 'investment_proof', label: 'Investment Certificates' },
  { value: 'sponsor_letter', label: 'Sponsor Letter' },
  { value: 'employment_letter', label: 'Employment Verification Letter' }
]

export default function FinancialStep({ data, onComplete }: FinancialStepProps) {
  const [formData, setFormData] = useState<Financial>({
    fundingSource: '',
    monthlyExpenses: '',
    hasDebts: false,
    hasAssets: false,
    travelBudget: '',
    emergencyFunds: '',
    proofOfFunds: [],
    ...data
  })

  useEffect(() => {
    const isValid = validateForm()
    onComplete(formData, isValid)
  }, [formData])

  const validateForm = () => {
    if (!formData.fundingSource) return false
    if (!formData.monthlyExpenses) return false
    if (!formData.travelBudget) return false
    if (!formData.emergencyFunds) return false
    if (formData.proofOfFunds.length === 0) return false

    // Validate based on funding source
    if (formData.fundingSource === 'personal' || formData.fundingSource === 'mixed') {
      if (!formData.personalSavings) return false
      const savings = formData.personalSavings
      if (!savings.amount || !savings.currency || !savings.bankName || !savings.accountType) {
        return false
      }
    }

    if (formData.fundingSource === 'sponsor') {
      if (!formData.sponsorDetails) return false
      const sponsor = formData.sponsorDetails
      const required = [
        sponsor.name,
        sponsor.relationship,
        sponsor.occupation,
        sponsor.income,
        sponsor.currency
      ]
      if (!required.every(field => field && field.trim() !== '')) {
        return false
      }
    }

    return true
  }

  const updatePersonalSavings = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalSavings: {
        ...prev.personalSavings!,
        [field]: value
      }
    }))
  }

  const updateSponsorDetails = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      sponsorDetails: {
        ...prev.sponsorDetails!,
        [field]: value
      }
    }))
  }

  const updateAssetDetails = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      assetDetails: {
        ...prev.assetDetails!,
        [field]: value
      }
    }))
  }

  const toggleProofDocument = (docType: string) => {
    setFormData(prev => ({
      ...prev,
      proofOfFunds: prev.proofOfFunds.includes(docType)
        ? prev.proofOfFunds.filter(d => d !== docType)
        : [...prev.proofOfFunds, docType]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Funding Source */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Source of Funds
        </h3>
        <div>
          <Label>Primary Funding Source *</Label>
          <RadioGroup
            value={formData.fundingSource}
            onValueChange={(value) => setFormData({ ...formData, fundingSource: value })}
            className="mt-2"
          >
            {fundingSources.map(source => (
              <div key={source.value} className="flex items-center space-x-2">
                <RadioGroupItem value={source.value} id={source.value} />
                <Label htmlFor={source.value}>{source.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* Personal Savings */}
      {(formData.fundingSource === 'personal' || formData.fundingSource === 'mixed') && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Personal Savings Details
          </h3>
          {!formData.personalSavings && setFormData(prev => ({
            ...prev,
            personalSavings: {
              amount: '',
              currency: 'EUR',
              bankName: '',
              accountType: 'savings'
            }
          }))}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="savingsAmount">Total Savings Amount *</Label>
              <Input
                id="savingsAmount"
                type="number"
                value={formData.personalSavings?.amount || ''}
                onChange={(e) => updatePersonalSavings('amount', e.target.value)}
                placeholder="10000"
              />
            </div>
            <div>
              <Label htmlFor="savingsCurrency">Currency *</Label>
              <Select
                value={formData.personalSavings?.currency || 'EUR'}
                onValueChange={(value) => updatePersonalSavings('currency', value)}
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
            <div>
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input
                id="bankName"
                value={formData.personalSavings?.bankName || ''}
                onChange={(e) => updatePersonalSavings('bankName', e.target.value)}
                placeholder="e.g., Deutsche Bank"
              />
            </div>
            <div>
              <Label htmlFor="accountType">Account Type *</Label>
              <Select
                value={formData.personalSavings?.accountType || 'savings'}
                onValueChange={(value) => updatePersonalSavings('accountType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings Account</SelectItem>
                  <SelectItem value="checking">Checking Account</SelectItem>
                  <SelectItem value="fixed">Fixed Deposit</SelectItem>
                  <SelectItem value="investment">Investment Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Sponsor Details */}
      {formData.fundingSource === 'sponsor' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Sponsor Details</h3>
          {!formData.sponsorDetails && setFormData(prev => ({
            ...prev,
            sponsorDetails: {
              name: '',
              relationship: '',
              occupation: '',
              income: '',
              currency: 'EUR',
              willProvideAffidavit: false
            }
          }))}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sponsorName">Sponsor Name *</Label>
              <Input
                id="sponsorName"
                value={formData.sponsorDetails?.name || ''}
                onChange={(e) => updateSponsorDetails('name', e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label htmlFor="relationship">Relationship *</Label>
              <Input
                id="relationship"
                value={formData.sponsorDetails?.relationship || ''}
                onChange={(e) => updateSponsorDetails('relationship', e.target.value)}
                placeholder="e.g., Parent, Spouse"
              />
            </div>
            <div>
              <Label htmlFor="sponsorOccupation">Sponsor's Occupation *</Label>
              <Input
                id="sponsorOccupation"
                value={formData.sponsorDetails?.occupation || ''}
                onChange={(e) => updateSponsorDetails('occupation', e.target.value)}
                placeholder="e.g., Business Owner"
              />
            </div>
            <div>
              <Label htmlFor="sponsorIncome">Annual Income *</Label>
              <Input
                id="sponsorIncome"
                type="number"
                value={formData.sponsorDetails?.income || ''}
                onChange={(e) => updateSponsorDetails('income', e.target.value)}
                placeholder="50000"
              />
            </div>
            <div>
              <Label htmlFor="sponsorCurrency">Currency *</Label>
              <Select
                value={formData.sponsorDetails?.currency || 'EUR'}
                onValueChange={(value) => updateSponsorDetails('currency', value)}
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="affidavit"
                checked={formData.sponsorDetails?.willProvideAffidavit || false}
                onCheckedChange={(checked) => updateSponsorDetails('willProvideAffidavit', checked)}
              />
              <Label htmlFor="affidavit">Sponsor will provide affidavit of support</Label>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Expenses */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="monthlyExpenses">Monthly Living Expenses *</Label>
            <Input
              id="monthlyExpenses"
              type="number"
              value={formData.monthlyExpenses}
              onChange={(e) => setFormData({ ...formData, monthlyExpenses: e.target.value })}
              placeholder="1500"
            />
            <p className="text-xs text-gray-500 mt-1">Current monthly expenses in EUR</p>
          </div>
          <div>
            <Label htmlFor="travelBudget">Travel Budget *</Label>
            <Input
              id="travelBudget"
              type="number"
              value={formData.travelBudget}
              onChange={(e) => setFormData({ ...formData, travelBudget: e.target.value })}
              placeholder="5000"
            />
            <p className="text-xs text-gray-500 mt-1">Total budget for this trip in EUR</p>
          </div>
          <div>
            <Label htmlFor="emergencyFunds">Emergency Funds *</Label>
            <Input
              id="emergencyFunds"
              type="number"
              value={formData.emergencyFunds}
              onChange={(e) => setFormData({ ...formData, emergencyFunds: e.target.value })}
              placeholder="2000"
            />
            <p className="text-xs text-gray-500 mt-1">Available emergency funds in EUR</p>
          </div>
        </div>
      </div>

      {/* Debts */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Financial Obligations</h3>
        <div>
          <Label>Do you have any outstanding debts or loans?</Label>
          <RadioGroup
            value={formData.hasDebts ? 'yes' : 'no'}
            onValueChange={(value) => setFormData({ ...formData, hasDebts: value === 'yes' })}
            className="mt-2"
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="debt-yes" />
                <Label htmlFor="debt-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="debt-no" />
                <Label htmlFor="debt-no">No</Label>
              </div>
            </div>
          </RadioGroup>
        </div>
        
        {formData.hasDebts && (
          <div className="mt-4">
            <Label htmlFor="debtDetails">Debt Details</Label>
            <Textarea
              id="debtDetails"
              value={formData.debtDetails || ''}
              onChange={(e) => setFormData({ ...formData, debtDetails: e.target.value })}
              placeholder="Please describe your debts (type, amount, monthly payments)..."
              rows={3}
            />
          </div>
        )}
      </div>

      {/* Assets */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building className="h-5 w-5" />
          Assets
        </h3>
        <div>
          <Label>Do you own any assets?</Label>
          <RadioGroup
            value={formData.hasAssets ? 'yes' : 'no'}
            onValueChange={(value) => setFormData({ ...formData, hasAssets: value === 'yes' })}
            className="mt-2"
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="assets-yes" />
                <Label htmlFor="assets-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="assets-no" />
                <Label htmlFor="assets-no">No</Label>
              </div>
            </div>
          </RadioGroup>
        </div>
        
        {formData.hasAssets && (
          <div className="mt-4 space-y-4">
            {!formData.assetDetails && setFormData(prev => ({
              ...prev,
              assetDetails: {
                property: false,
                vehicle: false,
                investments: false
              }
            }))}
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="property"
                    checked={formData.assetDetails?.property || false}
                    onCheckedChange={(checked) => updateAssetDetails('property', checked)}
                  />
                  <Label htmlFor="property">Real Estate Property</Label>
                </div>
                {formData.assetDetails?.property && (
                  <Input
                    type="number"
                    value={formData.assetDetails?.propertyValue || ''}
                    onChange={(e) => updateAssetDetails('propertyValue', e.target.value)}
                    placeholder="Value in EUR"
                    className="w-32"
                  />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vehicle"
                    checked={formData.assetDetails?.vehicle || false}
                    onCheckedChange={(checked) => updateAssetDetails('vehicle', checked)}
                  />
                  <Label htmlFor="vehicle">Vehicle(s)</Label>
                </div>
                {formData.assetDetails?.vehicle && (
                  <Input
                    type="number"
                    value={formData.assetDetails?.vehicleValue || ''}
                    onChange={(e) => updateAssetDetails('vehicleValue', e.target.value)}
                    placeholder="Value in EUR"
                    className="w-32"
                  />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="investments"
                    checked={formData.assetDetails?.investments || false}
                    onCheckedChange={(checked) => updateAssetDetails('investments', checked)}
                  />
                  <Label htmlFor="investments">Investments/Stocks</Label>
                </div>
                {formData.assetDetails?.investments && (
                  <Input
                    type="number"
                    value={formData.assetDetails?.investmentValue || ''}
                    onChange={(e) => updateAssetDetails('investmentValue', e.target.value)}
                    placeholder="Value in EUR"
                    className="w-32"
                  />
                )}
              </div>
              
              <div>
                <Label htmlFor="otherAssets">Other Assets</Label>
                <Textarea
                  id="otherAssets"
                  value={formData.assetDetails?.other || ''}
                  onChange={(e) => updateAssetDetails('other', e.target.value)}
                  placeholder="Describe any other assets..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Proof Documents */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Proof of Funds Documents</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select all documents you will provide as proof of financial means *
        </p>
        <div className="space-y-2">
          {proofDocuments.map(doc => (
            <div key={doc.value} className="flex items-center space-x-2">
              <Checkbox
                id={doc.value}
                checked={formData.proofOfFunds.includes(doc.value)}
                onCheckedChange={() => toggleProofDocument(doc.value)}
              />
              <Label htmlFor={doc.value}>{doc.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Consulates typically require proof of funds for 3-6 months. 
          Ensure your financial documents are recent (within 30 days).
        </AlertDescription>
      </Alert>
    </div>
  )
}