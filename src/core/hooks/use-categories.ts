"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy } from "firebase/firestore"
import { useAuth } from "@/src/services/firebase/auth/context/auth-context"
import { getFirestoreInstance } from "@/src/services/firebase/config/firebase"

export interface CustomCategory {
  id: string
  name: string
  userId: string
  createdAt: Date
}

export function useCategories(collectionName: string) {
  const [categories, setCategories] = useState<CustomCategory[]>([])
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
        collection(db, collectionName),
        where("userId", "==", user.uid),
        orderBy("createdAt", "asc")
      )
      const querySnapshot = await getDocs(q)
      const categoriesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CustomCategory[]
      setCategories(categoriesData)
    } catch (error) {
      console.error(`Erro ao buscar categorias de ${collectionName}:`, error)
    } finally {
      setLoading(false)
    }
  }, [user, collectionName])

  const addCategory = async (name: string) => {
    if (!user) return
    try {
      const db = getFirestoreInstance()
      const categoryData = {
        name,
        userId: user.uid,
        createdAt: new Date(),
      }
      const docRef = await addDoc(collection(db, collectionName), categoryData)
      const newCategory = { id: docRef.id, ...categoryData } as CustomCategory
      setCategories((prev) => [...prev, newCategory])
      return newCategory
    } catch (error) {
      console.error(`Erro ao adicionar categoria em ${collectionName}:`, error)
      throw error
    }
  }

  const updateCategory = async (id: string, name: string) => {
    try {
      const db = getFirestoreInstance()
      await updateDoc(doc(db, collectionName, id), { name })
      setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, name } : cat)))
    } catch (error) {
      console.error(`Erro ao atualizar categoria em ${collectionName}:`, error)
      throw error
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      const db = getFirestoreInstance()
      await deleteDoc(doc(db, collectionName, id))
      setCategories((prev) => prev.filter((cat) => cat.id !== id))
    } catch (error) {
      console.error(`Erro ao deletar categoria em ${collectionName}:`, error)
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
