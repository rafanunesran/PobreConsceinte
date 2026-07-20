import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { CARD_BRAND_LABELS, type CreditCard } from './types'
import { Card } from '../../components/ui/Card'
import { formatBRL } from '../../lib/utils'

interface CardTileProps {
  card: CreditCard
  occupied: number
  available: number
}

export function CardTile({ card, occupied, available }: CardTileProps) {
  return (
    <div className="relative">
      <Link
        to={`/cartoes/${card.id}/editar`}
        aria-label="Editar cartão"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-light-secondary transition-colors duration-200 hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary"
      >
        <Settings size={16} />
      </Link>
      <Link to={`/cartoes/${card.id}/fatura`} className="block">
        <Card className="transition-all duration-200 hover:border-brand-500">
          <p className="text-sm text-light-secondary dark:text-dark-secondary">
            {CARD_BRAND_LABELS[card.brand]}
          </p>
          <p className="mt-1 pr-8 font-medium text-light-primary dark:text-dark-primary">
            {card.name}
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="min-w-0">
              <p className="text-light-secondary dark:text-dark-secondary">Limite</p>
              <p className="truncate font-semibold text-light-primary dark:text-dark-primary">
                {formatBRL(card.limit)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-light-secondary dark:text-dark-secondary">Ocupado</p>
              <p className="truncate font-semibold text-danger">{formatBRL(occupied)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-light-secondary dark:text-dark-secondary">Disponível</p>
              <p className="truncate font-semibold text-brand-500">{formatBRL(available)}</p>
            </div>
          </div>

          <p className="mt-3 text-sm text-light-secondary dark:text-dark-secondary">
            Fecha dia {card.closingDay}, vence dia {card.dueDay}
          </p>
        </Card>
      </Link>
    </div>
  )
}
