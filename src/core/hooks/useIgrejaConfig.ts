"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { useAuth } from "@/src/services/firebase/auth/context/auth-context"
import { getFirestoreInstance } from "@/src/services/firebase/config/firebase"
import { IgrejaConfig } from "../@types/IgrejaConfig"


export function useIgrejaConfig() {
  const [config, setConfig] = useState<IgrejaConfig>({
    nome: "",
    endereco: "",
    telefone: "",
    email: "",
    pastor: "",
    cnpj: "",
    descricao: "",
    userId: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  const fetchConfig = async () => {
    if (!user) {
      console.log("No user found, skipping config fetch")
      setLoading(false)
      return
    }

    try {
      console.log("Fetching igreja config for user:", user.uid)
      const db = getFirestoreInstance()
      const docRef = doc(db, "igrejaConfig", user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data() as IgrejaConfig
        console.log("Igreja config loaded:", data)
        setConfig(data)
      } else {
        console.log("No igreja config found, using defaults")
        // Manter valores padrão se não existir configuração
        setConfig((prev) => ({
          ...prev,
          userId: user.uid,
        }))
      }
    } catch (error) {
      console.error("Erro ao buscar configurações da igreja:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async (newConfig: Partial<IgrejaConfig>) => {
    if (!user) {
      console.error("No user found for saving config")
      return false
    }

    setSaving(true)
    try {
      console.log("Saving igreja config:", newConfig)
      const db = getFirestoreInstance()
      const docRef = doc(db, "igrejaConfig", user.uid)

      const configData = {
        ...config,
        ...newConfig,
        userId: user.uid,
        updatedAt: new Date(),
      }

      // Verificar se o documento já existe
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        // Atualizar documento existente
        await updateDoc(docRef, configData)
        console.log("Igreja config updated")
      } else {
        // Criar novo documento
        await setDoc(docRef, {
          ...configData,
          createdAt: new Date(),
        })
        console.log("Igreja config created")
      }

      // Atualizar estado local
      setConfig(configData as IgrejaConfig)
      return true
    } catch (error) {
      console.error("Erro ao salvar configurações da igreja:", error)
      return false
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (updates: Partial<IgrejaConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }

  useEffect(() => {
    console.log("useIgrejaConfig effect triggered, user:", user?.uid)
    if (user) {
      fetchConfig()
    } else {
      console.log("No user, clearing config")
      setConfig({
        nome: "",
        endereco: "",
        telefone: "",
        email: "",
        pastor: "",
        cnpj: "",
        descricao: "",
        userId: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setLoading(false)
    }
  }, [user])

  return {
    config,
    loading,
    saving,
    saveConfig,
    updateConfig,
    refetch: fetchConfig,
  }
}
