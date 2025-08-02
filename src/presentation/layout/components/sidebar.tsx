"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Church,
  DollarSign,
  FileText,
  Home,
  PiggyBank,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
  Database,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Receitas",
    href: "/receitas",
    icon: TrendingUp,
  },
  {
    name: "Despesas",
    href: "/despesas",
    icon: TrendingDown,
  },
  {
    name: "Dízimos",
    href: "/dizimos",
    icon: PiggyBank,
  },
  {
    name: "Ofertas",
    href: "/ofertas",
    icon: DollarSign,
  },
  {
    name: "Membros",
    href: "/membros",
    icon: Users,
  },
  {
    name: "Relatórios",
    href: "/relatorios",
    icon: FileText,
  },
  {
    name: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
  
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="pb-12 w-64">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center mb-6">
            <Church className="h-8 w-8 mr-2 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Igreja Videira</h2>
              <p className="text-xs text-muted-foreground">Sistema Financeiro</p>
            </div>
          </div>
          <div className="space-y-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                      isActive && "bg-muted text-primary",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
