import { useState, useEffect } from 'react'
import { Outlet } from 'react-router'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'motion/react'
import { Menu } from 'lucide-react'
import { TbLayoutSidebarLeftCollapseFilled } from 'react-icons/tb'

import { connectSocket, onPresence } from '@/lib/socket'
import { UserAvatar } from '@/components/ui/avatar'
import { ThemeCycleButton } from '@/components/ThemeToggle'
import AdminSidebar from './AdminSidebar'

export default function AdminLayout() {
  const user = useSelector(s => s.auth.user)

  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    connectSocket()

    const cleanup = onPresence({
      adminUpdate: payload => {
        if (typeof payload?.onlineCount === 'number') {
          setOnlineCount(payload.onlineCount)
        }
      }
    })

    return () => {
      cleanup()
      // Keep the shared socket connected when leaving admin.
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-neutral-100 dark:bg-neutral-950">
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{
          width: {
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1]
          }
        }}
        className="sticky top-0 hidden h-screen shrink-0 overflow-hidden border-r border-neutral-200 bg-neutral-950 text-white md:block dark:border-neutral-800"
      >
        <AdminSidebar collapsed={collapsed} onlineCount={onlineCount} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-admin-drawer"
            className="fixed inset-0 z-50 md:hidden"
            initial="closed"
            animate="open"
            exit="closed"
            variants={{
              open: {
                transition: {
                  staggerChildren: 0.04
                }
              },
              closed: {
                transition: {
                  staggerChildren: 0.03,
                  staggerDirection: -1
                }
              }
            }}
          >
            {/* Background overlay */}
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 h-full w-full cursor-default bg-neutral-950/60 backdrop-blur-[3px]"
              variants={{
                closed: { opacity: 0 },
                open: { opacity: 1 }
              }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />

            {/* Sliding sidebar */}
            <motion.div
              className="absolute inset-y-0 left-0 z-10 w-72 max-w-[85vw] shadow-2xl shadow-black/30"
              variants={{
                closed: {
                  x: '-100%',
                  opacity: 0.7
                },
                open: {
                  x: 0,
                  opacity: 1
                }
              }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 32,
                mass: 0.8
              }}
            >
              <AdminSidebar
                mobile
                onlineCount={onlineCount}
                onClose={() => setOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white/90 px-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
          {/* Mobile menu button */}
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-neutral-100 md:hidden dark:hover:bg-neutral-800"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop collapse button */}
          <button
            type="button"
            className="hidden rounded-lg p-2 hover:bg-neutral-100 md:inline-flex dark:hover:bg-neutral-800"
            onClick={() => setCollapsed(current => !current)}
            aria-label="Toggle sidebar"
            aria-expanded={!collapsed}
          >
            <TbLayoutSidebarLeftCollapseFilled className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          <div className="flex-1" />

          <ThemeCycleButton />

          {/* Admin profile */}
          <div className="flex items-center gap-2 rounded-full border border-neutral-200 py-1 pl-1 pr-1 md:pr-3 dark:border-neutral-700">
            <UserAvatar user={user} className="h-8 w-8 object-cover" />

            <span className="hidden text-sm font-semibold sm:inline">
              {user?.name}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="relative isolate flex-1 overflow-hidden bg-gradient-to-br from-violet-50 via-white to-blue-50 p-4 sm:p-6 dark:from-neutral-950 dark:via-neutral-900 dark:to-indigo-950/40">
          {/* Decorative gradients */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />

            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  )
}
