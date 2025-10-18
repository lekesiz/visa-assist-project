'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { 
  Search,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Filter,
  Globe,
  Building,
  Users,
  Sparkles,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Target
} from 'lucide-react'

interface JobSearchFormProps {
  onSearch: (filters: JobSearchFilters) => void
  onSaveSearch?: (filters: JobSearchFilters) => void
  initialFilters?: Partial<JobSearchFilters>
  variant?: 'full' | 'compact'
}

export interface JobSearchFilters {
  keywords: string
  location: string
  country: string
  jobType: string[]
  experienceLevel: string
  visaSponsorship: boolean
  remote: boolean
  salary: {
    min: number
    max: number
    currency: string
  }
  industries: string[]
  skills: string[]
  languages: string[]
  startDate: string
  companySize: string[]
}

const defaultFilters: JobSearchFilters = {
  keywords: '',
  location: '',
  country: 'Germany',
  jobType: [],
  experienceLevel: 'any',
  visaSponsorship: true,
  remote: false,
  salary: {
    min: 0,
    max: 150000,
    currency: 'EUR'
  },
  industries: [],
  skills: [],
  languages: [],
  startDate: 'immediately',
  companySize: []
}

const countries = [
  { value: 'Germany', label: 'Germany', flag: '🇩🇪' },
  { value: 'France', label: 'France', flag: '🇫🇷' },
  { value: 'Netherlands', label: 'Netherlands', flag: '🇳🇱' },
  { value: 'Switzerland', label: 'Switzerland', flag: '🇨🇭' },
  { value: 'Austria', label: 'Austria', flag: '🇦🇹' },
  { value: 'Belgium', label: 'Belgium', flag: '🇧🇪' },
  { value: 'Luxembourg', label: 'Luxembourg', flag: '🇱🇺' },
  { value: 'UK', label: 'United Kingdom', flag: '🇬🇧' }
]

const jobTypes = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' }
]

const experienceLevels = [
  { value: 'any', label: 'Any Experience' },
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (2-5 years)' },
  { value: 'senior', label: 'Senior Level (5+ years)' },
  { value: 'lead', label: 'Lead/Manager' },
  { value: 'executive', label: 'Executive' }
]

const industries = [
  'Technology', 'Finance', 'Healthcare', 'Manufacturing', 
  'Retail', 'Education', 'Consulting', 'Media', 
  'Transportation', 'Energy', 'Real Estate', 'Hospitality'
]

const languages = [
  { value: 'english', label: 'English' },
  { value: 'german', label: 'German' },
  { value: 'french', label: 'French' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'italian', label: 'Italian' },
  { value: 'dutch', label: 'Dutch' },
  { value: 'turkish', label: 'Turkish' }
]

const companySizes = [
  { value: 'startup', label: 'Startup (1-50)' },
  { value: 'small', label: 'Small (51-200)' },
  { value: 'medium', label: 'Medium (201-1000)' },
  { value: 'large', label: 'Large (1000+)' },
  { value: 'enterprise', label: 'Enterprise (10000+)' }
]

