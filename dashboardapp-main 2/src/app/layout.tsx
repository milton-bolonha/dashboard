import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: 'AI Sales Dashboard',
  description: 'Interactive sales research dashboard with AI-powered insights',
  keywords: ['sales', 'AI', 'dashboard', 'research', 'CRM'],
  authors: [{ name: 'AI Sales Dashboard Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
