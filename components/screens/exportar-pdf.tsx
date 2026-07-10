'use client'

import { useState } from 'react'
import { FileText, Download, Loader2 } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { tipoLabel } from '@/lib/utils-app'
import {
  format,
  parseISO,
  getMonth,
  getYear,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i)

// Carrega uma imagem da pasta public e converte para dataURL (para embutir no PDF)
async function loadImageDataURL(src: string): Promise<string | null> {
  try {
    const res = await fetch(src)
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.error('[v0] Erro ao carregar logo para o PDF:', err)
    return null
  }
}

export function ExportarPDFScreen() {
  const { festas } = useApp()
  const now = new Date()
  const [mes, setMes] = useState(getMonth(now))
  const [ano, setAno] = useState(getYear(now))
  const [loading, setLoading] = useState(false)

  const festasMes = festas.filter(f => {
    const d = parseISO(f.data)
    return getMonth(d) === mes && getYear(d) === ano
  })

  const stats = {
    total: festasMes.length,
    buffet: festasMes.filter(f => f.tipo === 'buffet').length,
    domicilio: festasMes.filter(f => f.tipo === 'domicilio').length,
    outro: festasMes.filter(f => f.tipo === 'outro').length,
    convidados: festasMes.reduce((acc, f) => acc + (f.convidados || 0), 0),
  }

  const gerarPDF = async () => {
    setLoading(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const autoTableModule = await import('jspdf-autotable')
      const autoTable = autoTableModule.default

      // Carrega a logo do buffet para embutir no PDF
      const logoData = await loadImageDataURL('/logo.png')

      // Retrato A4 — poucas colunas, layout limpo
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 14

      const NAVY: [number, number, number] = [26, 46, 74]
      const GOLD: [number, number, number] = [201, 162, 39]

      // --- Cabeçalho ---
      const headerH = 36
      doc.setFillColor(...NAVY)
      doc.rect(0, 0, pageW, headerH, 'F')

      // Logo do Buffet Agathon (proporção 4:3)
      if (logoData) {
        const logoH = 24
        const logoW = logoH * (2048 / 1536)
        doc.addImage(logoData, 'PNG', margin, (headerH - logoH) / 2, logoW, logoH)
      }

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(`${MONTHS[mes]} / ${ano}`, pageW - margin, 15, { align: 'right' })

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GOLD)
      doc.text('Agenda de Festas', pageW - margin, 22, { align: 'right' })

      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(210, 210, 210)
      doc.text(
        `Emitido em ${format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
        pageW - margin,
        28,
        { align: 'right' },
      )

      // --- Faixa de resumo ---
      let y = headerH + 7
      const resumoTexto = `${stats.total} festa(s) no mês  |  Total de convidados: ${stats.convidados}`
      doc.setFillColor(240, 243, 248)
      doc.roundedRect(margin, y, pageW - margin * 2, 9, 1.5, 1.5, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...NAVY)
      doc.text(resumoTexto, margin + 4, y + 6)
      y += 14

      if (festasMes.length === 0) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(150, 150, 150)
        doc.text('Nenhuma festa agendada para este mês.', margin, y + 6)
      } else {
        // Ordenar por data e horário
        const ordenadas = [...festasMes].sort((a, b) => {
          if (a.data !== b.data) return a.data.localeCompare(b.data)
          return a.horario.localeCompare(b.horario)
        })

        const body = ordenadas.map(f => {
          const dataFmt = format(parseISO(f.data), 'dd/MM (EEE)', { locale: ptBR })
          const horario = f.horarioFim ? `${f.horario} - ${f.horarioFim}` : f.horario
          return [
            dataFmt,
            horario,
            f.nomeAniversariante,
            f.tema,
            tipoLabel(f.tipo),
            String(f.convidados),
          ]
        })

        autoTable(doc, {
          startY: y,
          head: [[
            'Dia', 'Horário', 'Aniversariante', 'Tema', 'Tipo', 'Convidados',
          ]],
          body,
          margin: { left: margin, right: margin },
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 2.5,
            overflow: 'linebreak',
            valign: 'middle',
            lineColor: [220, 224, 230],
            lineWidth: 0.1,
            textColor: [40, 45, 55],
          },
          headStyles: {
            fillColor: NAVY,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'left',
          },
          alternateRowStyles: {
            fillColor: [245, 247, 251],
          },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 28 },
            2: { cellWidth: 45 },
            3: { cellWidth: 40 },
            4: { cellWidth: 24 },
            5: { cellWidth: 'auto', halign: 'center' },
          },
        })
      }

      // --- Rodapé ---
      const totalPages = (doc as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p)
        doc.setDrawColor(...GOLD)
        doc.setLineWidth(0.4)
        doc.line(margin, pageH - 10, pageW - margin, pageH - 10)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(150, 150, 150)
        doc.text('Buffet Agathon - Sistema de Gerenciamento de Festas', margin, pageH - 6)
        doc.text(
          `${MONTHS[mes]}/${ano}  -  Página ${p} de ${totalPages}`,
          pageW - margin,
          pageH - 6,
          { align: 'right' },
        )
      }

      doc.save(`ficha-operacional-agathon-${MONTHS[mes].toLowerCase()}-${ano}.pdf`)
    } catch (err) {
      console.error('[v0] Erro ao gerar PDF:', err)
      alert('Erro ao gerar o PDF. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Configuração */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border" style={{ backgroundColor: '#1a2e4a' }}>
          <h2 className="text-lg font-bold text-white">Exportar Ficha Operacional</h2>
          <p className="text-sm mt-0.5" style={{ color: '#c9a227' }}>
            Documento completo em A4 para enviar à equipe
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Mês</label>
              <select
                value={mes}
                onChange={e => setMes(parseInt(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#c9a227] transition"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Ano</label>
              <select
                value={ano}
                onChange={e => setAno(parseInt(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#c9a227] transition"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Preview do resumo */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Prévia — {MONTHS[mes]} de {ano}
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8eef7' }}>
              <FileText size={18} style={{ color: '#1a2e4a' }} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total de festas</p>
            </div>
          </div>
          <div className="rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-50">
              <FileText size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.buffet}</p>
              <p className="text-xs text-muted-foreground">Buffet Agathon</p>
            </div>
          </div>
          <div className="rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-green-50">
              <FileText size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.domicilio}</p>
              <p className="text-xs text-muted-foreground">Domicílio</p>
            </div>
          </div>
          <div className="rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-orange-50">
              <FileText size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.outro}</p>
              <p className="text-xs text-muted-foreground">Outro Espaço</p>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-border p-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Total de convidados no mês</span>
          <span className="text-lg font-bold text-foreground">{stats.convidados}</span>
        </div>

        <button
          onClick={gerarPDF}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#1a2e4a' }}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Download size={18} />
          )}
          {loading ? 'Gerando PDF...' : `Gerar PDF — ${MONTHS[mes]} ${ano}`}
        </button>
      </div>
    </div>
  )
}
