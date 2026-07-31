import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, ChevronDown, Menu, Database } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/query-studio': 'Query Studio',
  '/connections': 'Connections',
  '/schema': 'Schema Explorer',
  '/history': 'Query History',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/help': 'Help & Documentation',
};

interface TopBarProps {
  onMobileMenuToggle: () => void;
  onSearchOpen: () => void;
}

export function TopBar({ onMobileMenuToggle, onSearchOpen }: TopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { user, connections, activeConnection, setActiveConnection } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const currentPage = breadcrumbMap[location.pathname] ?? 'InsightDB AI';

  return (
    <header className="app-topbar">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuToggle}
        className="btn btn-ghost p-1.5 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
          {currentPage}
        </span>
      </div>

      {/* Center actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          onClick={onSearchOpen}
          className="hidden sm:flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-base)', color: 'var(--text-muted)' }}
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:block">Search anything…</span>
          <kbd
            className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold"
            style={{ background: 'var(--bg-tag)', border: '1px solid var(--border-base)', color: 'var(--text-muted)' }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Connection selector */}
        {connections.length > 0 && (
          <div
            className="hidden md:flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-base)' }}
          >
            <Database className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-brand)' }} />
            <select
              value={activeConnection?.id ?? ''}
              onChange={e => setActiveConnection(connections.find(c => c.id === Number(e.target.value)) ?? null)}
              className="bg-transparent text-xs font-semibold outline-none max-w-[150px] cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
              aria-label="Active database connection"
            >
              <option value="" disabled>Select DB</option>
              {connections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="btn btn-ghost p-1.5 rounded-lg"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4" style={{ color: '#fbbf24' }} />
            : <Moon className="w-4 h-4" style={{ color: 'var(--brand-500)' }} />
          }
        </button>

        {/* Notifications */}
        <button className="btn btn-ghost p-1.5 rounded-lg relative" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--brand-500)' }}
          />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg border px-2 py-1 text-xs transition-colors"
            style={{ background: 'var(--bg-tag)', borderColor: 'var(--border-base)' }}
            aria-label="User menu"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ background: 'var(--grad-brand)' }}
            >
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="hidden sm:block text-xs font-medium truncate max-w-[80px]" style={{ color: 'var(--text-primary)' }}>
              {user?.email?.split('@')[0]}
            </span>
            <ChevronDown className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div
                className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border glass animate-slide-up z-20"
                style={{ boxShadow: 'var(--shadow-dialog)' }}
              >
                <div className="p-3 border-b" style={{ borderColor: 'var(--border-base)' }}>
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.email}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{user?.role}</p>
                </div>
                {[
                  { label: 'Profile', href: '/profile' },
                  { label: 'Settings', href: '/settings' },
                  { label: 'Help', href: '/help' },
                ].map(item => (
                  <button
                    key={item.href}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-tag)] transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                    onClick={() => { navigate(item.href); setUserMenuOpen(false); }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
