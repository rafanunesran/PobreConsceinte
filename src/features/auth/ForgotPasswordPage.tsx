import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sendPasswordResetEmail } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { auth } from '../../lib/firebase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { mapAuthError } from './authErrors'
import { forgotPasswordSchema, type ForgotPasswordFormData } from './schemas'

export function ForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const form = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(data: ForgotPasswordFormData) {
    setFormError(null)
    try {
      await sendPasswordResetEmail(auth, data.email)
      setSent(true)
    } catch (error) {
      // Não revela se o e-mail existe ou não — mesma mensagem de sucesso
      // pra ambos, só erros de fato (rede, muitas tentativas) viram erro.
      if (error instanceof FirebaseError && error.code === 'auth/user-not-found') {
        setSent(true)
        return
      }
      setFormError(mapAuthError(error))
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-bg-light p-6 dark:bg-bg-dark">
      <div className="w-full max-w-sm rounded-2xl border border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-gradient-to-b dark:from-surface-dark dark:to-surface-dark-elevated">
        <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
          Recuperar senha
        </h1>
        <p className="mt-1 text-sm text-light-secondary dark:text-dark-secondary">
          {sent
            ? 'Verifique seu e-mail.'
            : 'Informe seu e-mail e enviamos um link pra redefinir a senha.'}
        </p>

        {sent ? (
          <p className="mt-6 text-sm text-light-primary dark:text-dark-primary">
            Se esse e-mail tiver uma conta, você vai receber um link de redefinição em instantes.
          </p>
        ) : (
          <form className="mt-6 flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              error={form.formState.errors.email?.message}
              {...form.register('email')}
            />
            {formError ? <p className="text-sm text-danger">{formError}</p> : null}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Enviando...' : 'Enviar link'}
            </Button>
          </form>
        )}

        <Link
          to="/login"
          className="mt-6 block w-full text-center text-sm text-light-secondary transition-colors duration-200 hover:text-brand-500 dark:text-dark-secondary"
        >
          Voltar para login
        </Link>
      </div>
    </main>
  )
}
