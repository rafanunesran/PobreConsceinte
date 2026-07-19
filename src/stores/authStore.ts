import { create } from 'zustand'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../lib/firebase'

interface AuthState {
  user: User | null
  initializing: boolean
}

export const useAuthStore = create<AuthState>(() => ({
  user: null,
  initializing: true,
}))

// NOTE: o listener é registrado uma única vez, fora de qualquer componente,
// porque a sessão do Firebase não depende do ciclo de vida do React — ele
// deve existir enquanto o app estiver de pé, não só enquanto algo estiver montado.
onAuthStateChanged(auth, (user) => {
  useAuthStore.setState({ user, initializing: false })
})
