"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy } from "firebase/firestore"
import { useAuth } from "@/src/services/firebase/auth/context/auth-context"
import { getFirestoreInstance } from "@/src/services/firebase/config/firebase"
import { notificationService } from "@/src/services/firebase/Modulo-Notification/notification-service"
import { Despesa } from "../@types/Despesa"


export function useDespesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchDespesas = async () => {
    if (!user) {
      console.log("No user found, skipping fetch")
      setLoading(false)
      return
    }

    try {
      console.log("Fetching despesas for user:", user.uid)
      const db = getFirestoreInstance()
      const q = query(collection(db, "despesas"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const despesasData = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        console.log("Despesa data:", { id: doc.id, ...data })
        return {
          id: doc.id,
          ...data,
        }
      }) as Despesa[]

      console.log(`Successfully loaded ${despesasData.length} despesas`)
      setDespesas(despesasData)
    } catch (error) {
      console.error("Erro ao buscar despesas:", error)
      // Se der erro no orderBy, tenta sem ordenação
      try {
        console.log("Retrying without orderBy...")
        const db = getFirestoreInstance()
        const q = query(collection(db, "despesas"), where("userId", "==", user.uid))
        const querySnapshot = await getDocs(q)
        const despesasData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Despesa[]

        // Ordenar manualmente por data
        despesasData.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

        console.log(`Loaded ${despesasData.length} despesas without orderBy`)
        setDespesas(despesasData)
      } catch (retryError) {
        console.error("Erro mesmo sem orderBy:", retryError)
      }
    } finally {
      setLoading(false)
    }
  }

  const addDespesa = async (despesa: Omit<Despesa, "id" | "userId" | "createdAt">) => {
    if (!user) {
      console.error("No user found for adding despesa")
      return
    }

    try {
      console.log("Adding despesa:", despesa)
      const db = getFirestoreInstance()

      const despesaData = {
        ...despesa,
        userId: user.uid,
        createdAt: new Date(),
      }

      console.log("Despesa data to save:", despesaData)

      const docRef = await addDoc(collection(db, "despesas"), despesaData)
      console.log("Despesa saved with ID:", docRef.id)

      const newDespesa = {
        id: docRef.id,
        ...despesaData,
      }

      // Atualizar o estado local imediatamente
      setDespesas((prev) => [newDespesa, ...prev])
      console.log("Local state updated")

      // Notificar nova despesa
      await notificationService.notifyNewDespesa(despesa.valor, despesa.categoria)

      // Verificar se é despesa vencida
      if (despesa.status === "Vencido") {
        await notificationService.notifyDespesaVencida(despesa.descricao, despesa.valor)
      }

      // Refetch para garantir sincronização
      setTimeout(() => {
        console.log("Refetching after add...")
        fetchDespesas()
      }, 1000)

      return docRef.id
    } catch (error) {
      console.error("Erro ao adicionar despesa:", error)
      throw error
    }
  }

  const updateDespesa = async (id: string, despesa: Partial<Despesa>) => {
    try {
      const db = getFirestoreInstance()
      await updateDoc(doc(db, "despesas", id), despesa)
      setDespesas((prev) => prev.map((d) => (d.id === id ? { ...d, ...despesa } : d)))
      console.log("Despesa updated:", id)
    } catch (error) {
      console.error("Erro ao atualizar despesa:", error)
      throw error
    }
  }

  const deleteDespesa = async (id: string) => {
    try {
      const db = getFirestoreInstance()
      await deleteDoc(doc(db, "despesas", id))
      setDespesas((prev) => prev.filter((d) => d.id !== id))
      console.log("Despesa deleted:", id)
    } catch (error) {
      console.error("Erro ao deletar despesa:", error)
      throw error
    }
  }

  useEffect(() => {
    console.log("useDespesas effect triggered, user:", user?.uid)
    if (user) {
      fetchDespesas()
    } else {
      console.log("No user, clearing despesas")
      setDespesas([])
      setLoading(false)
    }
  }, [user]) // Usar user em vez de user?.uid

  return {
    despesas,
    loading,
    addDespesa,
    updateDespesa,
    deleteDespesa,
    refetch: fetchDespesas,
  }
}
