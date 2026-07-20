import {
  collection,
  doc,
  getDoc,
  setDoc,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { UserProfile } from './types'

const userProfileConverter: FirestoreDataConverter<UserProfile> = {
  toFirestore: (profile) => ({
    displayName: profile.displayName,
    email: profile.email,
    ...(profile.photoURL !== undefined ? { photoURL: profile.photoURL } : {}),
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data()
    const photoURL = typeof data.photoURL === 'string' ? data.photoURL : undefined
    return {
      uid: snapshot.id,
      displayName: typeof data.displayName === 'string' ? data.displayName : '',
      email: typeof data.email === 'string' ? data.email : '',
      ...(photoURL !== undefined ? { photoURL } : {}),
    }
  },
}

export function userProfilesCollection() {
  return collection(db, 'userProfiles').withConverter(userProfileConverter)
}

export function userProfileDoc(uid: string) {
  return doc(db, 'userProfiles', uid).withConverter(userProfileConverter)
}

// Upsert idempotente — chamado a cada login (ver AppShell.tsx) pra
// manter o espelho público em dia, inclusive pra usuários que nunca
// mexeram em nada de família (assim o perfil já existe quando alguém
// precisar resolver o nome deles).
export async function upsertMyProfile(
  uid: string,
  data: { displayName: string; email: string; photoURL?: string },
): Promise<void> {
  await setDoc(userProfileDoc(uid), { uid, ...data })
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(userProfileDoc(uid))
  return snapshot.exists() ? snapshot.data() : null
}
