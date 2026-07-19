import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Receipt } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useTransactions } from './useTransactions'
import { useAccounts } from '../accounts/useAccounts'
import { useCards } from '../cards/useCards'
import { useCategories } from '../categories/useCategories'
import { CATEGORY_ICON_COMPONENTS } from '../categories/types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { cn, formatBRL } from '../../lib/utils'

export function RegistrosPage() {
  const user = useAuthStore((state) => state.user)
  const { transactions, loading, error } = useTransactions(user?.uid ?? '')
  const { accounts } = useAccounts(user?.uid ?? '')
  const { cards } = useCards(user?.uid ?? '')
  const { categories } = useCategories(user?.uid ?? '')

  if (!user) return null

  const accountsById = new Map(accounts.map((account) => [account.id, account]))
  const cardsById = new Map(cards.map((card) => [card.id, card]))
  const categoriesById = new Map(categories.map((category) => [category.id, category]))

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
          Registros
        </h1>
        <Link to="/registros/novo">
          <Button type="button" className="gap-1.5">
            <Plus size={18} />
            Novo
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark-elevated"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-danger">
          Não foi possível carregar seus registros. Verifique sua conexão ou tente novamente mais
          tarde.
        </p>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-light py-16 text-center dark:border-border-dark">
          <Receipt size={32} className="text-light-secondary dark:text-dark-secondary" />
          <p className="text-sm text-light-secondary dark:text-dark-secondary">
            Nenhum registro ainda.
          </p>
          <Link to="/registros/novo">
            <Button type="button" variant="secondary">
              Criar o primeiro registro
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {transactions.map((transaction) => {
            const category = categoriesById.get(transaction.categoryId)
            const Icon = category ? CATEGORY_ICON_COMPONENTS[category.icon] : Receipt
            const linkedName =
              transaction.accountId !== undefined
                ? accountsById.get(transaction.accountId)?.name
                : transaction.cardId !== undefined
                  ? cardsById.get(transaction.cardId)?.name
                  : undefined
            const kind = transaction.type === 'expense' ? 'despesa' : 'receita'

            return (
              <Link key={transaction.id} to={`/registros/${kind}/${transaction.id}/editar`}>
                <Card className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: category?.color ?? '#6B7280' }}
                  >
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-light-primary dark:text-dark-primary">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-light-secondary dark:text-dark-secondary">
                      {format(new Date(`${transaction.date}T00:00:00`), "d 'de' MMM", { locale: ptBR })}
                      {linkedName ? ` · ${linkedName}` : ''}
                    </p>
                  </div>
                  <p
                    className={cn(
                      'shrink-0 font-semibold',
                      transaction.type === 'expense' ? 'text-danger' : 'text-brand-500',
                    )}
                  >
                    {transaction.type === 'expense' ? '-' : '+'}
                    {formatBRL(transaction.amount)}
                  </p>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
