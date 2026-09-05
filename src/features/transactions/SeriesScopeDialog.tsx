import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { cn } from '../../lib/utils'
import type { SeriesKind, SeriesScope } from './series'
import type { TransactionType } from './types'

interface SeriesScopeDialogProps {
  action: 'edit' | 'delete'
  kind: SeriesKind
  type: TransactionType
  pendingCount: number
  totalCount: number
  busy: boolean
  error: string | null
  onCancel: () => void
  onConfirm: (scope: SeriesScope) => void
}

// Pergunta o alcance da edição/exclusão de um lançamento que faz parte de
// uma série (fixa ou parcelada) — sem isso, mexer numa parcela ou num mês
// da recorrência é ambíguo: só ele, a série toda, ou o que ainda está por
// vir?
export function SeriesScopeDialog({
  action,
  kind,
  type,
  pendingCount,
  totalCount,
  busy,
  error,
  onCancel,
  onConfirm,
}: SeriesScopeDialogProps) {
  const [scope, setScope] = useState<SeriesScope>('one')

  const isDelete = action === 'delete'
  const seriesLabel = kind === 'recurring' ? 'lançamento fixo' : 'parcelamento'
  const settledLabel = type === 'income' ? 'recebidos' : 'pagos'
  const verb = isDelete ? 'excluir' : 'alterar'

  const options: { value: SeriesScope; label: string; hint: string }[] = [
    {
      value: 'one',
      label: 'Somente este',
      hint: `${isDelete ? 'Exclui' : 'Altera'} apenas este lançamento; o resto da série fica como está.`,
    },
    {
      value: 'pending',
      label: 'Todos os pendentes',
      hint: `Este e os que ainda não foram ${settledLabel} (${pendingCount}).`,
    },
    {
      value: 'all',
      label: 'Todos',
      hint: `A série inteira, incluindo os já ${settledLabel} (${totalCount}).`,
    },
  ]

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <button
        type="button"
        aria-label="Cancelar"
        className="absolute inset-0 cursor-default"
        onClick={busy ? undefined : onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`O que ${verb}?`}
        className="relative flex w-full max-w-md flex-col gap-4 rounded-t-2xl border border-border-light bg-surface-light p-6 sm:rounded-2xl dark:border-border-dark dark:bg-surface-dark-elevated"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-light-primary dark:text-dark-primary">
            O que {verb}?
          </h2>
          <p className="text-sm text-light-secondary dark:text-dark-secondary">
            Este registro faz parte de um {seriesLabel}.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={scope === option.value}
              onClick={() => setScope(option.value)}
              className={cn(
                'flex flex-col gap-0.5 rounded-xl border px-4 py-3 text-left transition-all duration-200',
                scope === option.value
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-border-light dark:border-border-dark',
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  scope === option.value
                    ? 'text-brand-500'
                    : 'text-light-primary dark:text-dark-primary',
                )}
              >
                {option.label}
              </span>
              <span className="text-xs text-light-secondary dark:text-dark-secondary">
                {option.hint}
              </span>
            </button>
          ))}
        </div>

        {kind === 'recurring' && isDelete && scope !== 'one' ? (
          <p className="text-xs text-light-secondary dark:text-dark-secondary">
            Isso também encerra a recorrência — nenhum lançamento novo será gerado.
          </p>
        ) : null}

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
            disabled={busy}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className={cn('flex-1', isDelete && 'bg-danger hover:bg-danger hover:shadow-none')}
            onClick={() => onConfirm(scope)}
            disabled={busy}
          >
            {busy ? (isDelete ? 'Excluindo...' : 'Salvando...') : isDelete ? 'Excluir' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
