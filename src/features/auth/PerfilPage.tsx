import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { LogOut, Moon, Sun, Tag, Trash2 } from 'lucide-react'
import { auth } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { resetUserData } from './resetUserData'

const RESET_CONFIRM_WORD = 'ZERAR'

export function PerfilPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  const [confirmingReset, setConfirmingReset] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  // NOTE: PerfilPage só é renderizada atrás de <ProtectedRoute>, então
  // `user` nunca deveria ser null aqui — o guard é só pro TS não reclamar.
  if (!user) return null

  async function handleReset() {
    if (!user) return
    setIsResetting(true)
    setResetError(null)
    try {
      await resetUserData(user.uid)
      navigate('/')
    } catch {
      setResetError('Não foi possível zerar os dados. Tente novamente.')
      setIsResetting(false)
    }
  }

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
        <Link to="/categorias">
          <Button variant="secondary" className="w-full">
            <Tag size={20} />
            Gerenciar categorias
          </Button>
        </Link>

        <Button variant="secondary" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </Button>

        <Button variant="secondary" onClick={() => signOut(auth)}>
          <LogOut size={20} />
          Sair
        </Button>
      </div>

      <div className="w-full max-w-xs border-t border-border-light pt-4 dark:border-border-dark">
        {confirmingReset ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-danger">
              Isso apaga TODOS os seus dados (contas, cartões, categorias, transações e
              caixinhas) para sempre. Não pode ser desfeito.
            </p>
            <Input
              label={`Digite "${RESET_CONFIRM_WORD}" para confirmar`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
            {resetError ? <p className="text-sm text-danger">{resetError}</p> : null}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setConfirmingReset(false)
                  setConfirmText('')
                  setResetError(null)
                }}
                disabled={isResetting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1 bg-danger hover:bg-danger hover:shadow-none"
                onClick={handleReset}
                disabled={confirmText !== RESET_CONFIRM_WORD || isResetting}
              >
                {isResetting ? 'Zerando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmingReset(true)}>
            <Trash2 size={20} />
            Zerar todos os dados
          </Button>
        )}
      </div>
    </div>
  )
}
