import type { Transaction } from '../transactions/types'
import type { ParsedEntry } from './types'

const AMOUNT_EPSILON = 0.005 // meio centavo de tolerância pra arredondamento

// `existing` já deve vir filtrado pra mesma conta/cartão do import (o
// caller já tem essa lista em memória via useTransactions + filtro por
// accountId/cardId, mesmo padrão usado em AccountDetailPage).
export function isLikelyDuplicate(entry: ParsedEntry, existing: Transaction[]): boolean {
  return existing.some(
    (t) => t.date === entry.date && t.type === entry.type && Math.abs(t.amount - entry.amount) < AMOUNT_EPSILON,
  )
}
