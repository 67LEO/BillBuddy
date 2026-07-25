import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getMemberExpenseSummary } from '../utils/settlementOptimizer';
import { stagger, fadeUp } from '../utils/animations';
import AnimatedCounter from '../components/AnimatedCounter';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';

const CHART_COLORS = ['var(--ink)', 'var(--crimson)', 'var(--pumpkin)', 'var(--mint)', '#818cf8', '#60a5fa', '#f472b6', '#a78bfa'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--cream-2)', border: '2px solid var(--ink)', boxShadow: '3px 3px 0 var(--ink)' }}>
      <p className="text-[var(--ink)]/60 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || 'var(--ink)' }} className="font-semibold">
          {p.name}: ₹{p.value.toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { groupId } = useParams();
  const { state } = useApp();
  const navigate = useNavigate();

  const group = state.groups.find((g) => g.id === groupId);
  const groupExpenses = useMemo(
    () => state.expenses.filter((e) => e.groupId === groupId).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [state.expenses, groupId]
  );

  const memberSummary = useMemo(() => {
    if (!group) return [];
    return getMemberExpenseSummary(groupExpenses, group.members);
  }, [groupExpenses, group]);

  const dailyData = useMemo(() => {
    const map = {};
    groupExpenses.forEach((e) => {
      const key = new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      if (!map[key]) map[key] = { day: key, total: 0 };
      map[key].total += e.amount;
    });
    return Object.values(map).slice(-14);
  }, [groupExpenses]);

  const memberBarData = useMemo(() => {
    return memberSummary.map((m) => ({
      name: m.name.length > 8 ? m.name.slice(0, 7) + '…' : m.name,
      paid: m.totalPaid,
      owes: Math.round(m.totalOwes),
    }));
  }, [memberSummary]);

  const pieData = useMemo(() => {
    return memberSummary
      .filter((m) => m.totalPaid > 0)
      .map((m) => ({ name: m.name, value: m.totalPaid }));
  }, [memberSummary]);

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

  const totalSpent = groupExpenses.reduce((s, e) => s + e.amount, 0);

  const statValues = [
    totalSpent,
    groupExpenses.length ? Math.round(totalSpent / groupExpenses.length) : 0,
    groupExpenses.length,
    group.members.length,
  ];

  const statColors = ['var(--ink)', 'var(--crimson)', 'var(--pumpkin)', 'var(--mint)'];
  const statLabels = ['Total Spent', 'Avg per Expense', 'Total Expenses', 'Members'];

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="mb-6 sm:mb-8">
          <motion.h1 variants={fadeUp} className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-[var(--ink)]">
            Analytics
          </motion.h1>
          <motion.p variants={fadeUp} className="text-[var(--ink)]/60 text-sm mt-1">{group.name} ka expense breakdown</motion.p>
        </motion.div>

        {/* TOP STATS */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          {statLabels.map((label, i) => (
            <motion.div key={i} variants={fadeUp} className="flap-card overflow-hidden relative p-4 sm:p-5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5"
                style={{ background: statColors[i] }}
              >
                <i className="ti ti-chart-bar text-[var(--cream)] text-sm" />
              </div>
              <div className="text-xs text-[var(--ink)]/50 mb-1">{label}</div>
              <div className="text-lg sm:text-2xl font-bold text-[var(--ink)] font-display">
                {i < 2 ? (
                  <AnimatedCounter value={statValues[i]} prefix="₹" />
                ) : (
                  <AnimatedCounter value={statValues[i]} />
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* MEMBER SUMMARY CARDS */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="ink-border rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8" style={{ background: 'var(--cream-2)' }}>
          <motion.h3 variants={fadeUp} className="label" style={{ marginBottom: '0.875rem' }}>Member Summary</motion.h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {memberSummary.map((m, i) => (
              <motion.div
                key={m.id}
                variants={fadeUp}
                className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl"
                style={{ background: 'rgba(58,44,92,0.03)', border: '1px solid rgba(58,44,92,0.08)' }}
              >
                <div
                  className="avatar-solid shrink-0"
                  style={{ background: m.color, width: 38, height: 38, fontSize: 13 }}
                >
                  <span className="text-[var(--cream)]">{m.name[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm text-[var(--ink)] font-medium truncate">{m.name}</div>
                  <div className="flex gap-2 sm:gap-3 text-[10px] sm:text-[11px]">
                    <span className="text-[var(--mint)]">Paid ₹{m.totalPaid.toLocaleString('en-IN')}</span>
                    <span className="text-[var(--crimson)]">Owes ₹{Math.round(m.totalOwes).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className={`text-base sm:text-lg font-bold font-display ${m.net >= 0 ? 'text-[var(--mint)]' : 'text-[var(--crimson)]'} shrink-0`}>
                  {m.net >= 0 ? '+' : ''}₹{Math.abs(m.net).toLocaleString('en-IN')}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* DAILY SPENDING */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flap-card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <i className="ti ti-trending-up text-[var(--crimson)]" />
              <h3 className="label" style={{ marginBottom: 0 }}>Daily Spending</h3>
            </div>
            <div className="h-52 sm:h-64">
              {dailyData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[var(--ink)]/40 text-sm">Abhi koi data nahi</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,44,92,0.08)" />
                    <XAxis dataKey="day" tick={{ fill: 'var(--ink)', fontSize: 10, opacity: 0.4 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'var(--ink)', fontSize: 10, opacity: 0.4 }} tickLine={false} axisLine={false} width={40} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Spent" fill="var(--crimson)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* CONTRIBUTION PIE */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flap-card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <i className="ti ti-chart-pie text-[var(--pumpkin)]" />
              <h3 className="label" style={{ marginBottom: 0 }}>Who Paid What</h3>
            </div>
            <div className="h-52 sm:h-64">
              {pieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[var(--ink)]/40 text-sm">Abhi koi data nahi</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 justify-center">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[var(--ink)]/60">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* MEMBER BAR CHART */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flap-card p-4 sm:p-5">
          <h3 className="label mb-3 sm:mb-4">Paid vs Owes per Member</h3>
          <div className="h-56 sm:h-72">
            {memberBarData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[var(--ink)]/40 text-sm">Abhi koi data nahi</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberBarData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,44,92,0.08)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--ink)', fontSize: 10, opacity: 0.4 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--ink)', fontSize: 10, opacity: 0.4 }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="paid" name="Paid" fill="var(--mint)" radius={[6, 6, 0, 0]} barSize={20} />
                  <Bar dataKey="owes" name="Owes" fill="var(--crimson)" radius={[6, 6, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
