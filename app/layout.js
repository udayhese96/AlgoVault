import './globals.css'
import Navbar from '@/components/Navbar'
import { ThemeProvider } from '@/components/ThemeContext'

export const metadata = {
  title: 'AlgoVault — DSA Practice Platform',
  description: 'Your personal DSA vault. Organize questions, write strategies, and track your progress.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'AlgoVault',
    description: 'Your personal DSA vault. Organize questions, write strategies, and track your progress.',
    images: ['/logo.png'],
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
