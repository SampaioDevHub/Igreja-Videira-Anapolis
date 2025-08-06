"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import ReCAPTCHA from "react-google-recaptcha"

import logo from "@/public/logo.png"
import { useAuth } from "@/src/services/firebase/auth/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ForgotPasswordModal } from "@/src/presentation/layout/components/ForgotPasswordModal"

const RECAPTCHA_SITE_KEY = "6LeSe5orAAAAAEQF73vFEHquvVZ5tLiYnHkxiiW8"

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório.")
    .email("Formato de email inválido.")
    .max(100, "Email muito longo."),
  password: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres.")
    .max(100, "Senha muito longa."),
  recaptchaToken: z.string().min(1, "Confirme que você não é um robô."),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  })

  const handleCaptchaChange = (token: string | null) => {
    setValue("recaptchaToken", token || "")
  }

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setFormError("")

    try {
      await login(data.email, data.password)
      router.push("/dashboard")
    } catch (error: any) {
      setFormError("Email ou senha inválidos. Verifique e tente novamente.")
      if (process.env.NODE_ENV === "development") {
        console.error("Erro ao logar:", error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <Image
            src={logo || "/placeholder.svg"}
            alt="Logo"
            width={130}
            height={130}
            className="dark:filter dark:brightness-0 dark:invert"
          />
        </div>
        <CardTitle className="text-lg text-center">Acesso Restrito</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Informe suas credenciais para continuar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <p className="text-sm text-red-500 text-center">{formError}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Digite seu e-mail:</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              placeholder="E-mail"
              {...register("email")}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Digite sua senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              inputMode="text"
              placeholder="••••••••"
              {...register("password")}
              disabled={loading}
              onPaste={(e) => e.preventDefault()}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div>
            <ReCAPTCHA
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={handleCaptchaChange}
              theme="light"
            />
            {errors.recaptchaToken && (
              <p className="text-sm text-red-500 mt-2">{errors.recaptchaToken.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Verificando..." : "Login"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm space-y-1">
          <p>
            Não tem uma conta?{" "}
            <Link href="/register" className="text-primary hover:underline cursor-pointer">
              Cadastre-se
            </Link>
          </p>
          <div className="mt-4 text-center text-sm">
            <button
              className="text-primary hover:underline cursor-pointer"
              onClick={() => setModalOpen(true)}
              type="button"
            >
              Esqueceu sua senha? 
            </button>
          </div>

          <ForgotPasswordModal open={modalOpen} onOpenChange={setModalOpen} />
        </div>
      </CardContent>
    </Card>
  )
}
