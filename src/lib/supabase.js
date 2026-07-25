import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('BillBuddy: Supabase credentials not found. Auth will not work until .env is configured.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// ============================================
// DATABASE HELPERS
// ============================================

export async function fetchAllData(userId) {
  if (!supabase || !userId) return { groups: [], expenses: [] };

  const { data: groups, error: gErr } = await supabase
    .from('groups')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (gErr) throw gErr;

  const groupIds = (groups || []).map((g) => g.id);
  if (groupIds.length === 0) return { groups: [], expenses: [] };

  const [membersResult, expensesResult] = await Promise.all([
    supabase.from('members').select('*').in('group_id', groupIds),
    supabase.from('expenses').select('*').in('group_id', groupIds),
  ]);

  if (membersResult.error) throw membersResult.error;
  if (expensesResult.error) throw expensesResult.error;

  const membersByGroup = {};
  (membersResult.data || []).forEach((m) => {
    if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = [];
    membersByGroup[m.group_id].push({ id: m.id, name: m.name, color: m.color });
  });

  const formattedGroups = (groups || []).map((g) => ({
    id: g.id,
    name: g.name,
    members: membersByGroup[g.id] || [],
    createdAt: g.created_at,
  }));

  const formattedExpenses = (expensesResult.data || []).map((e) => ({
    id: e.id,
    groupId: e.group_id,
    payerId: e.payer_id,
    amount: Number(e.amount),
    description: e.description,
    presentMembers: e.present_members || [],
    splitDetails: e.split_details || null,
    splitMode: e.split_mode || 'equal',
    date: e.date,
    createdAt: e.created_at,
  }));

  return { groups: formattedGroups, expenses: formattedExpenses };
}

export async function createGroupInDB(userId, name, members) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: group, error: gErr } = await supabase
    .from('groups')
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (gErr) throw gErr;

  if (members.length > 0) {
    const { error: mErr } = await supabase
      .from('members')
      .insert(members.map((m) => ({
        group_id: group.id,
        name: m.name,
        color: m.color,
      })));

    if (mErr) throw mErr;
  }

  const { data: savedMembers } = await supabase
    .from('members')
    .select('id, name, color')
    .eq('group_id', group.id);

  return {
    id: group.id,
    name: group.name,
    members: (savedMembers || []).map((m) => ({ id: m.id, name: m.name, color: m.color })),
    createdAt: group.created_at,
  };
}

export async function deleteGroupFromDB(groupId) {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('groups').delete().eq('id', groupId);
  if (error) throw error;
}

export async function addMemberInDB(groupId, name, color) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('members')
    .insert({ group_id: groupId, name, color })
    .select('id, name, color')
    .single();

  if (error) throw error;
  return { id: data.id, name: data.name, color: data.color };
}

export async function addExpenseInDB(groupId, payerId, amount, description, presentMembers, date, splitDetails, splitMode) {
  if (!supabase) throw new Error('Supabase not configured');

  const insertData = {
    group_id: groupId,
    payer_id: payerId,
    amount,
    description,
    present_members: presentMembers,
    split_mode: splitMode || 'equal',
    date: date || new Date().toISOString(),
  };

  if (splitDetails && splitMode === 'custom') {
    insertData.split_details = splitDetails;
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    groupId: data.group_id,
    payerId: data.payer_id,
    amount: Number(data.amount),
    description: data.description,
    presentMembers: data.present_members || [],
    splitDetails: data.split_details || null,
    splitMode: data.split_mode || 'equal',
    date: data.date,
    createdAt: data.created_at,
  };
}

export async function updateExpenseInDB(expenseId, updates) {
  if (!supabase) throw new Error('Supabase not configured');

  const dbUpdates = {};
  if (updates.payerId !== undefined) dbUpdates.payer_id = updates.payerId;
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.presentMembers !== undefined) dbUpdates.present_members = updates.presentMembers;
  if (updates.splitDetails !== undefined) dbUpdates.split_details = updates.splitDetails;
  if (updates.splitMode !== undefined) dbUpdates.split_mode = updates.splitMode;
  if (updates.date !== undefined) dbUpdates.date = updates.date;

  const { data, error } = await supabase
    .from('expenses')
    .update(dbUpdates)
    .eq('id', expenseId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    groupId: data.group_id,
    payerId: data.payer_id,
    amount: Number(data.amount),
    description: data.description,
    presentMembers: data.present_members || [],
    splitDetails: data.split_details || null,
    splitMode: data.split_mode || 'equal',
    date: data.date,
    createdAt: data.created_at,
  };
}

export async function deleteExpenseFromDB(expenseId) {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw error;
}

// ============================================
// BILLS (Quick Bill Calculator)
// ============================================

export async function fetchBills(userId) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((b) => ({
    id: b.id,
    title: b.title || '',
    items: b.items || [],
    total: Number(b.total),
    paidAmount: Number(b.paid_amount),
    difference: Number(b.difference),
    createdAt: b.created_at,
  }));
}

export async function addBillInDB(userId, title, items, total, paidAmount, difference) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('bills')
    .insert({
      user_id: userId,
      title: title || '',
      items,
      total,
      paid_amount: paidAmount,
      difference,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title || '',
    items: data.items || [],
    total: Number(data.total),
    paidAmount: Number(data.paid_amount),
    difference: Number(data.difference),
    createdAt: data.created_at,
  };
}

export async function deleteBillFromDB(billId) {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('bills').delete().eq('id', billId);
  if (error) throw error;
}

export async function updateBillInDB(billId, updates) {
  if (!supabase) throw new Error('Supabase not configured');

  const dbUpdates = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.items !== undefined) dbUpdates.items = updates.items;
  if (updates.total !== undefined) dbUpdates.total = updates.total;
  if (updates.paidAmount !== undefined) dbUpdates.paid_amount = updates.paidAmount;
  if (updates.difference !== undefined) dbUpdates.difference = updates.difference;

  const { data, error } = await supabase
    .from('bills')
    .update(dbUpdates)
    .eq('id', billId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title || '',
    items: data.items || [],
    total: Number(data.total),
    paidAmount: Number(data.paid_amount),
    difference: Number(data.difference),
    createdAt: data.created_at,
  };
}

// ============================================
// SAVED ITEMS (reusable item library)
// ============================================

export async function fetchSavedItems(userId) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from('saved_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((s) => ({
    id: s.id,
    name: s.name,
    price: Number(s.price),
    createdAt: s.created_at,
  }));
}

export async function addSavedItemInDB(userId, name, price) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('saved_items')
    .insert({ user_id: userId, name, price })
    .select()
    .single();

  if (error) throw error;

  return { id: data.id, name: data.name, price: Number(data.price), createdAt: data.created_at };
}

export async function deleteSavedItemFromDB(itemId) {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('saved_items').delete().eq('id', itemId);
  if (error) throw error;
}
