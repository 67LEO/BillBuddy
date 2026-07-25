import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchAllData,
  createGroupInDB,
  deleteGroupFromDB,
  addMemberInDB,
  addExpenseInDB,
  updateExpenseInDB,
  deleteExpenseFromDB,
  fetchBills,
  addBillInDB,
  updateBillInDB,
  deleteBillFromDB,
  fetchSavedItems,
  addSavedItemInDB,
  deleteSavedItemFromDB,
} from '../lib/supabase';

const AppContext = createContext(null);

const initialState = {
  groups: [],
  expenses: [],
  bills: [],
  savedItems: [],
  activeGroupId: null,
};

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('billbuddy_active');
    return { ...initialState, activeGroupId: saved || null };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setState(initialState);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetchAllData(user.id),
      fetchBills(user.id),
      fetchSavedItems(user.id),
    ])
      .then(([data, bills, savedItems]) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            groups: data.groups,
            expenses: data.expenses,
            bills,
            savedItems,
          }));
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load data:', err);
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    localStorage.setItem('billbuddy_active', state.activeGroupId || '');
  }, [state.activeGroupId]);

  const dispatch = useCallback(async (action) => {
    switch (action.type) {
      case 'SET_ACTIVE_GROUP': {
        setState((prev) => ({ ...prev, activeGroupId: action.payload }));
        break;
      }

      case 'CREATE_GROUP': {
        if (!user) throw new Error('Not authenticated');
        const group = await createGroupInDB(user.id, action.payload.name, action.payload.members);
        setState((prev) => ({ ...prev, groups: [group, ...prev.groups] }));
        break;
      }

      case 'DELETE_GROUP': {
        await deleteGroupFromDB(action.payload);
        setState((prev) => ({
          ...prev,
          groups: prev.groups.filter((g) => g.id !== action.payload),
          expenses: prev.expenses.filter((e) => e.groupId !== action.payload),
          activeGroupId: prev.activeGroupId === action.payload ? null : prev.activeGroupId,
        }));
        break;
      }

      case 'ADD_EXPENSE': {
        const expense = await addExpenseInDB(
          action.payload.groupId,
          action.payload.payerId,
          action.payload.amount,
          action.payload.description,
          action.payload.presentMembers,
          action.payload.date,
          action.payload.splitDetails || null,
          action.payload.splitMode || 'equal'
        );
        setState((prev) => ({ ...prev, expenses: [...prev.expenses, expense] }));
        break;
      }

      case 'UPDATE_EXPENSE': {
        const updated = await updateExpenseInDB(action.payload.id, action.payload.updates);
        setState((prev) => ({
          ...prev,
          expenses: prev.expenses.map((e) => (e.id === updated.id ? updated : e)),
        }));
        break;
      }

      case 'DELETE_EXPENSE': {
        await deleteExpenseFromDB(action.payload);
        setState((prev) => ({
          ...prev,
          expenses: prev.expenses.filter((e) => e.id !== action.payload),
        }));
        break;
      }

      case 'ADD_MEMBER': {
        const member = await addMemberInDB(action.payload.groupId, action.payload.name, action.payload.color);
        setState((prev) => ({
          ...prev,
          groups: prev.groups.map((g) =>
            g.id === action.payload.groupId
              ? { ...g, members: [...g.members, member] }
              : g
          ),
        }));
        break;
      }

      case 'ADD_BILL': {
        if (!user) throw new Error('Not authenticated');
        const bill = await addBillInDB(
          user.id,
          action.payload.title,
          action.payload.items,
          action.payload.total,
          action.payload.paidAmount,
          action.payload.difference
        );
        setState((prev) => ({ ...prev, bills: [bill, ...prev.bills] }));
        break;
      }

      case 'DELETE_BILL': {
        await deleteBillFromDB(action.payload);
        setState((prev) => ({
          ...prev,
          bills: prev.bills.filter((b) => b.id !== action.payload),
        }));
        break;
      }

      case 'UPDATE_BILL': {
        const updatedBill = await updateBillInDB(action.payload.id, action.payload.updates);
        setState((prev) => ({
          ...prev,
          bills: prev.bills.map((b) => (b.id === updatedBill.id ? updatedBill : b)),
        }));
        break;
      }

      case 'ADD_SAVED_ITEM': {
        if (!user) throw new Error('Not authenticated');
        const savedItem = await addSavedItemInDB(user.id, action.payload.name, action.payload.price);
        setState((prev) => ({ ...prev, savedItems: [savedItem, ...prev.savedItems] }));
        break;
      }

      case 'DELETE_SAVED_ITEM': {
        await deleteSavedItemFromDB(action.payload);
        setState((prev) => ({
          ...prev,
          savedItems: prev.savedItems.filter((s) => s.id !== action.payload),
        }));
        break;
      }

      default:
        break;
    }
  }, [user]);

  return (
    <AppContext.Provider value={{ state, loading, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
