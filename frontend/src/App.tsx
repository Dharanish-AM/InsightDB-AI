import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';

// Lazy load pages for production quality and code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const QueryStudio = lazy(() => import('./components/QueryStudio').then(m => ({ default: m.QueryStudio })));
const ConnectionManager = lazy(() => import('./components/ConnectionManager').then(m => ({ default: m.ConnectionManager })));
const SchemaExplorer = lazy(() => import('./components/SchemaExplorer').then(m => ({ default: m.SchemaExplorer })));
const QueryHistoryView = lazy(() => import('./components/QueryHistory').then(m => ({ default: m.QueryHistoryView })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Help = lazy(() => import('./pages/Help').then(m => ({ default: m.Help })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const AuthView = lazy(() => import('./components/AuthView').then(m => ({ default: m.AuthView })));

// Loading spinner fallback for lazy loading suspenses
function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="thinking-dot" />
          <div className="thinking-dot" />
          <div className="thinking-dot" />
        </div>
      </div>
    </div>
  );
}

export function App() {
  const { user, connections } = useAuth();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="flex items-center gap-2">
          <div className="thinking-dot" />
          <div className="thinking-dot" />
          <div className="thinking-dot" />
        </div>
      </div>
    }>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthView />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />

        {/* Protected Application Routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          } />
          <Route path="query-studio" element={
            <Suspense fallback={<PageLoader />}>
              <QueryStudio />
            </Suspense>
          } />
          <Route path="connections" element={
            <Suspense fallback={<PageLoader />}>
              <ConnectionManager />
            </Suspense>
          } />
          <Route path="schema" element={
            <Suspense fallback={<PageLoader />}>
              <SchemaExplorer />
            </Suspense>
          } />
          <Route path="history" element={
            <Suspense fallback={<PageLoader />}>
              <QueryHistoryView
                connections={connections}
                onSelectQuery={(sql, text) => {
                  // Direct history selection -> Studio navigate logic handled by setting states
                  window.location.href = `/query-studio?sql=${encodeURIComponent(sql)}&text=${encodeURIComponent(text)}`;
                }}
              />
            </Suspense>
          } />
          <Route path="reports" element={
            <Suspense fallback={<PageLoader />}>
              <Reports />
            </Suspense>
          } />
          <Route path="settings" element={
            <Suspense fallback={<PageLoader />}>
              <Settings />
            </Suspense>
          } />
          <Route path="profile" element={
            <Suspense fallback={<PageLoader />}>
              <Profile />
            </Suspense>
          } />
          <Route path="help" element={
            <Suspense fallback={<PageLoader />}>
              <Help />
            </Suspense>
          } />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="thinking-dot" />
            </div>
          }>
            <NotFound />
          </Suspense>
        } />
      </Routes>
    </Suspense>
  );
}

export default App;
