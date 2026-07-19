import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, CheckCircle2, CircleDashed } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useTransactions } from './useTransactions'
import { useCategories } from '../categories/useCategories'
import { CATEGORY_ICON_COMPONENTS } from '../categories/types'
import { updateTransaction } from './api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { formatBRL } from '../../lib/utils'
import type { Transaction } from './types'

export function PendingTransactionsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { transactions, loading, error } = useTransactions(user?.uid ?? '')
  const { categories } = useCategories(user?.uid ?? '')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  if (!user) return null

  const categoriesById = new Map(categories.map((category) => [category.id, category]))
  const pending = transactions.filter((transaction) => !transaction.paid)

  async function handleConfirm(transaction: Transaction) {
    setConfirmingId(transaction.id)
    try {
      const { id, ...data } = transaction
      void id
      await updateTransaction(user!.uid, transaction.id, { ...data, paid: true })
    } catch {
      // silencioso — a linha continua pendente e o usuário pode tentar de novo
    } finally {
      setConfirmingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border-light text-light-secondary transition-colors duration-200 hover:text-light-primary dark:border-border-dark dark:text-dark-secondary dark:hover:text-dark-primary"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
          Pagamentos pendentes
        </h1>
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
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-light py-16 text-center dark:border-border-dark">
          <CheckCircle2 size={32} className="text-light-secondary dark:text-dark-secondary" />
          <p className="text-sm text-light-secondary dark:text-dark-secondary">
            Nenhum pagamento ou recebimento pendente.
          </p>
          <Link to="/registros">
            <Button type="button" variant="secondary">
              Ver todos os registros
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((transaction) => {
            const category = categoriesById.get(transaction.categoryId)
            const Icon = category ? CATEGORY_ICON_COMPONENTS[category.icon] : CircleDashed

            return (
              <Card key={transaction.id} className="flex items-center gap-3">
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
                    {' · '}
                    {transaction.type === 'expense' ? '-' : '+'}
                    {formatBRL(transaction.amount)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  disabled={confirmingId === transaction.id}
                  onClick={() => handleConfirm(transaction)}
                >
                  {confirmingId === transaction.id
                    ? 'Salvando...'
                    : transaction.type === 'expense'
                      ? 'Marcar como pago'
                      : 'Marcar como recebido'}
                </Button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
