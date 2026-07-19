import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { FAB } from './FAB'

// NOTE: abaixo de `lg`, comportamento igual ao original (coluna única de
// 480px, bottom nav). Em `lg+`, a Sidebar substitui a bottom nav e a coluna
// de conteúdo cresce (com um teto pra não esticar demais em telas ultra-wide).
export function AppShell() {
  return (
    <div className="min-h-svh bg-bg-light dark:bg-bg-dark lg:flex">
      <Sidebar />
      <div className="flex w-full justify-center lg:flex-1">
        <div className="flex w-full max-w-[480px] flex-col lg:max-w-5xl">
          <Header />
          <main className="flex-1 pb-28 lg:pb-8">
            <Outlet />
          </main>
        </div>
      </div>
      <FAB />
      <BottomNav />
    </div>
  )
}
