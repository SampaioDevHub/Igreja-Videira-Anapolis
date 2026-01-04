"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  Avatar,
  Badge,
  Button,
  ConfigProvider,
  Dropdown,
  Space,
  Typography,
} from "antd"
import type { MenuProps } from "antd"
import {
  BellOutlined,
  DownOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons"
import { useTheme } from "next-themes"

import { useAuth } from "@/src/services/firebase/auth/context/auth-context"
import { notificationService } from "@/src/services/firebase/Modulo-Notification/notification-service"
import { NotificationModal } from "./NotificationModal"
import { NotificationData } from "@/src/core/@types/NotificationData"
import { getAntdTheme } from "@/components/antd-theme"

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

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
        title: "Logout realizado com sucesso",
        body: "Voce saiu do sistema com seguranca.",
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

  const userLabel = user?.displayName || user?.email || "Usuario"

  const menuItems: MenuProps["items"] = useMemo(
    () => [
      {
        key: "perfil",
        icon: <UserOutlined />,
        label: <Link href="/configuracoes">Perfil</Link>,
      },
      {
        key: "config",
        icon: <SettingOutlined />,
        label: <Link href="/configuracoes">Configuracoes</Link>,
      },
      { type: "divider" },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Sair",
        onClick: handleLogout,
      },
    ],
    [handleLogout],
  )

  return (
    <ConfigProvider theme={getAntdTheme(isDark)}>
      <header className="flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/70 px-4 backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70 lg:px-6">
        <Space direction="vertical" size={0} className="min-w-0">
          <Typography.Title level={4} className="m-0 truncate">
            Dashboard Financeiro
          </Typography.Title>
          <Typography.Text type="secondary" className="hidden sm:block">
            Visao executiva das financas da igreja
          </Typography.Text>
        </Space>

        <Space size="middle">
          <Badge dot={hasNewNotification} offset={[-2, 2]}>
            <Button
              type="text"
              shape="circle"
              icon={<BellOutlined />}
              aria-label="Notificacoes"
              onClick={openNotifications}
            />
          </Badge>

          <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={["click"]}>
            <Button type="text" className="flex items-center gap-2">
              <Avatar
                size={32}
                src={user?.photoURL || undefined}
                icon={!user?.photoURL ? <UserOutlined /> : undefined}
              >
                {getUserInitials(user?.displayName, user?.email)}
              </Avatar>
              <span className="hidden md:inline text-sm font-medium truncate max-w-[160px]">
                {userLabel}
              </span>
              <DownOutlined className="text-xs" />
            </Button>
          </Dropdown>
        </Space>
      </header>

      <NotificationModal
        open={showModal}
        onClose={() => setShowModal(false)}
        notifications={notifications}
        onDelete={handleDeleteNotification}
      />
    </ConfigProvider>
  )
}