export function JobSearchForm({
  onSearch,
  onSaveSearch,
  initialFilters = {},
  variant = 'full'
}: JobSearchFormProps) {
  const [filters, setFilters] = useState<JobSearchFilters>({
    ...defaultFilters,
    ...initialFilters
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [skillInput, setSkillInput] = useState('')

  const handleFilterChange = (key: keyof JobSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleAddSkill = () => {
    if (skillInput.trim() && !filters.skills.includes(skillInput.trim())) {
      handleFilterChange('skills', [...filters.skills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    handleFilterChange('skills', filters.skills.filter(s => s !== skill))
  }

  const handleSearch = () => {
    onSearch(filters)
  }

  const handleReset = () => {
    setFilters(defaultFilters)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.keywords) count++
    if (filters.location) count++
    if (filters.jobType.length > 0) count++
    if (filters.experienceLevel !== 'any') count++
    if (filters.remote) count++
    if (filters.salary.min > 0 || filters.salary.max < 150000) count++
    if (filters.industries.length > 0) count++
    if (filters.skills.length > 0) count++
    if (filters.languages.length > 0) count++
    if (filters.companySize.length > 0) count++
    return count
  }

  if (variant === 'compact') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Job title, keywords, or company"
                value={filters.keywords}
                onChange={(e) => handleFilterChange('keywords', e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge className="ml-2" variant="secondary">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
              <Button onClick={handleSearch}>
                Search Jobs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find Visa-Sponsoring Jobs</CardTitle>
        <CardDescription>
          Search for jobs that offer visa sponsorship in Europe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Search */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="keywords">What job are you looking for?</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="keywords"
                placeholder="Job title, keywords, or company"
                value={filters.keywords}
                onChange={(e) => handleFilterChange('keywords', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="location"
                  placeholder="City or region"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                value={filters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                {countries.map(country => (
                  <option key={country.value} value={country.value}>
                    {country.flag} {country.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.visaSponsorship}
                onCheckedChange={(checked) => handleFilterChange('visaSponsorship', checked)}
              />
              <span className="text-sm">Visa Sponsorship Required</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.remote}
                onCheckedChange={(checked) => handleFilterChange('remote', checked)}
              />
              <span className="text-sm">Remote Opportunities</span>
            </label>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full justify-between"
        >
          <span>Advanced Filters</span>
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            {/* Job Type */}
            <div>
              <Label>Job Type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {jobTypes.map(type => (
                  <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={filters.jobType.includes(type.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleFilterChange('jobType', [...filters.jobType, type.value])
                        } else {
                          handleFilterChange('jobType', filters.jobType.filter(t => t !== type.value))
                        }
                      }}
                    />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <Label>Experience Level</Label>
              <RadioGroup
                value={filters.experienceLevel}
                onValueChange={(value) => handleFilterChange('experienceLevel', value)}
                className="grid grid-cols-2 gap-3 mt-2"
              >
                {experienceLevels.map(level => (
                  <label
                    key={level.value}
                    className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50"
                  >
                    <RadioGroupItem value={level.value} />
                    <span className="text-sm">{level.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Salary Range */}
            <div>
              <Label>Salary Range (EUR/year)</Label>
              <div className="mt-2 space-y-3">
                <Slider
                  value={[filters.salary.min, filters.salary.max]}
                  onValueChange={(values) => handleFilterChange('salary', {
                    ...filters.salary,
                    min: values[0],
                    max: values[1]
                  })}
                  max={150000}
                  step={5000}
                  className="mt-3"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>€{filters.salary.min.toLocaleString()}</span>
                  <span>€{filters.salary.max.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <Label>Skills</Label>
              <div className="mt-2 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddSkill}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {filters.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.skills.map(skill => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Languages */}
            <div>
              <Label>Languages</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {languages.map(lang => (
                  <label key={lang.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={filters.languages.includes(lang.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleFilterChange('languages', [...filters.languages, lang.value])
                        } else {
                          handleFilterChange('languages', filters.languages.filter(l => l !== lang.value))
                        }
                      }}
                    />
                    <span className="text-sm">{lang.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Company Size */}
            <div>
              <Label>Company Size</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {companySizes.map(size => (
                  <label key={size.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={filters.companySize.includes(size.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleFilterChange('companySize', [...filters.companySize, size.value])
                        } else {
                          handleFilterChange('companySize', filters.companySize.filter(s => s !== size.value))
                        }
                      }}
                    />
                    <span className="text-sm">{size.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Industries */}
            <div>
              <Label>Industries</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {industries.map(industry => (
                  <label key={industry} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={filters.industries.includes(industry)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleFilterChange('industries', [...filters.industries, industry])
                        } else {
                          handleFilterChange('industries', filters.industries.filter(i => i !== industry))
                        }
                      }}
                    />
                    <span className="text-sm">{industry}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Reset Filters
            </Button>
            {onSaveSearch && (
              <Button variant="outline" onClick={() => onSaveSearch(filters)}>
                <Target className="h-4 w-4 mr-2" />
                Save Search
              </Button>
            )}
          </div>
          <Button onClick={handleSearch} className="min-w-[150px]">
            <Search className="h-4 w-4 mr-2" />
            Search Jobs
          </Button>
        </div>

        {/* Active Filters Summary */}
        {getActiveFiltersCount() > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Sparkles className="h-4 w-4" />
            <span>{getActiveFiltersCount()} active filter{getActiveFiltersCount() > 1 ? 's' : ''}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}