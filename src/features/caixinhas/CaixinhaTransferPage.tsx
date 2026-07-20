import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../../stores/authStore'
import { useAccounts } from '../accounts/useAccounts'
import { useCaixinhas } from './useCaixinhas'
import { depositToCaixinha, withdrawFromCaixinha } from './caixinhaTransfers'
import { caixinhaTransferSchema, type CaixinhaTransferFormData } from './schemas'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { formatBRL } from '../../lib/utils'

export function CaixinhaTransferPage() {
  const navigate = useNavigate()
  const { accountId, caixinhaId } = useParams<{ accountId: string; caixinhaId: string }>()
  const [searchParams] = useSearchParams()
  const direction = searchParams.get('direction') === 'resgatar' ? 'resgatar' : 'guardar'
  const user = useAuthStore((state) => state.user)

  const { accounts, loading: loadingAccounts } = useAccounts(user?.uid ?? '')
  const { caixinhas, loading: loadingCaixinhas } = useCaixinhas(user?.uid ?? '', accountId ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  const account = accounts.find((a) => a.id === accountId)
  const caixinha = caixinhas.find((c) => c.id === caixinhaId)
  const loading = loadingAccounts || loadingCaixinhas

  const teto = direction === 'guardar' ? (account?.balance ?? 0) : (caixinha?.balance ?? 0)

  const form = useForm<CaixinhaTransferFormData>({
    resolver: zodResolver(caixinhaTransferSchema),
    defaultValues: { amount: 0 },
  })

  if (!user || !accountId || !caixinhaId) return null

  if (!loading && (!account || !caixinha)) {
    navigate(`/contas/${accountId ?? ''}`, { replace: true })
    return null
  }

  async function onSubmit(data: CaixinhaTransferFormData) {
    if (!user || !account || !caixinha) return
    setFormError(null)
    if (data.amount > teto) {
      setFormError(
        direction === 'guardar'
          ? 'O valor não pode ser maior que o saldo da conta.'
          : 'O valor não pode ser maior que o saldo da caixinha.',
      )
      return
    }
    try {
      if (direction === 'guardar') {
        await depositToCaixinha(user.uid, account.id, caixinha.id, data.amount)
      } else {
        await withdrawFromCaixinha(user.uid, account.id, caixinha.id, data.amount)
      }
      navigate(`/contas/${account.id}`)
    } catch {
      setFormError('Não foi possível concluir a operação. Tente novamente.')
    }
  }

  if (loading || !account || !caixinha) {
    return (
      <div className="px-6 pt-4 text-sm text-light-secondary dark:text-dark-secondary">
        Carregando...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
        {direction === 'guardar' ? 'Guardar' : 'Resgatar'} — {caixinha.name}
      </h1>

      <p className="text-sm text-light-secondary dark:text-dark-secondary">
        {direction === 'guardar'
          ? `Saldo disponível na conta: ${formatBRL(account.balance)}`
          : `Saldo disponível na caixinha: ${formatBRL(caixinha.balance)}`}
      </p>

      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Input
          label="Valor"
          type="number"
          step="0.01"
          error={form.formState.errors.amount?.message}
          {...form.register('amount', { valueAsNumber: true })}
        />

        {formError ? <p className="text-sm text-danger">{formError}</p> : null}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Salvando...' : direction === 'guardar' ? 'Guardar' : 'Resgatar'}
        </Button>
      </form>
    </div>
  )
}
