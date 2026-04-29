import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Instrument_Serif, Cormorant_Garamond } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const instrumentSerif = Instrument_Serif({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
})

const cormorant = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Associa',
  description: 'Gérez votre association simplement.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="fr"
      className={`${jakarta.variable} ${instrumentSerif.variable} ${cormorant.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground transition-colors duration-200">
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
