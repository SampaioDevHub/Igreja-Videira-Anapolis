
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore"
import { getFirestoreInstance } from "../config/firebase"
import { notificationService } from "../Modulo-Notification/notification-service"
import { AniversarioNotification } from "@/src/core/@types/AniversarioNotification"

export class AniversarioService {
  private static instance: AniversarioService

  public static getInstance(): AniversarioService {
    if (!AniversarioService.instance) {
      AniversarioService.instance = new AniversarioService()
    }
    return AniversarioService.instance
  }

  async verificarAniversariosHoje(userId: string): Promise<AniversarioNotification[]> {
    try {
      const db = getFirestoreInstance()
      const hoje = new Date()

      // Buscar membros do usuário
      const membrosQuery = query(collection(db, "membros"), where("userId", "==", userId))

      const membrosSnapshot = await getDocs(membrosQuery)
      const aniversariosHoje: AniversarioNotification[] = []

      for (const doc of membrosSnapshot.docs) {
        const membro = doc.data()
        if (!membro.dataNascimento) continue

        const nascimento = new Date(membro.dataNascimento)
        const isAniversarioHoje = nascimento.getDate() === hoje.getDate() && nascimento.getMonth() === hoje.getMonth()

        if (isAniversarioHoje) {
          const idade = hoje.getFullYear() - nascimento.getFullYear()
          const notificado = await this.verificarSeJaNotificado(userId, doc.id, "hoje")

          aniversariosHoje.push({
            membroId: doc.id,
            nome: membro.nome,
            idade,
            diasRestantes: 0,
            notificado,
          })
        }
      }

      return aniversariosHoje
    } catch (error) {
      console.error("Erro ao verificar aniversários de hoje:", error)
      return []
    }
  }

  async verificarAniversariosAmanha(userId: string): Promise<AniversarioNotification[]> {
    try {
      const db = getFirestoreInstance()
      const amanha = new Date()
      amanha.setDate(amanha.getDate() + 1)

      // Buscar membros do usuário
      const membrosQuery = query(collection(db, "membros"), where("userId", "==", userId))

      const membrosSnapshot = await getDocs(membrosQuery)
      const aniversariosAmanha: AniversarioNotification[] = []

      for (const doc of membrosSnapshot.docs) {
        const membro = doc.data()
        if (!membro.dataNascimento) continue

        const nascimento = new Date(membro.dataNascimento)
        const isAniversarioAmanha =
          nascimento.getDate() === amanha.getDate() && nascimento.getMonth() === amanha.getMonth()

        if (isAniversarioAmanha) {
          const idade = amanha.getFullYear() - nascimento.getFullYear()
          const notificado = await this.verificarSeJaNotificado(userId, doc.id, "amanha")

          aniversariosAmanha.push({
            membroId: doc.id,
            nome: membro.nome,
            idade,
            diasRestantes: 1,
            notificado,
          })
        }
      }

      return aniversariosAmanha
    } catch (error) {
      console.error("Erro ao verificar aniversários de amanhã:", error)
      return []
    }
  }

  async enviarNotificacaoAniversario(aniversario: AniversarioNotification, tipo: "hoje" | "amanha"): Promise<void> {
    try {
      if (aniversario.notificado) return

      const titulo = tipo === "hoje" ? "🎉 Aniversário Hoje!" : "🎂 Aniversário Amanhã!"

      const mensagem =
        tipo === "hoje"
          ? `${aniversario.nome} está fazendo ${aniversario.idade} anos hoje!`
          : `${aniversario.nome} fará ${aniversario.idade} anos amanhã`

      await notificationService.sendNotification({
        title: titulo,
        body: mensagem,
        tag: `aniversario-${tipo}-${aniversario.membroId}`,
        requireInteraction: tipo === "hoje",
      })

      // Marcar como notificado
      await this.marcarComoNotificado(aniversario.membroId, tipo)
    } catch (error) {
      console.error("Erro ao enviar notificação de aniversário:", error)
    }
  }

  async verificarSeJaNotificado(userId: string, membroId: string, tipo: "hoje" | "amanha"): Promise<boolean> {
    try {
      const db = getFirestoreInstance()
      const hoje = new Date().toISOString().split("T")[0]
      const notificacaoRef = doc(db, "notificacoes_aniversario", `${userId}_${membroId}_${tipo}_${hoje}`)
      const notificacaoDoc = await getDoc(notificacaoRef)

      return notificacaoDoc.exists()
    } catch (error) {
      console.error("Erro ao verificar notificação:", error)
      return false
    }
  }

  async marcarComoNotificado(membroId: string, tipo: "hoje" | "amanha"): Promise<void> {
    try {
      const db = getFirestoreInstance()
      const hoje = new Date().toISOString().split("T")[0]
      const notificacaoRef = doc(db, "notificacoes_aniversario", `${membroId}_${tipo}_${hoje}`)

      await setDoc(notificacaoRef, {
        membroId,
        tipo,
        data: hoje,
        timestamp: new Date(),
      })
    } catch (error) {
      console.error("Erro ao marcar como notificado:", error)
    }
  }

  async iniciarVerificacaoDiaria(userId: string): Promise<void> {
    // Verificar aniversários de hoje
    const aniversariosHoje = await this.verificarAniversariosHoje(userId)
    for (const aniversario of aniversariosHoje) {
      await this.enviarNotificacaoAniversario(aniversario, "hoje")
    }

    // Verificar aniversários de amanhã
    const aniversariosAmanha = await this.verificarAniversariosAmanha(userId)
    for (const aniversario of aniversariosAmanha) {
      await this.enviarNotificacaoAniversario(aniversario, "amanha")
    }
  }

  configurarVerificacaoAutomatica(userId: string): void {
    // Verificar imediatamente
    this.iniciarVerificacaoDiaria(userId)

    // Configurar para verificar todo dia às 9h
    const agora = new Date()
    const proximaVerificacao = new Date()
    proximaVerificacao.setDate(agora.getDate() + 1)
    proximaVerificacao.setHours(9, 0, 0, 0)

    const tempoAteProximaVerificacao = proximaVerificacao.getTime() - agora.getTime()

    setTimeout(() => {
      this.iniciarVerificacaoDiaria(userId)

      // Configurar verificação diária
      setInterval(
        () => {
          this.iniciarVerificacaoDiaria(userId)
        },
        24 * 60 * 60 * 1000,
      ) // 24 horas
    }, tempoAteProximaVerificacao)
  }
}

export const aniversarioService = AniversarioService.getInstance()
