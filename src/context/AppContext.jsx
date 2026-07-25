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
} from '../lib/supabase';

const AppContext = createContext(null);

const initialState = {
  groups: [],
  expenses: [],
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

    fetchAllData(user.id)
      .then((data) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            groups: data.groups,
            expenses: data.expenses,
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
          action.payload.date
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
