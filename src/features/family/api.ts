import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Family } from './types'

const familyConverter: FirestoreDataConverter<Family> = {
  toFirestore: (family) => ({
    ownerId: family.ownerId,
    memberIds: family.memberIds,
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data()
    const memberIds = Array.isArray(data.memberIds)
      ? data.memberIds.filter((id: unknown): id is string => typeof id === 'string')
      : []
    return {
      id: snapshot.id,
      ownerId: typeof data.ownerId === 'string' ? data.ownerId : snapshot.id,
      memberIds,
    }
  },
}

export function familiesCollection() {
  return collection(db, 'families').withConverter(familyConverter)
}

export function familyDoc(ownerId: string) {
  return doc(db, 'families', ownerId).withConverter(familyConverter)
}

export async function createFamily(ownerId: string): Promise<void> {
  await setDoc(familyDoc(ownerId), { id: ownerId, ownerId, memberIds: [ownerId] })
}

// "code" é o ownerId da família a entrar — o próprio ID do documento
// funciona como código de convite compartilhável.
export async function joinFamily(code: string, myUid: string): Promise<void> {
  const snap = await getDoc(familyDoc(code))
  if (!snap.exists()) throw new Error('Código inválido.')
  if (snap.data().memberIds.includes(myUid)) return
  await updateDoc(familyDoc(code), { memberIds: arrayUnion(myUid) })
}

export async function leaveFamily(ownerId: string, myUid: string): Promise<void> {
  await updateDoc(familyDoc(ownerId), { memberIds: arrayRemove(myUid) })
}

// Observa a família (se houver) de que `myUid` faz parte — sem orderBy,
// array-contains sozinho não exige índice composto (lição do bug de
// caixinhas). Chama `onChange(null)` se a pessoa não estiver em nenhuma
// família (modo solo).
export function watchMyFamily(myUid: string, onChange: (family: Family | null) => void): Unsubscribe {
  const q = query(familiesCollection(), where('memberIds', 'array-contains', myUid))
  return onSnapshot(
    q,
    (snapshot) => {
      const first = snapshot.docs[0]
      onChange(first ? first.data() : null)
    },
    () => onChange(null),
  )
}
