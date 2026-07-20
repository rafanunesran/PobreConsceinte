import { addMonthsClamped, formatDate, monthsBetween, parseDate, roundToCents } from '../transactions/dateUtils'
import type { Transaction } from '../transactions/types'
import type { CreditCard } from './types'

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

// Receita vinculada a cartão é um crédito/ajuste — abate o valor devido em
// vez de somar, por isso netamos por `type` aqui.
export function sumUnpaid(transactions: Transaction[]): number {
  return roundToCents(
    transactions.reduce((sum, t) => {
      if (t.paid) return sum
      return t.type === 'expense' ? sum + t.amount : sum - t.amount
    }, 0),
  )
}

// "Ocupado": todas as despesas não-pagas do cartão, sem filtro de período —
// um retrato ao vivo do quanto do limite está comprometido.
export function cardOccupiedLimit(transactions: Transaction[], cardId: string): number {
  return sumUnpaid(transactions.filter((t) => t.cardId === cardId))
}

// Diferente de sumUnpaid: soma TODAS as transações do período, pagas ou
// não — representa o valor total histórico daquela fatura, não "quanto
// ainda falta pagar". Uma fatura já paga (tudo com paid:true) precisa
// continuar mostrando o total que ela teve, não R$ 0,00.
function sumInvoiceTotal(transactions: Transaction[]): number {
  return roundToCents(
    transactions.reduce((sum, t) => (t.type === 'expense' ? sum + t.amount : sum - t.amount), 0),
  )
}

export interface CardInvoiceGroup {
  cardId: string
  cardName: string
  period: InvoicePeriod
  dueDate: string
  dueMonth: string // 'YYYY-MM' — mês de vencimento, usado pra agrupar no extrato
  periodOffset: number // relativo à fatura aberta de hoje (0), pra linkar direto pra CardInvoicePage
  amount: number // total histórico do período (pago ou não) — ver sumInvoiceTotal
  unpaidAmount: number // só o que ainda está em aberto — ver sumUnpaid
}

// Agrupa transações de cartão por fatura (cartão + período de fechamento)
// — usado no extrato geral (Registros) pra mostrar "Fatura {cartão}" como
// um único registro em vez de uma linha por compra. Cada fatura é alocada
// pelo mês do VENCIMENTO, não da compra: uma compra feita depois do
// fechamento só vira parte da fatura seguinte, que vence no mês seguinte.
export function groupCardTransactionsByInvoice(
  transactions: Transaction[],
  cards: CreditCard[],
): CardInvoiceGroup[] {
  const cardsById = new Map(cards.map((c) => [c.id, c]))
  const groups = new Map<
    string,
    { cardId: string; cardName: string; period: InvoicePeriod; dueDate: string; items: Transaction[] }
  >()

  for (const t of transactions) {
    if (t.cardId === undefined) continue
    const card = cardsById.get(t.cardId)
    if (!card) continue
    const period = getInvoicePeriod(card.closingDay, t.date)
    const key = `${card.id}|${period.end}`
    const existing = groups.get(key)
    if (existing) {
      existing.items.push(t)
    } else {
      groups.set(key, {
        cardId: card.id,
        cardName: card.name,
        period,
        dueDate: getDueDate(period.end, card.dueDay),
        items: [t],
      })
    }
  }

  const today = todayDateString()
  return Array.from(groups.values()).map((g) => {
    const card = cardsById.get(g.cardId)
    const openPeriod = card ? getInvoicePeriod(card.closingDay, today) : g.period
    return {
      cardId: g.cardId,
      cardName: g.cardName,
      period: g.period,
      dueDate: g.dueDate,
      dueMonth: g.dueDate.slice(0, 7),
      periodOffset: monthsBetween(openPeriod.end, g.period.end),
      amount: sumInvoiceTotal(g.items),
      unpaidAmount: sumUnpaid(g.items),
    }
  })
}

// Mês "efetivo" de uma transação pra agrupar por mês em qualquer tela: uma
// transação de conta usa a própria data (é quando o dinheiro mexeu de
// verdade); uma transação de cartão usa o mês de VENCIMENTO da fatura em
// que ela caiu — pode ser diferente do mês da compra (compra feita depois
// do fechamento só vence no mês seguinte).
export function effectiveMonth(transaction: Transaction, cardsById: Map<string, CreditCard>): string {
  if (transaction.cardId === undefined) return transaction.date.slice(0, 7)
  const card = cardsById.get(transaction.cardId)
  if (!card) return transaction.date.slice(0, 7)
  const period = getInvoicePeriod(card.closingDay, transaction.date)
  return getDueDate(period.end, card.dueDay).slice(0, 7)
}

// steps positivo = avança N faturas (projeção), negativo = volta N faturas.
export function shiftInvoicePeriod(closingDay: number, period: InvoicePeriod, steps: number): InvoicePeriod {
  let result = period
  if (steps > 0) {
    for (let i = 0; i < steps; i++) result = nextInvoicePeriod(closingDay, result)
  } else {
    for (let i = 0; i < -steps; i++) result = previousInvoicePeriod(closingDay, result)
  }
  return result
}

export interface CardInvoiceWindowEntry {
  offset: number // relativo a HOJE (não à janela) — -1 sempre é a última fechada, 0 sempre é a aberta
  periodEnd: string // 'YYYY-MM-DD' — pro caller formatar o nome do mês
  status: 'closed' | 'open' | null
  amount: number
}

export interface CardInvoiceWindow {
  cardId: string
  cardName: string
  entries: CardInvoiceWindowEntry[]
}

// Janela fixa de 5 faturas por cartão: a que fechou mais recentemente
// (offset -1), a aberta (offset 0) e as 3 seguintes projetadas — desloca
// inteira com `baseOffset` (as setas do InvoicesSummaryCard mudam isso),
// mas `status` continua sempre relativo a HOJE, não à janela, então
// "fechada"/"aberta" nunca aparecem em lugar errado mesmo com a janela
// deslocada.
export function computeInvoiceWindows(
  cards: CreditCard[],
  transactions: Transaction[],
  baseOffset: number,
): CardInvoiceWindow[] {
  const today = todayDateString()
  const offsets = [-1, 0, 1, 2, 3].map((o) => o + baseOffset)

  return cards.map((card) => {
    const openPeriod = getInvoicePeriod(card.closingDay, today)
    const entries = offsets.map((offset) => {
      const period = shiftInvoicePeriod(card.closingDay, openPeriod, offset)
      return {
        offset,
        periodEnd: period.end,
        status: offset === -1 ? ('closed' as const) : offset === 0 ? ('open' as const) : null,
        amount: sumUnpaid(transactionsInPeriod(transactions, card.id, period)),
      }
    })
    return { cardId: card.id, cardName: card.name, entries }
  })
}
