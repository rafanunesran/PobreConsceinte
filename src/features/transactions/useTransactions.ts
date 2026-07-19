import { useEffect, useState } from 'react'
import { onSnapshot, orderBy, query } from 'firebase/firestore'
import { transactionsCollection } from './api'
import type { Transaction } from './types'

interface UseTransactionsResult {
  transactions: Transaction[]
  loading: boolean
  error: boolean
}

export function useTransactions(uid: string): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const q = query(transactionsCollection(uid), orderBy('date', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setTransactions(snapshot.docs.map((doc) => doc.data()))
        setLoading(false)
      },
      () => {
        setError(true)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [uid])

  return { transactions, loading, error }
}
