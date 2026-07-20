import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useAccounts } from '../accounts/useAccounts'
import { useCaixinhas } from './useCaixinhas'
import { useCategories } from '../categories/useCategories'
import { getOrCreateCategoryByName } from '../categories/api'
import { registerCaixinhaYield } from './caixinhaTransfers'
import { caixinhaYieldSchema, type CaixinhaYieldFormData } from './schemas'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function CaixinhaYieldPage() {
  const navigate = useNavigate()
  const { accountId, caixinhaId } = useParams<{ accountId: string; caixinhaId: string }>()
  const user = useAuthStore((state) => state.user)
  const workspaceId = useWorkspaceStore((state) => state.workspaceId)

  const { accounts, loading: loadingAccounts } = useAccounts(workspaceId ?? '')
  const { caixinhas, loading: loadingCaixinhas } = useCaixinhas(workspaceId ?? '', accountId ?? '')
  const { categories } = useCategories(workspaceId ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  const account = accounts.find((a) => a.id === accountId)
  const caixinha = caixinhas.find((c) => c.id === caixinhaId)
  const loading = loadingAccounts || loadingCaixinhas

  const form = useForm<CaixinhaYieldFormData>({
    resolver: zodResolver(caixinhaYieldSchema),
    defaultValues: { amount: 0 },
  })

  if (!user || !workspaceId || !accountId || !caixinhaId) return null

  if (!loading && (!account || !caixinha)) {
    navigate(`/contas/${accountId ?? ''}`, { replace: true })
    return null
  }

  async function onSubmit(data: CaixinhaYieldFormData) {
    if (!user || !workspaceId || !account || !caixinha) return
    setFormError(null)
    try {
      const categoryId = await getOrCreateCategoryByName(
        workspaceId,
        categories,
        'Outro',
        'income',
        'more',
        '#F59E0B',
        user.uid,
      )
      await registerCaixinhaYield(
        workspaceId,
        account.id,
        caixinha.id,
        caixinha.name,
        data.amount,
        categoryId,
        user.uid,
      )
      navigate(`/contas/${account.id}`)
    } catch {
      setFormError('Não foi possível registrar o rendimento. Tente novamente.')
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
        Registrar rendimento — {caixinha.name}
      </h1>

      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Input
          label="Valor do rendimento"
          type="number"
          step="0.01"
          error={form.formState.errors.amount?.message}
          {...form.register('amount', { valueAsNumber: true })}
        />
        <p className="-mt-2 text-sm text-light-secondary dark:text-dark-secondary">
          Vira uma receita no extrato da conta e soma direto ao saldo desta caixinha.
        </p>

        {formError ? <p className="text-sm text-danger">{formError}</p> : null}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Salvando...' : 'Registrar'}
        </Button>
      </form>
    </div>
  )
}
