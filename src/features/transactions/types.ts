export const TRANSACTION_TYPES = ['expense', 'income'] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export interface Transaction {
  id: string
  type: TransactionType
  amount: number // sempre positivo; o sinal do efeito no saldo vem de `type`
  date: string // 'YYYY-MM-DD', de <input type="date">
  description: string
  categoryId: string
  accountId?: string // presente sse account-linked
  cardId?: string // presente sse card-linked (só em expenses)
}

export interface TransactionFormData {
  type: TransactionType
  amount: number
  date: string
  description: string
  categoryId: string
  accountId?: string
  cardId?: string
}
