import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import AuthProvider from "@/src/components/AuthProvider"  // ← CHANGEMENT ICI

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "3D Smart Factory",
  description: "Plateforme de suivi intelligent des stagiaires",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}