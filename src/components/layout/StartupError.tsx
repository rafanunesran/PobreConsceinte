// NOTE: não importa nada de firebase/router/stores — se o boot falhou,
// esse componente precisa continuar de pé mesmo que o resto do app não suba.
interface StartupErrorProps {
  error: unknown
}

export function StartupError({ error }: StartupErrorProps) {
  const message = error instanceof Error ? error.message : 'Erro desconhecido.'

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-bg-light p-6 text-center dark:bg-bg-dark">
      <div className="w-full max-w-sm rounded-2xl border border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark">
        <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
          Não foi possível iniciar o app
        </h1>
        <p className="mt-3 text-sm text-light-secondary dark:text-dark-secondary">{message}</p>
      </div>
    </main>
  )
}
