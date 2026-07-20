import { useEffect, useState } from 'react'
import { onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { caixinhaMovementsCollection } from './movements'
import type { CaixinhaMovement } from './types'

interface UseCaixinhaMovementsResult {
  movements: CaixinhaMovement[]
  loading: boolean
  error: boolean
}

export function useCaixinhaMovements(uid: string, caixinhaId: string): UseCaixinhaMovementsResult {
  const [movements, setMovements] = useState<CaixinhaMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const q = query(
      caixinhaMovementsCollection(uid),
      where('caixinhaId', '==', caixinhaId),
      orderBy('date', 'desc'),
    )
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMovements(snapshot.docs.map((doc) => doc.data()))
        setLoading(false)
      },
      () => {
        setError(true)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [uid, caixinhaId])

  return { movements, loading, error }
}
