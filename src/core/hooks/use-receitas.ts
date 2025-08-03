"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy } from "firebase/firestore"
import { useAuth } from "@/src/services/firebase/auth/context/auth-context"
import { getFirestoreInstance } from "@/src/services/firebase/config/firebase"
import { notificationService } from "@/src/services/firebase/Modulo-Notification/notification-service"


export interface Receita {
  id: string
  descricao: string
  categoria: string
  valor: number
  data: string
  formaPagamento?: string
  observacoes?: string
  membro?: string
  userId: string
  createdAt: Date
}

export function useReceitas() {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchReceitas = async () => {
    if (!user) {
      console.log("No user found, skipping fetch")
      setLoading(false)
      return
    }

    try {
      console.log("Fetching receitas for user:", user.uid)
      const db = getFirestoreInstance()
      const q = query(collection(db, "receitas"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const receitasData = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        console.log("Receita data:", { id: doc.id, ...data })
        return {
          id: doc.id,
          ...data,
          // Garantir que campos opcionais existam
          formaPagamento: data.formaPagamento || "pix",
          observacoes: data.observacoes || "",
          membro: data.membro || "",
        }
      }) as Receita[]

      console.log(`Successfully loaded ${receitasData.length} receitas`)
      setReceitas(receitasData)
    } catch (error) {
      console.error("Erro ao buscar receitas:", error)
      // Se der erro no orderBy, tenta sem ordenação
      try {
        console.log("Retrying without orderBy...")
        const db = getFirestoreInstance()
        const q = query(collection(db, "receitas"), where("userId", "==", user.uid))
        const querySnapshot = await getDocs(q)
        const receitasData = querySnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            // Garantir que campos opcionais existam
            formaPagamento: data.formaPagamento || "pix",
            observacoes: data.observacoes || "",
            membro: data.membro || "",
          }
        }) as Receita[]

        // Ordenar manualmente por data
        receitasData.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

        console.log(`Loaded ${receitasData.length} receitas without orderBy`)
        setReceitas(receitasData)
      } catch (retryError) {
        console.error("Erro mesmo sem orderBy:", retryError)
      }
    } finally {
      setLoading(false)
    }
  }

  const addReceita = async (receita: Omit<Receita, "id" | "userId" | "createdAt">) => {
    if (!user) {
      console.error("No user found for adding receita")
      throw new Error("Usuário não autenticado")
    }

    try {
      console.log("Adding receita:", receita)
      const db = getFirestoreInstance()

      const receitaData = {
        ...receita,
        userId: user.uid,
        createdAt: new Date(),
        // Garantir valores padrão
        formaPagamento: receita.formaPagamento || "pix",
        observacoes: receita.observacoes || "",
        membro: receita.membro || "",
      }

      console.log("Receita data to save:", receitaData)

      const docRef = await addDoc(collection(db, "receitas"), receitaData)
      console.log("Receita saved with ID:", docRef.id)

      const newReceita = {
        id: docRef.id,
        ...receitaData,
      }

      // Atualizar o estado local imediatamente
      setReceitas((prev) => [newReceita, ...prev])
      console.log("Local state updated")

      // Notificar nova receita
      try {
        await notificationService.notifyNewReceita(receita.valor, receita.categoria)
      } catch (notificationError) {
        console.warn("Erro ao enviar notificação:", notificationError)
      }

      // Refetch para garantir sincronização
      setTimeout(() => {
        console.log("Refetching after add...")
        fetchReceitas()
      }, 1000)

      return docRef.id
    } catch (error) {
      console.error("Erro ao adicionar receita:", error)
      throw error
    }
  }

  const updateReceita = async (id: string, receita: Partial<Receita>) => {
    try {
      const db = getFirestoreInstance()
      const updateData = {
        ...receita,
        // Garantir valores padrão
        formaPagamento: receita.formaPagamento || "pix",
        observacoes: receita.observacoes || "",
        membro: receita.membro || "",
      }

      await updateDoc(doc(db, "receitas", id), updateData)
      setReceitas((prev) => prev.map((r) => (r.id === id ? { ...r, ...updateData } : r)))
      console.log("Receita updated:", id)
    } catch (error) {
      console.error("Erro ao atualizar receita:", error)
      throw error
    }
  }

  const deleteReceita = async (id: string) => {
    try {
      const db = getFirestoreInstance()
      await deleteDoc(doc(db, "receitas", id))
      setReceitas((prev) => prev.filter((r) => r.id !== id))
      console.log("Receita deleted:", id)
    } catch (error) {
      console.error("Erro ao deletar receita:", error)
      throw error
    }
  }

  useEffect(() => {
    console.log("useReceitas effect triggered, user:", user?.uid)
    if (user) {
      fetchReceitas()
    } else {
      console.log("No user, clearing receitas")
      setReceitas([])
      setLoading(false)
    }
  }, [user])

  return {
    receitas,
    loading,
    addReceita,
    updateReceita,
    deleteReceita,
    refetch: fetchReceitas,
  }
}
