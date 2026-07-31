import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 animate-fade-in" style={{ background: 'var(--bg-base)' }}>
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8" style={{ background: 'var(--grad-brand)' }}>
        <Zap className="w-8 h-8 text-white" fill="white" />
      </div>

      {/* 404 */}
      <div
        className="text-[120px] font-black leading-none mb-4 select-none"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.6), rgba(6,182,212,0.4))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        404
      </div>

      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Page not found
      </h1>
      <p className="text-sm mb-8 max-w-xs" style={{ color: 'var(--text-secondary)' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="md"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
        <Button
          variant="primary"
          size="md"
          icon={<Home className="w-4 h-4" />}
          onClick={() => navigate('/dashboard')}
        >
          Dashboard
        </Button>
      </div>
    </div>
  );
}
