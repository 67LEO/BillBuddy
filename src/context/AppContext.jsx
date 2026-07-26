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
  fetchProfile,
  updateProfile,
  fetchContacts,
  addContactInDB,
  updateContactInDB,
  deleteContactFromDB,
  fetchAccounts,
  addAccountEntryInDB,
  updateAccountEntryInDB,
  deleteAccountEntryFromDB,
  fetchCategories,
  addCategoryInDB,
  deleteCategoryFromDB,
  fetchSavedPersons,
  addSavedPersonInDB,
  deleteSavedPersonFromDB,
  updateSavedItemInDB,
  updateSavedPersonInDB,
  findUsersByMobile,
  shareGroupWithUser,
  fetchSharedGroups,
  updateExpenseLastEditor,
  findGroupsByMemberMobile,
} from '../lib/supabase';

const AppContext = createContext(null);

const initialState = {
  groups: [],
  expenses: [],
  bills: [],
  savedItems: [],
  profile: null,
  contacts: [],
  accounts: [],
  categories: [],
  savedPersons: [],
  sharedGroups: [],
  sharedExpenses: [],
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

    const load = async () => {
      try {
        const results = await Promise.allSettled([
          fetchAllData(user.id),
          fetchBills(user.id),
          fetchSavedItems(user.id),
          fetchProfile(user.id),
          fetchContacts(user.id),
          fetchAccounts(user.id),
          fetchCategories(user.id),
          fetchSavedPersons(user.id),
          fetchSharedGroups(user.id),
        ]);

        if (!cancelled) {
          const data = results[0].status === 'fulfilled' ? results[0].value : { groups: [], expenses: [] };
          const bills = results[1].status === 'fulfilled' ? results[1].value : [];
          const savedItems = results[2].status === 'fulfilled' ? results[2].value : [];
          const profile = results[3].status === 'fulfilled' ? results[3].value : null;
          const contacts = results[4].status === 'fulfilled' ? results[4].value : [];
          const accounts = results[5].status === 'fulfilled' ? results[5].value : [];
          const categories = results[6].status === 'fulfilled' ? results[6].value : [];
          const savedPersons = results[7].status === 'fulfilled' ? results[7].value : [];
          const sharedData = results[8].status === 'fulfilled' ? results[8].value : { groups: [], expenses: [] };

          setState((prev) => ({
            ...prev,
            groups: data.groups,
            expenses: data.expenses,
            bills,
            savedItems,
            profile,
            contacts,
            accounts,
            categories,
            savedPersons,
            sharedGroups: sharedData.groups || [],
            sharedExpenses: sharedData.expenses || [],
          }));
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        if (!cancelled) setLoading(false);
      }
    };

    load();

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

        // Auto-match: find users by member mobile numbers
        const memberMobiles = (action.payload.members || []).filter((m) => m.mobile);
        if (memberMobiles.length > 0) {
          const mobileNums = memberMobiles.map((m) => m.mobile);
          const matchedUsers = await findUsersByMobile(mobileNums);
          const ownerName = action.payload.displayName || user.email?.split('@')[0] || 'Someone';

          for (const match of matchedUsers) {
            if (match.user_id === user.id) continue;
            const member = group.members.find((gm) =>
              gm.mobile && (gm.mobile === match.mobile || gm.mobile === match.mobile2)
            );
            if (member) {
              try {
                await shareGroupWithUser(group.id, match.user_id, member.id, member.name, ownerName);
              } catch (err) {
                console.error('Share failed:', err);
              }
            }
          }
        }
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
        const editorName = state.profile?.displayName || user?.email?.split('@')[0] || '';
        if (editorName) {
          await updateExpenseLastEditor(expense.id, editorName);
          expense.lastEditedBy = editorName;
        }
        setState((prev) => ({ ...prev, expenses: [...prev.expenses, expense] }));
        break;
      }

      case 'UPDATE_EXPENSE': {
        const updated = await updateExpenseInDB(action.payload.id, action.payload.updates);
        const updEditorName = state.profile?.displayName || user?.email?.split('@')[0] || '';
        if (updEditorName) {
          await updateExpenseLastEditor(updated.id, updEditorName);
          updated.lastEditedBy = updEditorName;
        }
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
        const member = await addMemberInDB(action.payload.groupId, action.payload.name, action.payload.color, action.payload.mobile || '');
        setState((prev) => ({
          ...prev,
          groups: prev.groups.map((g) =>
            g.id === action.payload.groupId
              ? { ...g, members: [...g.members, member] }
              : g
          ),
        }));

        // Auto-match: find users by this member's mobile
        if (action.payload.mobile && user) {
          const matchedUsers = await findUsersByMobile([action.payload.mobile]);
          const ownerName = state.profile?.displayName || user.email?.split('@')[0] || 'Someone';
          for (const match of matchedUsers) {
            if (match.user_id === user.id) continue;
            try {
              await shareGroupWithUser(action.payload.groupId, match.user_id, member.id, member.name, ownerName);
            } catch (err) {
              console.error('Share failed:', err);
            }
          }
        }
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

      case 'UPDATE_SAVED_ITEM': {
        const updatedItem = await updateSavedItemInDB(action.payload.id, action.payload.updates);
        setState((prev) => ({
          ...prev,
          savedItems: prev.savedItems.map((s) => (s.id === updatedItem.id ? updatedItem : s)),
        }));
        break;
      }

      case 'UPDATE_PROFILE': {
        if (!user) throw new Error('Not authenticated');
        const updatedProfile = await updateProfile(user.id, action.payload);
        setState((prev) => ({ ...prev, profile: updatedProfile }));

        // Auto-match: check if this user's new mobile matches any existing group members
        const myMobiles = [updatedProfile.mobile, updatedProfile.mobile2].filter(Boolean);
        if (myMobiles.length > 0) {
          const matchedGroups = await findGroupsByMemberMobile(myMobiles);
          const ownerName = updatedProfile.displayName || user.email?.split('@')[0] || 'Someone';
          for (const mg of matchedGroups) {
            try {
              await shareGroupWithUser(mg.group_id, user.id, mg.member_id, mg.member_name, ownerName);
            } catch (err) {
              console.error('Auto-match share failed:', err);
            }
          }
          if (matchedGroups.length > 0) {
            const sharedData = await fetchSharedGroups(user.id);
            setState((prev) => ({
              ...prev,
              sharedGroups: sharedData.groups || [],
              sharedExpenses: sharedData.expenses || [],
            }));
          }
        }
        break;
      }

      case 'ADD_CONTACT': {
        if (!user) throw new Error('Not authenticated');
        const contact = await addContactInDB(user.id, action.payload.name, action.payload.mobile, action.payload.email, action.payload.notes);
        setState((prev) => ({ ...prev, contacts: [contact, ...prev.contacts] }));
        break;
      }

      case 'UPDATE_CONTACT': {
        const updatedContact = await updateContactInDB(action.payload.id, action.payload.updates);
        setState((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) => (c.id === updatedContact.id ? updatedContact : c)),
        }));
        break;
      }

      case 'DELETE_CONTACT': {
        await deleteContactFromDB(action.payload);
        setState((prev) => ({
          ...prev,
          contacts: prev.contacts.filter((c) => c.id !== action.payload),
        }));
        break;
      }

      case 'ADD_ACCOUNT_ENTRY': {
        if (!user) throw new Error('Not authenticated');
        const entry = await addAccountEntryInDB(user.id, action.payload);
        setState((prev) => ({ ...prev, accounts: [entry, ...prev.accounts] }));
        break;
      }

      case 'UPDATE_ACCOUNT_ENTRY': {
        const updatedEntry = await updateAccountEntryInDB(action.payload.id, action.payload.updates);
        setState((prev) => ({
          ...prev,
          accounts: prev.accounts.map((a) => (a.id === updatedEntry.id ? updatedEntry : a)),
        }));
        break;
      }

      case 'DELETE_ACCOUNT_ENTRY': {
        await deleteAccountEntryFromDB(action.payload);
        setState((prev) => ({
          ...prev,
          accounts: prev.accounts.filter((a) => a.id !== action.payload),
        }));
        break;
      }

      case 'SETTLE_ACCOUNT_ENTRY': {
        const settled = await updateAccountEntryInDB(action.payload, {
          isSettled: true,
          settledAt: new Date().toISOString(),
        });
        setState((prev) => ({
          ...prev,
          accounts: prev.accounts.map((a) => (a.id === settled.id ? settled : a)),
        }));
        break;
      }

      case 'UNSETTLE_ACCOUNT_ENTRY': {
        const unsettled = await updateAccountEntryInDB(action.payload, {
          isSettled: false,
          settledAt: null,
        });
        setState((prev) => ({
          ...prev,
          accounts: prev.accounts.map((a) => (a.id === unsettled.id ? unsettled : a)),
        }));
        break;
      }

      case 'ADD_CATEGORY': {
        if (!user) throw new Error('Not authenticated');
        const cat = await addCategoryInDB(user.id, action.payload.name, action.payload.icon, action.payload.color);
        setState((prev) => ({ ...prev, categories: [...prev.categories, cat] }));
        break;
      }

      case 'DELETE_CATEGORY': {
        await deleteCategoryFromDB(action.payload);
        setState((prev) => ({
          ...prev,
          categories: prev.categories.filter((c) => c.id !== action.payload),
        }));
        break;
      }

      case 'ADD_SAVED_PERSON': {
        if (!user) throw new Error('Not authenticated');
        const savedPerson = await addSavedPersonInDB(user.id, action.payload);
        setState((prev) => ({ ...prev, savedPersons: [savedPerson, ...prev.savedPersons] }));
        break;
      }

      case 'DELETE_SAVED_PERSON': {
        await deleteSavedPersonFromDB(action.payload);
        setState((prev) => ({
          ...prev,
          savedPersons: prev.savedPersons.filter((s) => s.id !== action.payload),
        }));
        break;
      }

      case 'UPDATE_SAVED_PERSON': {
        const updatedPerson = await updateSavedPersonInDB(action.payload.id, action.payload.updates);
        setState((prev) => ({
          ...prev,
          savedPersons: prev.savedPersons.map((s) => (s.id === updatedPerson.id ? updatedPerson : s)),
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
