import { signOut } from 'firebase/auth'
import { LogOut, Moon, Sun } from 'lucide-react'
import { auth } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'

export function PerfilPage() {
  const user = useAuthStore((state) => state.user)
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  // NOTE: PerfilPage só é renderizada atrás de <ProtectedRoute>, então
  // `user` nunca deveria ser null aqui — o guard é só pro TS não reclamar.
  if (!user) return null

  return (
    <div className="flex flex-col items-center gap-6 px-6 pt-4">
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

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button variant="secondary" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </Button>

        <Button variant="secondary" onClick={() => signOut(auth)}>
          <LogOut size={20} />
          Sair
        </Button>
      </div>
    </div>
  )
}
