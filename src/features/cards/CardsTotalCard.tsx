import { Card } from '../../components/ui/Card'
import { formatBRL } from '../../lib/utils'

interface CardsTotalCardProps {
  totalLimit: number
  totalOccupied: number
  totalAvailable: number
}

export function CardsTotalCard({ totalLimit, totalOccupied, totalAvailable }: CardsTotalCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm font-medium text-light-primary dark:text-dark-primary">
        Total dos cartões
      </p>
      <div>
        <p className="text-light-secondary dark:text-dark-secondary text-sm">Limite</p>
        <p className="text-lg font-semibold text-light-primary dark:text-dark-primary">
          {formatBRL(totalLimit)}
        </p>
      </div>
      <div>
        <p className="text-light-secondary dark:text-dark-secondary text-sm">Ocupado</p>
        <p className="text-lg font-semibold text-danger">{formatBRL(totalOccupied)}</p>
      </div>
      <div className="border-t border-border-light pt-3 dark:border-border-dark">
        <p className="text-light-secondary dark:text-dark-secondary text-sm">Disponível</p>
        <p className="text-lg font-semibold text-brand-500">{formatBRL(totalAvailable)}</p>
      </div>
    </Card>
  )
}
