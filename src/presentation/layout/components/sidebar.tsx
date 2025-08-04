"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ChevronDown,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/src/services/firebase/auth/context/auth-context"
import Image from "next/image"
import logo from "@/public/logo.png"
import { navigation } from "../links/navigation"

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Financeiro", "Gestão"])

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName) ? prev.filter((name) => name !== groupName) : [...prev, groupName],
    )
  }

  const isGroupActive = (children: any[]) => {
    return children.some((child) => pathname === child.href)
  }

  const isItemActive = (href: string) => {
    return pathname === href
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-3">
          <Image src={logo} alt="" width={130} height={130}/>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <span className="text-xs font-medium">
              {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user?.displayName || "Usuário"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          if (item.children) {
            const isExpanded = expandedGroups.includes(item.name)
            const isActive = isGroupActive(item.children)

            return (
              <div key={item.name} className="space-y-1">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between px-3 py-2 h-9 font-medium",
                    isActive && "bg-muted text-foreground",
                  )}
                  onClick={() => toggleGroup(item.name)}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                </Button>

                {isExpanded && (
                  <div className="ml-3 space-y-1 border-l border-border pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                          isItemActive(child.href)
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "text-muted-foreground",
                        )}
                      >
                        <child.icon className="h-4 w-4" />
                        <span>{child.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                isItemActive(item.href)
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Versão BETA v2.1.0</span>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Online</span>
          </div>
        </div>
      </div>
    </div>
  )
}
