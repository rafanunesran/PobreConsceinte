import { useEffect, useState } from 'react'
import { onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { caixinhasCollection } from './api'
import type { Caixinha } from './types'

interface UseCaixinhasResult {
  caixinhas: Caixinha[]
  loading: boolean
  error: boolean
}

export function useCaixinhas(uid: string, accountId: string): UseCaixinhasResult {
  const [caixinhas, setCaixinhas] = useState<Caixinha[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const q = query(caixinhasCollection(uid), where('accountId', '==', accountId), orderBy('name'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCaixinhas(snapshot.docs.map((doc) => doc.data()))
        setLoading(false)
      },
      () => {
        setError(true)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [uid, accountId])

  return { caixinhas, loading, error }
}
