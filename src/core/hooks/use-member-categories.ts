"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy } from "firebase/firestore"
import { useAuth } from "@/src/services/firebase/auth/context/auth-context"
import { getFirestoreInstance } from "@/src/services/firebase/config/firebase"
import { MemberCategory } from "../@types/MemberCategory"

export function useMemberCategories() {
  const [categories, setCategories] = useState<MemberCategory[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchCategories = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const db = getFirestoreInstance()
      const q = query(
        collection(db, "memberCategories"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "asc")
      )
      const querySnapshot = await getDocs(q)
      const categoriesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MemberCategory[]
      setCategories(categoriesData)
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const addCategory = async (name: string) => {
    if (!user) return
    try {
      const db = getFirestoreInstance()
      const categoryData = {
        name,
        userId: user.uid,
        createdAt: new Date(),
      }
      const docRef = await addDoc(collection(db, "memberCategories"), categoryData)
      const newCategory = { id: docRef.id, ...categoryData } as MemberCategory
      setCategories((prev) => [...prev, newCategory])
      return newCategory
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error)
      throw error
    }
  }

  const updateCategory = async (id: string, name: string) => {
    try {
      const db = getFirestoreInstance()
      await updateDoc(doc(db, "memberCategories", id), { name })
      setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, name } : cat)))
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error)
      throw error
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      const db = getFirestoreInstance()
      await deleteDoc(doc(db, "memberCategories", id))
      setCategories((prev) => prev.filter((cat) => cat.id !== id))
    } catch (error) {
      console.error("Erro ao deletar categoria:", error)
      throw error
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetchCategories: fetchCategories,
  }
}
