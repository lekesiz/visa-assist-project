import Link from 'next/link'
import { ArrowRight, Brain, FileCheck, Briefcase, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Almanya Vize Surecinde
              <span className="text-blue-600"> AI Rehberiniz</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Yapay zeka destekli danismanlik ile vize basvurunuzu hatasiz tamamlayin. 
              Belge analizi, denklik sureci ve is bulma - hepsi tek platformda.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Hemen Basla
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Nasil Calisir?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Neden Visa Assist?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Brain className="h-10 w-10 text-blue-600" />}
              title="AI Destekli Analiz"
              description="Belgeleriniz yapay zeka ile analiz edilir, eksikler aninda tespit edilir."
            />
            <FeatureCard
              icon={<FileCheck className="h-10 w-10 text-blue-600" />}
              title="Otomatik Basvuru"
              description="Tum belgeleriniz otomatik olarak ilgili kurumlara iletilir."
            />
            <FeatureCard
              icon={<Briefcase className="h-10 w-10 text-blue-600" />}
              title="Is Bulma Destegi"
              description="Profilinize uygun is ilanlari bulunur ve basvurular otomatik gonderilir."
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-blue-600" />}
              title="Guvenli & Hizli"
              description="GDPR uyumlu, sifreli depolama ve 7/24 erisim imkani."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Vize Surecinde Zaman Kaybetmeyin
          </h2>
          <p className="text-xl mb-8">
            Binlerce kisiye yardimci olduk. Simdi sira sizde!
          </p>
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Ucretsiz Baslat
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}