const TIME_ZONE = 'America/Sao_Paulo'
export const REMINDER_GRACE_MS = 5 * 60_000

export function localDate(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const value = (type: string) => parts.find(p => p.type === type)!.value
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function weekendRange(now: Date): { start: string; end: string } {
  const base = new Date(`${localDate(now)}T00:00:00Z`)
  const day = base.getUTCDay()
  // Durante sex/sáb/dom, o resumo continua se referindo ao fim de semana atual.
  base.setUTCDate(base.getUTCDate() + (day === 0 ? -2 : 5 - day))
  const start = base.toISOString().slice(0, 10)
  base.setUTCDate(base.getUTCDate() + 2)
  return { start, end: base.toISOString().slice(0, 10) }
}

export function festaStart(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(time.trim())
  if (!match) return null
  const [, h, m, s = '00'] = match
  if (+h > 23 || +m > 59 || +s > 59) return null
  // Resolve o offset pela zona da festa, sem depender do TZ do servidor.
  const probe = new Date(`${date}T12:00:00Z`)
  if (Number.isNaN(probe.getTime()) || probe.toISOString().slice(0, 10) !== date) return null
  const zone = new Intl.DateTimeFormat('en', {
    timeZone: TIME_ZONE, timeZoneName: 'longOffset',
  }).formatToParts(probe).find(p => p.type === 'timeZoneName')!.value
  const offset = zone === 'GMT' ? '+00:00' : zone.replace('GMT', '')
  return new Date(`${date}T${h.padStart(2, '0')}:${m}:${s}${offset}`)
}

export function reminderWindow(now: Date): { start: string; end: string } {
  const end = new Date(now.getTime() + 60 * 60_000)
  return { start: localDate(new Date(end.getTime() - REMINDER_GRACE_MS)), end: localDate(end) }
}

export function reminderDue(start: Date, now: Date): boolean {
  const elapsed = now.getTime() - (start.getTime() - 60 * 60_000)
  return elapsed >= 0 && elapsed < REMINDER_GRACE_MS
}
