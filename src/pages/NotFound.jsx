import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 sm:pt-24 pb-24 sm:pb-16 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, delay: 0.2 }}
          className="text-8xl md:text-9xl font-bold font-display gradient-text mb-4"
        >
          404
        </motion.div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--ink)] font-display mb-2">
          Page Not Found
        </h1>
        <p className="text-[var(--ink)]/60 mb-8 max-w-md mx-auto">
          Yeh page toh exist hi nahi karta bhai. Dashboard pe chalo.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard')}
          className="btn-crimson px-6 py-3 font-semibold"
        >
          <i className="ti ti-home text-lg" />
          Dashboard pe Jao
        </motion.button>
      </motion.div>
    </div>
  );
}
