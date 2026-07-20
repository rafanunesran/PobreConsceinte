import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useCaixinhas } from './useCaixinhas'
import { adjustCaixinhaBalance } from './api'
import { caixinhaAdjustSchema, type CaixinhaAdjustFormData } from './schemas'
import { roundToCents } from '../transactions/dateUtils'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { formatBRL } from '../../lib/utils'

export function CaixinhaAdjustPage() {
  const navigate = useNavigate()
  const { accountId, caixinhaId } = useParams<{ accountId: string; caixinhaId: string }>()
  const user = useAuthStore((state) => state.user)
  const workspaceId = useWorkspaceStore((state) => state.workspaceId)

  const { caixinhas, loading } = useCaixinhas(workspaceId ?? '', accountId ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  const caixinha = caixinhas.find((c) => c.id === caixinhaId)

  const form = useForm<CaixinhaAdjustFormData>({
    resolver: zodResolver(caixinhaAdjustSchema),
    defaultValues: { realBalance: 0 },
  })
  const realBalance = form.watch('realBalance')
  const diff = useMemo(
    () => roundToCents((realBalance || 0) - (caixinha?.balance ?? 0)),
    [realBalance, caixinha],
  )

  if (!user || !workspaceId || !accountId || !caixinhaId) return null

  if (!loading && !caixinha) {
    navigate(`/contas/${accountId}`, { replace: true })
    return null
  }

  async function onSubmit(data: CaixinhaAdjustFormData) {
    if (!user || !workspaceId || !caixinhaId || !caixinha) return
    setFormError(null)
    const diff = roundToCents(data.realBalance - caixinha.balance)
    try {
      await adjustCaixinhaBalance(workspaceId, caixinhaId, data.realBalance, diff, user.uid)
      navigate(`/contas/${accountId}`)
    } catch {
      setFormError('Não foi possível ajustar o saldo. Tente novamente.')
    }
  }

  if (loading || !caixinha) {
    return (
      <div className="px-6 pt-4 text-sm text-light-secondary dark:text-dark-secondary">
        Carregando...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
        Ajuste de saldo — {caixinha.name}
      </h1>

      <p className="text-sm text-light-secondary dark:text-dark-secondary">
        Saldo atual: <span className="font-semibold">{formatBRL(caixinha.balance)}</span>
      </p>

      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Input
          label="Saldo real da caixinha"
          type="number"
          step="0.01"
          error={form.formState.errors.realBalance?.message}
          {...form.register('realBalance', { valueAsNumber: true })}
        />
        <p className="-mt-2 text-sm text-light-secondary dark:text-dark-secondary">
          {diff !== 0
            ? 'Só corrige o saldo desta caixinha — não cria nenhuma transação nem mexe no saldo da conta.'
            : 'Sem diferença — nada muda.'}
        </p>

        {formError ? <p className="text-sm text-danger">{formError}</p> : null}

        <Button type="submit" disabled={form.formState.isSubmitting || diff === 0}>
          {form.formState.isSubmitting ? 'Salvando...' : 'Ajustar saldo'}
        </Button>
      </form>
    </div>
  )
}
