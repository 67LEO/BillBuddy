import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('BillBuddy: Supabase credentials not found. Auth will not work until .env is configured.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
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

export async function addExpenseInDB(groupId, payerId, amount, description, presentMembers, date) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      group_id: groupId,
      payer_id: payerId,
      amount,
      description,
      present_members: presentMembers,
      date: date || new Date().toISOString(),
    })
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
    date: data.date,
    createdAt: data.created_at,
  };
}

export async function deleteExpenseFromDB(expenseId) {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw error;
}
