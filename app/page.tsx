import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  Brain, 
  Clock, 
  Shield, 
  CheckCircle2, 
  Users, 
  Zap,
  Globe,
  ArrowRight,
  FileCheck,
  Briefcase
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Visa Assist</h1>
            </div>
            <nav className="space-x-4">
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Almanya Vize Sürecinde
            <span className="block text-blue-600">AI Rehberiniz</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Yapay zeka destekli danışmanlık ile vize başvurunuzu hatasız tamamlayın. 
            Belge analizi, denklik süreci ve iş bulma - hepsi tek platformda.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Ücretsiz Başlat
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="px-8">
                Nasıl Çalışır?
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">95%</div>
            <p className="mt-2 text-gray-600">Başarı Oranı</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">10k+</div>
            <p className="mt-2 text-gray-600">Başvuru İşlendi</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">24/7</div>
            <p className="mt-2 text-gray-600">AI Destek</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Neden Visa Assist?</h2>
            <p className="mt-4 text-lg text-gray-600">
              Vize sürecinizi kolaylaştıran kapsamlı özellikler
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Brain className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>AI Destekli Analiz</CardTitle>
                <CardDescription>
                  Belgeleriniz yapay zeka ile analiz edilir, eksikler anında tespit edilir
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <FileCheck className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Otomatik Başvuru</CardTitle>
                <CardDescription>
                  Tüm belgeleriniz otomatik olarak ilgili kurumlara iletilir
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Briefcase className="h-10 w-10 text-purple-600 mb-4" />
                <CardTitle>İş Bulma Desteği</CardTitle>
                <CardDescription>
                  Profilinize uygun iş ilanları bulunur ve başvurular otomatik gönderilir
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-red-600 mb-4" />
                <CardTitle>Güvenli & Hızlı</CardTitle>
                <CardDescription>
                  GDPR uyumlu, şifreli depolama ve 7/24 erişim imkanı
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Nasıl Çalışır?</h2>
            <p className="mt-4 text-lg text-gray-600">
              4 basit adımda vize başvurunuzu tamamlayın
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-4">
            {[
              { step: '1', title: 'Hesap Oluştur', desc: 'Kayıt olun ve vize ihtiyaçlarınızı belirtin' },
              { step: '2', title: 'Belge Yükle', desc: 'Gerekli belgelerinizi güvenle yükleyin' },
              { step: '3', title: 'AI İnceleme', desc: 'Anında geri bildirim ve öneriler alın' },
              { step: '4', title: 'Başvuru Gönder', desc: 'Güvenle başvurun ve süreci takip edin' }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">
            Vize Sürecinde Zaman Kaybetmeyin
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Binlerce kişiye yardımcı olduk. Şimdi sıra sizde!
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="mt-8 px-8">
              Ücretsiz Başlat
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 text-center text-gray-400">
        <p>&copy; 2025 Visa Assist. All rights reserved.</p>
      </footer>
    </div>
  )
}