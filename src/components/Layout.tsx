import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import Logo from './Logo'
import { useSettings } from '../config/SettingsContext'
import { daysUntil } from '../lib/utils'

const navItems = [
  { to: '/', label: '面板', end: true },
  { to: '/schools', label: '院校库' },
  { to: '/syllabus', label: '考纲笔记' },
  { to: '/practice', label: '刷题' },
  { to: '/data', label: '数据' },
  { to: '/settings', label: '⚙️ 设置' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const left = daysUntil(settings.examDate)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-panel2/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5" aria-label="跨过406 首页">
            <Logo size={34} />
            <span className="text-lg font-bold tracking-tight text-ink">
              跨过<span className="num text-amber">406</span>
            </span>
            <span className="ml-1 hidden text-[13px] text-muted lg:inline">管理学1联考 · 个人备考控制台</span>
          </NavLink>

          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 sm:flex">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">D-</span>
              <span className="num text-sm font-bold text-teal">{left}</span>
            </span>
            <nav className="flex items-center gap-1.5 sm:gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-xl px-3.5 py-2.5 text-[16px] font-semibold transition-all sm:px-4 sm:text-[17px] ${
                      isActive ? 'bg-roseSoft text-rose shadow-sm' : 'text-copy hover:bg-panel hover:text-ink'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10">{children}</main>

      <footer className="mx-auto max-w-[1440px] px-4 pb-10 pt-6 sm:px-6">
        <div className="border-t border-line pt-5 text-xs text-muted">
          跨过406 · 配置文件在 <span className="num text-copy">src/config</span> 与{' '}
          <span className="num text-copy">src/data</span> · 参数可在设置页直接修改
        </div>
      </footer>
    </div>
  )
}
