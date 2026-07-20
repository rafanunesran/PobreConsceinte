import { useState } from 'react'
import { updateTransaction } from './api'
import type { Transaction } from './types'

export function useConfirmPending(uid: string) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  async function confirm(transaction: Transaction): Promise<void> {
    setConfirmingId(transaction.id)
    try {
      const { id, ...data } = transaction
      void id
      await updateTransaction(uid, transaction.id, { ...data, paid: true })
    } catch {
      // silencioso — a linha continua pendente e o usuário pode tentar de novo
    } finally {
      setConfirmingId(null)
    }
  }

  return { confirmingId, confirm }
}
