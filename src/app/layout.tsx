import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/components/query-provider'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  fallback: ['Arial', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'Worksphere',
  description: 'AI-powered workspace.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={(inter.className, 'min-h-screen antialiased')}>
        <QueryProvider>
          <Toaster />
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
