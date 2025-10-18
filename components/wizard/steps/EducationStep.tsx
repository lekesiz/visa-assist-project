'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, Trash2, GraduationCap, Languages } from 'lucide-react'

interface Education {
  highestEducation: string
  educationHistory: Array<{
    id: string
    level: string
    institution: string
    country: string
    fieldOfStudy: string
    startDate: string
    endDate: string
    graduated: boolean
    degreeObtained?: string
  }>
  currentlyStudying: boolean
  languages: Array<{
    id: string
    language: string
    proficiency: string
  }>
  professionalCertifications?: string
}

interface EducationStepProps {
  data: Partial<Education>
  onComplete: (data: Education, isValid: boolean) => void
}

const educationLevels = [
  { value: 'none', label: 'No formal education' },
  { value: 'primary', label: 'Primary School' },
  { value: 'secondary', label: 'High School/Secondary' },
  { value: 'vocational', label: 'Vocational/Technical' },
  { value: 'bachelor', label: "Bachelor's Degree" },
  { value: 'master', label: "Master's Degree" },
  { value: 'doctorate', label: 'Doctorate/PhD' }
]

const languageProficiencyLevels = [
  { value: 'native', label: 'Native' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'basic', label: 'Basic' },
  { value: 'beginner', label: 'Beginner' }
]

const commonLanguages = [
  'Turkish', 'English', 'German', 'French', 'Spanish', 
  'Italian', 'Dutch', 'Arabic', 'Russian', 'Chinese'
]

