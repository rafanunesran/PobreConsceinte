import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { navItems } from './navItems'

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex h-[72px] w-full max-w-[480px] items-center justify-around border-t border-border-light bg-surface-light/80 backdrop-blur-xl dark:border-border-dark dark:bg-surface-dark/80 lg:hidden">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 text-light-secondary transition-colors duration-200 dark:text-dark-secondary',
              isActive && 'text-brand-500 dark:text-brand-400',
            )
          }
        >
          <Icon size={24} />
          <span className="text-sm">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
