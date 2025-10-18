import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Visa Assist - AI Destekli Vize Danismanligi',
  description: 'Almanya vize sureci icin yapay zeka destekli danismanlik platformu',
  keywords: ['vize', 'almanya', 'danismanlik', 'denklik', 'is bulma'],
  authors: [{ name: 'Visa Assist Team' }],
  creator: 'Metehan Eski',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://visaassist.ai',
    title: 'Visa Assist - AI Destekli Vize Danismanligi',
    description: 'Almanya vize sureci icin yapay zeka destekli danismanlik platformu',
    siteName: 'Visa Assist',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Visa Assist - AI Destekli Vize Danismanligi',
    description: 'Almanya vize sureci icin yapay zeka destekli danismanlik platformu',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}