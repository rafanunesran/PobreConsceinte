import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { CATEGORY_ICONS, CATEGORY_COLORS, CATEGORY_TYPES, type Category, type CategoryType, type CategoryIcon, type CategoryColor } from './types'
import type { CategoryFormData } from './schemas'

const categoryConverter: FirestoreDataConverter<Category> = {
  toFirestore: (category) => ({
    name: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data()
    const type: CategoryType = CATEGORY_TYPES.includes(data.type) ? data.type : 'expense'
    const icon: CategoryIcon = CATEGORY_ICONS.includes(data.icon) ? data.icon : 'more'
    const color: CategoryColor = CATEGORY_COLORS.includes(data.color) ? data.color : '#10B981'
    return {
      id: snapshot.id,
      name: typeof data.name === 'string' ? data.name : '',
      type,
      icon,
      color,
    }
  },
}

export function categoriesCollection(uid: string) {
  return collection(db, 'users', uid, 'categories').withConverter(categoryConverter)
}

function categoryDoc(uid: string, categoryId: string) {
  return doc(db, 'users', uid, 'categories', categoryId).withConverter(categoryConverter)
}

export async function createCategory(uid: string, data: CategoryFormData): Promise<string> {
  const ref = await addDoc(categoriesCollection(uid), { id: '', ...data })
  return ref.id
}

export async function updateCategory(
  uid: string,
  categoryId: string,
  data: CategoryFormData,
): Promise<void> {
  await updateDoc(categoryDoc(uid, categoryId), data)
}

export async function deleteCategory(uid: string, categoryId: string): Promise<void> {
  await deleteDoc(categoryDoc(uid, categoryId))
}

export async function getCategory(uid: string, categoryId: string): Promise<Category | null> {
  const snapshot = await getDoc(categoryDoc(uid, categoryId))
  return snapshot.exists() ? snapshot.data() : null
}

// Usado por fluxos automáticos (ajuste de fatura, ajuste de saldo, etc.)
// que precisam de uma categoria fixa sem pedir pro usuário escolher —
// reaproveita se já existir, cria só na primeira vez.
export async function getOrCreateCategoryByName(
  uid: string,
  categories: Category[],
  name: string,
  type: CategoryType,
  icon: CategoryIcon,
  color: CategoryColor,
): Promise<string> {
  const existing = categories.find((c) => c.type === type && c.name === name)
  if (existing) return existing.id
  return createCategory(uid, { name, type, icon, color })
}
