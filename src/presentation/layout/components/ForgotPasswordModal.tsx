"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/src/services/firebase/auth/context/auth-context"
import { ForgotPasswordModalProps } from "@/src/core/@types/props/ForgotPasswordModalProps"

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const { sendPasswordResetEmail } = useAuth()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const emailInputRef = useRef<HTMLInputElement>(null)
 
  useEffect(() => {
    if (open) {
      setStatus(null) 
      setEmail("")
      setTimeout(() => emailInputRef.current?.focus(), 150) 
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      await sendPasswordResetEmail(email.trim())
      setStatus({
        type: "success",
        message: "Email enviado com sucesso! Verifique sua caixa de entrada.",
      })
      
      setTimeout(() => onOpenChange(false), 2000)
    } catch (error) {
      setStatus({
        type: "error",
        message:
          "Erro ao enviar email. Verifique se o endereço está correto e tente novamente.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="w-full max-w-md rounded-lg p-6 bg-white dark:bg-gray-800 shadow-lg transition-transform scale-100 data-[state=open]:scale-100 data-[state=closed]:scale-95">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Recuperar acesso
          </DialogTitle>
          <DialogDescription className="mt-1 text-gray-600 dark:text-gray-400">
            Informe seu email cadastrado para receber um link de recuperação de senha.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="flex flex-col">
            <Label htmlFor="email" className="mb-2 font-medium text-gray-700 dark:text-gray-300">
              Email
            </Label>
            <Input
              ref={emailInputRef}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              aria-describedby="emailHelp"
              className="placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {status && (
            <p
              className={`text-sm ${
                status.type === "success"
                  ? "text-green-600"
                  : "text-red-600"
              } transition-opacity duration-500`}
              role="alert"
              aria-live="assertive"
            >
              {status.message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={loading || email.trim() === ""}
              aria-busy={loading}
            >
              {loading ? "Enviando..." : "Enviar email de recuperação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
