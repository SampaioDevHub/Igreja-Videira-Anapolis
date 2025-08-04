"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, LogOut, User } from "lucide-react"
import { useEffect, useState } from "react"

import { useAuth } from "@/src/services/firebase/auth/context/auth-context"
import { notificationService } from "@/src/services/firebase/Modulo-Notification/notification-service"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "./mode-toggle"
import { NotificationModal } from "./NotificationModal"
import { NotificationData } from "@/src/core/@types/NotificationData"

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  useEffect(() => {
    const originalSendNotification = notificationService.sendNotification.bind(notificationService)

    notificationService.sendNotification = async (options) => {
      const date = new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      setHasNewNotification(true)

      setNotifications((prev) => [
        { title: options.title, body: options.body, date },
        ...prev.slice(0, 9),
      ])

      return await originalSendNotification(options)
    }

    return () => {
      notificationService.sendNotification = originalSendNotification
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      await notificationService.sendNotification({
        title: "Logout realizado com sucesso!",
        body: "Você saiu do sistema com segurança.",
      })
      router.push("/login")
    } catch {
      await notificationService.sendNotification({
        title: "Erro ao realizar logout",
        body: "Tente novamente ou entre em contato com o suporte.",
        tag: "logout-erro",
        requireInteraction: true,
      })
    }
  }

  const handleDeleteNotification = (indexToRemove: number) => {
    setNotifications((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const getUserInitials = (name?: string | null, email?: string | null) =>
    name?.charAt(0)?.toUpperCase() ?? email?.charAt(0)?.toUpperCase() ?? "U"

  const openNotifications = () => {
    setHasNewNotification(false)
    setShowModal(true)
  }

  const renderUserAvatar = () => (
    <Avatar className="h-8 w-8">
      <AvatarImage src={user?.photoURL ?? ""} alt="Avatar" />
      <AvatarFallback>{getUserInitials(user?.displayName, user?.email)}</AvatarFallback>
    </Avatar>
  )

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
        <div className="flex-1">
          <h1 className="text-lg font-semibold md:text-2xl">Dashboard Financeiro</h1>
        </div>
        <div className="flex items-center gap-4 relative">
          <Button variant="outline" size="icon" onClick={openNotifications} className="relative">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notificações</span>
            {hasNewNotification && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-green-500 animate-ping" />
            )}
          </Button>
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                {renderUserAvatar()}
                <span className="sr-only">Menu do usuário</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.displayName ?? user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <Link href="/configuracoes">Perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <NotificationModal
        open={showModal}
        onClose={() => setShowModal(false)}
        notifications={notifications}
        onDelete={handleDeleteNotification}
      />
    </>
  )
}
