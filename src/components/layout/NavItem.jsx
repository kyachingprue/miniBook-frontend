import { NavLink } from 'react-router'
import { useSelector } from 'react-redux'
import { cn } from '@/lib/utils'

export default function NavItem({ item, onClick }) {
  const user = useSelector(s => s.auth.user)
  if (
    item.adminOnly &&
    !['admin', 'administrator'].includes(String(user?.role || '').toLowerCase())
  )
    return null

  const Icon = item.icon
  const textOnly = item.textOnly || !Icon

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-semibold transition-colors',
          isActive
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-400'
            : 'text-black hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800'
        )
      }
    >
      {!textOnly && Icon && <Icon className="h-5 w-5" />}
      {item.label}
    </NavLink>
  )
}
