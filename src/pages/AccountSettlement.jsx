import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { stagger, fadeUp } from '../utils/animations';
import { calculateRunningBalances, optimizeAccountSettlements, getAccountStats } from '../utils/accountUtils';
import { generateShareText, shareGeneric } from '../utils/exportUtils';

const formatCurrency = (n) => `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function AccountSettlement() {
  const navigate = useNavigate();
  const { state } = useApp();

  const balances = useMemo(() => calculateRunningBalances(state.accounts), [state.accounts]);
  const stats = useMemo(() => getAccountStats(state.accounts), [state.accounts]);
  const settlements = useMemo(() => optimizeAccountSettlements(balances), [balances]);

  const activeBalances = Object.values(balances).filter((b) => Math.abs(b.net) > 0.01);

  const handleShare = () => {
    const text = generateShareText(stats, settlements, balances);
    shareGeneric(text);
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-4 sm:px-6 lg:px-12 max-w-3xl mx-auto relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        {/* HEADER */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="mb-6 sm:mb-8">
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate('/account')}
              className="p-2 rounded-xl hover:bg-[var(--ink)]/5 transition-colors text-[var(--ink)]/50 hover:text-[var(--ink)] cursor-pointer"
            >
              <i className="ti ti-arrow-left text-lg" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--ink)]">Settlement Plan</h1>
          </motion.div>
          <motion.p variants={fadeUp} className="text-[var(--ink)]/60 text-sm ml-11">
            Minimum transactions se sab settle karo
          </motion.p>
        </motion.div>

        {/* BALANCE OVERVIEW */}
        {activeBalances.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <label className="label mb-3">
              <i className="ti ti-chart-bar text-sm mr-1" /> Balance Overview
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeBalances.map((b) => (
                <div
                  key={b.name}
                  className="ink-border rounded-2xl p-4 text-center"
                  style={{ background: b.net > 0 ? 'rgba(168,214,184,0.15)' : 'rgba(194,61,61,0.08)' }}
                >
                  <div className="text-sm font-semibold text-[var(--ink)] mb-1">{b.name}</div>
                  <div
                    className="text-xl font-bold font-display"
                    style={{ color: b.net > 0 ? 'var(--ink)' : 'var(--crimson)' }}
                  >
                    {b.net > 0 ? '+' : '-'}{formatCurrency(b.net)}
                  </div>
                  <div className="text-xs mt-1" style={{ color: b.net > 0 ? 'var(--ink)' : 'var(--crimson)', opacity: 0.7 }}>
                    {b.net > 0 ? 'Tere paas hai ✅' : 'Tujhe dena hai ❌'}
                  </div>
                  <div className="text-[10px] text-[var(--ink)]/40 mt-2">
                    Diya: {formatCurrency(b.totalDiya)} · Liya: {formatCurrency(b.totalLiya)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* OPTIMIZED SETTLEMENTS */}
        {settlements.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <label className="label mb-3">
              <i className="ti ti-arrows-cross text-sm mr-1" /> Optimal Transactions
              <span className="text-[var(--ink)]/40 ml-1">({settlements.length})</span>
            </label>
            <div className="ink-border rounded-2xl p-4 sm:p-5" style={{ background: 'var(--cream-2)' }}>
              <div className="text-center mb-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ink)]/50 mb-1">
                  Sirf {settlements.length} transaction{settlements.length > 1 ? 's' : ''} se sab settle!
                </div>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {settlements.map((s, i) => (
                    <motion.div
                      key={`${s.from}-${s.to}-${i}`}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="ink-border rounded-xl p-3 flex items-center gap-3"
                      style={{ background: 'var(--cream)' }}
                    >
                      <div className="flex-1 text-right">
                        <div className="text-sm font-semibold text-[var(--crimson)]">{s.from}</div>
                        <div className="text-[10px] text-[var(--ink)]/40">dega</div>
                      </div>
                      <div className="flex flex-col items-center shrink-0">
                        <div className="text-lg font-bold font-mono text-[var(--ink)]">{formatCurrency(s.amount)}</div>
                        <i className="ti ti-arrow-right text-[var(--pumpkin)]" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold text-[var(--ink)]">{s.to}</div>
                        <div className="text-[10px] text-[var(--ink)]/40">lega</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15, delay: 0.15 }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'var(--mint)' }}
            >
              <i className="ti ti-mood-smile text-[var(--ink)] text-2xl" />
            </motion.div>
            <h3 className="text-lg sm:text-xl font-semibold text-[var(--ink)] mb-2 font-display">Sab Settled Hai!</h3>
            <p className="text-[var(--ink)]/60 text-sm mb-6 px-4">Koi dues nahi hai — sab barabar hai</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/account')}
              className="btn-secondary px-6 py-3 font-semibold"
            >
              Account pe wapas jao
            </motion.button>
          </motion.div>
        )}

        {/* SHARE BUTTON */}
        {settlements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-3 mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShare}
              className="btn-crimson flex-1 py-3"
            >
              <i className="ti ti-share text-base" /> Share Settlement
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/account')}
              className="btn-secondary flex-1 py-3"
            >
              <i className="ti ti-arrow-left text-base" /> Wapas Jao
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
