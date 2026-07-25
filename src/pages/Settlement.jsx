import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { calculateAllBalances } from '../utils/splitCalculator';
import { optimizeSettlements } from '../utils/settlementOptimizer';
import { stagger, fadeUp } from '../utils/animations';

export default function Settlement() {
  const { groupId } = useParams();
  const { state } = useApp();
  const navigate = useNavigate();

  const group = state.groups.find((g) => g.id === groupId);
  const groupExpenses = state.expenses.filter((e) => e.groupId === groupId);

  const settlements = useMemo(() => {
    if (!group) return [];
    const balances = calculateAllBalances(groupExpenses, group.members);
    return optimizeSettlements(balances);
  }, [groupExpenses, group]);

  const balances = useMemo(() => {
    if (!group) return {};
    return calculateAllBalances(groupExpenses, group.members);
  }, [groupExpenses, group]);

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20 sm:pt-24 pb-24 sm:pb-16">
        <div className="text-center">
          <h2 className="text-xl text-[var(--ink)] mb-2 font-display">Group nahi mila</h2>
          <button onClick={() => navigate('/dashboard')} className="text-[var(--crimson)] cursor-pointer text-sm">Dashboard pe jao →</button>
        </div>
      </div>
    );
  }

  const totalSettled = settlements.reduce((s, t) => s + t.amount, 0);

  const shareOnWhatsApp = () => {
    let message = `💰 *${group.name} — Settlement Plan*\n\n`;
    if (settlements.length === 0) {
      message += '✅ Sab settled hai! Koi paisa nahi dena.\n';
    } else {
      settlements.forEach((s, i) => {
        const from = group.members.find(m => m.id === s.from.id);
        const to = group.members.find(m => m.id === s.to.id);
        message += `${i + 1}. ${from?.name || 'Unknown'} → ${to?.name || 'Unknown'}: ₹${s.amount.toLocaleString('en-IN')}\n`;
      });
      message += `\n💸 Total: ₹${totalSettled.toLocaleString('en-IN')}\n`;
    }
    message += '\n— Sent via BillBuddy 🧾';
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center mb-8 sm:mb-10">
          <motion.h1 variants={fadeUp} className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-[var(--ink)] mb-2">
            Settlement Plan
          </motion.h1>
          <motion.p variants={fadeUp} className="text-[var(--ink)]/60 text-sm">
            Minimum transactions me sab settled — koi tension nahi
          </motion.p>
        </motion.div>

        {/* BALANCE OVERVIEW */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="ink-border rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8" style={{ background: 'var(--cream-2)' }}>
          <h3 className="label" style={{ marginBottom: '0.875rem' }}>
            <i className="ti ti-chart-bar text-sm" /> Sabka Net Balance
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {group.members.map((m, i) => {
              const net = balances[m.id]?.net || 0;
              const isPositive = net > 0.01;
              const isNegative = net < -0.01;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="p-3 sm:p-4 rounded-xl"
                  style={{
                    background: isPositive ? 'rgba(168,214,184,0.15)' : isNegative ? 'rgba(194,61,61,0.06)' : 'rgba(58,44,92,0.03)',
                    border: `1px solid ${isPositive ? 'var(--mint)' : isNegative ? 'rgba(194,61,61,0.2)' : 'rgba(58,44,92,0.08)'}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <div className="avatar-solid" style={{ background: m.color, width: 28, height: 28, fontSize: 10 }}>
                      <span className="text-[var(--cream)]">{m.name[0].toUpperCase()}</span>
                    </div>
                    <span className="text-xs sm:text-sm text-[var(--ink)] font-medium truncate">{m.name}</span>
                  </div>
                  <div className={`text-base sm:text-lg font-bold font-display ${isPositive ? 'text-[var(--mint)]' : isNegative ? 'text-[var(--crimson)]' : 'text-[var(--ink)]/40'}`}>
                    {isPositive ? '+' : ''}₹{net.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-[var(--ink)]/50 mt-0.5">
                    {isPositive ? 'Gets back' : isNegative ? 'Owes' : 'Settled'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* SETTLEMENT TRANSACTIONS */}
        {settlements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 sm:py-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, delay: 0.2 }}
            >
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'var(--mint)' }}
              >
                <i className="ti ti-circle-check text-[var(--ink)] text-4xl" />
              </div>
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--ink)] mt-4 mb-2 font-display">Sab Settled Hai!</h3>
            <p className="text-[var(--ink)]/60 text-sm">Koi paisa nahi udha — tension free life</p>
            <button
              onClick={() => navigate(`/group/${groupId}`)}
              className="mt-5 sm:mt-6 btn-secondary px-6 py-2.5 text-sm font-medium"
            >
              Group pe Wapas Jao
            </button>
          </motion.div>
        ) : (
          <>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--ink)] font-display">
                  {settlements.length} Transaction{settlements.length !== 1 ? 's' : ''} Chahiye
                </h3>
                <div className="text-xs sm:text-sm text-[var(--ink)]/60">
                  Total: <span className="text-[var(--ink)] font-semibold">₹{totalSettled.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={shareOnWhatsApp}
                className="btn-whatsapp flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium w-full sm:w-auto justify-center"
              >
                <i className="ti ti-brand-whatsapp text-base" />
                WhatsApp pe Share
              </motion.button>
            </motion.div>

            <div className="space-y-3 sm:space-y-4">
              {settlements.map((s, i) => {
                const fromMember = group.members.find((m) => m.id === s.from.id);
                const toMember = group.members.find((m) => m.id === s.to.id);

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12, type: 'spring', damping: 20 }}
                    className="ink-border rounded-2xl p-4 overflow-hidden"
                    style={{ background: 'var(--cream-2)' }}
                  >
                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                      {/* FROM */}
                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.12 + 0.1 }}
                        className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0"
                      >
                        <div
                          className="avatar-solid shrink-0"
                          style={{ background: fromMember?.color || 'var(--ink)', width: 44, height: 44, fontSize: 15 }}
                        >
                          <span className="text-[var(--cream)]">{fromMember?.name?.[0]?.toUpperCase() || '?'}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base text-[var(--ink)] font-semibold truncate">{fromMember?.name || 'Unknown'}</div>
                          <div className="text-[10px] sm:text-xs text-[var(--crimson)]">Dega</div>
                        </div>
                      </motion.div>

                      {/* ARROW + AMOUNT */}
                      <div className="flex flex-col items-center gap-0.5 sm:gap-1 shrink-0 px-1 sm:px-2">
                        <div className="text-base sm:text-xl font-bold text-[var(--ink)] font-display">
                          ₹{s.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-8 h-[1px]" style={{ background: 'var(--ink)' }} />
                          <i className="ti ti-arrow-right text-[var(--ink)]/40 text-xs" />
                          <div className="w-8 h-[1px]" style={{ background: 'var(--ink)' }} />
                        </div>
                      </div>

                      {/* TO */}
                      <motion.div
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.12 + 0.1 }}
                        className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 justify-end"
                      >
                        <div className="min-w-0 text-right">
                          <div className="text-sm sm:text-base text-[var(--ink)] font-semibold truncate">{toMember?.name || 'Unknown'}</div>
                          <div className="text-[10px] sm:text-xs text-[var(--mint)]">Lega</div>
                        </div>
                        <div
                          className="avatar-solid shrink-0"
                          style={{ background: toMember?.color || 'var(--ink)', width: 44, height: 44, fontSize: 15 }}
                        >
                          <span className="text-[var(--cream)]">{toMember?.name?.[0]?.toUpperCase() || '?'}</span>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-[var(--ink)]/40 text-xs">
                Ye optimized hai — minimum transactions ke saath sab settle ho jayega
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
