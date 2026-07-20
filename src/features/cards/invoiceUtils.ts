import { addMonthsClamped, formatDate, parseDate, roundToCents } from '../transactions/dateUtils'
import type { Transaction } from '../transactions/types'

export interface InvoicePeriod {
  start: string // 'YYYY-MM-DD', inclusive
  end: string // 'YYYY-MM-DD', inclusive — sempre um dia de fechamento (clamped)
}

function addOneDay(year: number, month1based: number, day: number) {
  const d = new Date(year, month1based - 1, day + 1) // só componentes locais, nunca toISOString
  return { year: d.getFullYear(), month1based: d.getMonth() + 1, day: d.getDate() }
}

// Período cujo FECHAMENTO cai no mês year/month1based.
function periodEndingInMonth(closingDay: number, year: number, month1based: number): InvoicePeriod {
  const end = addMonthsClamped(year, month1based, closingDay, 0)
  const prevEnd = addMonthsClamped(year, month1based, closingDay, -1)
  const start = addOneDay(prevEnd.year, prevEnd.month1based, prevEnd.day)
  return {
    start: formatDate(start.year, start.month1based, start.day),
    end: formatDate(end.year, end.month1based, end.day),
  }
}

// Período que CONTÉM referenceDate (o dia de fechamento pertence à fatura
// que fecha nele, não à seguinte).
export function getInvoicePeriod(closingDay: number, referenceDate: string): InvoicePeriod {
  const ref = parseDate(referenceDate)
  const closingThisMonth = addMonthsClamped(ref.year, ref.month1based, closingDay, 0)
  if (ref.day <= closingThisMonth.day) return periodEndingInMonth(closingDay, ref.year, ref.month1based)
  const next = addMonthsClamped(ref.year, ref.month1based, closingDay, 1)
  return periodEndingInMonth(closingDay, next.year, next.month1based)
}

export function previousInvoicePeriod(closingDay: number, period: InvoicePeriod): InvoicePeriod {
  const end = parseDate(period.end)
  const m = addMonthsClamped(end.year, end.month1based, closingDay, -1)
  return periodEndingInMonth(closingDay, m.year, m.month1based)
}

export function nextInvoicePeriod(closingDay: number, period: InvoicePeriod): InvoicePeriod {
  const end = parseDate(period.end)
  const m = addMonthsClamped(end.year, end.month1based, closingDay, 1)
  return periodEndingInMonth(closingDay, m.year, m.month1based)
}

// 1ª ocorrência de dueDay ESTRITAMENTE depois de periodEnd — cobre tanto o
// vencimento cair ainda no mês de fechamento quanto no mês seguinte.
export function getDueDate(periodEnd: string, dueDay: number): string {
  const end = parseDate(periodEnd)
  const dueThisMonth = addMonthsClamped(end.year, end.month1based, dueDay, 0)
  const due = dueThisMonth.day > end.day ? dueThisMonth : addMonthsClamped(end.year, end.month1based, dueDay, 1)
  return formatDate(due.year, due.month1based, due.day)
}

export function todayDateString(): string {
  const now = new Date()
  return formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function transactionsInPeriod(
  transactions: Transaction[],
  cardId: string,
  period: InvoicePeriod,
): Transaction[] {
  return transactions.filter((t) => t.cardId === cardId && t.date >= period.start && t.date <= period.end)
}

export function sumUnpaid(transactions: Transaction[]): number {
  return roundToCents(transactions.reduce((sum, t) => (t.paid ? sum : sum + t.amount), 0))
}

// "Ocupado": todas as despesas não-pagas do cartão, sem filtro de período —
// um retrato ao vivo do quanto do limite está comprometido.
export function cardOccupiedLimit(transactions: Transaction[], cardId: string): number {
  return sumUnpaid(transactions.filter((t) => t.cardId === cardId))
}
