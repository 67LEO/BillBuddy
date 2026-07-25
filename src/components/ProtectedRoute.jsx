import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse"
            style={{ background: 'var(--ink)' }}
          >
            <span className="text-[var(--cream)] font-bold text-lg font-display">B</span>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--crimson)', animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--crimson)', animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--crimson)', animationDelay: '300ms' }} />
          </div>
          <p className="text-[var(--ink)]/50 text-sm">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
