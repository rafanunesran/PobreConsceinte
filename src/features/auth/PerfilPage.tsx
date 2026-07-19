import { signOut } from 'firebase/auth'
import { LogOut } from 'lucide-react'
import { auth } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'

export function PerfilPage() {
  const user = useAuthStore((state) => state.user)

  // NOTE: PerfilPage só é renderizada atrás de <ProtectedRoute>, então
  // `user` nunca deveria ser null aqui — o guard é só pro TS não reclamar.
  if (!user) return null

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[480px] flex-col items-center gap-6 bg-bg-light p-6 dark:bg-bg-dark">
      <Avatar
        src={user.photoURL}
        name={user.displayName ?? user.email}
        className="h-20 w-20 text-xl"
      />

      <div className="text-center">
        <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
          {user.displayName ?? 'Sem nome'}
        </h1>
        <p className="text-sm text-light-secondary dark:text-dark-secondary">{user.email}</p>
      </div>

      <Button variant="secondary" className="w-full max-w-xs" onClick={() => signOut(auth)}>
        <LogOut size={20} />
        Sair
      </Button>
    </main>
  )
}
