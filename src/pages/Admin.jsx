import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fetchAllUsers, subscribeActiveUsers } from '../lib/supabase';
import { stagger, fadeUp } from '../utils/animations';
import AnimatedCounter from '../components/AnimatedCounter';
import rpcSql from '../../supabase-rpc.sql?raw';

const AVATAR_COLORS = [
  'var(--ink)', 'var(--crimson)', 'var(--pumpkin)', 'var(--mint)',
  'var(--ink)', 'var(--crimson)', 'var(--pumpkin)', 'var(--mint)',
];

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const maskMobile = (m) => {
  if (!m) return '';
  const digits = m.replace(/\D/g, '');
  if (digits.length !== 10) return m;
  return `${digits.slice(0, 2)}******${digits.slice(-2)}`;
};

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [search, setSearch] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    const channel = subscribeActiveUsers(setActiveUsers);
    return () => channel?.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetchAllUsers();
      if (!cancelled) {
        setUsers(res.users);
        setLoadError(res.error);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(rpcSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        (u.display_name || '').toLowerCase().includes(q) ||
        (u.mobile || '').includes(q) ||
        (u.mobile2 || '').includes(q)
    );
  }, [users, search]);

  const totals = useMemo(() => users.reduce(
    (acc, u) => ({
      groups: acc.groups + Number(u.groups_count || 0),
      expenses: acc.expenses + Number(u.expenses_count || 0),
      entries: acc.entries + Number(u.account_entries || 0),
      contacts: acc.contacts + Number(u.contacts_count || 0),
    }),
    { groups: 0, expenses: 0, entries: 0, contacts: 0 }
  ), [users]);

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        {/* HEADER */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="mb-6 sm:mb-8">
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl hover:bg-[var(--ink)]/5 transition-colors text-[var(--ink)]/50 hover:text-[var(--ink)] cursor-pointer"
            >
              <i className="ti ti-arrow-left text-lg" />
            </button>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--ink)' }}>
              <i className="ti ti-shield-lock text-[var(--cream)] text-base" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--ink)]">Admin Panel</h1>
          </motion.div>
          <motion.p variants={fadeUp} className="text-[var(--ink)]/60 text-sm ml-11">
            Total users, unki activity — sab ek jagah
          </motion.p>
        </motion.div>

        {loadError && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="ink-border rounded-2xl p-5 mb-6"
            style={{ background: 'rgba(194,61,61,0.06)' }}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--crimson)' }}>
                <i className="ti ti-alert-triangle text-[var(--cream)] text-lg" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--ink)] font-display">Database functions run nahi hui!</h3>
                <p className="text-sm text-[var(--ink)]/60 mt-0.5">
                  Admin panel ka data load karne ke liye Supabase me kuch SQL functions chahiye. 1 minute ka kaam hai —
                  neeche SQL copy karo, <span className="font-semibold">Supabase Dashboard → SQL Editor → Run</span> karo.
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={copySql}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[var(--cream)] transition-all cursor-pointer"
                style={{ background: 'var(--ink)' }}
              >
                <i className={`ti ti-${copied ? 'check' : 'clipboard-copy'} mr-1.5`} />
                {copied ? 'Copy Ho Gaya!' : 'SQL Copy Karo'}
              </button>
              <button
                onClick={() => setShowSql(!showSql)}
                className="btn-secondary px-4 py-2.5 text-sm"
              >
                <i className={`ti ti-chevron-${showSql ? 'up' : 'down'} mr-1`} />
                {showSql ? 'Chhupao' : 'SQL Dekho'}
              </button>
            </div>

            {showSql && (
              <div className="ink-border rounded-xl overflow-hidden" style={{ background: 'var(--cream-2)' }}>
                <pre className="p-3 text-[10px] leading-relaxed text-[var(--ink)]/70 overflow-auto max-h-60 whitespace-pre-wrap">
                  {rpcSql}
                </pre>
              </div>
            )}

            <p className="text-xs text-[var(--ink)]/50 mt-3">
              Run karne ke baad page refresh karo — sab theek dikhne lagega.
            </p>
          </motion.div>
        )}

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse" style={{ background: 'var(--ink)' }}>
              <span className="text-[var(--cream)] font-bold text-lg font-display">B</span>
            </div>
            <p className="text-[var(--ink)]/50 text-sm">Users load ho rahe hain...</p>
          </div>
        ) : (
          <>
            {/* ACTIVE USERS — ONLINE ABHI */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
              <div className="ink-border rounded-2xl p-4 sm:p-5" style={{ background: 'rgba(34,197,94,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#22c55e' }}>
                      <i className="ti ti-user-check text-[var(--cream)] text-base" />
                    </div>
                    <span
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                      style={{ background: '#22c55e', border: '2px solid var(--cream)' }}
                    >
                      <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(34,197,94,0.5)' }} />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl font-bold text-[var(--ink)] font-display">
                        <AnimatedCounter value={activeUsers.length} />
                      </span>
                      <span className="text-xs text-[var(--ink)]/50">Active Users</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(34,197,94,0.15)', color: '#15803d' }}>
                        <i className="ti ti-bolt text-[8px] mr-0.5" />Online Abhi
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--ink)]/40">
                      Abhi jo log app me active hain — real-time
                    </div>
                  </div>
                </div>
                {activeUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {activeUsers.slice(0, 8).map((u) => (
                      <span
                        key={u.user_id}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium"
                        style={{ background: 'rgba(34,197,94,0.12)', color: '#15803d' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
                        {u.email?.split('@')[0] || 'User'}
                      </span>
                    ))}
                    {activeUsers.length > 8 && (
                      <span className="px-2 py-1 rounded-full text-[10px] text-[var(--ink)]/50" style={{ background: 'rgba(58,44,92,0.06)' }}>
                        +{activeUsers.length - 8} aur
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* STAT CARDS */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6"
            >
              {[
                { label: 'Total Users', value: users.length, color: 'var(--ink)', icon: 'ti ti-users' },
                { label: 'Total Groups', value: totals.groups, color: 'var(--pumpkin)', icon: 'ti ti-users-group' },
                { label: 'Total Expenses', value: totals.expenses, color: 'var(--crimson)', icon: 'ti ti-receipt-2' },
                { label: 'Account Entries', value: totals.entries, color: 'var(--mint)', icon: 'ti ti-wallet' },
              ].map((stat, i) => (
                <motion.div key={i} variants={fadeUp} className="flap-card p-4 sm:p-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: stat.color }}>
                    <i className={`${stat.icon} text-sm`} style={{ color: stat.color === 'var(--mint)' ? 'var(--ink)' : 'var(--cream)' }} />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[var(--ink)] font-display">
                    <AnimatedCounter value={stat.value} />
                  </div>
                  <div className="text-xs text-[var(--ink)]/50 mt-0.5">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* SEARCH */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-5">
              <div className="relative">
                <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/40 text-sm" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search email, naam ya mobile..."
                  className="input"
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
            </motion.div>

            {/* USERS LIST */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--pumpkin)' }}>
                  <i className="ti ti-users text-[var(--cream)] text-2xl" />
                </div>
                <p className="text-[var(--ink)]/60 text-sm mb-1">Koi user nahi mila</p>
                <p className="text-[var(--ink)]/40 text-xs">{users.length === 0 ? 'Abhi koi user sign up nahi hua' : 'Search badal kar try karo'}</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
              >
                {filteredUsers.map((u, i) => (
                  <motion.div
                    key={u.user_id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.2) }}
                    className="ink-border rounded-2xl p-3.5"
                    style={{ background: 'var(--cream-2)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                      >
                        <span className="text-[var(--cream)] font-bold text-sm">
                          {(u.display_name || u.email || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[var(--ink)]">
                            {u.display_name || '(koi naam nahi)'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                            {formatDate(u.created_at)}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--ink)]/50 truncate">{u.email || '—'}</div>
                        <div className="text-[10px] text-[var(--ink)]/40 mt-0.5">
                          {u.mobile ? `+91 ${maskMobile(u.mobile)}` : 'No mobile'}
                          {u.mobile2 ? ` · +91 ${maskMobile(u.mobile2)}` : ''}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                        <span className="px-2 py-1 rounded-lg text-[10px] font-semibold" style={{ background: 'rgba(58,44,92,0.08)', color: 'var(--ink)' }}>
                          {u.groups_count || 0} groups
                        </span>
                        <span className="px-2 py-1 rounded-lg text-[10px] font-semibold" style={{ background: 'rgba(194,61,61,0.08)', color: 'var(--crimson)' }}>
                          {u.expenses_count || 0} exp
                        </span>
                        <span className="px-2 py-1 rounded-lg text-[10px] font-semibold" style={{ background: 'rgba(224,130,68,0.12)', color: 'var(--pumpkin)' }}>
                          {u.account_entries || 0} hisab
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
