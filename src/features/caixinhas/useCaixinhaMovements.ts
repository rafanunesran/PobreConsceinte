import { useEffect, useState } from 'react'
import { onSnapshot, query, where } from 'firebase/firestore'
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
    // NOTE: sem orderBy aqui de propósito — mesma razão de useCaixinhas.ts,
    // ordena no cliente pra não precisar de índice composto manual.
    const q = query(caixinhaMovementsCollection(uid), where('caixinhaId', '==', caixinhaId))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => doc.data())
        docs.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
        setMovements(docs)
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
