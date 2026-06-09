import type { Metadata } from 'next'
import './globals.css'
import TopNav from '@/components/ui/TopNav'

export const metadata: Metadata = {
  title: 'ESC Study — Cardiology Guidelines',
  description: 'Interactive ESC cardiology guideline algorithm study tool',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[hsl(222_47%_7%)] text-[hsl(210_40%_96%)] font-sans">
        <TopNav />
        <main>{children}</main>
      </body>
    </html>
  )
}
