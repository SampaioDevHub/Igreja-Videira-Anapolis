

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "antd/dist/reset.css"
import "./globals.css"
import { ThemeProvider } from "next-themes"
import { AntdClientProvider } from "@/components/antd-client-provider"
import { FirebaseProvider } from "@/src/services/firebase/provider/firebase-provider"
import { AuthProvider } from "@/src/services/firebase/auth/context/auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema Financeiro - Igreja",
  description: "Sistema de gestão financeira para igrejas",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AntdClientProvider>
            <FirebaseProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </FirebaseProvider>
          </AntdClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
