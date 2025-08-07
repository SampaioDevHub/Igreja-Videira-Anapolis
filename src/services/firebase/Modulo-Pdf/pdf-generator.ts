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

  generateFinancialReport(
    allReceitas: Receita[],
    allDespesas: Despesa[],
    filteredReceitas: Receita[],
    filteredDespesas: Despesa[],
    options: PDFOptions,
  ): void {
    let yPosition = this.addHeader(options.title, options.subtitle, options.period)

    // --- RESUMO FINANCEIRO GERAL (sem filtros) ---
    const totalReceitasGeral = allReceitas.reduce((sum, r) => sum + r.valor, 0)
    const totalDespesasGeral = allDespesas.reduce((sum, d) => sum + d.valor, 0)
    const saldoLiquidoGeral = totalReceitasGeral - totalDespesasGeral

    yPosition += 10
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("RESUMO FINANCEIRO GERAL", 20, yPosition)

    yPosition += 15
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "normal")

    const resumoGeralData = [
      ["Total de Receitas (Geral)", `R$ ${totalReceitasGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Total de Despesas (Geral)", `R$ ${totalDespesasGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Saldo Líquido (Geral)", `R$ ${saldoLiquidoGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
    ]

    autoTable(this.doc, {
      startY: yPosition,
      head: [["Descrição", "Valor"]],
      body: resumoGeralData,
      theme: "grid",
      headStyles: { fillColor: [60, 179, 113] }, // Cor verde para o resumo geral
      styles: { fontSize: 10 },
    })

    yPosition = (this.doc as any).lastAutoTable.finalY + 20

    // --- RESUMO FINANCEIRO DO PERÍODO/TIPO (com filtros) ---
    const totalReceitasFiltradas = filteredReceitas.reduce((sum, r) => sum + r.valor, 0)
    const totalDespesasFiltradas = filteredDespesas.reduce((sum, d) => sum + d.valor, 0)
    const saldoLiquidoFiltrado = totalReceitasFiltradas - totalDespesasFiltradas

    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("RESUMO FINANCEIRO DO PERÍODO/TIPO", 20, yPosition)

    yPosition += 15
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "normal")

    const resumoFiltradoData = [
      ["Total de Receitas", `R$ ${totalReceitasFiltradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Total de Despesas", `R$ ${totalDespesasFiltradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Saldo Líquido", `R$ ${saldoLiquidoFiltrado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
    ]

    autoTable(this.doc, {
      startY: yPosition,
      head: [["Descrição", "Valor"]],
      body: resumoFiltradoData,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 },
    })

    yPosition = (this.doc as any).lastAutoTable.finalY + 20

    // Receitas por categoria (usando dados filtrados)
    if (filteredReceitas.length > 0) {
      this.doc.setFontSize(14)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("RECEITAS POR CATEGORIA", 20, yPosition)

      const receitasPorCategoria = filteredReceitas.reduce(
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

    // Despesas por categoria (usando dados filtrados)
    if (filteredDespesas.length > 0) {
      this.doc.setFontSize(14)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("DESPESAS POR CATEGORIA", 20, yPosition)

      const despesasPorCategoria = filteredDespesas.reduce(
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
      yPosition = (this.doc as any).lastAutoTable.finalY + 20 // Atualiza yPosition após a tabela
    }

    // Adicionar gráficos se includeCharts for true e houver imagens
    if (options.includeCharts && options.chartImages) {
      this.doc.addPage(); // Inicia gráficos em uma nova página
      yPosition = 20; // Reinicia a posição Y para a nova página

      this.doc.setFontSize(16);
      this.doc.setFont("helvetica", "bold");
      this.doc.text("GRÁFICOS DE ANÁLISE FINANCEIRA", 20, yPosition);
      yPosition += 15;

      const chartWidth = 170; // Largura do gráfico em mm (para A4 com margens de 20mm)
      const chartHeight = 90; // Altura do gráfico em mm

      // Função auxiliar para adicionar gráfico
      const addChart = (title: string, imageData?: string) => {
        if (imageData) {
          if (yPosition + chartHeight + 20 > this.doc.internal.pageSize.height) {
            this.doc.addPage();
            yPosition = 20;
          }
          this.doc.setFontSize(12);
          this.doc.setFont("helvetica", "bold");
          this.doc.text(title, 20, yPosition);
          yPosition += 5; // Espaço para o título
          this.doc.addImage(imageData, 'PNG', 20, yPosition, chartWidth, chartHeight);
          yPosition += chartHeight + 15; // Espaço após o gráfico
        }
      };

      addChart("Comparativo Geral", options.chartImages.barChartComparison);
      addChart("Receitas por Categoria", options.chartImages.pieReceitasChart);
      addChart("Despesas por Categoria", options.chartImages.pieDespesasChart);
      addChart("Status das Despesas", options.chartImages.pieDespesasStatusChart);
      addChart("Evolução Financeira (Receitas, Despesas, Saldo)", options.chartImages.evolutionLineChart);
      addChart("Área de Saldo Líquido Mensal", options.chartImages.areaSaldoChart);
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
