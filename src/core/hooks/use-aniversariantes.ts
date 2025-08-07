"use client"

import { useState, useEffect } from "react"
import { useMembros } from "./use-membros"
import { useAuth } from "@/src/services/firebase/auth/context/auth-context"
import { getFirestoreInstance } from "@/src/services/firebase/config/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { notificationService } from "@/src/services/firebase/Modulo-Notification/notification-service"
import { Aniversariante } from "../@types/Aniversariante"

export function useAniversariantes() {
  const [aniversariantesProximos, setAniversariantesProximos] = useState<Aniversariante[]>([])
  const [aniversariantesHoje, setAniversariantesHoje] = useState<Aniversariante[]>([])
  const [aniversariantesAmanha, setAniversariantesAmanha] = useState<Aniversariante[]>([])
  const [aniversariantesMes, setAniversariantesMes] = useState<Aniversariante[]>([])
  const [loading, setLoading] = useState(true)

  const { membros, loading: loadingMembros } = useMembros()
  const { user } = useAuth()

  const calcularIdade = (dataNascimento: string): number => {
    const hoje = new Date()
    const nascimento = new Date(dataNascimento)
    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const mesAtual = hoje.getMonth()
    const diaAtual = hoje.getDate()

    if (mesAtual < nascimento.getMonth() || (mesAtual === nascimento.getMonth() && diaAtual < nascimento.getDate())) {
      idade--
    }

    return idade
  }

  const calcularDiasRestantes = (dataNascimento: string): number => {
    const hoje = new Date()
    const nascimento = new Date(dataNascimento)

    const proximoAniversario = new Date(hoje.getFullYear(), nascimento.getMonth(), nascimento.getDate())

    if (proximoAniversario < hoje) {
      proximoAniversario.setFullYear(hoje.getFullYear() + 1)
    }

    const diffTime = proximoAniversario.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  const verificarParabenizado = async (membroId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const db = getFirestoreInstance()
      const hoje = new Date().toISOString().split("T")[0]
      const parabenizadoRef = doc(db, "parabenizados", `${user.uid}_${membroId}_${hoje}`)
      const parabenizadoDoc = await getDoc(parabenizadoRef)

      return parabenizadoDoc.exists()
    } catch (error) {
      console.error("Erro ao verificar se foi parabenizado:", error)
      return false
    }
  }

  const processarAniversariantes = async () => {
    if (loadingMembros || !membros.length) {
      setLoading(false)
      return
    }

    try {
      const hoje = new Date()
      const aniversariantes: Aniversariante[] = []

      for (const membro of membros) {
        if (!membro.dataNascimento) continue

        const idade = calcularIdade(membro.dataNascimento)
        const diasRestantes = calcularDiasRestantes(membro.dataNascimento)
        const parabenizado = await verificarParabenizado(membro.id)

        const aniversariante: Aniversariante = {
          id: membro.id,
          nome: membro.nome,
          email: membro.email,
          telefone: membro.telefone,
          dataNascimento: membro.dataNascimento,
          idade,
          diasRestantes,
          parabenizado,
        }

        aniversariantes.push(aniversariante)
      }

      aniversariantes.sort((a, b) => a.diasRestantes - b.diasRestantes)

      const hoje_lista = aniversariantes.filter((a) => a.diasRestantes === 0)
      const amanha_lista = aniversariantes.filter((a) => a.diasRestantes === 1)
      const proximos = aniversariantes.filter((a) => a.diasRestantes <= 60) // Próximos 60 dias
      const mes_atual = aniversariantes.filter((a) => {
        const nascimento = new Date(a.dataNascimento)
        return nascimento.getMonth() === hoje.getMonth()
      })

      setAniversariantesHoje(hoje_lista)
      setAniversariantesAmanha(amanha_lista)
      setAniversariantesProximos(proximos)
      setAniversariantesMes(mes_atual)

      for (const aniversariante of amanha_lista) {
        if (!aniversariante.parabenizado) {
          await notificationService.sendNotification({
            title: "Aniversário Amanhã! ",
            body: `${aniversariante.nome} fará ${aniversariante.idade + 1} anos amanhã`,
            tag: `aniversario-${aniversariante.id}`,
          })
        }
      }
      for (const aniversariante of hoje_lista) {
        if (!aniversariante.parabenizado) {
          await notificationService.sendNotification({
            title: "Aniversário Hoje! 🎉",
            body: `${aniversariante.nome} está fazendo ${aniversariante.idade} anos hoje!`,
            tag: `aniversario-hoje-${aniversariante.id}`,
            requireInteraction: true,
          })
        }
      }
    } catch (error) {
      console.error("Erro ao processar aniversariantes:", error)
    } finally {
      setLoading(false)
    }
  }

  const enviarParabens = async (membroId: string) => {
    if (!user) return

    try {
      const membro = membros.find((m) => m.id === membroId)
      if (!membro) return

      console.log(`Enviando parabéns para ${membro.nome}`)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      await notificationService.sendNotification({
        title: "Parabéns Enviados! 🎉",
        body: `Mensagem de aniversário enviada para ${membro.nome}`,
        tag: `parabens-enviado-${membroId}`,
      })
    } catch (error) {
      console.error("Erro ao enviar parabéns:", error)
      throw error
    }
  }

  const marcarComoParabenizado = async (membroId: string) => {
    if (!user) return

    try {
      const db = getFirestoreInstance()
      const hoje = new Date().toISOString().split("T")[0]
      const parabenizadoRef = doc(db, "parabenizados", `${user.uid}_${membroId}_${hoje}`)

      await setDoc(parabenizadoRef, {
        membroId,
        userId: user.uid,
        data: hoje,
        timestamp: new Date(),
      })

      setAniversariantesHoje((prev) => prev.map((a) => (a.id === membroId ? { ...a, parabenizado: true } : a)))
      setAniversariantesProximos((prev) => prev.map((a) => (a.id === membroId ? { ...a, parabenizado: true } : a)))
    } catch (error) {
      console.error("Erro ao marcar como parabenizado:", error)
      throw error
    }
  }

  useEffect(() => {
    if (!loadingMembros) {
      processarAniversariantes()
    }
  }, [membros, loadingMembros])

  useEffect(() => {
    const agora = new Date()
    const proximaVerificacao = new Date()
    proximaVerificacao.setDate(agora.getDate() + 1)
    proximaVerificacao.setHours(9, 0, 0, 0) 

    const tempoAteProximaVerificacao = proximaVerificacao.getTime() - agora.getTime()

    const timeout = setTimeout(() => {
      processarAniversariantes()

      const interval = setInterval(
        () => {
          processarAniversariantes()
        },
        24 * 60 * 60 * 1000,
      )

      return () => clearInterval(interval)
    }, tempoAteProximaVerificacao)

    return () => clearTimeout(timeout)
  }, [])

  return {
    aniversariantesProximos,
    aniversariantesHoje,
    aniversariantesAmanha,
    aniversariantesMes,
    loading: loading || loadingMembros,
    enviarParabens,
    marcarComoParabenizado,
    refetch: processarAniversariantes,
  }
}
