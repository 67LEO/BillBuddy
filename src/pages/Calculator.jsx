import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { stagger, fadeUp } from '../utils/animations';

const formatCurrency = (n) => `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function Calculator() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [editingBillId, setEditingBillId] = useState(null);

  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [showAddSavedItem, setShowAddSavedItem] = useState(false);

  const total = useMemo(() => items.reduce((sum, item) => {
    const p = parseFloat(item.price) || 0;
    const q = Math.max(0, parseInt(item.quantity) || 0);
    return sum + p * q;
  }, 0), [items]);

  const paid = parseFloat(paidAmount) || 0;
  const difference = paid - total;
  const isJama = difference >= 0;

  const totalPaidAll = useMemo(() => state.bills.reduce((s, b) => s + (b.paidAmount || 0), 0), [state.bills]);
  const totalBaakiAll = useMemo(() => state.bills.reduce((s, b) => s + (b.difference || 0), 0), [state.bills]);
  const unpaidTotal = useMemo(() => state.bills.reduce((s, b) => {
    if (b.paidAmount <= 0) return s + (b.total || 0);
    if (b.difference < 0) return s + Math.abs(b.difference);
    return s;
  }, 0), [state.bills]);

  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setItems(items.map((item) => {
      if (item.id !== id) return item;
      const current = parseInt(item.quantity) || 0;
      const next = Math.max(1, current + delta);
      return { ...item, quantity: next };
    }));
  };

  const addFromSavedItem = (savedItem) => {
    const existing = items.find((i) => i._savedId === savedItem.id);
    if (existing) {
      updateQuantity(existing.id, 1);
    } else {
      setItems([...items, {
        id: Date.now() + Math.random(),
        _savedId: savedItem.id,
        name: savedItem.name,
        price: savedItem.price.toString(),
        quantity: 1,
      }]);
    }
  };

  const saveNewSavedItem = () => {
    if (!newItemName.trim() || !parseFloat(newItemPrice)) return;
    dispatch({ type: 'ADD_SAVED_ITEM', payload: { name: newItemName.trim(), price: parseFloat(newItemPrice) } });
    setNewItemName('');
    setNewItemPrice('');
    setShowAddSavedItem(false);
  };

  const resetForm = () => {
    setItems([]);
    setTitle('');
    setPaidAmount('');
    setEditingBillId(null);
  };

  const saveBill = () => {
    const billItems = items
      .filter((item) => item.name.trim() && parseFloat(item.price) > 0)
      .map((item) => ({
        name: item.name.trim(),
        price: parseFloat(item.price) || 0,
        quantity: Math.max(1, parseInt(item.quantity) || 1),
      }));

    if (billItems.length === 0) return;

    const billData = {
      title: title.trim() || `Bill - ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      items: billItems,
      total,
      paidAmount: paid,
      difference: paid > 0 ? difference : 0,
    };

    if (editingBillId) {
      dispatch({ type: 'UPDATE_BILL', payload: { id: editingBillId, updates: billData } });
    } else {
      dispatch({ type: 'ADD_BILL', payload: billData });
    }

    resetForm();
  };

  const startEditBill = (bill) => {
    setEditingBillId(bill.id);
    setTitle(bill.title);
    setPaidAmount(bill.paidAmount > 0 ? bill.paidAmount.toString() : '');
    setItems(bill.items.map((item) => ({
      id: Date.now() + Math.random(),
      name: item.name,
      price: item.price.toString(),
      quantity: item.quantity,
    })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isValid = items.length > 0 && items.some((item) => item.name.trim() && parseFloat(item.price) > 0);

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
              {editingBillId ? 'Bill Edit Karo' : 'Quick Bill'}
            </h1>
          </motion.div>
          <motion.p variants={fadeUp} className="text-[var(--ink)]/60 text-sm ml-11">
            {editingBillId ? 'Bill update karo aur save karo' : 'Saved items se select karo, quantity set karo'}
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
              <i className="ti ti-cash text-[var(--ink)] text-sm" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-[var(--ink)] font-display">
              {formatCurrency(totalPaidAll)}
            </div>
            <div className="text-xs text-[var(--ink)]/50 mt-0.5">Total Paid</div>
          </div>
          <div className="flap-card p-4 sm:p-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: totalBaakiAll >= 0 ? 'var(--mint)' : 'var(--crimson)' }}>
              <i className="ti ti-wallet text-[var(--cream)] text-sm" />
            </div>
            <div className={`text-lg sm:text-2xl font-bold font-display ${totalBaakiAll >= 0 ? 'text-[var(--ink)]' : 'text-[var(--crimson)]'}`}>
              {totalBaakiAll >= 0 ? '+' : ''}{formatCurrency(totalBaakiAll)}
            </div>
            <div className="text-xs text-[var(--ink)]/50 mt-0.5">{totalBaakiAll >= 0 ? 'Total Jama' : 'Total Udhar'}</div>
          </div>
          <div className="flap-card p-4 sm:p-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: 'var(--crimson)' }}>
              <i className="ti ti-alert-triangle text-[var(--cream)] text-sm" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-[var(--crimson)] font-display">
              {formatCurrency(unpaidTotal)}
            </div>
            <div className="text-xs text-[var(--ink)]/50 mt-0.5">Abhi Udhar Hai</div>
          </div>
        </motion.div>

        {/* EDITING BANNER */}
        {editingBillId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 rounded-xl flex items-center justify-between"
            style={{ background: 'var(--pumpkin)', color: 'var(--ink)' }}
          >
            <span className="text-sm font-semibold flex items-center gap-2">
              <i className="ti ti-pencil text-base" /> Bill edit ho rahi hai
            </span>
            <button onClick={resetForm} className="text-xs underline font-semibold cursor-pointer">Cancel</button>
          </motion.div>
        )}

        {/* TITLE INPUT */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5">
          <label className="label">Bill ka naam (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Dinner, Groceries, Shopping..."
            className="input"
          />
        </motion.div>

        {/* SAVED ITEMS LIBRARY */}
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
                  placeholder="Item naam..."
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
            <div className="flex flex-wrap gap-2">
              {state.savedItems.map((si) => (
                <motion.button
                  key={si.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addFromSavedItem(si)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm transition-all cursor-pointer group/item"
                  style={{
                    borderColor: 'rgba(58,44,92,0.12)',
                    background: 'rgba(58,44,92,0.04)',
                  }}
                >
                  <span className="text-[var(--ink)] font-medium">{si.name}</span>
                  <span className="text-[var(--crimson)] font-mono text-xs font-semibold">{formatCurrency(si.price)}</span>
                  <i className="ti ti-plus text-[var(--ink)]/40 text-xs group-hover/item:text-[var(--mint)] transition-colors" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Yeh saved item delete ho jayega?')) {
                        dispatch({ type: 'DELETE_SAVED_ITEM', payload: si.id });
                      }
                    }}
                    className="ml-0.5 text-[var(--ink)]/30 hover:text-[var(--crimson)] transition-colors"
                  >
                    <i className="ti ti-x text-[10px]" />
                  </button>
                </motion.button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--ink)]/40 italic">Koi saved item nahi — upar "Naya Item" se add karo</p>
          )}
        </motion.div>

        {/* BILL ITEMS */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <label className="label" style={{ marginBottom: 0 }}>
              <i className="ti ti-receipt text-sm mr-1" /> Bill Items
            </label>
            <span className="text-xs text-[var(--ink)]/50 font-medium">
              {items.length} items · {formatCurrency(total)}
            </span>
          </div>

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 ink-border rounded-2xl"
              style={{ background: 'var(--cream-2)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                <i className="ti ti-point-of-sale text-lg" />
              </div>
              <p className="text-sm text-[var(--ink)]/50 font-medium">Saved items pe click karo</p>
              <p className="text-xs text-[var(--ink)]/30 mt-1">Item yahan aa jayega</p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {items.map((item, i) => {
                  const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                      transition={{ delay: Math.min(i * 0.03, 0.15) }}
                      className="ink-border rounded-2xl p-3"
                      style={{ background: 'var(--cream-2)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--ink)] truncate">{item.name}</div>
                          <div className="text-xs text-[var(--ink)]/50 font-mono">{formatCurrency(parseFloat(item.price) || 0)} / unit</div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 rounded-lg border-2 border-[var(--ink)]/15 flex items-center justify-center text-[var(--ink)]/60 hover:border-[var(--crimson)] hover:text-[var(--crimson)] transition-all cursor-pointer text-xs font-bold"
                            disabled={(parseInt(item.quantity) || 0) <= 1}
                          >
                            <i className="ti ti-minus text-sm" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-[var(--ink)]">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 rounded-lg border-2 border-[var(--ink)]/15 flex items-center justify-center text-[var(--ink)]/60 hover:border-[var(--mint)] hover:text-[var(--ink)] transition-all cursor-pointer text-xs font-bold"
                          >
                            <i className="ti ti-plus text-sm" />
                          </button>
                        </div>

                        <div className="text-right shrink-0 w-16">
                          {itemTotal > 0 && (
                            <div className="text-xs text-[var(--pumpkin)] font-mono font-semibold">
                              {formatCurrency(itemTotal)}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 rounded-lg text-[var(--ink)]/40 hover:text-[var(--crimson)] hover:bg-[var(--crimson)]/10 transition-all cursor-pointer shrink-0"
                        >
                          <i className="ti ti-trash text-xs" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* TOTAL + PAID + DIFFERENCE */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="ink-border rounded-2xl p-4 sm:p-5 mb-5"
          style={{ background: 'var(--cream-2)' }}
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-[var(--ink)]/10">
            <span className="text-sm font-medium text-[var(--ink)]">Total Bill</span>
            <span className="text-xl font-bold font-display text-[var(--ink)]">{formatCurrency(total)}</span>
          </div>

          <div className="mb-4">
            <label className="label">Kitna paisa diya? <span className="text-[var(--ink)]/30">(optional)</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--crimson)] font-semibold text-lg pointer-events-none">₹</span>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0"
                min="0"
                className="input input-lg"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {paid > 0 && total > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-4 text-center"
              style={{
                background: isJama ? 'rgba(168,214,184,0.2)' : 'rgba(194,61,61,0.08)',
                border: `2px solid ${isJama ? 'var(--mint)' : 'rgba(194,61,61,0.2)'}`,
              }}
            >
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: isJama ? 'var(--ink)' : 'var(--crimson)' }}>
                {isJama ? 'BACHA HUA' : 'ABHI CHAHIYE'}
              </div>
              <div className="text-3xl sm:text-4xl font-bold font-display" style={{ color: isJama ? 'var(--mint)' : 'var(--crimson)' }}>
                {isJama ? '+' : '-'}{formatCurrency(Math.abs(difference))}
              </div>
              <div className="text-xs mt-1" style={{ color: isJama ? 'var(--ink)' : 'var(--crimson)', opacity: 0.7 }}>
                {isJama ? 'Paisa bach gaya — jama!' : 'Itna aur chahiye — udhar hai!'}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* SAVE / RESET BUTTONS */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex gap-3 mb-8"
        >
          <button onClick={resetForm} className="btn-secondary flex-1 py-3">
            {editingBillId ? 'Cancel' : 'Reset'}
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={saveBill}
            disabled={!isValid}
            className="btn-crimson flex-1 py-3"
          >
            <i className="ti ti-device-floppy text-base" />
            {editingBillId ? 'Update Bill' : 'Save Bill'}
          </motion.button>
        </motion.div>

        {/* SAVED BILLS HISTORY */}
        {state.bills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="label" style={{ marginBottom: 0 }}>
                <i className="ti ti-history text-sm mr-1" /> Saved Bills
              </label>
              <span className="text-xs text-[var(--ink)]/50 font-medium">{state.bills.length} bills</span>
            </div>

            <div className="space-y-2">
              {state.bills.map((bill, i) => {
                const billDate = new Date(bill.createdAt);
                const isToday = billDate.toDateString() === new Date().toDateString();
                return (
                  <motion.div
                    key={bill.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    className={`ink-border rounded-2xl p-3 sm:p-4 group transition-all ${editingBillId === bill.id ? 'ring-2 ring-[var(--pumpkin)]' : ''}`}
                    style={{ background: 'var(--cream-2)' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[var(--ink)] font-medium text-sm">{bill.title}</span>
                          <span className="text-[var(--ink)]/30 text-[10px]">·</span>
                          <span className="text-[var(--ink)]/50 text-xs flex items-center gap-1">
                            <i className="ti ti-clock text-[9px]" />
                            {isToday ? 'Aaj' : billDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {bill.items.slice(0, 4).map((item, j) => (
                            <span key={j} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
                              {item.name} x{item.quantity}
                            </span>
                          ))}
                          {bill.items.length > 4 && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px]" style={{ background: 'rgba(58,44,92,0.1)', color: 'var(--ink)' }}>
                              +{bill.items.length - 4}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] sm:text-xs">
                          <span className="text-[var(--ink)]/60">Bill: {formatCurrency(bill.total)}</span>
                          {bill.paidAmount > 0 && (
                            <span className="text-[var(--ink)]/60">Paid: {formatCurrency(bill.paidAmount)}</span>
                          )}
                          {bill.paidAmount > 0 && (
                            <span className={bill.difference >= 0 ? 'text-[var(--mint)]' : 'text-[var(--crimson)]'}>
                              {bill.difference >= 0 ? `+${formatCurrency(bill.difference)} jama` : `${formatCurrency(bill.difference)} udhar`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEditBill(bill)}
                          className="p-1.5 rounded-lg text-[var(--ink)]/40 hover:text-[var(--pumpkin)] hover:bg-[var(--pumpkin)]/10 transition-all cursor-pointer"
                          title="Edit"
                        >
                          <i className="ti ti-pencil text-xs" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Yeh bill delete ho jayega?')) {
                              if (editingBillId === bill.id) resetForm();
                              dispatch({ type: 'DELETE_BILL', payload: bill.id });
                            }
                          }}
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
            </div>
          </motion.div>
        )}

        {state.bills.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--pumpkin)' }}>
              <i className="ti ti-calculator text-[var(--cream)] text-xl" />
            </div>
            <p className="text-[var(--ink)]/50 text-sm">Abhi koi saved bill nahi</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
