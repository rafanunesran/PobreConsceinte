import { useEffect, useState } from 'react'
import { onSnapshot, orderBy, query } from 'firebase/firestore'
import { categoriesCollection } from './api'
import type { Category } from './types'

interface UseCategoriesResult {
  categories: Category[]
  loading: boolean
  error: boolean
}

export function useCategories(uid: string): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const q = query(categoriesCollection(uid), orderBy('name'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCategories(snapshot.docs.map((doc) => doc.data()))
        setLoading(false)
      },
      () => {
        setError(true)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [uid])

  return { categories, loading, error }
}
