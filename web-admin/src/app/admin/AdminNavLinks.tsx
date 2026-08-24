'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Paneli Qendror' },
  { href: '/admin/zonat', label: 'Menaxhimi i Zonave' },
  { href: '/admin/stafi', label: 'Stafi & Rolet' },
  { href: '/admin/audit-logs', label: 'Audit Logs' },
]

export default function AdminNavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
      {navItems.map((item) => {
        // Logjika inteligjente e Active State:
        // Për '/admin' (Paneli Qendror) kërkojmë përputhje ekzakte që të mos mbetet i ndezur gjithmonë.
        // Për të tjerat përdorim .startsWith() në rast se ka faqe të fëmijëve (psh: /admin/stafi/edit).
        const isActive = item.href === '/admin' 
          ? pathname === '/admin' 
          : pathname?.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
              isActive
                ? 'bg-slate-800 text-white font-semibold shadow-sm ring-1 ring-slate-700' // HIJËZIMI I DALLUESHËM KUR ËSHTË AKTIV
                : 'text-slate-400 font-medium hover:text-white hover:bg-slate-800/50' // HOVER I BUTË PËR LINKET E TJERA
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}