export default function EducationStep({ data, onComplete }: EducationStepProps) {
  const [formData, setFormData] = useState<Education>({
    highestEducation: '',
    educationHistory: [],
    currentlyStudying: false,
    languages: [
      { id: '1', language: 'Turkish', proficiency: 'native' }
    ],
    ...data
  })

  useEffect(() => {
    const isValid = validateForm()
    onComplete(formData, isValid)
  }, [formData])

  const validateForm = () => {
    if (!formData.highestEducation) return false
    
    // At least one education entry if not "none"
    if (formData.highestEducation !== 'none' && formData.educationHistory.length === 0) {
      return false
    }

    // Validate education entries
    for (const edu of formData.educationHistory) {
      if (!edu.institution || !edu.country || !edu.fieldOfStudy || !edu.startDate) {
        return false
      }
    }

    // At least one language
    if (formData.languages.length === 0) return false

    // Validate languages
    for (const lang of formData.languages) {
      if (!lang.language || !lang.proficiency) {
        return false
      }
    }

    return true
  }

  const addEducation = () => {
    const newEducation = {
      id: Date.now().toString(),
      level: '',
      institution: '',
      country: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      graduated: false
    }

    setFormData(prev => ({
      ...prev,
      educationHistory: [...prev.educationHistory, newEducation]
    }))
  }

  const updateEducation = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      educationHistory: prev.educationHistory.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const removeEducation = (id: string) => {
    setFormData(prev => ({
      ...prev,
      educationHistory: prev.educationHistory.filter(edu => edu.id !== id)
    }))
  }

  const addLanguage = () => {
    const newLanguage = {
      id: Date.now().toString(),
      language: '',
      proficiency: 'intermediate'
    }

    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, newLanguage]
    }))
  }

  const updateLanguage = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.map(lang =>
        lang.id === id ? { ...lang, [field]: value } : lang
      )
    }))
  }

  const removeLanguage = (id: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang.id !== id)
    }))
  }

  return (
    <div className="space-y-6">
      {/* Highest Education Level */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Education Level</h3>
        <div>
          <Label htmlFor="highestEducation">Highest Education Level *</Label>
          <Select
            value={formData.highestEducation}
            onValueChange={(value) => setFormData({ ...formData, highestEducation: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select education level" />
            </SelectTrigger>
            <SelectContent>
              {educationLevels.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="mt-4">
          <Label>Are you currently studying?</Label>
          <RadioGroup
            value={formData.currentlyStudying ? 'yes' : 'no'}
            onValueChange={(value) => setFormData({ ...formData, currentlyStudying: value === 'yes' })}
            className="mt-2"
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="study-yes" />
                <Label htmlFor="study-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="study-no" />
                <Label htmlFor="study-no">No</Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Education History */}
      {formData.highestEducation !== 'none' && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education History
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            List your educational qualifications starting with the highest
          </p>
          
          {formData.educationHistory.map((education, index) => (
            <Card key={education.id} className="mb-4">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Education #{index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEducation(education.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Education Level</Label>
                    <Select
                      value={education.level}
                      onValueChange={(value) => updateEducation(education.id, 'level', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {educationLevels.filter(l => l.value !== 'none').map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Institution Name *</Label>
                    <Input
                      value={education.institution}
                      onChange={(e) => updateEducation(education.id, 'institution', e.target.value)}
                      placeholder="e.g., Istanbul University"
                    />
                  </div>
                  <div>
                    <Label>Field of Study *</Label>
                    <Input
                      value={education.fieldOfStudy}
                      onChange={(e) => updateEducation(education.id, 'fieldOfStudy', e.target.value)}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  <div>
                    <Label>Country *</Label>
                    <Input
                      value={education.country}
                      onChange={(e) => updateEducation(education.id, 'country', e.target.value)}
                      placeholder="e.g., Turkey"
                    />
                  </div>
                  <div>
                    <Label>Start Date *</Label>
                    <Input
                      type="date"
                      value={education.startDate}
                      onChange={(e) => updateEducation(education.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={education.endDate}
                      onChange={(e) => updateEducation(education.id, 'endDate', e.target.value)}
                      disabled={formData.currentlyStudying && index === 0}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        id={`graduated-${education.id}`}
                        checked={education.graduated}
                        onChange={(e) => updateEducation(education.id, 'graduated', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor={`graduated-${education.id}`}>Graduated</Label>
                    </div>
                    {education.graduated && (
                      <div>
                        <Label>Degree/Certificate Obtained</Label>
                        <Input
                          value={education.degreeObtained || ''}
                          onChange={(e) => updateEducation(education.id, 'degreeObtained', e.target.value)}
                          placeholder="e.g., Bachelor of Science"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button
            variant="outline"
            onClick={addEducation}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Education
          </Button>
        </div>
      )}

      {/* Languages */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Language Skills
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          List all languages you speak and your proficiency level
        </p>
        
        {formData.languages.map((language, index) => (
          <div key={language.id} className="flex gap-4 mb-3">
            <div className="flex-1">
              <Label className="sr-only">Language</Label>
              <Select
                value={language.language}
                onValueChange={(value) => updateLanguage(language.id, 'language', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Other (specify)</SelectItem>
                  {commonLanguages.map(lang => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {language.language === 'custom' && (
                <Input
                  className="mt-2"
                  placeholder="Specify language"
                  onChange={(e) => updateLanguage(language.id, 'language', e.target.value)}
                />
              )}
            </div>
            <div className="flex-1">
              <Label className="sr-only">Proficiency</Label>
              <Select
                value={language.proficiency}
                onValueChange={(value) => updateLanguage(language.id, 'proficiency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Proficiency" />
                </SelectTrigger>
                <SelectContent>
                  {languageProficiencyLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {index > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeLanguage(language.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        
        <Button
          variant="outline"
          onClick={addLanguage}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Language
        </Button>
      </div>

      {/* Professional Certifications */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Professional Certifications</h3>
        <div>
          <Label htmlFor="certifications">Certifications (Optional)</Label>
          <Textarea
            id="certifications"
            value={formData.professionalCertifications || ''}
            onChange={(e) => setFormData({ ...formData, professionalCertifications: e.target.value })}
            placeholder="List any professional certifications, licenses, or training..."
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}