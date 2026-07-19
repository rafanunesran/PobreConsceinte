import { Bell } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { Avatar } from '../ui/Avatar'

export function Header() {
  const user = useAuthStore((state) => state.user)
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'por aí'

  return (
    <header className="flex items-center justify-between px-6 pb-2 pt-6">
      <div className="flex items-center gap-3">
        <Avatar src={user?.photoURL} name={user?.displayName ?? user?.email} />
        <p className="text-base font-medium text-light-primary dark:text-dark-primary">
          Oi, {firstName}
        </p>
      </div>
      <button
        type="button"
        aria-label="Notificações"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light text-light-secondary transition-colors duration-200 hover:text-light-primary dark:border-border-dark dark:text-dark-secondary dark:hover:text-dark-primary"
      >
        <Bell size={20} />
      </button>
    </header>
  )
}
