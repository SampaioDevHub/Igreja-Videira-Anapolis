import { Despesa } from "@/src/core/@types/Despesa"
import { Membro } from "@/src/core/@types/Membro"
import { PDFOptions } from "@/src/core/@types/PDFOptions"
import { Receita } from "@/src/core/@types/Receita"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export class PDFGenerator {
  private doc: jsPDF

  constructor() {
    this.doc = new jsPDF()
  }

  private addHeader(title: string, subtitle?: string, period?: string) {
    // Logo/Título da Igreja
    this.doc.setFontSize(20)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Igreja Videira", 20, 25)

    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("Sistema Financeiro", 20, 32)

    // Linha separadora
    this.doc.line(20, 38, 190, 38)

    // Título do relatório
    this.doc.setFontSize(16)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(title, 20, 50)

    if (subtitle) {
      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(subtitle, 20, 58)
    }

    if (period) {
      this.doc.setFontSize(10)
      this.doc.text(`Período: ${period}`, 20, 66)
    }

    // Data de geração
    this.doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 20, 74)

    return 85 // Retorna a posição Y para continuar
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(8)
      this.doc.text(`Página ${i} de ${pageCount} - Igreja Videira - Sistema Financeiro`, 20, 285)
    }
  }

  generateFinancialReport(receitas: Receita[], despesas: Despesa[], options: PDFOptions): void {
    let yPosition = this.addHeader(options.title, options.subtitle, options.period)

    // Resumo financeiro
    const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0)
    const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0)
    const saldoLiquido = totalReceitas - totalDespesas

    yPosition += 10
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("RESUMO FINANCEIRO", 20, yPosition)

    yPosition += 15
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "normal")

    const resumoData = [
      ["Total de Receitas", `R$ ${totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Total de Despesas", `R$ ${totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Saldo Líquido", `R$ ${saldoLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
    ]

    autoTable(this.doc, {
      startY: yPosition,
      head: [["Descrição", "Valor"]],
      body: resumoData,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 },
    })

    yPosition = (this.doc as any).lastAutoTable.finalY + 20

    // Receitas por categoria
    if (receitas.length > 0) {
      this.doc.setFontSize(14)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("RECEITAS POR CATEGORIA", 20, yPosition)

      const receitasPorCategoria = receitas.reduce(
        (acc, r) => {
          acc[r.categoria] = (acc[r.categoria] || 0) + r.valor
          return acc
        },
        {} as Record<string, number>,
      )

      const receitasData = Object.entries(receitasPorCategoria).map(([categoria, valor]) => [
        categoria.toUpperCase(),
        `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      ])

      yPosition += 10
      autoTable(this.doc, {
        startY: yPosition,
        head: [["Categoria", "Valor"]],
        body: receitasData,
        theme: "striped",
        headStyles: { fillColor: [46, 204, 113] },
        styles: { fontSize: 10 },
      })

      yPosition = (this.doc as any).lastAutoTable.finalY + 20
    }

    // Despesas por categoria
    if (despesas.length > 0) {
      this.doc.setFontSize(14)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("DESPESAS POR CATEGORIA", 20, yPosition)

      const despesasPorCategoria = despesas.reduce(
        (acc, d) => {
          acc[d.categoria] = (acc[d.categoria] || 0) + d.valor
          return acc
        },
        {} as Record<string, number>,
      )

      const despesasData = Object.entries(despesasPorCategoria).map(([categoria, valor]) => [
        categoria.toUpperCase(),
        `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      ])

      yPosition += 10
      autoTable(this.doc, {
        startY: yPosition,
        head: [["Categoria", "Valor"]],
        body: despesasData,
        theme: "striped",
        headStyles: { fillColor: [231, 76, 60] },
        styles: { fontSize: 10 },
      })
    }

    this.addFooter()
  }

  generateMembersReport(membros: Membro[]): void {
    let yPosition = this.addHeader("RELATÓRIO DE MEMBROS", "Lista completa de membros cadastrados")

    yPosition += 10

    const membrosData = membros.map((membro) => [
      membro.nome,
      membro.email || "N/A",
      membro.telefone || "N/A",
      membro.status,
      new Date(membro.dataCadastro).toLocaleDateString("pt-BR"),
    ])

    autoTable(this.doc, {
      startY: yPosition,
      head: [["Nome", "Email", "Telefone", "Status", "Data Cadastro"]],
      body: membrosData,
      theme: "grid",
      headStyles: { fillColor: [155, 89, 182] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
      },
    })

    this.addFooter()
  }

  generateTithesReport(receitas: Receita[]): void {
    const dizimos = receitas.filter((r) => r.categoria.toLowerCase() === "dizimo")

    let yPosition = this.addHeader("RELATÓRIO DE DÍZIMOS", "Histórico completo de dízimos")

    yPosition += 10

    const dizimosData = dizimos.map((dizimo) => [
      dizimo.descricao,
      new Date(dizimo.data).toLocaleDateString("pt-BR"),
      `R$ ${dizimo.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    ])

    autoTable(this.doc, {
      startY: yPosition,
      head: [["Descrição", "Data", "Valor"]],
      body: dizimosData,
      theme: "grid",
      headStyles: { fillColor: [52, 152, 219] },
      styles: { fontSize: 10 },
    })

    // Resumo dos dízimos
    const totalDizimos = dizimos.reduce((sum, d) => sum + d.valor, 0)
    const mediaDizimos = dizimos.length > 0 ? totalDizimos / dizimos.length : 0

    yPosition = (this.doc as any).lastAutoTable.finalY + 20

    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("RESUMO DOS DÍZIMOS", 20, yPosition)

    yPosition += 10
    this.doc.setFont("helvetica", "normal")
    this.doc.text(`Total: R$ ${totalDizimos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 20, yPosition)
    this.doc.text(`Quantidade: ${dizimos.length} dízimos`, 20, yPosition + 8)
    this.doc.text(`Média: R$ ${mediaDizimos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 20, yPosition + 16)

    this.addFooter()
  }

  save(filename: string): void {
    this.doc.save(filename)
  }

  getBlob(): Blob {
    return this.doc.output("blob")
  }
}
