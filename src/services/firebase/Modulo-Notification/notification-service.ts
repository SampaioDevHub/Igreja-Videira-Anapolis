export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
}

export class NotificationService {
  private static instance: NotificationService
  private permission: NotificationPermission = "default"

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      console.warn("Este navegador não suporta notificações")
      return "denied"
    }

    if (Notification.permission === "granted") {
      this.permission = "granted"
      return "granted"
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission
    }

    this.permission = "denied"
    return "denied"
  }

  async sendNotification(options: NotificationOptions): Promise<void> {
    if (this.permission !== "granted") {
      const permission = await this.requestPermission()
      if (permission !== "granted") {
        console.warn("Permissão para notificações negada")
        return
      }
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || "/favicon.ico",
      badge: options.badge || "/favicon.ico",
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
    })

    // Auto-close após 5 segundos se não for interativa
    if (!options.requireInteraction) {
      setTimeout(() => {
        notification.close()
      }, 5000)
    }

    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  }

  // Notificações específicas do sistema
  async notifyNewReceita(valor: number, categoria: string): Promise<void> {
    await this.sendNotification({
      title: "Nova Receita Registrada",
      body: `${categoria}: R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      tag: "receita",
    })
  }

  async notifyNewDespesa(valor: number, categoria: string): Promise<void> {
    await this.sendNotification({
      title: "Nova Despesa Registrada",
      body: `${categoria}: R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      tag: "despesa",
    })
  }

  async notifyDespesaVencida(descricao: string, valor: number): Promise<void> {
    await this.sendNotification({
      title: "Despesa Vencida!",
      body: `${descricao}: R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      tag: "despesa-vencida",
      requireInteraction: true,
    })
  }

  async notifyBackupCompleted(): Promise<void> {
    await this.sendNotification({
      title: "Backup Realizado",
      body: "Backup automático dos dados foi concluído com sucesso",
      tag: "backup",
    })
  }

  async notifyMonthlyReport(totalReceitas: number, totalDespesas: number): Promise<void> {
    const saldo = totalReceitas - totalDespesas
    await this.sendNotification({
      title: "Relatório Mensal",
      body: `Saldo: R$ ${saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      tag: "relatorio-mensal",
    })
  }
}

export const notificationService = NotificationService.getInstance()
