import { Festa } from './types'
import { format, isToday, differenceInCalendarDays, parseISO, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Verifica se a data cai no fim de semana (sábado ou domingo)
export function isFimDeSemana(dateStr: string): boolean {
  const dia = getDay(parseISO(dateStr))
  return dia === 0 || dia === 6
}

export interface Notification {
  message: string
  type: 'info' | 'warning' | 'danger'
}

export function getNotifications(festasParam: Festa[]): Notification[] {
  const notifications: Notification[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Ignora festas já concluídas nos avisos
  const festas = festasParam.filter(f => !f.concluida)

  // Aviso 5 dias antes: festas de fim de semana
  festas
    .filter(f => {
      const diff = differenceInCalendarDays(parseISO(f.data), today)
      return diff === 5 && isFimDeSemana(f.data)
    })
    .forEach(f => {
      const d = parseISO(f.data)
      notifications.push({
        message: `Faltam 5 dias para a festa de fim de semana: ${f.nomeAniversariante} (${f.tema}) — ${format(d, "EEEE, dd/MM", { locale: ptBR })} às ${f.horario}`,
        type: 'warning',
      })
    })

  const upcomingFestas = festas.filter(f => {
    const d = parseISO(f.data)
    const diff = differenceInCalendarDays(d, today)
    return diff >= 0 && diff <= 7
  })

  // Festas hoje
  const todasHoje = festas.filter(f => isToday(parseISO(f.data)))
  if (todasHoje.length > 0) {
    todasHoje.forEach(f => {
      notifications.push({
        message: `Hoje há festa: ${f.nomeAniversariante} (${f.tema}) às ${f.horario}`,
        type: 'info',
      })
    })
  }

  // Festas próximas (1-7 dias)
  const proximas = upcomingFestas.filter(f => !isToday(parseISO(f.data)))
  proximas.slice(0, 3).forEach(f => {
    const diff = differenceInCalendarDays(parseISO(f.data), today)
    notifications.push({
      message: `Faltam ${diff} dia${diff > 1 ? 's' : ''} para a festa de ${f.nomeAniversariante}`,
      type: diff <= 2 ? 'warning' : 'info',
    })
  })

  // Conflito de horários
  const festasPorData: Record<string, Festa[]> = {}
  festas.forEach(f => {
    if (!festasPorData[f.data]) festasPorData[f.data] = []
    festasPorData[f.data].push(f)
  })

  Object.entries(festasPorData).forEach(([, fs]) => {
    const conflitos: Record<string, Festa[]> = {}
    fs.forEach(f => {
      if (!conflitos[f.horario]) conflitos[f.horario] = []
      conflitos[f.horario].push(f)
    })
    Object.entries(conflitos).forEach(([horario, fs2]) => {
      if (fs2.length > 1) {
        const d = parseISO(fs2[0].data)
        const diff = differenceInCalendarDays(d, today)
        if (diff >= 0 && diff <= 30) {
          notifications.push({
            message: `Conflito: ${fs2.map(f => f.nomeAniversariante).join(' e ')} têm festa no mesmo horário (${horario} em ${format(d, 'dd/MM', { locale: ptBR })})`,
            type: 'danger',
          })
        }
      }
    })
  })

  return notifications
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateLong(dateStr: string): string {
  return format(parseISO(dateStr), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function tipoLabel(tipo: string): string {
  if (tipo === 'buffet') return 'Buffet Agathon'
  if (tipo === 'domicilio') return 'Domicílio'
  if (tipo === 'outro') return 'Outro Espaço'
  return tipo
}

export function tipoColor(tipo: string): string {
  if (tipo === 'buffet') return '#3b82f6'
  if (tipo === 'domicilio') return '#22c55e'
  if (tipo === 'outro') return '#f97316'
  return '#64748b'
}

export function tipoBadgeClass(tipo: string): string {
  if (tipo === 'buffet') return 'bg-blue-100 text-blue-700'
  if (tipo === 'domicilio') return 'bg-green-100 text-green-700'
  if (tipo === 'outro') return 'bg-orange-100 text-orange-700'
  return 'bg-gray-100 text-gray-700'
}
