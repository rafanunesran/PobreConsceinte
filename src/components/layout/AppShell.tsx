import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { FAB } from './FAB'

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[480px] flex-col bg-bg-light dark:bg-bg-dark">
      <Header />
      <main className="flex-1 pb-28">
        <Outlet />
      </main>
      <FAB />
      <BottomNav />
    </div>
  )
}
