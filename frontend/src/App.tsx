import React, { useState, useEffect } from 'react'
import { Database, Activity, Server, ShieldCheck, Terminal, Layers } from 'lucide-react'

interface HealthResponse {
  status: string
  version: string
  environment: string
  timestamp: string
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/health')
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const data = await res.json()
      setHealth(data)
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend service')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                InsightDB AI
              </h1>
              <p className="text-xs text-slate-400">Enterprise AI Database Intelligence Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs bg-slate-900 border border-slate-800 rounded-full px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${health?.status === 'ok' ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${health?.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-slate-300">Milestone 1 Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 space-y-8">
        {/* Welcome Section */}
        <section className="bg-gradient-to-b from-indigo-950/30 to-slate-900/40 border border-indigo-900/30 rounded-2xl p-8 backdrop-blur">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Foundational Infrastructure Online
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                AI Layer Above Enterprise Data Engine
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                InsightDB AI enables seamless natural language database queries across PostgreSQL and MySQL databases with safety validation, multi-agent reasoning, automated insight synthesis, and ECharts visualizations.
              </p>
            </div>
            
            <button 
              onClick={checkHealth}
              disabled={loading}
              className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Testing API...' : 'Recheck Health'}</span>
            </button>
          </div>
        </section>

        {/* System Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Backend Health */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                <Server className="w-5 h-5" />
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${health?.status === 'ok' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {health?.status === 'ok' ? 'HEALTHY' : 'UNREACHABLE'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">FastAPI Backend Engine</h3>
              <p className="text-xs text-slate-400 mt-1">Python 3.11 + Pydantic v2 BaseSettings</p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-xs space-y-1.5 text-slate-400 font-mono">
              <div className="flex justify-between"><span>Version:</span> <span className="text-slate-200">{health?.version || 'N/A'}</span></div>
              <div className="flex justify-between"><span>Environment:</span> <span className="text-slate-200">{health?.environment || 'N/A'}</span></div>
            </div>
          </div>

          {/* Card 2: Multi-Agent Architecture */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                8 AGENTS
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">LangGraph Agent Pipeline</h3>
              <p className="text-xs text-slate-400 mt-1">Planner, SQL, Validator, Insights, Visualization</p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 leading-relaxed">
              Decoupled reasoning pipeline with safety validator blocking DML mutations.
            </div>
          </div>

          {/* Card 3: Enterprise Guardrails */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SECURITY READY
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Database Guardrails</h3>
              <p className="text-xs text-slate-400 mt-1">Read-Only SQL Enforcement & Row Limit Rules</p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 leading-relaxed">
              Blocks DROP, ALTER, TRUNCATE, and multi-statement injection risks.
            </div>
          </div>
        </div>

        {/* Live Diagnostics Console */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="bg-slate-900/80 px-6 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>API Gateway Health Payload (/api/v1/health)</span>
            </div>
            <span className="text-slate-500">JSON Diagnostics</span>
          </div>
          <div className="p-6 font-mono text-xs bg-slate-950 overflow-x-auto text-emerald-400">
            {error ? (
              <span className="text-red-400">Error: {error}</span>
            ) : health ? (
              <pre>{JSON.stringify(health, null, 2)}</pre>
            ) : (
              <span className="text-slate-500">Connecting to API Gateway...</span>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        InsightDB AI &bull; Enterprise Database Intelligence Platform &bull; Milestone 1 Complete
      </footer>
    </div>
  )
}
