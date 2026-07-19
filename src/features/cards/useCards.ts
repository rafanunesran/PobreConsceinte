import { useEffect, useState } from 'react'
import { onSnapshot, orderBy, query } from 'firebase/firestore'
import { cardsCollection } from './api'
import type { CreditCard } from './types'

interface UseCardsResult {
  cards: CreditCard[]
  loading: boolean
  error: boolean
}

export function useCards(uid: string): UseCardsResult {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const q = query(cardsCollection(uid), orderBy('name'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCards(snapshot.docs.map((doc) => doc.data()))
        setLoading(false)
      },
      () => {
        setError(true)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [uid])

  return { cards, loading, error }
}
