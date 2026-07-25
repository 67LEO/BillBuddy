import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { calculateAllBalances, getWeeklyBalances, getMonthlyBalances } from '../utils/splitCalculator';
import { stagger, fadeUp, scaleIn } from '../utils/animations';

const formatCurrency = (n) => `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const AVATAR_COLORS = [
  'var(--ink)', 'var(--crimson)', 'var(--pumpkin)', 'var(--mint)',
  'var(--ink)', 'var(--crimson)', 'var(--pumpkin)', 'var(--mint)',
];

function useIsMobile(bp = 640) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp}px)`);
    const fn = (e) => setM(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [bp]);
  return m;
}

function ExpenseModal({ group, expense, onClose }) {
  const { dispatch } = useApp();
  const isEdit = !!expense;
  const isMobile = useIsMobile();
  const [payerId, setPayerId] = useState(expense?.payerId || group.members[0]?.id || '');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [description, setDescription] = useState(expense?.description || '');
  const [presentMembers, setPresentMembers] = useState(expense?.presentMembers || group.members.map((m) => m.id));
  const [date, setDate] = useState(
    expense?.date
      ? new Date(expense.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );

  const toggleMember = (id) => {
    setPresentMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !payerId || presentMembers.length === 0 || !description.trim()) return;

    if (isEdit) {
      dispatch({
        type: 'UPDATE_EXPENSE',
        payload: {
          id: expense.id,
          updates: {
            payerId,
            amount: amt,
            description: description.trim(),
            presentMembers,
            date: new Date(date).toISOString(),
          },
        },
      });
    } else {
      dispatch({
        type: 'ADD_EXPENSE',
        payload: {
          groupId: group.id,
          payerId,
          amount: amt,
          description: description.trim(),
          presentMembers,
          date: new Date(date).toISOString(),
        },
      });
    }
    onClose();
  };

  const perPerson = presentMembers.length > 0 && amount
    ? (parseFloat(amount) / presentMembers.length)
    : 0;

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={isMobile ? { y: '100%', opacity: 1 } : { scale: 0.95, opacity: 0, y: 20 }}
        animate={isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
        exit={isMobile ? { y: '100%', opacity: 1 } : { scale: 0.95, opacity: 0 }}
        transition={isMobile ? { type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] } : { type: 'spring', damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="modal-content"
      >
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--ink)] font-display">{isEdit ? 'Expense Edit Karo' : 'Naya Expense'}</h2>
            <p className="text-[var(--ink)]/60 text-xs mt-0.5">Kaun kitna dega — auto-calculate</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[var(--ink)]/50 hover:text-[var(--ink)] cursor-pointer">
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        <div className="modal-scroll">
        <div className="modal-body space-y-4">
          {/* Description */}
          <div>
            <label className="label">Kya kharcha hua?</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dinner, Movie, Groceries..."
              className="input"
              autoFocus
            />
          </div>

          {/* Amount */}
          <div>
            <label className="label">Kitna paisa?</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--crimson)] font-semibold text-lg pointer-events-none">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0"
                className="input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            {perPerson > 0 && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-[var(--pumpkin)] mt-2"
              >
                {presentMembers.length} logon me divide = {formatCurrency(perPerson)} / each
              </motion.p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="label">Kab hua?</label>
            <div className="relative">
              <i className="ti ti-calendar absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink)]/40 pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          {/* Payer */}
          <div>
            <label className="label">Kisne paisa diya?</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {group.members.map((m) => (
                <motion.button
                  key={m.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setPayerId(m.id)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm transition-all cursor-pointer"
                  style={{
                    borderColor: payerId === m.id ? 'var(--crimson)' : 'rgba(58,44,92,0.12)',
                    color: payerId === m.id ? 'var(--crimson)' : 'var(--ink)',
                    background: payerId === m.id ? 'rgba(194,61,61,0.06)' : 'transparent',
                  }}
                >
                  <div className="avatar-solid" style={{ width: 24, height: 24, background: m.color, fontSize: 9 }}>
                    <span className="text-[var(--cream)]">{m.name[0].toUpperCase()}</span>
                  </div>
                  <span className="truncate">{m.name}</span>
                  {payerId === m.id && <i className="ti ti-check ml-auto text-[var(--crimson)] shrink-0" />}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Present Members */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label" style={{ marginBottom: 0 }}>Kaun kaun tha maujud?</label>
              <button
                onClick={() => setPresentMembers(
                  presentMembers.length === group.members.length ? [] : group.members.map((m) => m.id)
                )}
                className="text-xs text-[var(--pumpkin)] hover:text-[var(--crimson)] cursor-pointer"
              >
                {presentMembers.length === group.members.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {group.members.map((m) => {
                const present = presentMembers.includes(m.id);
                return (
                  <motion.button
                    key={m.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => toggleMember(m.id)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm transition-all cursor-pointer"
                    style={{
                      borderColor: present ? 'var(--mint)' : 'rgba(58,44,92,0.12)',
                      color: present ? 'var(--ink)' : 'var(--ink)',
                      background: present ? 'rgba(168,214,184,0.15)' : 'transparent',
                      opacity: present ? 1 : 0.5,
                    }}
                  >
                    <div className="avatar-solid" style={{ width: 24, height: 24, background: m.color, fontSize: 9 }}>
                      <span className="text-[var(--cream)]">{m.name[0].toUpperCase()}</span>
                    </div>
                    <span className="truncate">{m.name}</span>
                    {present && <i className="ti ti-check ml-auto text-[var(--mint)] shrink-0" />}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1 py-3">Cancel</button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={submit}
            disabled={!amount || parseFloat(amount) <= 0 || !description.trim() || presentMembers.length === 0}
            className="btn-crimson flex-1 py-3"
          >
            {isEdit ? 'Save Karo' : 'Add Karo'}
          </motion.button>
        </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

export default function GroupView() {
  const { groupId } = useParams();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [period, setPeriod] = useState('all');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  const group = state.groups.find((g) => g.id === groupId);
  const groupExpenses = useMemo(
    () => state.expenses.filter((e) => e.groupId === groupId).sort((a, b) => new Date(b.date) - new Date(a.date)),
    [state.expenses, groupId]
  );

  const balances = useMemo(() => {
    if (period === 'weekly') return getWeeklyBalances(groupExpenses, group?.members || []);
    if (period === 'monthly') return getMonthlyBalances(groupExpenses, group?.members || []);
    return calculateAllBalances(groupExpenses, group?.members || []);
  }, [groupExpenses, group, period]);

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl text-[var(--ink)] mb-2 font-display">Group nahi mila</h2>
          <button onClick={() => navigate('/dashboard')} className="text-[var(--crimson)] cursor-pointer text-sm">Dashboard pe jao →</button>
        </div>
      </div>
    );
  }

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    dispatch({
      type: 'ADD_MEMBER',
      payload: {
        groupId,
        name: newMemberName.trim(),
        color: AVATAR_COLORS[group.members.length % AVATAR_COLORS.length],
      },
    });
    setNewMemberName('');
    setShowAddMember(false);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setShowExpenseModal(true);
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setShowExpenseModal(true);
  };

  const closeExpenseModal = () => {
    setShowExpenseModal(false);
    setEditingExpense(null);
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--ink)]">{group.name}</h1>
            <p className="text-[var(--ink)]/60 text-xs sm:text-sm mt-1">
              {group.members.length} members · {groupExpenses.length} expenses
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/settlement/${groupId}`)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors"
              style={{ background: 'var(--mint)', color: 'var(--ink)', border: '2px solid var(--ink)' }}
            >
              <i className="ti ti-arrow-right" />
              Settle Up
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={openAddModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer btn-crimson"
            >
              <i className="ti ti-plus" />
              Add Expense
            </motion.button>
          </div>
        </div>

        {/* MEMBERS BAR */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="ink-border rounded-2xl p-3 sm:p-4 mb-5" style={{ background: 'var(--cream-2)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-chart-bar text-sm" /> Members & Balances
            </span>
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="text-xs text-[var(--crimson)] hover:text-[var(--pumpkin)] flex items-center gap-1 cursor-pointer"
            >
              <i className="ti ti-user-plus text-sm" /> Add
            </button>
          </div>
          {showAddMember && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Naam likho..."
                className="input"
                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                autoFocus
              />
              <button onClick={handleAddMember} className="px-3 py-2 rounded-lg text-sm cursor-pointer" style={{ background: 'var(--mint)', color: 'var(--ink)' }}>
                Add
              </button>
            </motion.div>
          )}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {group.members.map((m) => {
              const bal = balances[m.id];
              const net = bal?.net || 0;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl"
                  style={{ background: 'rgba(58,44,92,0.04)', border: '1px solid rgba(58,44,92,0.08)' }}
                >
                  <div className="avatar-solid" style={{ width: 30, height: 30, background: m.color, fontSize: 10 }}>
                    <span className="text-[var(--cream)]">{m.name[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-[var(--ink)] font-medium">{m.name}</div>
                    <div className={`text-[10px] sm:text-xs font-mono ${net > 0 ? 'text-[var(--mint)]' : net < 0 ? 'text-[var(--crimson)]' : 'text-[var(--ink)]/40'}`}>
                      {net > 0 ? `Gets ${formatCurrency(net)}` : net < 0 ? `Owes ${formatCurrency(net)}` : 'Settled'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* PERIOD TOGGLE */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex items-center gap-1.5 sm:gap-2 mb-5 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'All Time' },
            { key: 'monthly', label: 'This Month' },
            { key: 'weekly', label: 'This Week' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap"
              style={
                period === p.key
                  ? { background: 'var(--ink)', color: 'var(--cream)' }
                  : { color: 'var(--ink)', background: 'rgba(58,44,92,0.05)', border: '1px solid rgba(58,44,92,0.1)' }
              }
            >
              {p.label}
            </button>
          ))}
        </motion.div>

        {/* EXPENSES LIST */}
        <div className="space-y-2 sm:space-y-3">
          {groupExpenses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 sm:py-16"
            >
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 14, delay: 0.1 }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--mint)' }}
              >
                <i className="ti ti-receipt text-[var(--ink)] text-xl" />
              </motion.div>
              <h3 className="text-base sm:text-lg font-semibold text-[var(--ink)] mb-1 font-display">Koi expense nahi</h3>
              <p className="text-[var(--ink)]/60 text-sm">Pehla expense add karo</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {groupExpenses.map((expense, i) => {
                const payer = group.members.find((m) => m.id === expense.payerId);
                const perPerson = expense.amount / expense.presentMembers.length;
                const presentNames = expense.presentMembers
                  .map((id) => group.members.find((m) => m.id === id)?.name)
                  .filter(Boolean);
                const expenseDate = new Date(expense.date);
                const isToday = expenseDate.toDateString() === new Date().toDateString();

                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                    transition={{ delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
                    className="ink-border rounded-2xl p-3 sm:p-4 group"
                    style={{ background: 'var(--cream-2)' }}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                        <div
                          className="avatar-solid shrink-0"
                          style={{ width: 38, height: 38, background: payer?.color || 'var(--ink)', fontSize: 13 }}
                        >
                          <span className="text-[var(--cream)]">{payer?.name?.[0]?.toUpperCase() || '?'}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="text-[var(--ink)] font-medium text-xs sm:text-sm">{expense.description}</span>
                            <span className="text-[var(--ink)]/30 text-[10px]">·</span>
                            <span className="text-[var(--ink)]/50 text-[10px] sm:text-xs flex items-center gap-1">
                              <i className="ti ti-clock text-[9px]" />
                              {isToday ? 'Aaj' : expenseDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <div className="text-[10px] sm:text-xs text-[var(--ink)]/50 mt-0.5 sm:mt-1">
                            <span className="text-[var(--ink)]/70">{payer?.name}</span> ne diya · {presentNames.length} log me split · {formatCurrency(perPerson)}/each
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
                            {presentNames.slice(0, 5).map((name, j) => (
                              <span key={j} className="inline-block px-2 py-0.5 rounded-full text-[9px] font-medium" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                                {name}
                              </span>
                            ))}
                            {presentNames.length > 5 && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[9px]" style={{ background: 'rgba(58,44,92,0.1)', color: 'var(--ink)' }}>
                                +{presentNames.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base sm:text-lg font-bold text-[var(--ink)] font-display">{formatCurrency(expense.amount)}</div>
                        {/* Action buttons — always visible on mobile, hover on desktop */}
                        <div className="flex items-center justify-end gap-1 mt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(expense)}
                            className="p-1.5 rounded-lg text-[var(--ink)]/40 hover:text-[var(--pumpkin)] hover:bg-[var(--pumpkin)]/10 transition-all cursor-pointer"
                          >
                            <i className="ti ti-pencil text-xs" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Yeh expense delete ho jayega?')) {
                                dispatch({ type: 'DELETE_EXPENSE', payload: expense.id });
                              }
                            }}
                            className="p-1.5 rounded-lg text-[var(--ink)]/40 hover:text-[var(--crimson)] hover:bg-[var(--crimson)]/10 transition-all cursor-pointer"
                          >
                            <i className="ti ti-trash text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showExpenseModal && (
          <ExpenseModal
            group={group}
            expense={editingExpense}
            onClose={closeExpenseModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
