"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy } from "firebase/firestore"
import { useAuth } from "@/src/services/firebase/auth/context/auth-context"
import { getFirestoreInstance } from "@/src/services/firebase/config/firebase"
import { Membro } from "../@types/Membro"

export function useMembros() {
  const [membros, setMembros] = useState<Membro[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchMembros = async () => {
    if (!user) {
      console.log("No user found, skipping fetch")
      setLoading(false)
      return
    }

    try {
      console.log("Fetching membros for user:", user.uid)
      const db = getFirestoreInstance()
      const q = query(collection(db, "membros"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const membrosData = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
        }
      }) as Membro[]

      console.log(`Successfully loaded ${membrosData.length} membros`)
      setMembros(membrosData)
    } catch (error) {
      console.error("Erro ao buscar membros:", error)
     
      try {
        const db = getFirestoreInstance()
        const q = query(collection(db, "membros"), where("userId", "==", user.uid))
        const querySnapshot = await getDocs(q)
        const membrosData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Membro[]

        membrosData.sort((a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime())
        setMembros(membrosData)
      } catch (retryError) {
        console.error("Erro mesmo sem orderBy:", retryError)
      }
    } finally {
      setLoading(false)
    }
  }

  const addMembro = async (membro: Omit<Membro, "id" | "userId" | "createdAt">) => {
    if (!user) return

    try {
      const db = getFirestoreInstance()
      const membroData = {
        ...membro, 
        userId: user.uid,
        createdAt: new Date(),
      }

      const docRef = await addDoc(collection(db, "membros"), membroData)
      const newMembro = { id: docRef.id, ...membroData }

      setMembros((prev) => [newMembro, ...prev])
      return docRef.id
    } catch (error) {
      console.error("Erro ao adicionar membro:", error)
      throw error
    }
  }

  const updateMembro = async (id: string, membro: Partial<Membro>) => {
    try {
      const db = getFirestoreInstance()
      await updateDoc(doc(db, "membros", id), membro) 
      setMembros((prev) => prev.map((m) => (m.id === id ? { ...m, ...membro } : m)))
    } catch (error) {
      console.error("Erro ao atualizar membro:", error)
      throw error
    }
  }

  const deleteMembro = async (id: string) => {
    try {
      const db = getFirestoreInstance()
      await deleteDoc(doc(db, "membros", id))
      setMembros((prev) => prev.filter((m) => m.id !== id))
    } catch (error) {
      console.error("Erro ao deletar membro:", error)
      throw error
    }
  }

  useEffect(() => {
    if (user) {
      fetchMembros()
    } else {
      setMembros([])
      setLoading(false)
    }
  }, [user])

  return {
    membros,
    loading,
    addMembro,
    updateMembro,
    deleteMembro,
    refetch: fetchMembros,
  }
}
