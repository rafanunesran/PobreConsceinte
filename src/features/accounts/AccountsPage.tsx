import { Link } from 'react-router-dom'
import { Plus, Wallet } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useAccounts } from './useAccounts'
import { ACCOUNT_TYPE_LABELS } from './types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { formatBRL } from '../../lib/utils'

export function AccountsPage() {
  const user = useAuthStore((state) => state.user)
  // NOTE: hooks não podem ser condicionais — chama useAccounts sempre, com
  // uid vazio se `user` ainda não resolveu, e só corta a renderização depois.
  const { accounts, loading, error } = useAccounts(user?.uid ?? '')

  // Só renderiza atrás de <ProtectedRoute>, `user` nunca deveria ser null
  // aqui de verdade — o guard é só pro TS não reclamar.
  if (!user) return null

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
          Contas
        </h1>
        <Link to="/contas/nova">
          <Button type="button" className="gap-1.5">
            <Plus size={18} />
            Nova conta
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark-elevated"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-danger">
          Não foi possível carregar suas contas. Verifique sua conexão ou tente novamente mais
          tarde.
        </p>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-light py-16 text-center dark:border-border-dark">
          <Wallet size={32} className="text-light-secondary dark:text-dark-secondary" />
          <p className="text-sm text-light-secondary dark:text-dark-secondary">
            Nenhuma conta ainda.
          </p>
          <Link to="/contas/nova">
            <Button type="button" variant="secondary">
              Criar a primeira conta
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Link key={account.id} to={`/contas/${account.id}/editar`}>
              <Card className="transition-all duration-200 hover:border-brand-500">
                <p className="text-sm text-light-secondary dark:text-dark-secondary">
                  {ACCOUNT_TYPE_LABELS[account.type]}
                </p>
                <p className="mt-1 font-medium text-light-primary dark:text-dark-primary">
                  {account.name}
                </p>
                <p className="mt-3 text-xl font-semibold text-light-primary dark:text-dark-primary">
                  {formatBRL(account.balance)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
