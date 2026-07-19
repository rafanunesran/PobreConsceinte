// NOTE: placeholder temporário só para validar o setup do Tailwind/tema.
// Será substituído pelo router + AppShell no Checkpoint 3.
function App() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <div className="rounded-2xl border border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark">
        <h1 className="text-xl font-semibold">Checkpoint 1 — Fundação</h1>
        <p className="mt-2 text-sm text-light-secondary dark:text-dark-secondary">
          Vite + React 19 + TS + Tailwind v4 configurados.
        </p>
        <button
          type="button"
          className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-[0_0_20px_var(--color-brand-glow)]"
        >
          Botão de teste (brand-500)
        </button>
      </div>
    </main>
  )
}

export default App
