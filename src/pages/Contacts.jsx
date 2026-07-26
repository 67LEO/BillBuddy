import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { stagger, fadeUp } from '../utils/animations';
import { calculateRunningBalances } from '../utils/accountUtils';

export default function Contacts() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const balances = useMemo(() => calculateRunningBalances(state.accounts), [state.accounts]);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return state.contacts;
    const q = search.toLowerCase();
    return state.contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.mobile.includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [state.contacts, search]);

  const resetForm = () => {
    setFormName('');
    setFormMobile('');
    setFormEmail('');
    setFormNotes('');
    setEditingId(null);
    setShowAdd(false);
  };

  const handleSubmit = () => {
    if (!formName.trim()) return;

    if (editingId) {
      dispatch({
        type: 'UPDATE_CONTACT',
        payload: {
          id: editingId,
          updates: { name: formName.trim(), mobile: formMobile.trim(), email: formEmail.trim(), notes: formNotes.trim() },
        },
      });
    } else {
      dispatch({
        type: 'ADD_CONTACT',
        payload: { name: formName.trim(), mobile: formMobile.trim(), email: formEmail.trim(), notes: formNotes.trim() },
      });
    }
    resetForm();
  };

  const startEdit = (contact) => {
    setEditingId(contact.id);
    setFormName(contact.name);
    setFormMobile(contact.mobile);
    setFormEmail(contact.email);
    setFormNotes(contact.notes);
    setShowAdd(true);
  };

  const handleDelete = (id) => {
    if (confirm('Yeh contact delete ho jayega?')) {
      dispatch({ type: 'DELETE_CONTACT', payload: id });
    }
  };

  const getLinkedGroups = (name) => {
    return state.groups.filter((g) => g.members.some((m) => m.name.toLowerCase() === name.toLowerCase()));
  };

  const getBalance = (name) => {
    return balances[name] || null;
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-4 sm:px-6 lg:px-12 max-w-3xl mx-auto relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        {/* HEADER */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="mb-6 sm:mb-8">
          <motion.div variants={fadeUp} className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-xl hover:bg-[var(--ink)]/5 transition-colors text-[var(--ink)]/50 hover:text-[var(--ink)] cursor-pointer"
              >
                <i className="ti ti-arrow-left text-lg" />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--ink)]">Contacts</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { resetForm(); setShowAdd(true); }}
              className="btn-crimson px-3.5 py-2.5 text-sm font-semibold"
            >
              <i className="ti ti-plus text-lg" />
              <span className="hidden sm:inline">Naya Contact</span>
            </motion.button>
          </motion.div>
          <motion.p variants={fadeUp} className="text-[var(--ink)]/60 text-sm ml-11">
            {state.contacts.length} contacts saved
          </motion.p>
        </motion.div>

        {/* SEARCH */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5"
        >
          <div className="relative">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/40 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="input"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
        </motion.div>

        {/* ADD/EDIT FORM */}
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ink-border rounded-2xl p-4 sm:p-5 mb-5"
            style={{ background: 'var(--cream-2)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--ink)]">
                {editingId ? 'Contact Edit Karo' : 'Naya Contact'}
              </h3>
              <button onClick={resetForm} className="p-1.5 rounded-lg text-[var(--ink)]/40 hover:text-[var(--ink)] cursor-pointer">
                <i className="ti ti-x text-sm" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Rahul, Neha..."
                  className="input"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Mobile <span className="text-[var(--ink)]/30">(optional)</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink)]/40 text-sm pointer-events-none">+91</span>
                  <input
                    type="tel"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="input"
                    style={{ paddingLeft: '3.5rem' }}
                  />
                </div>
              </div>
              <div>
                <label className="label">Email <span className="text-[var(--ink)]/30">(optional)</span></label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Notes <span className="text-[var(--ink)]/30">(optional)</span></label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Office colleague, friend..."
                  className="input"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={resetForm} className="btn-secondary flex-1 py-3">Cancel</button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={!formName.trim()}
                  className="btn-crimson flex-1 py-3"
                >
                  {editingId ? 'Update' : 'Save Contact'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* CONTACTS LIST */}
        {filteredContacts.length > 0 ? (
          <div className="space-y-2">
            <AnimatePresence>
              {filteredContacts.map((contact, i) => {
                const linkedGroups = getLinkedGroups(contact.name);
                const balance = getBalance(contact.name);

                return (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                    transition={{ delay: Math.min(i * 0.03, 0.15) }}
                    className="ink-border rounded-2xl p-4"
                    style={{ background: 'var(--cream-2)' }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: balance ? (balance.net > 0 ? 'var(--mint)' : 'rgba(194,61,61,0.1)') : 'var(--ink)' }}
                      >
                        <span className="font-display text-sm font-bold" style={{ color: balance ? (balance.net > 0 ? 'var(--ink)' : 'var(--crimson)') : 'var(--cream)' }}>
                          {contact.name[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[var(--ink)]">{contact.name}</div>
                        {contact.mobile && (
                          <div className="text-xs text-[var(--ink)]/50 mt-0.5">
                            <i className="ti ti-phone text-[9px] mr-1" />{contact.mobile}
                          </div>
                        )}
                        {contact.email && (
                          <div className="text-xs text-[var(--ink)]/40 mt-0.5">
                            <i className="ti ti-mail text-[9px] mr-1" />{contact.email}
                          </div>
                        )}
                        {linkedGroups.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {linkedGroups.map((g) => (
                              <span key={g.id} className="px-1.5 py-0.5 rounded-full text-[9px] font-medium" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                                {g.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {balance && Math.abs(balance.net) > 0.01 && (
                          <div className="mt-1.5 text-xs font-semibold" style={{ color: balance.net > 0 ? 'var(--ink)' : 'var(--crimson)' }}>
                            {balance.net > 0 ? `Owes you ${Math.abs(balance.net).toLocaleString('en-IN')}` : `You owe ${Math.abs(balance.net).toLocaleString('en-IN')}`}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => startEdit(contact)}
                          className="p-1.5 rounded-lg text-[var(--ink)]/40 hover:text-[var(--pumpkin)] hover:bg-[var(--pumpkin)]/10 transition-all cursor-pointer"
                        >
                          <i className="ti ti-pencil text-xs" />
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="p-1.5 rounded-lg text-[var(--ink)]/40 hover:text-[var(--crimson)] hover:bg-[var(--crimson)]/10 transition-all cursor-pointer"
                        >
                          <i className="ti ti-trash text-xs" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--pumpkin)' }}>
              <i className="ti ti-notebook text-[var(--cream)] text-2xl" />
            </div>
            <p className="text-[var(--ink)]/60 text-sm mb-1">{search ? 'Koi contact nahi mila' : 'Abhi koi contact nahi hai'}</p>
            <p className="text-[var(--ink)]/40 text-xs mb-4">
              {search ? 'Kuch aur dhundho' : 'Upar "+" se naya contact add karo'}
            </p>
            {!search && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAdd(true)}
                className="btn-crimson px-6 py-3 font-semibold"
              >
                Pehla Contact Add Karo
              </motion.button>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
