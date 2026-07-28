import React, { useState } from 'react';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, ShieldCheck, BarChart3, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthViewProps { onSuccess: (user: User) => void; }

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try { if (isLogin) await api.login(email, password); else { await api.register(email, password); await api.login(email, password); } onSuccess(await api.getMe()); }
    catch (err: any) { setError(err.message || 'We could not complete that request.'); }
    finally { setLoading(false); }
  };
  const changeMode = () => { setIsLogin(value => !value); setError(null); setPassword(''); };
  return <div className="min-h-screen grid lg:grid-cols-[1.08fr_.92fr]">
    <section className="hidden lg:flex relative overflow-hidden px-12 py-12 xl:px-20 xl:py-16 flex-col justify-between bg-[#100c20] text-white">
      <div className="absolute inset-0 opacity-90" style={{ background: 'radial-gradient(circle at 13% 17%, #6d28d9 0, transparent 29%), radial-gradient(circle at 87% 88%, #0369a1 0, transparent 32%)' }} />
      <div className="relative flex items-center gap-3"><span className="grid place-items-center w-11 h-11 rounded-xl bg-white/10 border border-white/15"><Sparkles className="w-5 h-5" /></span><span><strong className="block text-lg tracking-[-.04em]">InsightDB</strong><small className="text-violet-200 font-bold tracking-[.16em] uppercase text-[10px]">AI Workspace</small></span></div>
      <div className="relative max-w-[620px]"><span className="text-violet-200 text-[11px] font-bold tracking-[.13em] uppercase">Business intelligence, unblocked</span><h1 className="mt-5 text-5xl xl:text-[64px] font-bold tracking-[-.065em] leading-[1.02]">Turn every database into a conversation.</h1><p className="mt-6 max-w-md text-base leading-7 text-violet-100/85">Explore data in plain language, inspect every query, and move from a question to a trusted decision in minutes.</p><div className="grid grid-cols-2 gap-4 mt-10 max-w-[560px]"><div className="rounded-2xl border border-white/15 bg-white/[.10] p-4"><ShieldCheck className="w-5 h-5 text-violet-100" /><p className="mt-4 text-sm font-semibold">Safe by design</p><p className="mt-1 text-xs leading-5 text-violet-100/85">Read-only, validated SQL.</p></div><div className="rounded-2xl border border-white/15 bg-white/[.10] p-4"><BarChart3 className="w-5 h-5 text-sky-100" /><p className="mt-4 text-sm font-semibold">Context in seconds</p><p className="mt-1 text-xs leading-5 text-violet-100/85">Insights that explain the why.</p></div></div></div>
      <p className="relative text-xs text-violet-100/60">© 2026 InsightDB AI</p>
    </section>
    <main className="relative flex items-center justify-center p-5 sm:p-10 border-l" style={{ background: 'linear-gradient(145deg, var(--bg-base), var(--bg-raised))', borderColor: 'var(--border-base)' }}><div className="w-full max-w-[410px]">
      <div className="lg:hidden flex items-center gap-2 mb-10"><span className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-800 text-white"><Sparkles className="w-5 h-5" /></span><strong className="tracking-[-.04em]">InsightDB</strong></div>
      <div><span className="eyebrow">Secure workspace</span><h2 className="mt-3 text-3xl font-bold tracking-[-.05em]" style={{ color: 'var(--text-primary)' }}>{isLogin ? 'Welcome back' : 'Create your workspace'}</h2><p className="mt-3 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{isLogin ? 'Sign in to continue exploring your data.' : 'Start asking better questions of your data.'}</p></div>
      {error && <div role="alert" className="mt-7 flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3.5 text-sm text-rose-600 dark:text-rose-400"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
      <form onSubmit={handleSubmit} className="mt-8 space-y-5"><div><label htmlFor="email" className="field-label">Work email</label><div className="relative"><Mail aria-hidden="true" className="absolute pointer-events-none left-3.5 top-3 w-4 h-4" style={{ color: 'var(--text-muted)' }} /><input id="email" className="form-control has-leading-icon" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" /></div></div><div><div className="flex items-center justify-between mb-1.5"><label htmlFor="password" className="field-label !mb-0">Password</label>{isLogin && <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Use your workspace password</span>}</div><div className="relative"><Lock aria-hidden="true" className="absolute pointer-events-none left-3.5 top-3 w-4 h-4" style={{ color: 'var(--text-muted)' }} /><input id="password" className="form-control has-leading-icon has-trailing-action" type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)} className="absolute right-2 top-1.5 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div><button className="btn-primary w-full h-11 mt-2" type="submit" disabled={loading}>{loading ? 'Please wait…' : isLogin ? 'Sign in to InsightDB' : 'Create account'} {!loading && <ArrowRight className="w-4 h-4" />}</button></form>
      <p className="mt-7 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>{isLogin ? 'New to InsightDB?' : 'Already have an account?'} <button type="button" onClick={changeMode} className="font-bold text-violet-600 dark:text-violet-400 hover:underline">{isLogin ? 'Create an account' : 'Sign in'}</button></p>
      <p className="mt-9 text-center text-xs leading-5" style={{ color: 'var(--text-muted)' }}><ShieldCheck className="inline w-3.5 h-3.5 mr-1 -mt-0.5 text-emerald-500" />Your connection is encrypted and your credentials stay protected.</p>
    </div></main>
  </div>;
};
