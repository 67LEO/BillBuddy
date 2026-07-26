import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { stagger, fadeUp } from '../utils/animations';
import { getAccountStats } from '../utils/accountUtils';

export default function Profile() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { user, logout } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [mobile, setMobile] = useState('');
  const [mobile2, setMobile2] = useState('');
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (state.profile) {
      setDisplayName(state.profile.displayName || '');
      setMobile(state.profile.mobile || '');
      setMobile2(state.profile.mobile2 || '');
    }
  }, [state.profile]);

  const stats = getAccountStats(state.accounts);

  const handleSave = async () => {
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    setShowConfirm(false);
    try {
      dispatch({ type: 'UPDATE_PROFILE', payload: { displayName: displayName.trim(), mobile: mobile.trim(), mobile2: mobile2.trim() } });
    } catch (e) {
      console.error('Profile update failed:', e);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-4 sm:px-6 lg:px-12 max-w-3xl mx-auto relative z-10">
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
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--ink)]">Mera Profile</h1>
          </motion.div>
        </motion.div>

        {/* PROFILE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="ink-border rounded-2xl p-5 sm:p-6 mb-6"
          style={{ background: 'var(--cream-2)' }}
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--ink)' }}>
              <span className="font-display text-[var(--cream)] text-2xl italic font-bold">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--ink)] font-display">
                {displayName || user?.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-sm text-[var(--ink)]/50">{user?.email || ''}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tera naam..."
                className="input"
              />
            </div>
            <div>
              <label className="label">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink)]/40 text-sm pointer-events-none">+91</span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="input"
                  style={{ paddingLeft: '3.5rem' }}
                />
              </div>
            </div>
            <div>
              <label className="label">Mobile Number 2 <span className="text-[var(--ink)]/30 text-xs">(optional)</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink)]/40 text-sm pointer-events-none">+91</span>
                <input
                  type="tel"
                  value={mobile2}
                  onChange={(e) => setMobile2(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Dusra number..."
                  className="input"
                  style={{ paddingLeft: '3.5rem' }}
                />
              </div>
              <div className="text-xs text-[var(--ink)]/40 mt-1">Max 2 numbers — doosra number optional hai</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="btn-crimson w-full py-3"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </motion.button>
          </div>
        </motion.div>

        {/* STATS */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="flap-card p-4 text-center">
            <div className="text-xl font-bold text-[var(--ink)] font-display">{state.contacts.length}</div>
            <div className="text-xs text-[var(--ink)]/50 mt-0.5">Contacts</div>
          </div>
          <div className="flap-card p-4 text-center">
            <div className="text-xl font-bold text-[var(--ink)] font-display">{stats.totalEntries}</div>
            <div className="text-xs text-[var(--ink)]/50 mt-0.5">Entries</div>
          </div>
          <div className="flap-card p-4 text-center">
            <div className="text-xl font-bold text-[var(--crimson)] font-display">{stats.pendingCount}</div>
            <div className="text-xs text-[var(--ink)]/50 mt-0.5">Active Dues</div>
          </div>
        </motion.div>

        {/* QUICK LINKS */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2 mb-8"
        >
          <button
            onClick={() => navigate('/contacts')}
            className="w-full ink-border rounded-xl p-4 flex items-center gap-3 hover:bg-[var(--ink)]/5 transition-colors cursor-pointer text-left"
            style={{ background: 'var(--cream-2)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--pumpkin)' }}>
              <i className="ti ti-notebook text-[var(--ink)]" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[var(--ink)]">My Contacts</div>
              <div className="text-xs text-[var(--ink)]/50">{state.contacts.length} contacts saved</div>
            </div>
            <i className="ti ti-chevron-right text-[var(--ink)]/40" />
          </button>

          <button
            onClick={() => navigate('/account')}
            className="w-full ink-border rounded-xl p-4 flex items-center gap-3 hover:bg-[var(--ink)]/5 transition-colors cursor-pointer text-left"
            style={{ background: 'var(--cream-2)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--mint)' }}>
              <i className="ti ti-wallet text-[var(--ink)]" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[var(--ink)]">Hisab Account</div>
              <div className="text-xs text-[var(--ink)]/50">{stats.totalEntries} entries</div>
            </div>
            <i className="ti ti-chevron-right text-[var(--ink)]/40" />
          </button>
        </motion.div>

        {/* LOGOUT */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl text-sm font-semibold text-[var(--crimson)] border-2 border-[var(--crimson)]/20 hover:bg-[var(--crimson)]/10 transition-all cursor-pointer"
          >
            <i className="ti ti-logout mr-2" /> Logout
          </button>
        </motion.div>
      </motion.div>

      {/* CONFIRM SAVE MODAL */}
      {showConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(58,44,92,0.4)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="ink-border rounded-2xl p-6 w-full max-w-sm"
            style={{ background: 'var(--cream)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--pumpkin)' }}>
                <i className="ti ti-alert-triangle text-2xl text-[var(--ink)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--ink)] font-display mb-1">Details Confirm Karo?</h3>
              <p className="text-sm text-[var(--ink)]/50">Baad mein change nahi hoga. Ek baar check kar lo.</p>
            </div>

            <div className="rounded-xl p-4 mb-5 space-y-2" style={{ background: 'var(--cream-2)' }}>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--ink)]/50">Naam</span>
                <span className="font-semibold text-[var(--ink)]">{displayName || '(koi naam nahi)'}</span>
              </div>
              {mobile && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--ink)]/50">Mobile 1</span>
                  <span className="font-semibold text-[var(--ink)]">+91 {mobile}</span>
                </div>
              )}
              {mobile2 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--ink)]/50">Mobile 2</span>
                  <span className="font-semibold text-[var(--ink)]">+91 {mobile2}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-[var(--ink)]/50 border-2 border-[var(--ink)]/10 hover:bg-[var(--ink)]/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={confirmSave}
                disabled={saving}
                className="flex-1 btn-crimson py-3"
              >
                {saving ? 'Saving...' : 'Haan, Save Karo'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
