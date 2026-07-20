import { create } from 'zustand'
import { watchMyFamily } from '../features/family/api'
import type { Family } from '../features/family/types'

interface WorkspaceState {
  // uid do "dono" cujos dados devem ser lidos/escritos — é o meu próprio
  // uid em modo solo, ou o ownerId da família de que faço parte. Nunca
  // null depois que `loading` vira false (cai pro meu uid se não houver
  // família).
  workspaceId: string | null
  family: Family | null // null = modo solo
  loading: boolean
}

export const useWorkspaceStore = create<WorkspaceState>(() => ({
  workspaceId: null,
  family: null,
  loading: true,
}))

// Chamado de dentro de AppShell.tsx (não module-level como authStore —
// depende de user.uid, que só existe depois do login). Retorna a função
// de unsubscribe pro caller limpar no useEffect.
export function syncWorkspace(myUid: string): () => void {
  useWorkspaceStore.setState({ loading: true })
  return watchMyFamily(myUid, (family) => {
    useWorkspaceStore.setState({
      workspaceId: family ? family.ownerId : myUid,
      family,
      loading: false,
    })
  })
}
