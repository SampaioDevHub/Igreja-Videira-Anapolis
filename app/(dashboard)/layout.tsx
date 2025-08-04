import NextTopLoader from 'nextjs-toploader';
import { Header } from "@/src/presentation/layout/components/header"
import { Sidebar } from "@/src/presentation/layout/components/sidebar"
import { AuthGuard } from "@/src/services/firebase/auth/guard/auth-guard"
import { DebugPanel } from "@/src/services/firebase/debug/debug-panel"
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Script from 'next/script';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
          <Sidebar />
           <NextTopLoader color="#8b5cf6" showSpinner={false} />
           <ToastContainer position="top-right"  autoClose={3000} />
        </div>
        <div className="flex flex-col">
          
          <Header />

          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">{children}</main>
          <DebugPanel />
        </div>
      </div>
      <Script src="//code.jivosite.com/widget/Ii4QOCHqQL" async />
    </AuthGuard>
  )
}
