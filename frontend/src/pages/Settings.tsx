import { useState } from 'react';
import {
  User, Lock, Palette, Cpu, Key, Shield, Sliders,
  Check, ChevronRight, Sun, Moon, Monitor
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const sections = [
  { id: 'profile',      label: 'Profile',      icon: User },
  { id: 'password',     label: 'Password',     icon: Lock },
  { id: 'appearance',   label: 'Appearance',   icon: Palette },
  { id: 'llm',          label: 'LLM Provider', icon: Cpu },
  { id: 'api-keys',     label: 'API Keys',     icon: Key },
  { id: 'security',     label: 'Security',     icon: Shield },
  { id: 'preferences',  label: 'Preferences',  icon: Sliders },
];

export function Settings() {
  const [activeSection, setActiveSection] = useState('profile');
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  const [profileForm, setProfileForm] = useState({ email: user?.email ?? '', name: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  const handleSaveProfile = () => { toast.success('Profile updated'); };
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) { toast.error('Passwords do not match'); return; }
    toast.success('Password changed successfully');
    setPasswordForm({ current: '', next: '', confirm: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <p className="page-eyebrow mb-1.5">Configuration</p>
        <h1 className="page-title">Settings</h1>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>Manage your account, appearance, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
        {/* Nav */}
        <Card padding="sm">
          <nav className="space-y-0.5">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === s.id ? 'text-[var(--text-brand)]' : ''}`}
                style={{
                  background: activeSection === s.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                  color: activeSection === s.id ? 'var(--text-brand)' : 'var(--text-secondary)',
                }}
              >
                <s.icon className="w-4 h-4 shrink-0" />
                {s.label}
                {activeSection === s.id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            ))}
          </nav>
        </Card>

        {/* Content */}
        <div className="animate-fade-in">
          {activeSection === 'profile' && (
            <Card padding="lg">
              <h2 className="section-title mb-5">Profile Information</h2>
              <div className="flex items-center gap-4 mb-7 pb-6 border-b" style={{ borderColor: 'var(--border-base)' }}>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                  style={{ background: 'var(--grad-brand)' }}
                >
                  {user?.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="blue">{user?.role}</Badge>
                    <Badge variant="green">Active</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-4 max-w-md">
                <Input
                  label="Display Name"
                  value={profileForm.name}
                  onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={profileForm.email}
                  onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                />
                <div className="pt-2">
                  <Button variant="primary" onClick={handleSaveProfile}>Save Changes</Button>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'password' && (
            <Card padding="lg">
              <h2 className="section-title mb-5">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <Input label="Current Password" type="password" value={passwordForm.current}
                  onChange={e => setPasswordForm(f => ({ ...f, current: e.target.value }))} required />
                <Input label="New Password" type="password" value={passwordForm.next}
                  onChange={e => setPasswordForm(f => ({ ...f, next: e.target.value }))} required />
                <Input label="Confirm New Password" type="password" value={passwordForm.confirm}
                  onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} required
                  error={passwordForm.confirm && passwordForm.next !== passwordForm.confirm ? 'Passwords do not match' : undefined} />
                <div className="pt-2">
                  <Button type="submit" variant="primary">Update Password</Button>
                </div>
              </form>
            </Card>
          )}

          {activeSection === 'appearance' && (
            <Card padding="lg">
              <h2 className="section-title mb-5">Appearance</h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Choose how InsightDB looks for you.</p>
              <div className="grid grid-cols-3 gap-3 max-w-sm">
                {[
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'system', label: 'System', icon: Monitor },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { if (opt.id !== 'system' && theme !== opt.id) toggle(); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all"
                    style={{
                      background: theme === opt.id ? 'rgba(59,130,246,0.1)' : 'var(--bg-tag)',
                      borderColor: theme === opt.id ? 'rgba(59,130,246,0.4)' : 'var(--border-base)',
                    }}
                  >
                    <opt.icon className="w-5 h-5" style={{ color: theme === opt.id ? 'var(--text-brand)' : 'var(--text-secondary)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{opt.label}</span>
                    {theme === opt.id && <Check className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {activeSection === 'llm' && (
            <Card padding="lg">
              <h2 className="section-title mb-2">LLM Provider</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Configure the AI model powering InsightDB's natural language queries.
              </p>
              <div className="space-y-3 max-w-md">
                {[
                  { id: 'ollama', label: 'Ollama (Local)', desc: 'Run models locally — llama3.2, mistral, etc.', active: true },
                  { id: 'openai', label: 'OpenAI', desc: 'GPT-4o, GPT-4 Turbo, and more.', active: false },
                  { id: 'anthropic', label: 'Anthropic Claude', desc: 'Claude 3 Opus, Sonnet, Haiku.', active: false },
                ].map(provider => (
                  <div
                    key={provider.id}
                    className="flex items-center gap-3 p-4 rounded-xl border"
                    style={{
                      background: provider.active ? 'rgba(59,130,246,0.06)' : 'var(--bg-tag)',
                      borderColor: provider.active ? 'rgba(59,130,246,0.3)' : 'var(--border-base)',
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{provider.label}</p>
                        {provider.active && <Badge variant="blue">Active</Badge>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{provider.desc}</p>
                    </div>
                  </div>
                ))}
                <p className="text-xs pt-2" style={{ color: 'var(--text-muted)' }}>
                  Provider settings are configured via environment variables. See documentation for details.
                </p>
              </div>
            </Card>
          )}

          {activeSection === 'api-keys' && (
            <Card padding="lg">
              <h2 className="section-title mb-5">API Keys</h2>
              <div className="space-y-4 max-w-md">
                <div
                  className="flex items-center gap-3 p-4 rounded-xl border"
                  style={{ background: 'var(--bg-tag)', borderColor: 'var(--border-base)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>OpenAI API Key</p>
                    <p className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                      {apiKeyVisible ? 'sk-...configured-via-env...' : '•••••••••••••••••••••••••••••••'}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setApiKeyVisible(v => !v)}>
                    {apiKeyVisible ? 'Hide' : 'Show'}
                  </Button>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  API keys are managed through environment variables for security. Contact your system administrator to update them.
                </p>
              </div>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card padding="lg">
              <h2 className="section-title mb-5">Security</h2>
              <div className="space-y-4">
                <div
                  className="flex items-center justify-between p-4 rounded-xl border"
                  style={{ background: 'var(--bg-tag)', borderColor: 'var(--border-base)' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Current Session</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>JWT · Expires in 24 hours</p>
                  </div>
                  <Badge variant="green">Active</Badge>
                </div>
                <div
                  className="flex items-center gap-2 p-3 rounded-xl border"
                  style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}
                >
                  <Check className="w-4 h-4 shrink-0" style={{ color: '#10b981' }} />
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>All queries are executed as read-only — write operations are blocked.</p>
                </div>
                <div
                  className="flex items-center gap-2 p-3 rounded-xl border"
                  style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}
                >
                  <Check className="w-4 h-4 shrink-0" style={{ color: '#10b981' }} />
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>SQL is validated with AST parsing before execution.</p>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'preferences' && (
            <Card padding="lg">
              <h2 className="section-title mb-5">Preferences</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="field-label">Language</label>
                  <select className="form-input">
                    <option>English (US)</option>
                    <option>English (UK)</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Timezone</label>
                  <select className="form-input">
                    <option>UTC</option>
                    <option>America/New_York</option>
                    <option>America/Los_Angeles</option>
                    <option>Europe/London</option>
                    <option>Asia/Kolkata</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Results per page</label>
                  <select className="form-input">
                    <option value="25">25</option>
                    <option value="50" selected>50</option>
                    <option value="100">100</option>
                    <option value="250">250</option>
                  </select>
                </div>
                <Button variant="primary" onClick={() => toast.success('Preferences saved')}>Save Preferences</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
