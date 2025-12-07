import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#D4AF37' },
    { media: '(prefers-color-scheme: light)', color: '#D4AF37' }
  ],
}

export const metadata: Metadata = {
  title: {
    default: 'Absolut Poker Club - ACATH',
    template: '%s | Absolut Poker Club'
  },
  description: 'Associação Canaense Absolut de Texas Hold\'em - Sistema de Gestão Mobile',
  keywords: ['poker', 'texas holdem', 'ACATH', 'Canaã dos Carajás', 'Absolut', 'gestão', 'mobile'],
  authors: [{ name: 'Absolut Poker Club' }],
  creator: 'Absolut Poker Club',
  publisher: 'Absolut Poker Club',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Absolut Poker',
  },
  applicationName: 'Absolut Poker Club',
  openGraph: {
    title: 'Absolut Poker Club - ACATH',
    description: 'Associação Canaense Absolut de Texas Hold\'em',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Absolut Poker Club',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Absolut Poker Club - ACATH',
    description: 'Associação Canaense Absolut de Texas Hold\'em',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icon-152x152.png', sizes: '152x152', type: 'image/png' }
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icon-152x152.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Absolut Poker" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
