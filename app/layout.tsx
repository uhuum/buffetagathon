import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/service-worker-register'
import { FCMProvider } from '@/components/fcm-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Buffet Agathon - Agenda de Festas',
  description: 'Sistema de gerenciamento e agenda de festas do Buffet Agathon',
  applicationName: 'Buffet Agathon',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Buffet Agathon',
  },
  icons: {
    icon: [
      { url: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#2d1154',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body className={`${inter.className} antialiased`}>
        {children}
        <ServiceWorkerRegister />
        <FCMProvider />
      </body>
    </html>
  )
}
