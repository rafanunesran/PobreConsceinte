import { useState } from 'react'
import { updateTransaction } from './api'
import type { Transaction } from './types'

export function useConfirmPending(uid: string) {
  const [confirmingIds, setConfirmingIds] = useState<Set<string>>(new Set())

  async function confirm(transaction: Transaction): Promise<void> {
    setConfirmingIds(new Set([transaction.id]))
    try {
      const { id, ...data } = transaction
      void id
      await updateTransaction(uid, transaction.id, { ...data, paid: true })
    } catch {
      // silencioso — a linha continua pendente e o usuário pode tentar de novo
    } finally {
      setConfirmingIds(new Set())
    }
  }

  async function confirmMany(transactions: Transaction[]): Promise<void> {
    setConfirmingIds(new Set(transactions.map((t) => t.id)))
    try {
      // sequencial, não Promise.all — evita várias runTransaction
      // concorrentes na mesma conta, que forçariam retries do Firestore.
      for (const transaction of transactions) {
        const { id, ...data } = transaction
        void id
        await updateTransaction(uid, transaction.id, { ...data, paid: true })
      }
    } catch {
      // o que já foi confirmado fica confirmado; o resto continua
      // pendente e o usuário pode tentar de novo.
    } finally {
      setConfirmingIds(new Set())
    }
  }

  return { confirmingIds, confirm, confirmMany }
}
