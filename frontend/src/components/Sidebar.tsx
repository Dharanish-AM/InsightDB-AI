import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Zap, LayoutDashboard, Database, FolderTree, MessageSquareCode,
  Clock, BarChart2, Settings, HelpCircle, LogOut, ChevronDown,
  User, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusIndicator } from './ui/StatusIndicator';

const navSections = [
  {
    label: null,
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/query-studio', icon: MessageSquareCode, label: 'Query Studio' },
    ],
  },
  {
    label: 'Data',
    items: [
      { to: '/connections', icon: Database, label: 'Connections' },
      { to: '/schema', icon: FolderTree, label: 'Schema Explorer' },
      { to: '/history', icon: Clock, label: 'Query History' },
    ],
  },
  {
    label: 'Reporting',
    items: [
      { to: '/reports', icon: BarChart2, label: 'Reports' },
    ],
  },
];

const bottomNav = [
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/help', icon: HelpCircle, label: 'Help & Docs' },
  { to: '/profile', icon: User, label: 'Profile' },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { user, activeConnection, logout } = useAuth();
  const navigate = useNavigate();
  const [wsOpen, setWsOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'var(--bg-overlay)' }}
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`app-sidebar ${mobileOpen ? 'open' : ''}`}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b shrink-0" style={{ borderColor: 'var(--border-base)' }}>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--grad-brand)' }}
          >
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>InsightDB</p>
            <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>AI Platform</p>
          </div>
          <button onClick={onMobileClose} className="ml-auto lg:hidden btn btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace switcher */}
        <div className="px-3 py-3 border-b" style={{ borderColor: 'var(--border-base)' }}>
          <button
            onClick={() => setWsOpen(!wsOpen)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-tag)]"
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ background: 'var(--grad-brand)' }}
            >
              {user?.email?.[0]?.toUpperCase() ?? 'W'}
            </div>
            <span className="text-xs font-semibold truncate flex-1 text-left" style={{ color: 'var(--text-primary)' }}>
              {user?.email?.split('@')[0] ?? 'Workspace'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Active Connection indicator */}
        {activeConnection && (
          <div className="px-3 py-2.5 border-b" style={{ borderColor: 'var(--border-base)' }}>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <StatusIndicator status="online" pulse />
              <span className="text-xs font-medium truncate" style={{ color: 'var(--text-brand)' }}>
                {activeConnection.name}
              </span>
              <span className="text-[10px] ml-auto uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>
                {activeConnection.db_type === 'postgresql' ? 'PG' : 'MY'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
          {navSections.map((section, si) => (
            <div key={si}>
              {section.label && (
                <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onMobileClose}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="border-t px-3 py-3 space-y-0.5 shrink-0" style={{ borderColor: 'var(--border-base)' }}>
          {bottomNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onMobileClose}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
          <button onClick={handleLogout} className="nav-link w-full text-left" style={{ color: 'var(--text-secondary)' }}>
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>

        {/* User footer */}
        <div className="border-t px-3 py-3 shrink-0" style={{ borderColor: 'var(--border-base)' }}>
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg" style={{ background: 'var(--bg-tag)' }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: 'var(--grad-brand)' }}
            >
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.email?.split('@')[0]}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                {user?.role === 'admin' ? 'Administrator' : 'Member'}
              </p>
            </div>
            <span
              className="badge badge-blue text-[10px] px-1.5 py-0.5 shrink-0"
            >
              {user?.role ?? 'user'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
