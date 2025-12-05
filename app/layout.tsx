import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Absolut Poker Club - ACATH',
  description: 'Associação Canaense Absolut de Texas Hold\'em - Sistema de Gestão',
  keywords: ['poker', 'texas holdem', 'ACATH', 'Canaã dos Carajás', 'Absolut'],
  authors: [{ name: 'Absolut Poker Club' }],
  openGraph: {
    title: 'Absolut Poker Club - ACATH',
    description: 'Associação Canaense Absolut de Texas Hold\'em',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
