import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // TODO: Fetch real data from database
  const stats = {
    totalApplications: 3,
    inProgress: 1,
    completed: 1,
    waiting: 1
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Hoş Geldiniz, {user?.email?.split('@')[0]}!
        </h1>
        <p className="text-gray-600 mt-2">
          Vize başvuru sürecinizi buradan takip edebilirsiniz.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Toplam Başvuru"
          value={stats.totalApplications}
          icon={<FileText className="h-6 w-6" />}
          color="bg-blue-500"
        />
        <StatsCard
          title="Devam Eden"
          value={stats.inProgress}
          icon={<Clock className="h-6 w-6" />}
          color="bg-yellow-500"
        />
        <StatsCard
          title="Tamamlanan"
          value={stats.completed}
          icon={<CheckCircle className="h-6 w-6" />}
          color="bg-green-500"
        />
        <StatsCard
          title="Bekleyen"
          value={stats.waiting}
          icon={<AlertCircle className="h-6 w-6" />}
          color="bg-gray-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Son Aktiviteler</h2>
        <div className="space-y-4">
          <ActivityItem
            title="Belge Yüklendi"
            description="Pasaport kopyası başarıyla yüklendi"
            time="2 saat önce"
            type="success"
          />
          <ActivityItem
            title="Eksik Belge"
            description="Diploma çevirisi eksik"
            time="1 gün önce"
            type="warning"
          />
          <ActivityItem
            title="Başvuru Oluşturuldu"
            description="Yeni vize başvurusu oluşturuldu"
            time="3 gün önce"
            type="info"
          />
        </div>
      </div>
    </div>
  )
}

// Temporary component - VS Developer will move these to proper component files
function StatsCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`${color} text-white p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ title, description, time, type }: any) {
  const typeColors = {
    success: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    info: 'text-blue-600 bg-blue-100'
  }

  return (
    <div className="flex items-start space-x-3">
      <div className={`p-2 rounded-full ${typeColors[type]}`}>
        {type === 'success' && <CheckCircle className="h-4 w-4" />}
        {type === 'warning' && <AlertCircle className="h-4 w-4" />}
        {type === 'info' && <FileText className="h-4 w-4" />}
      </div>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-gray-600 text-sm">{description}</p>
        <p className="text-gray-400 text-xs mt-1">{time}</p>
      </div>
    </div>
  )
}