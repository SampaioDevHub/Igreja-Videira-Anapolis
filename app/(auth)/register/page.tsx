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


const RECAPTCHA_SITE_KEY = "6LeSe5orAAAAAEQF73vFEHquvVZ5tLiYnHkxiiW8"

const registerSchema = z
  .object({
    name: z.string().min(3, "Informe seu nome completo"),
    email: z.string().email("Email inválido").max(100),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(8, "Confirme a senha corretamente"),
    recaptchaToken: z.string().min(1, "Confirme que você não é um robô."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
  })

  const handleCaptchaChange = (token: string | null) => {
    setValue("recaptchaToken", token || "")
  }

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)
    setFormError("")

    try {
      await registerUser(data.email, data.password, data.name)
      router.push("/dashboard")
      alert({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao Sistema Financeiro da Igreja Videira.",
      })
    } catch (error: any) {
      let errorMessage = "Erro ao criar conta."

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email já está em uso."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "A senha é muito fraca."
      }

      setFormError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Image
              src={logo}
              alt="Logo"
              width={130}
              height={130}
              className="dark:filter dark:brightness-0 dark:invert"
            />
          </div>
          <CardTitle className="text-lg text-center">Criar Conta</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Cadastre-se para acessar o sistema financeiro
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {formError && <p className="text-sm text-red-500 text-center">{formError}</p>}

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                {...register("name")}
                disabled={loading}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                disabled={loading}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
                disabled={loading}
                onPaste={(e) => e.preventDefault()}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
                disabled={loading}
                onPaste={(e) => e.preventDefault()}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Criar Conta"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
