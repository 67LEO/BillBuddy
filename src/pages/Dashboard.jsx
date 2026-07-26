import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { stagger, fadeUp, scaleIn } from '../utils/animations';
import AnimatedCounter from '../components/AnimatedCounter';
import { calculateRunningBalances, getAccountStats } from '../utils/accountUtils';

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

function CreateGroupModal({ onClose }) {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState([{ name: '', mobile: '' }, { name: '', mobile: '' }]);

  const addMember = () => {
    if (members.length < 20) setMembers([...members, { name: '', mobile: '' }]);
  };

  const removeMember = (idx) => {
    if (members.length > 2) setMembers(members.filter((_, i) => i !== idx));
  };

  const updateMember = (idx, field, value) => {
    const updated = [...members];
    updated[idx] = { ...updated[idx], [field]: value };
    setMembers(updated);
  };

  const create = () => {
    if (!groupName.trim()) return;
    const valid = members.filter((m) => m.name.trim());
    if (valid.length < 2) return;
    dispatch({
      type: 'CREATE_GROUP',
      payload: {
        name: groupName.trim(),
        members: valid.map((m, i) => ({
          name: m.name.trim(),
          mobile: m.mobile.trim(),
          color: AVATAR_COLORS[i % AVATAR_COLORS.length],
        })),
      },
    });
    onClose();
    navigate('/dashboard');
  };

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
        initial={isMobile ? { y: '100%', opacity: 1 } : { scale: 0.92, opacity: 0, y: 24 }}
        animate={isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
        exit={isMobile ? { y: '100%', opacity: 1 } : { scale: 0.96, opacity: 0, y: 12 }}
        transition={isMobile ? { type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] } : { type: 'spring', damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="modal-content"
      >
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[var(--ink)] font-display">Naya Group Banao</h2>
            <p className="text-[var(--ink)]/60 text-sm mt-0.5">Naam do aur members add karo</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[var(--ink)]/50 hover:text-[var(--ink)] cursor-pointer">
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        <div className="modal-scroll">
        <div className="modal-body space-y-4">
          <div>
            <label className="label">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Jaise: Hostel Boys, Office Team..."
              className="input"
              autoFocus
            />
          </div>

          <div>
            <label className="label">
              Members <span className="text-[var(--ink)]/40">({members.length})</span>
            </label>
            <div className="space-y-2">
              {members.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-2"
                >
                  <div
                    className="avatar-solid shrink-0"
                    style={{ width: 32, height: 32, background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {m.name ? m.name[0].toUpperCase() : (i + 1)}
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => updateMember(i, 'name', e.target.value)}
                      placeholder={`Member ${i + 1}`}
                      className="input flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && addMember()}
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/30 text-xs pointer-events-none">+91</span>
                      <input
                        type="tel"
                        value={m.mobile}
                        onChange={(e) => updateMember(i, 'mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Mobile"
                        className="input w-full sm:w-28"
                        style={{ paddingLeft: '2.8rem' }}
                      />
                    </div>
                  </div>
                  {members.length > 2 && (
                    <button
                      onClick={() => removeMember(i)}
                      className="p-2 rounded-lg text-[var(--ink)]/40 hover:text-[var(--crimson)] hover:bg-[var(--crimson)]/10 transition-all cursor-pointer"
                    >
                      <i className="ti ti-trash text-sm" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
            <button
              onClick={addMember}
              className="mt-3 w-full py-2.5 rounded-xl border-2 border-dashed border-[var(--ink)]/15 text-[var(--ink)]/50 hover:text-[var(--ink)] hover:border-[var(--ink)]/30 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="ti ti-plus text-base" /> Member Add Karo
            </button>
          </div>
        </div>

        <div className="modal-footer flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1 py-3">Cancel</button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={create}
            disabled={!groupName.trim() || members.filter((m) => m.name.trim()).length < 2}
            className="btn-crimson flex-1 py-3"
          >
            Group Banao
          </motion.button>
        </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

function GroupCard({ group, index, stats, onClick, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.06, type: 'spring', damping: 20, stiffness: 200 }}
      onClick={onClick}
      className="flap-card cursor-pointer group relative p-4 sm:p-5"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-3 right-3 p-2 rounded-lg text-[var(--ink)]/40 hover:text-[var(--crimson)] hover:bg-[var(--crimson)]/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer z-10"
      >
        <i className="ti ti-trash text-sm" />
      </button>

      {/* Washi tape accent */}
      <div
        className="washi absolute -top-2 -rotate-2 z-10"
        style={{
          width: '70px',
          left: '16px',
          height: '14px',
          background: index % 3 === 0 ? 'var(--mint)' : index % 3 === 1 ? 'var(--pumpkin)' : 'var(--crimson)',
          opacity: 0.7,
          borderRadius: '3px',
        }}
      />

      <div className="avatar-stack mb-3 mt-2">
        {group.members.slice(0, 5).map((m) => (
          <div
            key={m.id}
            className="avatar-solid"
            style={{ width: 34, height: 34, background: m.color }}
          >
            <span className="text-[var(--cream)]">{m.name[0].toUpperCase()}</span>
          </div>
        ))}
        {group.members.length > 5 && (
          <div
            className="avatar-solid"
            style={{ width: 34, height: 34, background: 'rgba(58,44,92,0.15)' }}
          >
            <span className="text-[var(--ink)]/50 text-[10px]">+{group.members.length - 5}</span>
          </div>
        )}
      </div>

      <h3 className="text-base font-semibold text-[var(--ink)] mb-1 font-display">{group.name}</h3>
      <div className="text-xs text-[var(--ink)]/50 mb-3">{group.members.length} members</div>

      <div className="flex items-center justify-between pt-3 border-t border-[var(--ink)]/10">
        <div>
          <div className="text-xs text-[var(--ink)]/50">{stats.count} expenses</div>
          <div className="text-lg font-bold text-[var(--ink)] font-display">
            ₹{stats.total.toLocaleString('en-IN')}
          </div>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--mint)', color: 'var(--ink)' }}
        >
          <i className="ti ti-arrow-right group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [unsettleConfirmEntry, setUnsettleConfirmEntry] = useState(null);
  const [toast, setToast] = useState(null);

  const getGroupStats = (groupId) => {
    const expenses = state.expenses.filter((e) => e.groupId === groupId);
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    return { count: expenses.length, total };
  };

  const weeklyTotal = state.expenses
    .filter((e) => {
      const d = new Date(e.date);
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return d >= start;
    })
    .reduce((s, e) => s + e.amount, 0);

  const totalSpent = state.expenses.reduce((s, e) => s + e.amount, 0);

  const accountStats = useMemo(() => getAccountStats(state.accounts), [state.accounts]);
  const accountBalances = useMemo(() => calculateRunningBalances(state.accounts), [state.accounts]);
  const pendingPersons = useMemo(() =>
    Object.values(accountBalances).filter((b) => Math.abs(b.net) > 0.01),
  [accountBalances]);

  const recentSettled = useMemo(() =>
    state.accounts
      .filter((a) => a.isSettled)
      .sort((a, b) => new Date(b.settledAt || b.date) - new Date(a.settledAt || a.date))
      .slice(0, 3),
  [state.accounts]);

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

  const statCards = [
    { label: 'Total Groups', value: state.groups.length, numeric: true, color: 'var(--ink)' },
    { label: 'Total Expenses', value: state.expenses.length, numeric: true, color: 'var(--crimson)' },
    { label: 'Total Spent', value: totalSpent, prefix: '₹', color: 'var(--pumpkin)' },
    { label: 'This Week', value: weeklyTotal, prefix: '₹', color: 'var(--mint)' },
  ];

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="flex items-center justify-between mb-8"
        >
          <motion.div variants={fadeUp}>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--ink)]">
              Tere Groups
            </h1>
            <p className="text-[var(--ink)]/60 text-sm mt-1">Koi naya group bana ya purana khol</p>
          </motion.div>
          <motion.button
            variants={scaleIn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreate(true)}
            className="btn-crimson px-3.5 sm:px-5 py-2.5 text-sm font-semibold"
          >
            <i className="ti ti-plus text-lg" />
            <span className="hidden sm:inline">Naya Group</span>
          </motion.button>
        </motion.div>

        {/* STATS */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8"
        >
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="flap-card p-4 sm:p-5"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: stat.color }}>
                <i className="ti ti-chart-bar text-[var(--cream)] text-sm" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[var(--ink)] font-display">
                <AnimatedCounter value={stat.value} prefix={stat.prefix || ''} />
              </div>
              <div className="text-xs text-[var(--ink)]/50 mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* QUICK ACTIONS + FEATURE CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate('/calculator')}
              className="flap-card p-4 sm:p-5 cursor-pointer"
              style={{ background: 'var(--pumpkin)', color: 'var(--ink)', borderColor: 'var(--ink)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                  >
                    <i className="ti ti-calculator text-lg" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base font-display">Quick Bill</div>
                    <div className="text-xs opacity-70">Items add karo, split karo</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {state.bills.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                      {state.bills.length}
                    </span>
                  )}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--cream)', color: 'var(--ink)' }}
                  >
                    <i className="ti ti-arrow-right" />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate('/account')}
              className="flap-card p-4 sm:p-5 cursor-pointer"
              style={{ background: 'var(--cream-2)', borderColor: 'var(--ink)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--ink)', color: 'var(--cream)' }}
                  >
                    <i className="ti ti-wallet text-lg" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base font-display">Account</div>
                    <div className="text-xs opacity-70">Diya / Liya hisab rakhlo</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {accountStats.totalEntries > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                      {accountStats.totalEntries}
                    </span>
                  )}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--mint)', color: 'var(--ink)' }}
                  >
                    <i className="ti ti-arrow-right" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-2 mb-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/contacts')}
              className="flex-1 ink-border rounded-xl py-3 px-3 flex items-center justify-center gap-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--ink)]/5 transition-colors cursor-pointer"
              style={{ background: 'var(--cream-2)' }}
            >
              <i className="ti ti-notebook text-base" />
              <span className="hidden sm:inline">Contacts</span>
              <span className="sm:hidden">📒</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/profile')}
              className="flex-1 ink-border rounded-xl py-3 px-3 flex items-center justify-center gap-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--ink)]/5 transition-colors cursor-pointer"
              style={{ background: 'var(--cream-2)' }}
            >
              <i className="ti ti-user text-base" />
              <span className="hidden sm:inline">Profile</span>
              <span className="sm:hidden">👤</span>
            </motion.button>
          </div>

          {/* Pending Dues */}
          {pendingPersons.length > 0 && (
            <div className="ink-border rounded-2xl p-4" style={{ background: 'var(--cream-2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <i className="ti ti-alert-triangle text-[var(--pumpkin)] text-sm" />
                <span className="text-sm font-semibold text-[var(--ink)]">Pending Dues</span>
                <span className="text-xs text-[var(--ink)]/40">({pendingPersons.length})</span>
              </div>
              <div className="space-y-2">
                {pendingPersons.slice(0, 3).map((b) => (
                  <div key={b.name} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--ink)]">{b.name}</span>
                    <span className="font-mono font-semibold" style={{ color: b.net > 0 ? 'var(--ink)' : 'var(--crimson)' }}>
                      {b.net > 0 ? `+₹${b.net.toLocaleString('en-IN')}` : `-₹${Math.abs(b.net).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                ))}
                {pendingPersons.length > 3 && (
                  <button
                    onClick={() => navigate('/account')}
                    className="text-xs text-[var(--pumpkin)] hover:underline cursor-pointer"
                  >
                    +{pendingPersons.length - 3} aur dekho →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recent Settlements */}
          {recentSettled.length > 0 && (
            <div className="ink-border rounded-2xl p-4" style={{ background: 'rgba(34,197,94,0.04)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <i className="ti ti-checkup-circle text-[var(--mint)] text-sm" />
                  <span className="text-sm font-semibold text-[var(--ink)]">Recent Settlements</span>
                </div>
                <button onClick={() => navigate('/account/settled-history')} className="text-[10px] text-[var(--pumpkin)] hover:underline cursor-pointer">View All →</button>
              </div>
              <div className="space-y-2">
                {recentSettled.map((entry) => {
                  const settledDate = entry.settledAt ? new Date(entry.settledAt) : null;
                  return (
                    <div key={entry.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--mint)' }}>
                        <i className="ti ti-check text-[var(--ink)] text-[10px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-[var(--ink)]">{entry.personName}</span>
                        {settledDate && (
                          <span className="text-[10px] text-[var(--ink)]/40 ml-2">
                            {settledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-mono font-semibold text-[var(--ink)]">₹{entry.amount.toLocaleString('en-IN')}</span>
                      <button
                        onClick={() => handleUnsettle(entry.id)}
                        className="p-1 rounded-lg text-[var(--ink)]/20 hover:text-[var(--pumpkin)] hover:bg-[var(--pumpkin)]/10 transition-all cursor-pointer shrink-0"
                        title="Undo settle"
                      >
                        <i className="ti ti-rotate text-[10px]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* GROUPS */}
        {state.groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 sm:py-24"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15, delay: 0.15 }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'var(--mint)' }}
            >
              <i className="ti ti-users text-[var(--ink)] text-2xl" />
            </motion.div>
            <h3 className="text-lg sm:text-xl font-semibold text-[var(--ink)] mb-2 font-display">Koi group nahi hai abhi</h3>
            <p className="text-[var(--ink)]/60 text-sm mb-6 px-4">Pehla group bana aur expenses track karna shuru kar</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreate(true)}
              className="btn-crimson px-6 py-3 font-semibold"
            >
              Pehla Group Banao
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            <AnimatePresence>
              {state.groups.map((group, i) => {
                const stats = getGroupStats(group.id);
                return (
                  <GroupCard
                    key={group.id}
                    group={group}
                    index={i}
                    stats={stats}
                    onClick={() => {
                      dispatch({ type: 'SET_ACTIVE_GROUP', payload: group.id });
                      navigate(`/group/${group.id}`);
                    }}
                    onDelete={() => {
                      if (confirm('Yeh group delete ho jayega. Sure hai?')) {
                        dispatch({ type: 'DELETE_GROUP', payload: group.id });
                      }
                    }}
                  />
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* SHARED GROUPS */}
        {state.sharedGroups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <i className="ti ti-link text-[var(--pumpkin)] text-sm" />
              <h2 className="text-lg font-bold text-[var(--ink)] font-display">Shared With You</h2>
              <span className="text-xs text-[var(--ink)]/40">({state.sharedGroups.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {state.sharedGroups.map((group, i) => {
                const expenses = state.sharedExpenses.filter((e) => e.groupId === group.id);
                const total = expenses.reduce((s, e) => s + e.amount, 0);
                return (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => {
                      dispatch({ type: 'SET_ACTIVE_GROUP', payload: group.id });
                      navigate(`/group/${group.id}`);
                    }}
                    className="flap-card cursor-pointer group relative p-4 sm:p-5"
                    style={{ borderStyle: 'dashed', borderColor: 'var(--pumpkin)' }}
                  >
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--pumpkin)', color: 'var(--cream)' }}>
                      <i className="ti ti-link mr-1" />Shared
                    </div>

                    <div className="avatar-stack mb-3 mt-2">
                      {group.members.slice(0, 5).map((m) => (
                        <div key={m.id} className="avatar-solid" style={{ width: 34, height: 34, background: m.color }}>
                          <span className="text-[var(--cream)]">{m.name[0].toUpperCase()}</span>
                        </div>
                      ))}
                    </div>

                    <h3 className="text-base font-semibold text-[var(--ink)] mb-1 font-display">{group.name}</h3>
                    <div className="text-xs text-[var(--ink)]/50 mb-1">{group.members.length} members</div>
                    <div className="text-[10px] text-[var(--pumpkin)] mb-3">
                      <i className="ti ti-user mr-1" />{group.sharedBy} ne share kiya
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--ink)]/10">
                      <div>
                        <div className="text-xs text-[var(--ink)]/50">{expenses.length} expenses</div>
                        <div className="text-lg font-bold text-[var(--ink)] font-display">₹{total.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--pumpkin)', color: 'var(--cream)' }}>
                        <i className="ti ti-arrow-right group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

      </motion.div>

      <AnimatePresence>
        {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>

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
                  <span className="text-sm font-mono font-bold text-[var(--crimson)]">₹{unsettleConfirmEntry.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: unsettleConfirmEntry.type === 'diya' ? 'rgba(220,38,38,0.08)' : 'rgba(34,197,94,0.08)', color: unsettleConfirmEntry.type === 'diya' ? 'var(--crimson)' : 'var(--mint)' }}>
                    {unsettleConfirmEntry.type === 'diya' ? 'Diya (Gave)' : 'Liya (Received)'}
                  </span>
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
              <p className="text-sm font-semibold text-[var(--ink)]">{toast.person} — ₹{toast.amount.toLocaleString('en-IN')} wapas active</p>
              <p className="text-[10px] text-[var(--ink)]/40">Entry phir se active ho gayi</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
