'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MapPinned, ShoppingBag, Settings2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { haptics } from '@/lib/haptics'

const navItems = [
  { icon: LayoutDashboard, label: 'Timeline', path: '/' },
  { icon: MapPinned,       label: 'Passport', path: '/profile' },
  { icon: ShoppingBag,     label: 'Market',   path: '/marketplace' },
  { icon: Settings2,       label: 'Settings', path: '/settings' },
]

export function BottomNav() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin') || pathname.startsWith('/demo')) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-bg md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around px-2 pt-2 pb-3">
        {navItems.map((item) => {
          const isActive =
            item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)

          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => haptics.light()}
              className="relative flex min-h-[3.25rem] min-w-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl active:bg-surface"
            >
              {/* Animated active dot */}
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute top-0.5 h-1 w-1 rounded-full bg-accent shadow-[0_0_6px_var(--color-accent)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon with tap spring */}
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`rounded-xl p-1.5 transition-colors ${
                  isActive ? 'text-accent' : 'text-text-muted'
                }`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>

              <span
                className={`text-[10px] font-bold uppercase tracking-wide ${
                  isActive ? 'text-accent' : 'text-text-muted'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
