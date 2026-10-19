import { NavLink, Link } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  FileText,
  Settings,
  X,
  Shield,
  ChevronLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/posts', label: 'Posts', icon: FileText },
  { to: '/admin/settings', label: 'Settings', icon: Settings }
]

export default function AdminSidebar({
  mobile = false,
  collapsed = false,
  onlineCount = 0,
  onClose
}) {
  const isExpanded = mobile || !collapsed

  return (
    <motion.aside
      initial={false}
      animate={{ width: mobile ? 288 : collapsed ? 72 : 256 }}
      transition={{
        width: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
      }}
      className={cn(
        'relative flex h-full flex-col overflow-hidden border-r border-white/10 text-white',
        'bg-gradient-to-b from-[#17102f] via-[#17152f] to-[#0b1224]',
        'shadow-xl shadow-violet-950/10',
        mobile ? 'w-72' : ''
      )}
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -right-20 top-1/3 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Brand */}
      <div className="relative flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <motion.div
          whileHover={{ rotate: 8, scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-blue-500 shadow-lg shadow-violet-500/25"
        >
          <Shield className="h-5 w-5 text-white" />
        </motion.div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="brand-title"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="min-w-0 flex-1 whitespace-nowrap"
            >
              <p className="bg-gradient-to-r from-white via-violet-100 to-fuchsia-200 bg-clip-text text-sm font-extrabold tracking-tight text-transparent">
                MiniBook Admin
              </p>
              <p className="mt-0.5 text-[10px] font-medium tracking-[0.18em] text-violet-300/70">
                CONTROL CENTER
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {mobile && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto rounded-lg p-2 text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </motion.button>
        )}
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden p-3">
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.p
              key="nav-heading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="mb-3 px-3 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500"
            >
              Workspace
            </motion.p>
          )}
        </AnimatePresence>

        {NAV.map(({ to, end, label, icon: Icon }, index) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => mobile && onClose?.()}
            title={collapsed && !mobile ? label : undefined}
            className="group relative block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            {({ isActive }) => (
              <motion.div
                initial={false}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  'relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5',
                  'text-sm font-medium',
                  isActive
                    ? 'text-white'
                    : 'text-neutral-400 hover:bg-white/[0.06] hover:text-white'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId={
                      mobile ? 'mobile-admin-active' : 'desktop-admin-active'
                    }
                    className="absolute inset-0 rounded-xl border border-white/10 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 shadow-lg shadow-violet-950/30"
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 30
                    }}
                  />
                )}

                {isActive && (
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                )}

                <motion.span
                  animate={{
                    scale: isActive ? 1.05 : 1,
                    color: isActive ? '#ffffff' : '#a3a3a3'
                  }}
                  transition={{ duration: 0.2 }}
                  className="relative z-10 flex shrink-0 items-center justify-center"
                >
                  <Icon className="h-5 w-5" />
                </motion.span>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.span
                      key={`label-${label}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{
                        duration: 0.2,
                        delay: isActive ? 0.03 : index * 0.015
                      }}
                      className="relative z-10 flex-1 whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {isActive && isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 h-1.5 w-1.5 shrink-0 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="relative shrink-0 border-t border-white/10 p-3">
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="presence"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
              className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.06] px-3 py-2.5"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-300">
                  {onlineCount > 0
                    ? `${onlineCount} online now`
                    : 'Presence live'}
                </p>
                <p className="mt-0.5 text-[10px] text-neutral-500">
                  Community status
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Link
          to="/"
          onClick={() => mobile && onClose?.()}
          title={collapsed && !mobile ? 'Back to app' : undefined}
          className="group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-400 transition-colors duration-200 hover:bg-white/[0.07] hover:text-white"
        >
          <motion.span whileHover={{ x: -3 }} className="shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </motion.span>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.span
                key="back-label"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap"
              >
                Back to app
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </motion.aside>
  )
}
