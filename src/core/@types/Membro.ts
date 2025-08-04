export interface Membro {
  id: string
  nome: string
  email?: string
  telefone?: string
  endereco?: string
  dataNascimento?: string
  dataCadastro: string
  status: "Ativo" | "Inativo" | "Visitante"
  observacoes?: string
  userId: string
  createdAt: Date
}