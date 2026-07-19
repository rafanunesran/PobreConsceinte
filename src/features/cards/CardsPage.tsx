import { Link } from 'react-router-dom'
import { CreditCard as CreditCardIcon, Plus } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCards } from './useCards'
import { CARD_BRAND_LABELS } from './types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { formatBRL } from '../../lib/utils'

export function CardsPage() {
  const user = useAuthStore((state) => state.user)
  // NOTE: hooks não podem ser condicionais — chama useCards sempre, com uid
  // vazio se `user` ainda não resolveu, e só corta a renderização depois.
  const { cards, loading, error } = useCards(user?.uid ?? '')

  // Só renderiza atrás de <ProtectedRoute>, `user` nunca deveria ser null
  // aqui de verdade — o guard é só pro TS não reclamar.
  if (!user) return null

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
          Cartões
        </h1>
        <Link to="/cartoes/novo">
          <Button type="button" className="gap-1.5">
            <Plus size={18} />
            Novo cartão
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark-elevated"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-danger">
          Não foi possível carregar seus cartões. Verifique sua conexão ou tente novamente mais
          tarde.
        </p>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-light py-16 text-center dark:border-border-dark">
          <CreditCardIcon size={32} className="text-light-secondary dark:text-dark-secondary" />
          <p className="text-sm text-light-secondary dark:text-dark-secondary">
            Nenhum cartão ainda.
          </p>
          <Link to="/cartoes/novo">
            <Button type="button" variant="secondary">
              Adicionar o primeiro cartão
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.id} to={`/cartoes/${card.id}/editar`}>
              <Card className="transition-all duration-200 hover:border-brand-500">
                <p className="text-sm text-light-secondary dark:text-dark-secondary">
                  {CARD_BRAND_LABELS[card.brand]}
                </p>
                <p className="mt-1 font-medium text-light-primary dark:text-dark-primary">
                  {card.name}
                </p>
                <p className="mt-3 text-xl font-semibold text-light-primary dark:text-dark-primary">
                  {formatBRL(card.limit)}
                </p>
                <p className="mt-1 text-sm text-light-secondary dark:text-dark-secondary">
                  Fecha dia {card.closingDay}, vence dia {card.dueDay}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
