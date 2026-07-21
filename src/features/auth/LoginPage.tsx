import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { mapAuthError } from './authErrors'
import {
  loginSchema,
  signUpSchema,
  type LoginFormData,
  type SignUpFormData,
} from './schemas'

type Mode = 'login' | 'signup'

const googleProvider = new GoogleAuthProvider()

export function LoginPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [mode, setMode] = useState<Mode>('login')
  const [formError, setFormError] = useState<string | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // NOTE: signInWithPopup/signInWithEmailAndPassword só atualizam o estado
  // global (via onAuthStateChanged, em authStore.ts) — não navegam sozinhos.
  // É esse efeito que tira o usuário da tela de login assim que `user` deixa
  // de ser null, cobrindo os três fluxos (Google, login e cadastro) de uma vez.
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const loginForm = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })
  const signUpForm = useForm<SignUpFormData>({ resolver: zodResolver(signUpSchema) })

  async function handleGoogleLogin() {
    setFormError(null)
    setIsGoogleLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      setFormError(mapAuthError(error))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  async function onLoginSubmit(data: LoginFormData) {
    setFormError(null)
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password)
    } catch (error) {
      setFormError(mapAuthError(error))
    }
  }

  async function onSignUpSubmit(data: SignUpFormData) {
    setFormError(null)
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password)
    } catch (error) {
      setFormError(mapAuthError(error))
    }
  }

  function toggleMode() {
    setFormError(null)
    setMode((current) => (current === 'login' ? 'signup' : 'login'))
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-bg-light p-6 dark:bg-bg-dark">
      <div className="w-full max-w-sm rounded-2xl border border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-gradient-to-b dark:from-surface-dark dark:to-surface-dark-elevated">
        <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
          {mode === 'login' ? 'Entrar' : 'Criar conta'}
        </h1>
        <p className="mt-1 text-sm text-light-secondary dark:text-dark-secondary">
          {mode === 'login' ? 'Acesse suas finanças.' : 'Leva menos de um minuto.'}
        </p>

        <Button
          type="button"
          variant="secondary"
          className="mt-6 w-full"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? 'Conectando...' : 'Continuar com Google'}
        </Button>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border-light dark:bg-border-dark" />
          <span className="text-sm text-light-secondary dark:text-dark-secondary">ou</span>
          <span className="h-px flex-1 bg-border-light dark:bg-border-dark" />
        </div>

        {mode === 'login' ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={loginForm.handleSubmit(onLoginSubmit)}
            noValidate
          >
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              error={loginForm.formState.errors.email?.message}
              {...loginForm.register('email')}
            />
            <Input
              label="Senha"
              type="password"
              autoComplete="current-password"
              error={loginForm.formState.errors.password?.message}
              {...loginForm.register('password')}
            />
            <Link
              to="/esqueci-senha"
              className="-mt-2 self-end text-sm text-light-secondary transition-colors duration-200 hover:text-brand-500 dark:text-dark-secondary"
            >
              Esqueci minha senha
            </Link>
            {formError ? <p className="text-sm text-danger">{formError}</p> : null}
            <Button type="submit" disabled={loginForm.formState.isSubmitting}>
              {loginForm.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={signUpForm.handleSubmit(onSignUpSubmit)}
            noValidate
          >
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              error={signUpForm.formState.errors.email?.message}
              {...signUpForm.register('email')}
            />
            <Input
              label="Senha"
              type="password"
              autoComplete="new-password"
              error={signUpForm.formState.errors.password?.message}
              {...signUpForm.register('password')}
            />
            <Input
              label="Confirmar senha"
              type="password"
              autoComplete="new-password"
              error={signUpForm.formState.errors.confirmPassword?.message}
              {...signUpForm.register('confirmPassword')}
            />
            {formError ? <p className="text-sm text-danger">{formError}</p> : null}
            <Button type="submit" disabled={signUpForm.formState.isSubmitting}>
              {signUpForm.formState.isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>
        )}

        <button
          type="button"
          className="mt-6 w-full text-center text-sm text-light-secondary transition-colors duration-200 hover:text-brand-500 dark:text-dark-secondary"
          onClick={toggleMode}
        >
          {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </main>
  )
}
