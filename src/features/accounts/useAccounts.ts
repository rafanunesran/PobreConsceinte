import { useEffect, useState } from 'react'
import { onSnapshot, orderBy, query } from 'firebase/firestore'
import { accountsCollection } from './api'
import type { Account } from './types'

interface UseAccountsResult {
  accounts: Account[]
  loading: boolean
  error: boolean
}

export function useAccounts(uid: string): UseAccountsResult {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const q = query(accountsCollection(uid), orderBy('name'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setAccounts(snapshot.docs.map((doc) => doc.data()))
        setLoading(false)
      },
      () => {
        // NOTE: cai aqui principalmente se as regras de segurança ainda não
        // foram publicadas no console, ou o Firestore Database nem existe.
        setError(true)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [uid])

  return { accounts, loading, error }
}
