'use client'

import { useState } from 'react'
import { ApplicationForm } from '@/components/applications/ApplicationForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DemoService } from '@/lib/demo/demo-service'

export default function NewApplicationPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true)

      if (DemoService.isDemoMode()) {
        // In demo mode, simulate creating an application
        await new Promise(resolve => setTimeout(resolve, 1000))
        router.push('/dashboard/applications')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          type: data.visaType,
          destination_country: data.destinationCountry,
          status: 'draft',
          travel_date: data.travelDate,
          return_date: data.returnDate,
          purpose: data.travelPurpose,
          notes: data.additionalNotes
        })

      if (error) throw error

      router.push('/dashboard/applications')
    } catch (error) {
      console.error('Failed to create application:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/applications')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold">Create New Application</h1>
        <p className="text-gray-600 mt-1">
          Start your visa application process by filling out the form below
        </p>
      </div>

      {/* Application Form */}
      <ApplicationForm />
    </div>
  )
}