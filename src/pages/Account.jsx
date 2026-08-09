import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { stagger, fadeUp } from '../utils/animations';
import { evaluateExpression, formatAmountPreview } from '../utils/mathParser';
import {
  calculateRunningBalances,
  getFilteredAccounts,
  getAccountStats,
  getUniquePersons,
  groupAccountsByPerson,
  DEFAULT_CATEGORIES,
} from '../utils/accountUtils';
import { exportCSV, exportPDF, generateShareText, shareGeneric } from '../utils/exportUtils';
import { optimizeAccountSettlements } from '../utils/accountUtils';

const formatCurrency = (n) => `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function Account() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('diya');
  const [category, setCategory] = useState('general');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [batchDate, setBatchDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterDate, setFilterDate] = useState('all');

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showAddSavedPerson, setShowAddSavedPerson] = useState(false);
  const [savedPersonName, setSavedPersonName] = useState('');
  const [savedPersonAmount, setSavedPersonAmount] = useState('');
  const [savedPersonType, setSavedPersonType] = useState('diya');
  const [savedPersonCategory, setSavedPersonCategory] = useState('general');
  const [showAddSavedItem, setShowAddSavedItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [entryMode, setEntryMode] = useState('direct');
  const [batchItems, setBatchItems] = useState([]);
  const [batchPersonName, setBatchPersonName] = useState('');
  const [batchType, setBatchType] = useState('diya');
  const [batchCategory, setBatchCategory] = useState('general');
  const [batchItemName, setBatchItemName] = useState('');
  const [batchItemPrice, setBatchItemPrice] = useState('');
  const [editingSavedItemId, setEditingSavedItemId] = useState(null);
  const [editSavedItemName, setEditSavedItemName] = useState('');
  const [editSavedItemPrice, setEditSavedItemPrice] = useState('');
  const [editingSavedPersonId, setEditingSavedPersonId] = useState(null);
  const [editSavedPersonName, setEditSavedPersonName] = useState('');
  const [editSavedPersonAmount, setEditSavedPersonAmount] = useState('');
  const [editSavedPersonType, setEditSavedPersonType] = useState('diya');
  const [editSavedPersonCategory, setEditSavedPersonCategory] = useState('general');
  const inputRef = useRef(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [settleConfirmEntry, setSettleConfirmEntry] = useState(null);
  const [unsettleConfirmEntry, setUnsettleConfirmEntry] = useState(null);
  const [toast, setToast] = useState(null);

  const balances = useMemo(() => calculateRunningBalances(state.accounts), [state.accounts]);
  const stats = useMemo(() => getAccountStats(state.accounts), [state.accounts]);
  const uniquePersons = useMemo(() => getUniquePersons(state.accounts), [state.accounts]);
  const settlements = useMemo(() => optimizeAccountSettlements(balances), [balances]);

  const filteredAccounts = useMemo(() => {
    return getFilteredAccounts(state.accounts, {
      search,
      type: filterType,
      category: filterCategory,
      status: filterStatus,
      dateRange: filterDate === 'all' ? null : filterDate,
    });
  }, [state.accounts, search, filterType, filterCategory, filterStatus, filterDate]);

  const activeEntries = filteredAccounts.filter((a) => !a.isSettled);
  const settledEntries = state.accounts.filter((a) => a.isSettled);
  const settledByPerson = useMemo(() => groupAccountsByPerson(settledEntries), [settledEntries]);

  const suggestions = useMemo(() => {
    if (!personName.trim()) return [];
    const q = personName.toLowerCase();
    const results = [];

    uniquePersons.forEach((p) => {
      if (p.name.toLowerCase().includes(q)) {
        results.push({ type: 'contact', name: p.name, mobile: p.mobile });
      }
    });

    state.groups.forEach((g) => {
      g.members.forEach((m) => {
        if (m.name.toLowerCase().includes(q) && !results.find((r) => r.name === m.name)) {
          results.push({ type: 'group', name: m.name, mobile: m.mobile || '', group: g.name });
        }
      });
    });

    if (personName.trim() && !results.find((r) => r.name.toLowerCase() === personName.toLowerCase())) {
      results.push({ type: 'new', name: personName.trim() });
    }

    return results.slice(0, 6);
  }, [personName, uniquePersons, state.groups]);

  const handleSubmit = () => {
    const evaluatedAmount = evaluateExpression(amount);
    if (!personName.trim() || isNaN(evaluatedAmount) || evaluatedAmount <= 0) return;

    const entry = {
      personName: personName.trim(),
      type,
      amount: evaluatedAmount,
      category,
      note: note.trim(),
      date: new Date(entryDate + 'T12:00:00').toISOString(),
    };

    if (editingId) {
      dispatch({ type: 'UPDATE_ACCOUNT_ENTRY', payload: { id: editingId, updates: entry } });
    } else {
      dispatch({ type: 'ADD_ACCOUNT_ENTRY', payload: entry });
    }

    resetForm();
  };

  const resetForm = () => {
    setPersonName('');
    setAmount('');
    setType('diya');
    setCategory('general');
    setNote('');
    setEditingId(null);
    setShowSuggestions(false);
    setEntryDate(new Date().toISOString().split('T')[0]);
    setBatchItems([]);
    setBatchPersonName('');
    setBatchType('diya');
    setBatchCategory('general');
    setBatchDate(new Date().toISOString().split('T')[0]);
    setEntryMode('direct');
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    const entryDateStr = entry.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    if (entry.batchItems && entry.batchItems.length > 0) {
      setEntryMode('batch');
      setBatchItems(entry.batchItems);
      setBatchPersonName(entry.personName);
      setBatchType(entry.type);
      setBatchCategory(entry.category);
      setBatchDate(entryDateStr);
      setPersonName('');
      setAmount('');
      setType('diya');
      setCategory('general');
      setNote('');
    } else {
      setEntryMode('direct');
      setPersonName(entry.personName);
      setAmount(entry.amount.toString());
      setType(entry.type);
      setCategory(entry.category);
      setNote(entry.note);
      setEntryDate(entryDateStr);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectSuggestion = (s) => {
    setPersonName(s.name);
    setShowSuggestions(false);
    if (s.mobile) {
    }
  };

  const addFromSavedPerson = (sp) => {
    if (entryMode === 'batch') {
      setBatchPersonName(sp.name);
      setBatchType(sp.defaultType);
      setBatchCategory(sp.defaultCategory);
    } else {
      dispatch({
        type: 'ADD_ACCOUNT_ENTRY',
        payload: {
          personName: sp.name,
          type: sp.defaultType,
          amount: sp.defaultAmount,
          category: sp.defaultCategory,
          note: '',
          mobile: sp.mobile || '',
        },
      });
    }
  };

  const saveNewSavedPerson = () => {
    if (!savedPersonName.trim()) return;
    dispatch({
      type: 'ADD_SAVED_PERSON',
      payload: {
        name: savedPersonName.trim(),
        defaultType: savedPersonType,
        defaultAmount: parseFloat(savedPersonAmount) || 0,
        defaultCategory: savedPersonCategory,
        mobile: '',
      },
    });
    setSavedPersonName('');
    setSavedPersonAmount('');
    setSavedPersonType('diya');
    setSavedPersonCategory('general');
    setShowAddSavedPerson(false);
  };

  const addFromSavedItem = (si) => {
    if (entryMode === 'batch') {
      addBatchItem(si.name, si.price);
    } else {
      setAmount(si.price.toString());
      setNote(si.name);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const saveNewSavedItem = () => {
    if (!newItemName.trim() || !parseFloat(newItemPrice)) return;
    dispatch({ type: 'ADD_SAVED_ITEM', payload: { name: newItemName.trim(), price: parseFloat(newItemPrice) } });
    setNewItemName('');
    setNewItemPrice('');
    setShowAddSavedItem(false);
  };

  const handleSettle = (id) => {
    const entry = state.accounts.find((a) => a.id === id);
    if (entry) setSettleConfirmEntry(entry);
  };

  const confirmSettle = () => {
    if (settleConfirmEntry) {
      dispatch({ type: 'SETTLE_ACCOUNT_ENTRY', payload: settleConfirmEntry.id });
      setToast({ person: settleConfirmEntry.personName, amount: settleConfirmEntry.amount, type: settleConfirmEntry.type });
      setSettleConfirmEntry(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleUnsettle = (id) => {
    const entry = state.accounts.find((a) => a.id === id);
    if (entry) setUnsettleConfirmEntry(entry);
  };

  const confirmUnsettle = () => {
    if (unsettleConfirmEntry) {
      dispatch({ type: 'UNSETTLE_ACCOUNT_ENTRY', payload: unsettleConfirmEntry.id });
      setUnsettleConfirmEntry(null);
      setToast({ person: unsettleConfirmEntry.personName, amount: unsettleConfirmEntry.amount, type: unsettleConfirmEntry.type, action: 'unsettled' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDelete = (id) => {
    if (confirm('Yeh entry delete ho jayegi?')) {
      if (editingId === id) resetForm();
      dispatch({ type: 'DELETE_ACCOUNT_ENTRY', payload: id });
    }
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleShare = () => {
    const text = generateShareText(stats, settlements, balances);
    shareGeneric(text);
  };

  const batchTotal = useMemo(() => batchItems.reduce((sum, item) => {
    return sum + (evaluateExpression(item.price) || 0) * (item.quantity || 1);
  }, 0), [batchItems]);

  const addBatchItem = (name, price) => {
    const existing = batchItems.find((i) => i._savedId === undefined && i.name === name);
    if (existing) {
      setBatchItems(batchItems.map((i) => i.id === existing.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i));
    } else {
      setBatchItems([...batchItems, { id: Date.now() + Math.random(), name, price: price.toString(), quantity: 1 }]);
    }
  };

  const removeBatchItem = (id) => {
    setBatchItems(batchItems.filter((item) => item.id !== id));
  };

  const updateBatchItemQty = (id, delta) => {
    setBatchItems(batchItems.map((item) => {
      if (item.id !== id) return item;
      return { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) };
    }));
  };

  const saveBatchEntry = () => {
    if (!batchPersonName.trim() || batchItems.length === 0 || batchTotal <= 0) return;
    const itemNames = batchItems.map((i) => i.name).join(', ');
    const cleanItems = batchItems.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity || 1 }));
    const payload = {
      personName: batchPersonName.trim(),
      type: batchType,
      amount: batchTotal,
      category: batchCategory,
      note: itemNames,
      batchItems: cleanItems,
      date: new Date(batchDate + 'T12:00:00').toISOString(),
    };

    if (editingId) {
      dispatch({ type: 'UPDATE_ACCOUNT_ENTRY', payload: { id: editingId, updates: payload } });
    } else {
      dispatch({ type: 'ADD_ACCOUNT_ENTRY', payload: payload });
    }
    resetForm();
  };

  const startEditSavedItem = (si) => {
    setEditingSavedItemId(si.id);
    setEditSavedItemName(si.name);
    setEditSavedItemPrice(si.price.toString());
  };

  const saveEditSavedItem = () => {
    if (!editSavedItemName.trim() || !parseFloat(editSavedItemPrice)) return;
    dispatch({ type: 'UPDATE_SAVED_ITEM', payload: { id: editingSavedItemId, updates: { name: editSavedItemName.trim(), price: parseFloat(editSavedItemPrice) } } });
    setEditingSavedItemId(null);
  };

  const startEditSavedPerson = (sp) => {
    setEditingSavedPersonId(sp.id);
    setEditSavedPersonName(sp.name);
    setEditSavedPersonAmount(sp.defaultAmount.toString());
    setEditSavedPersonType(sp.defaultType);
    setEditSavedPersonCategory(sp.defaultCategory);
  };

  const saveEditSavedPerson = () => {
    if (!editSavedPersonName.trim()) return;
    dispatch({ type: 'UPDATE_SAVED_PERSON', payload: { id: editingSavedPersonId, updates: { name: editSavedPersonName.trim(), defaultType: editSavedPersonType, defaultAmount: parseFloat(editSavedPersonAmount) || 0, defaultCategory: editSavedPersonCategory } } });
    setEditingSavedPersonId(null);
  };

  const activeBalances = Object.values(balances).filter((b) => Math.abs(b.net) > 0.01);

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
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--ink)]">
              {editingId ? 'Entry Edit Karo' : 'Account'}
            </h1>
          </motion.div>
          <motion.p variants={fadeUp} className="text-[var(--ink)]/60 text-sm ml-11">
            Diya / Liya track karo, hisab rakhlo
          </motion.p>
        </motion.div>

        {/* STAT CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
        >
          <div className="flap-card p-4 sm:p-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: 'var(--mint)' }}>
              <i className="ti ti-arrow-up-right text-[var(--ink)] text-sm" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-[var(--ink)] font-display">
              {formatCurrency(stats.totalDiya)}
            </div>
            <div className="text-xs text-[var(--ink)]/50 mt-0.5">Total Diya</div>
          </div>
          <div className="flap-card p-4 sm:p-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: 'var(--crimson)' }}>
              <i className="ti ti-arrow-down-left text-[var(--cream)] text-sm" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-[var(--crimson)] font-display">
              {formatCurrency(stats.totalLiya)}
            </div>
            <div className="text-xs text-[var(--ink)]/50 mt-0.5">Total Liya</div>
          </div>
          <div className="flap-card p-4 sm:p-5 col-span-2 sm:col-span-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5"
              style={{ background: stats.netBalance >= 0 ? 'var(--mint)' : 'var(--crimson)' }}
            >
              <i className="ti ti-wallet text-sm" style={{ color: stats.netBalance >= 0 ? 'var(--ink)' : 'var(--cream)' }} />
            </div>
            <div
              className={`text-lg sm:text-2xl font-bold font-display ${stats.netBalance >= 0 ? 'text-[var(--ink)]' : 'text-[var(--crimson)]'}`}
            >
              {stats.netBalance >= 0 ? '+' : '-'}{formatCurrency(stats.netBalance)}
            </div>
            <div className="text-xs text-[var(--ink)]/50 mt-0.5">{stats.netBalance >= 0 ? 'Net Jama' : 'Net Udhar'}</div>
          </div>
        </motion.div>

        {/* EDITING BANNER */}
        {editingId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 rounded-xl flex items-center justify-between"
            style={{ background: 'var(--pumpkin)', color: 'var(--ink)' }}
          >
            <span className="text-sm font-semibold flex items-center gap-2">
              <i className="ti ti-pencil text-base" /> Entry edit ho rahi hai
            </span>
            <button onClick={resetForm} className="text-xs underline font-semibold cursor-pointer">Cancel</button>
          </motion.div>
        )}

        {/* ENTRY MODE TOGGLE */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-5">
          <div className="flex gap-2 p-1 ink-border rounded-xl" style={{ background: 'var(--cream-2)' }}>
            <button
              onClick={() => setEntryMode('direct')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
              style={{
                background: entryMode === 'direct' ? 'var(--ink)' : 'transparent',
                color: entryMode === 'direct' ? 'var(--cream)' : 'var(--ink)',
              }}
            >
              <i className="ti ti-edit text-sm" /> Direct
            </button>
            <button
              onClick={() => setEntryMode('batch')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
              style={{
                background: entryMode === 'batch' ? 'var(--ink)' : 'transparent',
                color: entryMode === 'batch' ? 'var(--cream)' : 'var(--ink)',
              }}
            >
              <i className="ti ti-list text-sm" />               Item Wise
              {batchItems.length > 0 && (
                <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: 'var(--pumpkin)', color: 'var(--cream)' }}>
                  {batchItems.length}
                </span>
              )}
            </button>
          </div>
        </motion.div>

        {/* SAVED PERSONS */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <label className="label" style={{ marginBottom: 0 }}>
              <i className="ti ti-user text-sm mr-1" /> Saved Persons
            </label>
            <button
              onClick={() => setShowAddSavedPerson(!showAddSavedPerson)}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              <i className="ti ti-plus text-sm" /> Naya Person
            </button>
          </div>

          {showAddSavedPerson && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="ink-border rounded-2xl p-3 mb-3"
              style={{ background: 'var(--cream-2)' }}
            >
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={savedPersonName}
                    onChange={(e) => setSavedPersonName(e.target.value)}
                    placeholder="Person naam..."
                    className="input flex-1"
                    style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
                    onKeyDown={(e) => e.key === 'Enter' && saveNewSavedPerson()}
                  />
                  <div className="relative w-24">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--crimson)] font-semibold text-xs pointer-events-none">₹</span>
                    <input
                      type="number"
                      value={savedPersonAmount}
                      onChange={(e) => setSavedPersonAmount(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="input"
                      style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem', paddingLeft: '1.75rem' }}
                      onKeyDown={(e) => e.key === 'Enter' && saveNewSavedPerson()}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex gap-1 flex-1">
                    <button
                      onClick={() => setSavedPersonType('diya')}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-2"
                      style={{
                        background: savedPersonType === 'diya' ? 'var(--mint)' : 'transparent',
                        borderColor: savedPersonType === 'diya' ? 'var(--mint)' : 'rgba(58,44,92,0.12)',
                        color: 'var(--ink)',
                      }}
                    >
                      Diya
                    </button>
                    <button
                      onClick={() => setSavedPersonType('liya')}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-2"
                      style={{
                        background: savedPersonType === 'liya' ? 'var(--crimson)' : 'transparent',
                        borderColor: savedPersonType === 'liya' ? 'var(--crimson)' : 'rgba(58,44,92,0.12)',
                        color: savedPersonType === 'liya' ? 'var(--cream)' : 'var(--ink)',
                      }}
                    >
                      Liya
                    </button>
                  </div>
                  <select
                    value={savedPersonCategory}
                    onChange={(e) => setSavedPersonCategory(e.target.value)}
                    className="input text-xs"
                    style={{ fontSize: '0.75rem', padding: '0.375rem 0.5rem' }}
                  >
                    {(state.categories.length > 0 ? state.categories : DEFAULT_CATEGORIES).map((c) => (
                      <option key={c.name} value={c.name.toLowerCase()}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                  <button onClick={saveNewSavedPerson} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer font-semibold" style={{ background: 'var(--mint)', color: 'var(--ink)' }}>
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {state.savedPersons.length > 0 ? (
            <div className="space-y-2">
              {state.savedPersons.map((sp) => (
                <motion.div
                  key={sp.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ink-border rounded-xl p-2.5"
                  style={{
                    borderColor: sp.defaultType === 'diya' ? 'rgba(168,214,184,0.5)' : 'rgba(194,61,61,0.2)',
                    background: sp.defaultType === 'diya' ? 'rgba(168,214,184,0.1)' : 'rgba(194,61,61,0.05)',
                  }}
                >
                  {editingSavedPersonId === sp.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input type="text" value={editSavedPersonName} onChange={(e) => setEditSavedPersonName(e.target.value)} className="input flex-1 text-xs" style={{ padding: '0.375rem 0.5rem' }} onKeyDown={(e) => e.key === 'Enter' && saveEditSavedPerson()} />
                        <div className="relative w-20">
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[var(--crimson)] font-semibold text-[10px] pointer-events-none">₹</span>
                          <input type="number" value={editSavedPersonAmount} onChange={(e) => setEditSavedPersonAmount(e.target.value)} className="input text-xs" style={{ padding: '0.375rem 0.5rem', paddingLeft: '1.25rem' }} />
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="flex gap-1 flex-1">
                          <button onClick={() => setEditSavedPersonType('diya')} className="flex-1 py-1 rounded text-[10px] font-semibold cursor-pointer border" style={{ background: editSavedPersonType === 'diya' ? 'var(--mint)' : 'transparent', borderColor: editSavedPersonType === 'diya' ? 'var(--mint)' : 'rgba(58,44,92,0.12)', color: 'var(--ink)' }}>Diya</button>
                          <button onClick={() => setEditSavedPersonType('liya')} className="flex-1 py-1 rounded text-[10px] font-semibold cursor-pointer border" style={{ background: editSavedPersonType === 'liya' ? 'var(--crimson)' : 'transparent', borderColor: editSavedPersonType === 'liya' ? 'var(--crimson)' : 'rgba(58,44,92,0.12)', color: editSavedPersonType === 'liya' ? 'var(--cream)' : 'var(--ink)' }}>Liya</button>
                        </div>
                        <button onClick={saveEditSavedPerson} className="px-2 py-1 rounded text-[10px] font-semibold cursor-pointer" style={{ background: 'var(--mint)', color: 'var(--ink)' }}>Save</button>
                        <button onClick={() => setEditingSavedPersonId(null)} className="px-2 py-1 rounded text-[10px] font-semibold cursor-pointer" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => addFromSavedPerson(sp)} className="flex-1 flex items-center gap-1.5 text-left cursor-pointer">
                        <span className="text-[10px]">{sp.defaultType === 'diya' ? '🟢' : '🔴'}</span>
                        <span className="text-[var(--ink)] font-medium text-sm">{sp.name}</span>
                        {sp.defaultAmount > 0 && (
                          <span className="text-[var(--crimson)] font-mono text-xs font-semibold">{formatCurrency(sp.defaultAmount)}</span>
                        )}
                        <i className="ti ti-plus text-[var(--ink)]/40 text-xs" />
                      </button>
                      <button onClick={() => startEditSavedPerson(sp)} className="p-1 rounded text-[var(--ink)]/30 hover:text-[var(--pumpkin)] transition-colors cursor-pointer"><i className="ti ti-pencil text-[10px]" /></button>
                      <button onClick={() => { if (confirm('Yeh saved person delete ho jayega?')) dispatch({ type: 'DELETE_SAVED_PERSON', payload: sp.id }); }} className="p-1 rounded text-[var(--ink)]/30 hover:text-[var(--crimson)] transition-colors cursor-pointer"><i className="ti ti-x text-[10px]" /></button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--ink)]/40 italic">Koi saved person nahi — upar "Naya Person" se add karo</p>
          )}
        </motion.div>

        {/* SAVED ITEMS — Item Wise mode only */}
        {entryMode === 'batch' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <label className="label" style={{ marginBottom: 0 }}>
              <i className="ti ti-package text-sm mr-1" /> Saved Items
            </label>
            <button
              onClick={() => setShowAddSavedItem(!showAddSavedItem)}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              <i className="ti ti-plus text-sm" /> Naya Item
            </button>
          </div>

          {showAddSavedItem && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="ink-border rounded-2xl p-3 mb-3"
              style={{ background: 'var(--cream-2)' }}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Item naam (Rent, Groceries...)"
                  className="input flex-1"
                  style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
                  onKeyDown={(e) => e.key === 'Enter' && saveNewSavedItem()}
                />
                <div className="relative w-28">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--crimson)] font-semibold text-xs pointer-events-none">₹</span>
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="input"
                    style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem', paddingLeft: '1.75rem' }}
                    onKeyDown={(e) => e.key === 'Enter' && saveNewSavedItem()}
                  />
                </div>
                <button onClick={saveNewSavedItem} className="px-3 py-2 rounded-lg text-sm cursor-pointer font-semibold" style={{ background: 'var(--mint)', color: 'var(--ink)' }}>
                  Save
                </button>
              </div>
            </motion.div>
          )}

          {state.savedItems.length > 0 ? (
            <div className="space-y-2">
              {state.savedItems.map((si) => (
                <motion.div
                  key={si.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ink-border rounded-xl p-2.5"
                  style={{ borderColor: 'rgba(58,44,92,0.12)', background: 'rgba(58,44,92,0.04)' }}
                >
                  {editingSavedItemId === si.id ? (
                    <div className="flex gap-2 items-center">
                      <input type="text" value={editSavedItemName} onChange={(e) => setEditSavedItemName(e.target.value)} className="input flex-1 text-xs" style={{ padding: '0.375rem 0.5rem' }} onKeyDown={(e) => e.key === 'Enter' && saveEditSavedItem()} />
                      <div className="relative w-20">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[var(--crimson)] font-semibold text-[10px] pointer-events-none">₹</span>
                        <input type="text" value={editSavedItemPrice} onChange={(e) => setEditSavedItemPrice(e.target.value)} className="input text-xs" style={{ padding: '0.375rem 0.5rem', paddingLeft: '1.25rem' }} />
                      </div>
                      <button onClick={saveEditSavedItem} className="px-2 py-1 rounded text-[10px] font-semibold cursor-pointer" style={{ background: 'var(--mint)', color: 'var(--ink)' }}>Save</button>
                      <button onClick={() => setEditingSavedItemId(null)} className="px-2 py-1 rounded text-[10px] font-semibold cursor-pointer" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => addFromSavedItem(si)} className="flex-1 flex items-center gap-1.5 text-left cursor-pointer">
                        <span className="text-[var(--ink)] font-medium text-sm">{si.name}</span>
                        <span className="text-[var(--crimson)] font-mono text-xs font-semibold">{formatCurrency(si.price)}</span>
                        <i className="ti ti-plus text-[var(--ink)]/40 text-xs" />
                      </button>
                      <button onClick={() => startEditSavedItem(si)} className="p-1 rounded text-[var(--ink)]/30 hover:text-[var(--pumpkin)] transition-colors cursor-pointer"><i className="ti ti-pencil text-[10px]" /></button>
                      <button onClick={() => { if (confirm('Yeh saved item delete ho jayega?')) dispatch({ type: 'DELETE_SAVED_ITEM', payload: si.id }); }} className="p-1 rounded text-[var(--ink)]/30 hover:text-[var(--crimson)] transition-colors cursor-pointer"><i className="ti ti-x text-[10px]" /></button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--ink)]/40 italic">Koi saved item nahi — Quick Bill mein save karo ya "Naya Item" se add karo</p>
          )}
        </motion.div>
        )}

        {/* ENTRY FORM — DIRECT MODE */}
        {entryMode === 'direct' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ink-border rounded-2xl p-4 sm:p-5 mb-5"
          style={{ background: 'var(--cream-2)' }}
        >
          <div className="mb-4">
            <label className="label">Person ka naam</label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={personName}
                onChange={(e) => { setPersonName(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Rahul, Neha, Aman..."
                className="input"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 ink-border rounded-xl overflow-hidden z-20" style={{ background: 'var(--cream)' }}>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onMouseDown={() => selectSuggestion(s)}
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-[var(--ink)]/5 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      {s.type === 'new' ? (
                        <>
                          <i className="ti ti-plus text-[var(--mint)]" />
                          <span className="text-[var(--ink)]">&quot;{s.name}&quot; naya contact</span>
                        </>
                      ) : (
                        <>
                          <i className={s.type === 'contact' ? 'ti ti-notebook text-[var(--pumpkin)]' : 'ti ti-users text-[var(--ink)]/50'} />
                          <span className="text-[var(--ink)] font-medium">{s.name}</span>
                          {s.group && <span className="text-[var(--ink)]/40 text-xs">({s.group})</span>}
                          {s.mobile && <span className="text-[var(--ink)]/40 text-xs ml-auto">{s.mobile}</span>}
                        </>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Kis din ka hai?</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="input"
            />
          </div>

          <div className="mb-4">
            <label className="label">Amount <span className="text-[var(--ink)]/30">(calculation bhi chalega — 500*3, 1000+500)</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--crimson)] font-semibold text-lg pointer-events-none">₹</span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0 — ya type karo 500*3, 1000+500"
                className="input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            {amount && formatAmountPreview(amount) && (
              <p className="text-xs text-[var(--mint)] font-medium mt-1">{formatAmountPreview(amount)}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="label">Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setType('diya')}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer border-2"
                style={{
                  background: type === 'diya' ? 'var(--mint)' : 'transparent',
                  borderColor: type === 'diya' ? 'var(--mint)' : 'rgba(58,44,92,0.12)',
                  color: 'var(--ink)',
                }}
              >
                <i className="ti ti-arrow-up-right mr-1" /> Diya
              </button>
              <button
                onClick={() => setType('liya')}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer border-2"
                style={{
                  background: type === 'liya' ? 'var(--crimson)' : 'transparent',
                  borderColor: type === 'liya' ? 'var(--crimson)' : 'rgba(58,44,92,0.12)',
                  color: type === 'liya' ? 'var(--cream)' : 'var(--ink)',
                }}
              >
                <i className="ti ti-arrow-down-left mr-1" /> Liya
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Category</label>
            <div className="flex flex-wrap gap-2">
              {(state.categories.length > 0 ? state.categories : DEFAULT_CATEGORIES).map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setCategory(cat.name.toLowerCase())}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border-2"
                  style={{
                    background: category === cat.name.toLowerCase() ? cat.color : 'transparent',
                    borderColor: category === cat.name.toLowerCase() ? cat.color : 'rgba(58,44,92,0.12)',
                    color: category === cat.name.toLowerCase() ? 'var(--cream)' : 'var(--ink)',
                  }}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Note <span className="text-[var(--ink)]/30">(optional)</span></label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Dinner tha, shopping, rent..."
              className="input"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={resetForm} className="btn-secondary flex-1 py-3">
              {editingId ? 'Cancel' : 'Reset'}
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={!personName.trim() || !amount || isNaN(evaluateExpression(amount)) || evaluateExpression(amount) <= 0}
              className="btn-crimson flex-1 py-3"
            >
              <i className="ti ti-device-floppy text-base" />
              {editingId ? 'Update Entry' : 'Add Entry'}
            </motion.button>
          </div>
        </motion.div>
        )}

        {/* ENTRY FORM — BATCH MODE */}
        {entryMode === 'batch' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ink-border rounded-2xl p-4 sm:p-5 mb-5"
          style={{ background: 'var(--cream-2)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--ink)' }}>
              <i className="ti ti-list text-[var(--cream)] text-sm" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--ink)]">Item Wise Entry</div>
              <div className="text-[10px] text-[var(--ink)]/50">Person select karo, items add karo, save karo</div>
            </div>
          </div>

          <div className="mb-3">
            <label className="label">Person ka naam</label>
            <input type="text" value={batchPersonName} onChange={(e) => setBatchPersonName(e.target.value)} placeholder="Rahul, Neha, Aman..." className="input" />
          </div>

          <div className="mb-3">
            <label className="label">Kis din ka hai?</label>
            <input type="date" value={batchDate} onChange={(e) => setBatchDate(e.target.value)} className="input" />
          </div>

          <div className="flex gap-2 mb-3">
            <button onClick={() => setBatchType('diya')} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border-2" style={{ background: batchType === 'diya' ? 'var(--mint)' : 'transparent', borderColor: batchType === 'diya' ? 'var(--mint)' : 'rgba(58,44,92,0.12)', color: 'var(--ink)' }}>
              <i className="ti ti-arrow-up-right mr-1" /> Diya
            </button>
            <button onClick={() => setBatchType('liya')} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border-2" style={{ background: batchType === 'liya' ? 'var(--crimson)' : 'transparent', borderColor: batchType === 'liya' ? 'var(--crimson)' : 'rgba(58,44,92,0.12)', color: batchType === 'liya' ? 'var(--cream)' : 'var(--ink)' }}>
              <i className="ti ti-arrow-down-left mr-1" /> Liya
            </button>
            <select value={batchCategory} onChange={(e) => setBatchCategory(e.target.value)} className="input text-xs" style={{ fontSize: '0.75rem', padding: '0.375rem 0.5rem' }}>
              {(state.categories.length > 0 ? state.categories : DEFAULT_CATEGORIES).map((c) => (
                <option key={c.name} value={c.name.toLowerCase()}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {state.savedItems.length === 0 && (
          <>
          <div className="flex gap-2 mb-3">
            <input type="text" value={batchItemName} onChange={(e) => setBatchItemName(e.target.value)} placeholder="Item naam..." className="input flex-1 text-sm" style={{ fontSize: '0.8125rem' }} onKeyDown={(e) => { if (e.key === 'Enter' && batchItemName.trim() && batchItemPrice) { addBatchItem(batchItemName.trim(), evaluateExpression(batchItemPrice) || 0); setBatchItemName(''); setBatchItemPrice(''); } }} />
            <div className="relative w-24">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--crimson)] font-semibold text-[10px] pointer-events-none">₹</span>
              <input type="text" value={batchItemPrice} onChange={(e) => setBatchItemPrice(e.target.value)} placeholder="0" className="input text-sm" style={{ fontSize: '0.8125rem', paddingLeft: '1.25rem' }} onKeyDown={(e) => { if (e.key === 'Enter' && batchItemName.trim() && batchItemPrice) { addBatchItem(batchItemName.trim(), evaluateExpression(batchItemPrice) || 0); setBatchItemName(''); setBatchItemPrice(''); } }} />
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { if (batchItemName.trim() && batchItemPrice) { addBatchItem(batchItemName.trim(), evaluateExpression(batchItemPrice) || 0); setBatchItemName(''); setBatchItemPrice(''); } }} disabled={!batchItemName.trim() || !batchItemPrice} className="px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer shrink-0" style={{ background: 'var(--mint)', color: 'var(--ink)' }}>
              <i className="ti ti-plus text-sm" />
            </motion.button>
          </div>
          {batchItemPrice && formatAmountPreview(batchItemPrice) && (
            <p className="text-[10px] text-[var(--mint)] font-medium -mt-2 mb-3">{formatAmountPreview(batchItemPrice)}</p>
          )}
          </>
          )}

          {batchItems.length > 0 ? (
            <div>
              <div className="space-y-1.5 mb-3">
                <AnimatePresence>
                  {batchItems.map((item, i) => {
                    const itemTotal = (evaluateExpression(item.price) || 0) * (item.quantity || 1);
                    return (
                      <motion.div key={item.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ delay: Math.min(i * 0.03, 0.1) }} className="ink-border rounded-xl p-2.5 flex items-center gap-2" style={{ background: 'var(--cream)' }}>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--ink)] truncate">{item.name}</div>
                          <div className="text-[10px] text-[var(--ink)]/50 font-mono">{formatCurrency(evaluateExpression(item.price) || 0)} / unit</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => updateBatchItemQty(item.id, -1)} className="w-7 h-7 rounded-lg border border-[var(--ink)]/15 flex items-center justify-center text-[var(--ink)]/60 hover:border-[var(--crimson)] hover:text-[var(--crimson)] transition-all cursor-pointer" disabled={(item.quantity || 1) <= 1}>
                            <i className="ti ti-minus text-[10px]" />
                          </button>
                          <span className="w-6 text-center text-xs font-semibold text-[var(--ink)]">{item.quantity || 1}</span>
                          <button onClick={() => updateBatchItemQty(item.id, 1)} className="w-7 h-7 rounded-lg border border-[var(--ink)]/15 flex items-center justify-center text-[var(--ink)]/60 hover:border-[var(--mint)] hover:text-[var(--ink)] transition-all cursor-pointer">
                            <i className="ti ti-plus text-[10px]" />
                          </button>
                        </div>
                        <div className="text-right shrink-0 w-14">
                          <div className="text-xs text-[var(--pumpkin)] font-mono font-semibold">{formatCurrency(itemTotal)}</div>
                        </div>
                        <button onClick={() => removeBatchItem(item.id)} className="p-1 rounded text-[var(--ink)]/30 hover:text-[var(--crimson)] transition-colors cursor-pointer shrink-0"><i className="ti ti-x text-[10px]" /></button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl mb-3" style={{ background: 'rgba(255,187,68,0.1)' }}>
                <span className="text-sm font-semibold text-[var(--ink)]">{batchItems.length} items — Total</span>
                <span className="text-xl font-bold font-display text-[var(--pumpkin)]">{formatCurrency(batchTotal)}</span>
              </div>

              <div className="flex gap-3">
                <button onClick={resetForm} className="btn-secondary flex-1 py-2.5 text-sm">
                  <i className="ti ti-x text-sm mr-1" /> {editingId ? 'Cancel' : 'Clear'}
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={saveBatchEntry} disabled={!batchPersonName.trim() || batchItems.length === 0 || batchTotal <= 0} className="btn-crimson flex-1 py-2.5 text-sm">
                  <i className="ti ti-device-floppy text-base mr-1" /> {editingId ? 'Update Entry' : 'Save Entry'}
                </motion.button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--ink)]/40 italic text-center py-4">Upar items add karo — saved items pe click se bhi add hoga</p>
          )}
        </motion.div>
        )}

        {/* RUNNING BALANCES */}
        {activeBalances.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-5"
          >
            <label className="label mb-3">
              <i className="ti ti-users text-sm mr-1" /> Running Balances
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeBalances.map((b) => (
                <div
                  key={b.name}
                  className="ink-border rounded-2xl p-3 text-center"
                  style={{ background: b.net > 0 ? 'rgba(168,214,184,0.15)' : b.net < 0 ? 'rgba(194,61,61,0.08)' : 'var(--cream-2)' }}
                >
                  <div className="text-sm font-semibold text-[var(--ink)] mb-1">{b.name}</div>
                  <div
                    className="text-lg font-bold font-display"
                    style={{ color: b.net > 0 ? 'var(--ink)' : 'var(--crimson)' }}
                  >
                    {b.net > 0 ? '+' : '-'}{formatCurrency(b.net)}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: b.net > 0 ? 'var(--ink)' : 'var(--crimson)', opacity: 0.7 }}>
                    {b.net > 0 ? 'owed to you' : 'you owe'}
                  </div>
                  <div className="text-[10px] text-[var(--ink)]/40 mt-0.5">
                    D: {formatCurrency(b.totalDiya)} | L: {formatCurrency(b.totalLiya)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* QUICK SETTLEMENT */}
        {settlements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.17 }}
            className="ink-border rounded-2xl p-4 mb-5"
            style={{ background: 'rgba(255,187,68,0.08)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="label" style={{ marginBottom: 0 }}>
                <i className="ti ti-zap text-sm mr-1" style={{ color: 'var(--pumpkin)' }} /> Quick Settlement
              </label>
              <button
                onClick={() => navigate('/account/settlement')}
                className="text-xs font-semibold text-[var(--pumpkin)] hover:underline cursor-pointer"
              >
                Full Plan →
              </button>
            </div>
            <div className="space-y-1.5">
              {settlements.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-[var(--ink)]">{s.from}</span>
                  <i className="ti ti-arrow-right text-[var(--ink)]/40 text-xs" />
                  <span className="font-semibold text-[var(--ink)]">{s.to}</span>
                  <span className="ml-auto font-mono font-bold text-[var(--pumpkin)]">{formatCurrency(s.amount)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* SEARCH + FILTERS */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mb-5"
        >
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/40 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search person, note..."
                className="input"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary px-3"
            >
              <i className="ti ti-filter text-sm" />
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="ink-border rounded-xl p-3 mb-2"
              style={{ background: 'var(--cream-2)' }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--ink)]/50 font-semibold mb-1 block">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="all">All</option>
                    <option value="diya">Diya</option>
                    <option value="liya">Liya</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--ink)]/50 font-semibold mb-1 block">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="all">All</option>
                    {(state.categories.length > 0 ? state.categories : DEFAULT_CATEGORIES).map((c) => (
                      <option key={c.name} value={c.name.toLowerCase()}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--ink)]/50 font-semibold mb-1 block">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="settled">Settled</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--ink)]/50 font-semibold mb-1 block">Date</label>
                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="all">All Time</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex gap-2">
            {['all', 'diya', 'liya'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                style={{
                  background: filterType === t ? 'var(--ink)' : 'transparent',
                  color: filterType === t ? 'var(--cream)' : 'var(--ink)',
                  opacity: filterType === t ? 1 : 0.5,
                }}
              >
                {t === 'all' ? 'All' : t === 'diya' ? '🟢 Diya' : '🔴 Liya'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ACTIVE ENTRIES */}
        {activeEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-5"
          >
            <label className="label mb-3">
              <i className="ti ti-list text-sm mr-1" /> Entries
              <span className="text-[var(--ink)]/40 ml-1">({activeEntries.length})</span>
            </label>
            <div className="space-y-2">
              <AnimatePresence>
                {activeEntries.map((entry, i) => {
                  const entryDate = new Date(entry.date);
                  const isToday = entryDate.toDateString() === new Date().toDateString();
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                      transition={{ delay: Math.min(i * 0.03, 0.15) }}
                      className="ink-border rounded-2xl p-3"
                      style={{ background: 'var(--cream-2)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: entry.type === 'diya' ? 'var(--mint)' : 'rgba(194,61,61,0.1)' }}
                        >
                          <i
                            className={`ti ti-arrow-${entry.type === 'diya' ? 'up-right' : 'down-left'} text-sm`}
                            style={{ color: entry.type === 'diya' ? 'var(--ink)' : 'var(--crimson)' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--ink)]">{entry.personName}</span>
                            {entry.batchItems && entry.batchItems.length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--pumpkin)', color: 'var(--cream)' }}>
                                <i className="ti ti-list text-[8px] mr-0.5" />{entry.batchItems.length} items
                              </span>
                            )}
                            {entry.category && entry.category !== 'general' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                                {entry.category}
                              </span>
                            )}
                          </div>
                          {entry.note && (
                            <div className="text-xs text-[var(--ink)]/50 truncate mt-0.5">{entry.note}</div>
                          )}
                          <div className="text-[10px] text-[var(--ink)]/40 mt-0.5">
                            {isToday ? 'Aaj' : entryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                          {entry.batchItems && entry.batchItems.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {entry.batchItems.map((item, j) => (
                                <span key={j} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-medium" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                                  {item.name} ×{item.quantity || 1} · {formatCurrency((evaluateExpression(item.price) || 0) * (item.quantity || 1))}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div
                            className="text-base font-bold font-mono"
                            style={{ color: entry.type === 'diya' ? 'var(--ink)' : 'var(--crimson)' }}
                          >
                            {entry.type === 'diya' ? '+' : '-'}{formatCurrency(entry.amount)}
                          </div>
                          <div className="text-[10px]" style={{ color: entry.type === 'diya' ? 'var(--ink)' : 'var(--crimson)', opacity: 0.6 }}>
                            {entry.type === 'diya' ? 'Diya' : 'Liya'}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => handleSettle(entry.id)}
                            className="p-1.5 rounded-lg text-[var(--ink)]/40 hover:text-[var(--mint)] hover:bg-[var(--mint)]/10 transition-all cursor-pointer"
                            title="Settle"
                          >
                            <i className="ti ti-check text-xs" />
                          </button>
                          <button
                            onClick={() => startEdit(entry)}
                            className="p-1.5 rounded-lg text-[var(--ink)]/40 hover:text-[var(--pumpkin)] hover:bg-[var(--pumpkin)]/10 transition-all cursor-pointer"
                            title="Edit"
                          >
                            <i className="ti ti-pencil text-xs" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 rounded-lg text-[var(--ink)]/40 hover:text-[var(--crimson)] hover:bg-[var(--crimson)]/10 transition-all cursor-pointer"
                            title="Delete"
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
          </motion.div>
        )}

        {/* SETTLED ARCHIVE */}
        {settledEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="mb-5"
          >
            {(() => {
              const totalSettledAmount = settledEntries.reduce((s, e) => s + e.amount, 0);
              const lastSettled = settledEntries.sort((a, b) => new Date(b.settledAt || b.date) - new Date(a.settledAt || a.date))[0];
              return (
                <div className="ink-border rounded-2xl p-3 mb-3" style={{ background: 'rgba(34,197,94,0.06)' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <i className="ti ti-checkup-circle text-[var(--mint)] text-sm" />
                    <span className="text-xs font-semibold text-[var(--ink)]/70">Payment Summary</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--ink)]/60">
                    <span>{settledEntries.length} settled</span>
                    <span className="text-[var(--ink)]/20">|</span>
                    <span className="font-mono font-semibold text-[var(--ink)]">{formatCurrency(totalSettledAmount)}</span>
                    {lastSettled && (
                      <>
                        <span className="text-[var(--ink)]/20">|</span>
                        <span>Last: {lastSettled.personName}</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/account/settled-history')}
                    className="flex items-center gap-1.5 text-[10px] font-medium mt-2 cursor-pointer transition-colors"
                    style={{ color: 'var(--pumpkin)' }}
                  >
                    View Settled History
                    <i className="ti ti-arrow-right text-xs" />
                  </button>
                </div>
              );
            })()}
            <button
              onClick={() => setShowArchive(!showArchive)}
              className="flex items-center gap-2 text-sm text-[var(--ink)]/50 hover:text-[var(--ink)] transition-colors cursor-pointer mb-2"
            >
              <i className={`ti ti-chevron-${showArchive ? 'up' : 'down'}`} />
              <span>Person-wise History ({settledByPerson.length} persons)</span>
            </button>
            {showArchive && (
              <div className="space-y-3">
                {settledByPerson.map((person) => (
                  <div
                    key={person.name}
                    className="ink-border rounded-2xl p-4"
                    style={{ background: 'rgba(34,197,94,0.03)' }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--mint)' }}>
                        <span className="text-[var(--ink)] font-bold text-sm">{person.name[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[var(--ink)] font-display">{person.name}</div>
                        <div className="text-[10px] text-[var(--ink)]/40">{person.entries.length} settled entries</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold font-mono text-[var(--ink)]">{formatCurrency(person.total)}</div>
                        <div className="text-[10px] text-[var(--ink)]/40">
                          D: {formatCurrency(person.totalDiya)} · L: {formatCurrency(person.totalLiya)}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {person.entries.map((entry) => {
                        const entryDate = entry.date ? new Date(entry.date) : null;
                        const settledDate = entry.settledAt ? new Date(entry.settledAt) : null;
                        return (
                          <div
                            key={entry.id}
                            className="rounded-xl p-2.5 flex items-center gap-3 opacity-70"
                            style={{ background: 'var(--cream-2)' }}
                          >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--mint)' }}>
                              <i className="ti ti-check text-[var(--ink)] text-[10px]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: entry.type === 'diya' ? 'rgba(220,38,38,0.08)' : 'rgba(34,197,94,0.08)', color: entry.type === 'diya' ? 'var(--crimson)' : '#22c55e' }}>
                                  {entry.type === 'diya' ? 'Diya' : 'Liya'}
                                </span>
                                {entry.category && entry.category !== 'general' && (
                                  <span className="text-[10px] text-[var(--ink)]/40">{entry.category}</span>
                                )}
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
                              {entry.note && <p className="text-[10px] text-[var(--ink)]/30 mt-0.5 truncate">{entry.note}</p>}
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
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* EMPTY STATE */}
        {state.accounts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--pumpkin)' }}>
              <i className="ti ti-wallet text-[var(--cream)] text-2xl" />
            </div>
            <p className="text-[var(--ink)]/60 text-sm mb-1">Abhi koi entry nahi hai</p>
            <p className="text-[var(--ink)]/40 text-xs">Upar form fill karke pehli entry add karo</p>
          </motion.div>
        )}

        {/* ACTION BUTTONS */}
        {state.accounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex gap-3 mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/account/settlement')}
              className="btn-pumpkin flex-1 py-3 text-sm"
            >
              <i className="ti ti-arrows-cross text-base" /> Settlement Plan
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShare}
              className="btn-secondary flex-1 py-3 text-sm"
            >
              <i className="ti ti-share text-base" /> Share
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              className="btn-secondary flex-1 py-3 text-sm"
            >
              <i className="ti ti-download text-base" /> Export
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* EXPORT MODAL */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setShowExportModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="ink-border rounded-2xl p-5 w-full max-w-xs" style={{ background: 'var(--cream)' }} onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-bold text-[var(--ink)] mb-1">Export Hisab</h3>
              <p className="text-xs text-[var(--ink)]/50 mb-4">Format choose karo:</p>
              <div className="space-y-2">
                <button onClick={() => { exportCSV(state.accounts, state.categories); setShowExportModal(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-[var(--cream-2)] transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--mint)' }}>
                    <i className="ti ti-file-spreadsheet text-[var(--ink)] text-lg" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">CSV File</p>
                    <p className="text-[10px] text-[var(--ink)]/40">Excel / Google Sheets mein open hoga</p>
                  </div>
                </button>
                <button onClick={async () => { await exportPDF(state.accounts, state.categories); setShowExportModal(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-[var(--cream-2)] transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--crimson)' }}>
                    <i className="ti ti-file-type-pdf text-[var(--cream)] text-lg" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">PDF File</p>
                    <p className="text-[10px] text-[var(--ink)]/40">Print / share ke liye perfect</p>
                  </div>
                </button>
              </div>
              <button onClick={() => setShowExportModal(false)} className="w-full mt-3 btn-secondary py-2 text-xs">Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SETTLE CONFIRMATION MODAL */}
      <AnimatePresence>
        {settleConfirmEntry && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setSettleConfirmEntry(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="ink-border rounded-2xl p-5 w-full max-w-xs" style={{ background: 'var(--cream)' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--mint)' }}>
                  <i className="ti ti-check text-[var(--ink)] text-lg" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--ink)]">Entry Settle Karo?</h3>
                  <p className="text-[10px] text-[var(--ink)]/40">Yeh entry settled ho jayegi</p>
                </div>
              </div>
              <div className="ink-border rounded-xl p-3 mb-4" style={{ background: 'var(--cream-2)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-[var(--ink)]">{settleConfirmEntry.personName}</span>
                  <span className="text-sm font-mono font-bold text-[var(--crimson)]">{formatCurrency(settleConfirmEntry.amount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: settleConfirmEntry.type === 'diya' ? 'rgba(220,38,38,0.08)' : 'rgba(34,197,94,0.08)', color: settleConfirmEntry.type === 'diya' ? 'var(--crimson)' : 'var(--mint)' }}>
                    {settleConfirmEntry.type === 'diya' ? 'Diya (Gave)' : 'Liya (Received)'}
                  </span>
                  {settleConfirmEntry.note && <span className="text-[10px] text-[var(--ink)]/40">{settleConfirmEntry.note}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSettleConfirmEntry(null)} className="flex-1 btn-secondary py-2.5 text-sm">Cancel</button>
                <button onClick={confirmSettle} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'var(--mint)', color: 'var(--ink)' }}>
                  Haan, Settle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: toast.action === 'unsettled' ? 'var(--pumpkin)' : 'var(--mint)' }}>
              <i className={`ti ti-${toast.action === 'unsettled' ? 'rotate' : 'check'} text-${toast.action === 'unsettled' ? 'cream' : 'ink'} text-sm`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">{toast.person} — {formatCurrency(toast.amount)} {toast.action === 'unsettled' ? 'wapas active' : 'settled'}</p>
              <p className="text-[10px] text-[var(--ink)]/40">{toast.action === 'unsettled' ? 'Entry phir se active ho gayi' : `${toast.type === 'diya' ? 'Diya entry' : 'Liya entry'} marked as paid`}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
