import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { caixinhaSchema, type CaixinhaFormData } from './schemas'
import { createCaixinha, getCaixinha, updateCaixinha } from './api'
import { closeCaixinha } from './caixinhaTransfers'

export function CaixinhaFormPage() {
  const navigate = useNavigate()
  const { accountId, caixinhaId } = useParams<{ accountId: string; caixinhaId?: string }>()
  const isEditMode = Boolean(caixinhaId)
  const user = useAuthStore((state) => state.user)

  const [formError, setFormError] = useState<string | null>(null)
  const [isLoadingCaixinha, setIsLoadingCaixinha] = useState(isEditMode)
  const [loadError, setLoadError] = useState(false)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const form = useForm<CaixinhaFormData>({
    resolver: zodResolver(caixinhaSchema),
    defaultValues: { name: '', yieldLabel: '' },
  })

  useEffect(() => {
    if (!user || !caixinhaId) return
    let cancelled = false
    getCaixinha(user.uid, caixinhaId)
      .then((caixinha) => {
        if (cancelled) return
        if (!caixinha || !accountId) {
          navigate(`/contas/${accountId ?? ''}`, { replace: true })
          return
        }
        form.reset({ name: caixinha.name, yieldLabel: caixinha.yieldLabel ?? '' })
        setIsLoadingCaixinha(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoadError(true)
        setIsLoadingCaixinha(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, caixinhaId, accountId, form, navigate])

  if (!user || !accountId) return null

  async function onSubmit(data: CaixinhaFormData) {
    if (!user || !accountId) return
    setFormError(null)
    try {
      if (caixinhaId) {
        await updateCaixinha(user.uid, caixinhaId, data)
      } else {
        await createCaixinha(user.uid, accountId, data)
      }
      navigate(`/contas/${accountId}`)
    } catch {
      setFormError('Não foi possível salvar a caixinha. Tente novamente.')
    }
  }

  async function handleClose() {
    if (!user || !caixinhaId || !accountId) return
    setIsClosing(true)
    try {
      await closeCaixinha(user.uid, accountId, caixinhaId)
      navigate(`/contas/${accountId}`)
    } catch {
      setFormError('Não foi possível encerrar a caixinha. Tente novamente.')
      setIsClosing(false)
    }
  }

  if (isEditMode && isLoadingCaixinha) {
    return (
      <div className="px-6 pt-4 text-sm text-light-secondary dark:text-dark-secondary">
        Carregando...
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-3 px-6 pt-4">
        <p className="text-sm text-danger">
          Não foi possível carregar essa caixinha. Verifique sua conexão ou tente novamente mais
          tarde.
        </p>
        <Button type="button" variant="secondary" onClick={() => navigate(`/contas/${accountId}`)}>
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
        {isEditMode ? 'Editar caixinha' : 'Nova caixinha'}
      </h1>

      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Input
          label="Nome"
          placeholder="Ex: Reserva de emergência"
          error={form.formState.errors.name?.message}
          {...form.register('name')}
        />
        <Input
          label="Rendimento (opcional)"
          placeholder="Ex: 110% do CDI"
          error={form.formState.errors.yieldLabel?.message}
          {...form.register('yieldLabel')}
        />

        {formError ? <p className="text-sm text-danger">{formError}</p> : null}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>

      {isEditMode ? (
        <div className="border-t border-border-light pt-4 dark:border-border-dark">
          {confirmingClose ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-light-secondary dark:text-dark-secondary">
                O saldo restante volta pra conta. Essa ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setConfirmingClose(false)}
                  disabled={isClosing}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-danger hover:bg-danger hover:shadow-none"
                  onClick={handleClose}
                  disabled={isClosing}
                >
                  {isClosing ? 'Encerrando...' : 'Confirmar encerramento'}
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setConfirmingClose(true)}>
              Encerrar caixinha
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
