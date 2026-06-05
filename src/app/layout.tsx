import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Fluxy',
  description: 'Personal finance app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
