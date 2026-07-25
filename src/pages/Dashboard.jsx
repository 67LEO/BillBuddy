import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { stagger, fadeUp, scaleIn } from '../utils/animations';
import AnimatedCounter from '../components/AnimatedCounter';

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
  const [members, setMembers] = useState([{ name: '' }, { name: '' }]);

  const addMember = () => {
    if (members.length < 20) setMembers([...members, { name: '' }]);
  };

  const removeMember = (idx) => {
    if (members.length > 2) setMembers(members.filter((_, i) => i !== idx));
  };

  const updateMember = (idx, name) => {
    const updated = [...members];
    updated[idx] = { name };
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
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => updateMember(i, e.target.value)}
                    placeholder={`Member ${i + 1}`}
                    className="input"
                    onKeyDown={(e) => e.key === 'Enter' && addMember()}
                  />
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

        {/* QUICK BILL CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
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
                  <div className="font-semibold text-sm sm:text-base font-display">Quick Bill Calculator</div>
                  <div className="text-xs opacity-70">Items add karo, total calculate karo</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {state.bills.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                    {state.bills.length} saved
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
      </motion.div>

      <AnimatePresence>
        {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  );
}
