import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, ShieldCheck, BarChart3, Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { InlineError } from './ui/ErrorState';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export function AuthView() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'We could not complete that request.');
    } finally {
      setLoading(false);
    }
  };

  const changeMode = () => {
    setIsLogin(value => !value);
    setError(null);
    setPassword('');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_.9fr]" style={{ background: 'var(--bg-base)' }}>
      {/* Brand panel */}
      <section className="hidden lg:flex relative overflow-hidden px-12 py-12 xl:px-20 xl:py-16 flex-col justify-between text-white">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: 'radial-gradient(circle at 13% 17%, #1e3a8a 0, transparent 40%), radial-gradient(circle at 87% 88%, #0891b2 0, transparent 45%), #080c14'
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-xl bg-white/10 border border-white/15">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </span>
          <span>
            <strong className="block text-lg tracking-tight">InsightDB</strong>
            <small className="text-sky-200 font-bold tracking-widest uppercase text-[9px]">AI Workspace</small>
          </span>
        </div>
        <div className="relative max-w-[620px]">
          <span className="text-sky-300 text-xs font-bold tracking-wider uppercase">Business intelligence, unblocked</span>
          <h1 className="mt-5 text-5xl xl:text-[56px] font-extrabold tracking-tight leading-[1.05]">
            Turn every database into a conversation.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-sky-100/80">
            Explore data in plain language, inspect every query, and move from a question to a trusted decision in minutes.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-10 max-w-[560px]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-sky-200" />
              <p className="mt-4 text-sm font-semibold">Safe by design</p>
              <p className="mt-1 text-xs leading-5 text-sky-100/60">Read-only, AST validated SQL.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <BarChart3 className="w-5 h-5 text-cyan-200" />
              <p className="mt-4 text-sm font-semibold">Context in seconds</p>
              <p className="mt-1 text-xs leading-5 text-sky-100/60">Insights that explain the why.</p>
            </div>
          </div>
        </div>
        <p className="relative text-xs text-sky-100/40">© 2026 InsightDB AI</p>
      </section>

      {/* Form panel */}
      <main
        className="relative flex items-center justify-center p-5 sm:p-10 border-l"
        style={{
          background: 'linear-gradient(145deg, var(--bg-base), var(--bg-raised))',
          borderColor: 'var(--border-base)'
        }}
      >
        <div className="w-full max-w-[400px] space-y-8">
          <div className="lg:hidden flex items-center gap-2">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </span>
            <strong className="tracking-tight text-lg" style={{ color: 'var(--text-primary)' }}>InsightDB</strong>
          </div>
          <div>
            <p className="page-eyebrow mb-1">Secure workspace</p>
            <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {isLogin ? 'Welcome back' : 'Create your workspace'}
            </h2>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              {isLogin ? 'Sign in to continue exploring your data.' : 'Start asking better questions of your data.'}
            </p>
          </div>

          {error && <InlineError message={error} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work email"
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              icon={<Mail className="w-4 h-4" />}
            />
            <div className="relative">
              <Input
                label="Password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                icon={<Lock className="w-4 h-4" />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded-md hover:bg-[var(--bg-tag)]"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                }
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 mt-2 justify-center"
              loading={loading}
              iconRight={!loading ? <ArrowRight className="w-4 h-4" /> : undefined}
            >
              {isLogin ? 'Sign in to InsightDB' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? 'New to InsightDB?' : 'Already have an account?'} <button type="button" onClick={changeMode} className="font-bold text-[var(--text-brand)] hover:underline">{isLogin ? 'Create an account' : 'Sign in'}</button>
          </p>

          <p className="text-center text-xs leading-5" style={{ color: 'var(--text-muted)' }}>
            <ShieldCheck className="inline w-3.5 h-3.5 mr-1 -mt-0.5 text-emerald-500" />
            Your connection is encrypted and your credentials stay protected.
          </p>
        </div>
      </main>
    </div>
  );
}
