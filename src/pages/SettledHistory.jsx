import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const formatCurrency = (n) => `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function SettledHistory() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [unsettleConfirmEntry, setUnsettleConfirmEntry] = useState(null);
  const [toast, setToast] = useState(null);

  const settledEntries = useMemo(() => {
    return state.accounts
      .filter((a) => a.isSettled)
      .sort((a, b) => new Date(b.settledAt || b.date) - new Date(a.settledAt || a.date));
  }, [state.accounts]);

  const totalSettledAmount = useMemo(() => settledEntries.reduce((s, e) => s + e.amount, 0), [settledEntries]);

  const dateRange = useMemo(() => {
    if (settledEntries.length === 0) return null;
    const dates = settledEntries
      .map((e) => new Date(e.settledAt || e.date))
      .sort((a, b) => a - b);
    const first = dates[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const last = dates[dates.length - 1].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return first === last ? first : `${first} — ${last}`;
  }, [settledEntries]);

  const handleUnsettle = (id) => {
    const entry = state.accounts.find((a) => a.id === id);
    if (entry) setUnsettleConfirmEntry(entry);
  };

  const confirmUnsettle = () => {
    if (unsettleConfirmEntry) {
      dispatch({ type: 'UNSETTLE_ACCOUNT_ENTRY', payload: unsettleConfirmEntry.id });
      setToast({ person: unsettleConfirmEntry.personName, amount: unsettleConfirmEntry.amount });
      setUnsettleConfirmEntry(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-4 sm:px-6 lg:px-12 max-w-3xl mx-auto relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate('/account')}
              className="p-2 rounded-xl hover:bg-[var(--ink)]/5 transition-colors text-[var(--ink)]/50 hover:text-[var(--ink)] cursor-pointer"
            >
              <i className="ti ti-arrow-left text-lg" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--ink)]">
              Settled Payments
            </h1>
          </div>
          <p className="text-[var(--ink)]/60 text-sm ml-11">
            Jo de diya / le liya — sab ka hisab
          </p>
        </motion.div>

        {/* STATS BAR */}
        {settledEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <div className="ink-border rounded-2xl p-4" style={{ background: 'rgba(34,197,94,0.06)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--mint)' }}>
                  <i className="ti ti-checkup-circle text-[var(--ink)] text-sm" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--ink)]">Settled Summary</div>
                  <div className="text-[10px] text-[var(--ink)]/50">Sab ka hisab kitab</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold font-display text-[var(--ink)]">
                    {settledEntries.length}
                  </div>
                  <div className="text-[10px] text-[var(--ink)]/50 mt-0.5">Total Settled</div>
                </div>
                <div className="text-center border-x border-[var(--ink)]/10 px-3">
                  <div className="text-lg sm:text-xl font-bold font-display text-[var(--ink)]">
                    {formatCurrency(totalSettledAmount)}
                  </div>
                  <div className="text-[10px] text-[var(--ink)]/50 mt-0.5">Total Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-medium text-[var(--ink)]/60 leading-tight">
                    {dateRange}
                  </div>
                  <div className="text-[10px] text-[var(--ink)]/50 mt-0.5">Date Range</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SETTLED ENTRIES LIST */}
        {settledEntries.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            {settledEntries.map((entry, idx) => {
              const entryDate = entry.date ? new Date(entry.date) : null;
              const settledDate = entry.settledAt ? new Date(entry.settledAt) : null;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + idx * 0.03 }}
                  className="ink-border rounded-2xl p-3.5"
                  style={{ background: 'var(--cream-2)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'var(--mint)' }}
                    >
                      <i className="ti ti-check text-[var(--ink)] text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--ink)] font-medium">{entry.personName}</span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            background: entry.type === 'diya' ? 'rgba(220,38,38,0.08)' : 'rgba(34,197,94,0.08)',
                            color: entry.type === 'diya' ? 'var(--crimson)' : '#22c55e',
                          }}
                        >
                          {entry.type === 'diya' ? 'Diya' : 'Liya'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {entryDate && (
                          <span className="text-[10px] text-[var(--ink)]/40">
                            {entryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        {settledDate && (
                          <>
                            <span className="text-[var(--ink)]/20">→</span>
                            <span className="text-[10px] text-[#22c55e] font-medium">
                              Settled {settledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              {' '}{settledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>
                      {entry.note && <p className="text-[10px] text-[var(--ink)]/30 mt-0.5">{entry.note}</p>}
                    </div>
                    <div className="text-sm font-mono font-semibold text-[var(--ink)]">
                      {formatCurrency(entry.amount)}
                    </div>
                    <button
                      onClick={() => handleUnsettle(entry.id)}
                      className="p-1.5 rounded-lg text-[var(--ink)]/30 hover:text-[var(--pumpkin)] hover:bg-[var(--pumpkin)]/10 transition-all cursor-pointer shrink-0"
                      title="Undo settle"
                    >
                      <i className="ti ti-rotate text-xs" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* EMPTY STATE */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--mint)' }}
            >
              <i className="ti ti-checkup-circle text-[var(--ink)] text-2xl" />
            </div>
            <h3 className="text-lg font-bold font-display text-[var(--ink)] mb-1">Abhi koi settled nahi</h3>
            <p className="text-sm text-[var(--ink)]/50 mb-4">Jab koi entry settle karoge yahan dikh jayegi</p>
            <button
              onClick={() => navigate('/account')}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--cream)] transition-colors cursor-pointer"
              style={{ background: 'var(--pumpkin)' }}
            >
              <i className="ti ti-plus mr-1" />
              Naya Hisab Add Karo
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* UNSETTLE CONFIRMATION MODAL */}
      <AnimatePresence>
        {unsettleConfirmEntry && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setUnsettleConfirmEntry(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="ink-border rounded-2xl p-5 w-full max-w-xs" style={{ background: 'var(--cream)' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--pumpkin)' }}>
                  <i className="ti ti-rotate text-[var(--cream)] text-lg" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--ink)]">Entry Wapas Laoge?</h3>
                  <p className="text-[10px] text-[var(--ink)]/40">Yeh entry phir se active ho jayegi</p>
                </div>
              </div>
              <div className="ink-border rounded-xl p-3 mb-4" style={{ background: 'var(--cream-2)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-[var(--ink)]">{unsettleConfirmEntry.personName}</span>
                  <span className="text-sm font-mono font-bold text-[var(--crimson)]">{formatCurrency(unsettleConfirmEntry.amount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: unsettleConfirmEntry.type === 'diya' ? 'rgba(220,38,38,0.08)' : 'rgba(34,197,94,0.08)', color: unsettleConfirmEntry.type === 'diya' ? 'var(--crimson)' : 'var(--mint)' }}>
                    {unsettleConfirmEntry.type === 'diya' ? 'Diya (Gave)' : 'Liya (Received)'}
                  </span>
                  {unsettleConfirmEntry.note && <span className="text-[10px] text-[var(--ink)]/40">{unsettleConfirmEntry.note}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setUnsettleConfirmEntry(null)} className="flex-1 btn-secondary py-2.5 text-sm">Cancel</button>
                <button onClick={confirmUnsettle} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'var(--pumpkin)', color: 'var(--cream)' }}>
                  Haan, Undo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 ink-border rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: 'var(--cream)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--pumpkin)' }}>
              <i className="ti ti-rotate text-[var(--cream)] text-sm" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">{toast.person} — {formatCurrency(toast.amount)} wapas active</p>
              <p className="text-[10px] text-[var(--ink)]/40">Entry phir se active ho gayi</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
