"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Search, Gift, Bell, Cake, PartyPopper, Clock, Star, Heart } from "lucide-react"
import { useAniversariantes } from "@/src/core/hooks/use-aniversariantes"


export default function AniversariantesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [periodoFilter, setPeriodoFilter] = useState("proximos7dias")

  const {
    aniversariantesProximos,
    aniversariantesHoje,
    aniversariantesAmanha,
    aniversariantesMes,
    loading,
    enviarParabens,
    marcarComoParabenizado,
  } = useAniversariantes()



  const handleEnviarParabens = async (membroId: string, nome: string) => {
    try {
      await enviarParabens(membroId)
      await marcarComoParabenizado(membroId)

      alert({
        title: "Parabéns enviados! 🎉",
        description: `Mensagem de aniversário enviada para ${nome}`,
      })
    } catch (error) {
      alert({
        title: "Erro",
        description: "Erro ao enviar parabéns.",
        variant: "destructive",
      })
    }
  }

  const getAniversariantesPorPeriodo = () => {
    switch (periodoFilter) {
      case "hoje":
        return aniversariantesHoje
      case "amanha":
        return aniversariantesAmanha
      case "proximos7dias":
        return aniversariantesProximos.filter((a) => a.diasRestantes <= 7)
      case "proximos30dias":
        return aniversariantesProximos.filter((a) => a.diasRestantes <= 30)
      case "mes":
        return aniversariantesMes
      default:
        return aniversariantesProximos
    }
  }

  const filteredAniversariantes = getAniversariantesPorPeriodo().filter((aniversariante) =>
    aniversariante.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getDiasRestantesText = (dias: number) => {
    if (dias === 0) return "Hoje! 🎉"
    if (dias === 1) return "Amanhã"
    if (dias < 0) return `Há ${Math.abs(dias)} dias`
    return `Em ${dias} dias`
  }

  const getDiasRestantesBadge = (dias: number) => {
    if (dias === 0) return "destructive" // Hoje - vermelho
    if (dias === 1) return "default" // Amanhã - azul
    if (dias <= 7) return "secondary" // Próximos 7 dias - cinza
    return "outline" // Mais de 7 dias - outline
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Cake className="h-8 w-8 text-pink-600" />
            Aniversariantes
          </h1>
          <p className="text-muted-foreground">Acompanhe e parabenize os aniversariantes da igreja</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Bell className="mr-2 h-4 w-4" />
            Configurar Notificações
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <PartyPopper className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{aniversariantesHoje.length}</div>
            <p className="text-xs text-muted-foreground">aniversariantes hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amanhã</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{aniversariantesAmanha.length}</div>
            <p className="text-xs text-muted-foreground">aniversariantes amanhã</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos 7 dias</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {aniversariantesProximos.filter((a) => a.diasRestantes <= 7).length}
            </div>
            <p className="text-xs text-muted-foreground">na próxima semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <Gift className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{aniversariantesMes.length}</div>
            <p className="text-xs text-muted-foreground">aniversários no mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas para Hoje e Amanhã */}
      {aniversariantesHoje.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <PartyPopper className="h-5 w-5" />
              Aniversariantes de Hoje! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {aniversariantesHoje.map((aniversariante) => (
                <div
                  key={aniversariante.id}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt={aniversariante.nome} />
                    <AvatarFallback className="bg-red-100 text-red-700">
                      {aniversariante.nome.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{aniversariante.nome}</p>
                    <p className="text-xs text-muted-foreground">{aniversariante.idade} anos</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleEnviarParabens(aniversariante.id, aniversariante.nome)}
                    disabled={aniversariante.parabenizado}
                  >
                    {aniversariante.parabenizado ? (
                      <>
                        <Heart className="mr-1 h-3 w-3" />
                        Enviado
                      </>
                    ) : (
                      <>
                        <Gift className="mr-1 h-3 w-3" />
                        Parabenizar
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {aniversariantesAmanha.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Clock className="h-5 w-5" />
              Aniversariantes de Amanhã
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {aniversariantesAmanha.map((aniversariante) => (
                <div
                  key={aniversariante.id}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt={aniversariante.nome} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {aniversariante.nome.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{aniversariante.nome}</p>
                    <p className="text-xs text-muted-foreground">{aniversariante.idade} anos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Aniversariantes</CardTitle>
          <CardDescription>Todos os próximos aniversários dos membros</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={periodoFilter === "hoje" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodoFilter("hoje")}
              >
                Hoje
              </Button>
              <Button
                variant={periodoFilter === "amanha" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodoFilter("amanha")}
              >
                Amanhã
              </Button>
              <Button
                variant={periodoFilter === "proximos7dias" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodoFilter("proximos7dias")}
              >
                7 dias
              </Button>
              <Button
                variant={periodoFilter === "proximos30dias" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodoFilter("proximos30dias")}
              >
                30 dias
              </Button>
              <Button
                variant={periodoFilter === "mes" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodoFilter("mes")}
              >
                Este mês
              </Button>
            </div>
          </div>

          {filteredAniversariantes.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Cake className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum aniversariante encontrado</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Data de Nascimento</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Aniversário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAniversariantes.map((aniversariante) => (
                  <TableRow key={aniversariante.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="/placeholder.svg" alt={aniversariante.nome} />
                          <AvatarFallback>{aniversariante.nome.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{aniversariante.nome}</p>
                          <p className="text-sm text-muted-foreground">{aniversariante.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(aniversariante.dataNascimento).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{aniversariante.idade}</span>
                        {aniversariante.idade >= 60 && <Star className="h-4 w-4 text-yellow-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getDiasRestantesBadge(aniversariante.diasRestantes)}>
                        {getDiasRestantesText(aniversariante.diasRestantes)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {aniversariante.parabenizado ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Heart className="mr-1 h-3 w-3" />
                          Parabenizado
                        </Badge>
                      ) : aniversariante.diasRestantes === 0 ? (
                        <Badge variant="destructive">
                          <PartyPopper className="mr-1 h-3 w-3" />
                          Pendente
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="mr-1 h-3 w-3" />
                          Aguardando
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {aniversariante.diasRestantes <= 1 && !aniversariante.parabenizado && (
                          <Button
                            size="sm"
                            onClick={() => handleEnviarParabens(aniversariante.id, aniversariante.nome)}
                          >
                            <Gift className="mr-1 h-4 w-4" />
                            Parabenizar
                          </Button>
                        )}
                        {aniversariante.telefone && (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={`https://wa.me/${aniversariante.telefone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              WhatsApp
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
