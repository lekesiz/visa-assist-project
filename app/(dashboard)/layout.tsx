import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - VS Developer will implement the Sidebar component */}
      <div className="flex">
        <aside className="w-64 bg-white shadow-md h-screen">
          {/* TODO: Import Sidebar component when ready */}
          <div className="p-4">
            <h2 className="text-xl font-bold">Dashboard</h2>
            <nav className="mt-8">
              <a href="/dashboard" className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded">
                Ana Sayfa
              </a>
              <a href="/dashboard/applications" className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded">
                Başvurularım
              </a>
              <a href="/dashboard/documents" className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded">
                Belgelerim
              </a>
              <a href="/dashboard/appointments" className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded">
                Randevularım
              </a>
              <a href="/dashboard/profile" className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded">
                Profilim
              </a>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}