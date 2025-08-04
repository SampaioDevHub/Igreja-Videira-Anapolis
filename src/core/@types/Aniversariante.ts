export interface Aniversariante {
  id: string
  nome: string
  email?: string
  telefone?: string
  dataNascimento: string
  idade: number
  diasRestantes: number
  parabenizado: boolean
  dataParabens?: string
}