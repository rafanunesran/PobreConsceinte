import { roundToCents } from './dateUtils'
import type { Account } from '../accounts/types'
import type { Transaction, TransactionType } from './types'

// Um movimento que de fato mexeu no saldo combinado das contas (pago +
// vinculado a conta que entra no total). `balanceAfter` é o saldo total
// logo depois desse movimento.
export interface BalanceMovement {
  id: string
  date: string // 'YYYY-MM-DD'
  description: string
  accountName: string
  type: TransactionType
  amount: number // sempre positivo
  effect: number // efeito assinado no saldo (income +, expense −)
  balanceAfter: number
}

export interface BalancePoint {
  date: string
  balance: number
}

export interface BalanceHistory {
  currentTotal: number
  // saldo "de partida" implícito antes do 1º movimento registrado — cobre
  // saldos iniciais de conta e qualquer ajuste que não virou movimento.
  openingBaseline: number
  movements: BalanceMovement[] // mais recente primeiro (pro extrato)
  series: BalancePoint[] // ordem cronológica crescente (pro gráfico)
}

function effectOf(type: TransactionType, amount: number): number {
  return type === 'income' ? amount : -amount
}

// Reconstrói a evolução do saldo TOTAL (todas as contas que entram no total)
// a partir dos movimentos que o afetaram. Ancoramos no saldo atual e
// caminhamos pra trás: o movimento mais recente sempre fecha exatamente no
// saldo atual (o número clicado na Home), independente de saldos iniciais,
// ajustes ou transferências que não geraram transação — essas diferenças
// ficam absorvidas no `openingBaseline` (o começo da linha), nunca num
// movimento errado.
export function buildBalanceHistory(transactions: Transaction[], accounts: Account[]): BalanceHistory {
  const included = accounts.filter((a) => a.includeInTotal)
  const includedIds = new Set(included.map((a) => a.id))
  const namesById = new Map(included.map((a) => [a.id, a.name]))
  const currentTotal = roundToCents(included.reduce((sum, a) => sum + a.balance, 0))

  const relevant = transactions.filter(
    (t) => t.paid && t.accountId !== undefined && includedIds.has(t.accountId),
  )

  // ordem cronológica crescente; empate pelo id só pra ser determinístico.
  const ascending = [...relevant].sort((a, b) =>
    a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date),
  )

  const totalEffect = roundToCents(
    ascending.reduce((sum, t) => sum + effectOf(t.type, t.amount), 0),
  )
  const openingBaseline = roundToCents(currentTotal - totalEffect)

  let running = openingBaseline
  const ascendingMovements: BalanceMovement[] = ascending.map((t) => {
    const effect = effectOf(t.type, t.amount)
    running = roundToCents(running + effect)
    return {
      id: t.id,
      date: t.date,
      description: t.description,
      accountName: namesById.get(t.accountId ?? '') ?? '',
      type: t.type,
      amount: t.amount,
      effect,
      balanceAfter: running,
    }
  })

  // Série do gráfico: 1 ponto no baseline (antes de tudo) + saldo de
  // fim-de-dia pra cada data (colapsa vários movimentos no mesmo dia num
  // ponto só, mantendo a linha limpa). O extrato abaixo mantém movimento a
  // movimento.
  const series: BalancePoint[] = []
  if (ascendingMovements.length > 0) {
    series.push({ date: ascendingMovements[0]!.date, balance: openingBaseline })
    for (const m of ascendingMovements) {
      const last = series[series.length - 1]!
      if (last.date === m.date) last.balance = m.balanceAfter
      else series.push({ date: m.date, balance: m.balanceAfter })
    }
  }

  return {
    currentTotal,
    openingBaseline,
    movements: ascendingMovements.reverse(),
    series,
  }
}
