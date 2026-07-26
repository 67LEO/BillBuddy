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
    membersByGroup[m.group_id].push({ id: m.id, name: m.name, color: m.color, mobile: m.mobile || '' });
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
    lastEditedBy: e.last_edited_by || '',
    lastEditedAt: e.last_edited_at || null,
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
        mobile: m.mobile || '',
      })));

    if (mErr) throw mErr;
  }

  const { data: savedMembers } = await supabase
    .from('members')
    .select('id, name, color, mobile')
    .eq('group_id', group.id);

  return {
    id: group.id,
    name: group.name,
    members: (savedMembers || []).map((m) => ({ id: m.id, name: m.name, color: m.color, mobile: m.mobile || '' })),
    createdAt: group.created_at,
  };
}

export async function deleteGroupFromDB(groupId) {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('groups').delete().eq('id', groupId);
  if (error) throw error;
}

export async function addMemberInDB(groupId, name, color, mobile) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('members')
    .insert({ group_id: groupId, name, color, mobile: mobile || '' })
    .select('id, name, color, mobile')
    .single();

  if (error) throw error;
  return { id: data.id, name: data.name, color: data.color, mobile: data.mobile || '' };
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

export async function updateSavedItemInDB(itemId, updates) {
  if (!supabase) throw new Error('Supabase not configured');

  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.price !== undefined) dbUpdates.price = updates.price;

  const { data, error } = await supabase
    .from('saved_items')
    .update(dbUpdates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return { id: data.id, name: data.name, price: Number(data.price), createdAt: data.created_at };
}

// ============================================
// PROFILES
// ============================================

export async function fetchProfile(userId) {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116' || error.code === '42P01' || error.code === 'PGRST205') {
      const { data: created, error: createErr } = await supabase
        .from('profiles')
        .insert({ user_id: userId })
        .select()
        .single();
      if (createErr) return null;
      return { id: created.id, userId: created.user_id, displayName: created.display_name || '', mobile: created.mobile || '', mobile2: created.mobile2 || '' };
    }
    return null;
  }

  return { id: data.id, userId: data.user_id, displayName: data.display_name || '', mobile: data.mobile || '', mobile2: data.mobile2 || '' };
}

export async function updateProfile(userId, updates) {
  if (!supabase) throw new Error('Supabase not configured');

  const dbUpdates = {};
  if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
  if (updates.mobile !== undefined) dbUpdates.mobile = updates.mobile;
  if (updates.mobile2 !== undefined) dbUpdates.mobile2 = updates.mobile2;

  const { data, error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  return { id: data.id, userId: data.user_id, displayName: data.display_name || '', mobile: data.mobile || '', mobile2: data.mobile2 || '' };
}

// ============================================
// CONTACTS
// ============================================

export async function fetchContacts(userId) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];

  return (data || []).map((c) => ({
    id: c.id,
    name: c.name,
    mobile: c.mobile || '',
    email: c.email || '',
    notes: c.notes || '',
    createdAt: c.created_at,
  }));
}

export async function addContactInDB(userId, name, mobile, email, notes) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('contacts')
    .insert({ user_id: userId, name, mobile: mobile || '', email: email || '', notes: notes || '' })
    .select()
    .single();

  if (error) throw error;

  return { id: data.id, name: data.name, mobile: data.mobile || '', email: data.email || '', notes: data.notes || '', createdAt: data.created_at };
}

export async function updateContactInDB(contactId, updates) {
  if (!supabase) throw new Error('Supabase not configured');

  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.mobile !== undefined) dbUpdates.mobile = updates.mobile;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { data, error } = await supabase
    .from('contacts')
    .update(dbUpdates)
    .eq('id', contactId)
    .select()
    .single();

  if (error) throw error;

  return { id: data.id, name: data.name, mobile: data.mobile || '', email: data.email || '', notes: data.notes || '', createdAt: data.created_at };
}

export async function deleteContactFromDB(contactId) {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('contacts').delete().eq('id', contactId);
  if (error) throw error;
}

// ============================================
// ACCOUNTS (diya/liya ledger)
// ============================================

export async function fetchAccounts(userId) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];

  return (data || []).map((a) => ({
    id: a.id,
    personName: a.person_name,
    type: a.type,
    amount: Number(a.amount),
    category: a.category || 'general',
    note: a.note || '',
    contactId: a.contact_id || null,
    mobile: a.mobile || '',
    isRecurring: a.is_recurring || false,
    recurringFreq: a.recurring_freq || null,
    recurringDay: a.recurring_day || null,
    isSettled: a.is_settled || false,
    settledAt: a.settled_at || null,
    batchItems: a.batch_items || null,
    date: a.date,
    createdAt: a.created_at,
  }));
}

export async function addAccountEntryInDB(userId, entry) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: userId,
      person_name: entry.personName,
      type: entry.type,
      amount: entry.amount,
      category: entry.category || 'general',
      note: entry.note || '',
      contact_id: entry.contactId || null,
      mobile: entry.mobile || '',
      is_recurring: entry.isRecurring || false,
      recurring_freq: entry.recurringFreq || null,
      recurring_day: entry.recurringDay || null,
      batch_items: entry.batchItems || null,
      date: entry.date || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    personName: data.person_name,
    type: data.type,
    amount: Number(data.amount),
    category: data.category || 'general',
    note: data.note || '',
    contactId: data.contact_id || null,
    mobile: data.mobile || '',
    isRecurring: data.is_recurring || false,
    recurringFreq: data.recurring_freq || null,
    recurringDay: data.recurring_day || null,
    isSettled: data.is_settled || false,
    settledAt: data.settled_at || null,
    batchItems: data.batch_items || null,
    date: data.date,
    createdAt: data.created_at,
  };
}

export async function updateAccountEntryInDB(entryId, updates) {
  if (!supabase) throw new Error('Supabase not configured');

  const dbUpdates = {};
  if (updates.personName !== undefined) dbUpdates.person_name = updates.personName;
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.note !== undefined) dbUpdates.note = updates.note;
  if (updates.contactId !== undefined) dbUpdates.contact_id = updates.contactId;
  if (updates.mobile !== undefined) dbUpdates.mobile = updates.mobile;
  if (updates.isSettled !== undefined) dbUpdates.is_settled = updates.isSettled;
  if (updates.settledAt !== undefined) dbUpdates.settled_at = updates.settledAt;
  if (updates.batchItems !== undefined) dbUpdates.batch_items = updates.batchItems;
  if (updates.date !== undefined) dbUpdates.date = updates.date;

  const { data, error } = await supabase
    .from('accounts')
    .update(dbUpdates)
    .eq('id', entryId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    personName: data.person_name,
    type: data.type,
    amount: Number(data.amount),
    category: data.category || 'general',
    note: data.note || '',
    contactId: data.contact_id || null,
    mobile: data.mobile || '',
    isRecurring: data.is_recurring || false,
    recurringFreq: data.recurring_freq || null,
    recurringDay: data.recurring_day || null,
    isSettled: data.is_settled || false,
    settledAt: data.settled_at || null,
    batchItems: data.batch_items || null,
    date: data.date,
    createdAt: data.created_at,
  };
}

export async function deleteAccountEntryFromDB(entryId) {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('accounts').delete().eq('id', entryId);
  if (error) throw error;
}

// ============================================
// CATEGORIES
// ============================================

export async function fetchCategories(userId) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) return [];

  return (data || []).map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon || '📝',
    color: c.color || '#3A2C5C',
  }));
}

export async function addCategoryInDB(userId, name, icon, color) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: userId, name, icon: icon || '📝', color: color || '#3A2C5C' })
    .select()
    .single();

  if (error) throw error;

  return { id: data.id, name: data.name, icon: data.icon, color: data.color };
}

export async function deleteCategoryFromDB(categoryId) {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('categories').delete().eq('id', categoryId);
  if (error) throw error;
}

// ============================================
// SAVED PERSONS (frequently used people)
// ============================================

export async function fetchSavedPersons(userId) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from('saved_persons')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];

  return (data || []).map((s) => ({
    id: s.id,
    name: s.name,
    defaultType: s.default_type,
    defaultAmount: Number(s.default_amount),
    defaultCategory: s.default_category || 'general',
    mobile: s.mobile || '',
    createdAt: s.created_at,
  }));
}

export async function addSavedPersonInDB(userId, person) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('saved_persons')
    .insert({
      user_id: userId,
      name: person.name,
      default_type: person.defaultType,
      default_amount: person.defaultAmount || 0,
      default_category: person.defaultCategory || 'general',
      mobile: person.mobile || '',
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    defaultType: data.default_type,
    defaultAmount: Number(data.default_amount),
    defaultCategory: data.default_category || 'general',
    mobile: data.mobile || '',
    createdAt: data.created_at,
  };
}

export async function deleteSavedPersonFromDB(personId) {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('saved_persons').delete().eq('id', personId);
  if (error) throw error;
}

export async function updateSavedPersonInDB(personId, updates) {
  if (!supabase) throw new Error('Supabase not configured');

  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.defaultType !== undefined) dbUpdates.default_type = updates.defaultType;
  if (updates.defaultAmount !== undefined) dbUpdates.default_amount = updates.defaultAmount;
  if (updates.defaultCategory !== undefined) dbUpdates.default_category = updates.defaultCategory;
  if (updates.mobile !== undefined) dbUpdates.mobile = updates.mobile;

  const { data, error } = await supabase
    .from('saved_persons')
    .update(dbUpdates)
    .eq('id', personId)
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    defaultType: data.default_type,
    defaultAmount: Number(data.default_amount),
    defaultCategory: data.default_category || 'general',
    mobile: data.mobile || '',
    createdAt: data.created_at,
  };
}

// ============================================
// SHARED GROUPS (auto-linked via mobile)
// ============================================

export async function findUsersByMobile(mobileNumbers) {
  if (!supabase || !mobileNumbers || mobileNumbers.length === 0) return [];

  const cleaned = mobileNumbers.map((n) => n.replace(/\D/g, '').slice(-10)).filter(Boolean);
  if (cleaned.length === 0) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name, mobile, mobile2')
    .or(`mobile.in.(${cleaned.join(',')}),mobile2.in.(${cleaned.join(',')})`);

  if (error) return [];
  return data || [];
}

export async function shareGroupWithUser(groupId, targetUserId, memberId, memberName, sharedByName) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('shared_groups')
    .upsert({
      group_id: groupId,
      user_id: targetUserId,
      member_id: memberId,
      member_name: memberName,
      shared_by: sharedByName,
    }, { onConflict: 'group_id,user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchSharedGroups(userId) {
  if (!supabase || !userId) return [];

  const { data: links, error: lErr } = await supabase
    .from('shared_groups')
    .select('*')
    .eq('user_id', userId);

  if (lErr || !links || links.length === 0) return [];

  const groupIds = [...new Set(links.map((l) => l.group_id))];
  if (groupIds.length === 0) return [];

  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds);

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .in('group_id', groupIds);

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .in('group_id', groupIds);

  const membersByGroup = {};
  (members || []).forEach((m) => {
    if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = [];
    membersByGroup[m.group_id].push({ id: m.id, name: m.name, color: m.color, mobile: m.mobile || '' });
  });

  const linkInfo = {};
  links.forEach((l) => { linkInfo[l.group_id] = l; });

  const formattedGroups = (groups || []).map((g) => ({
    id: g.id,
    name: g.name,
    members: membersByGroup[g.id] || [],
    createdAt: g.created_at,
    isShared: true,
    sharedBy: linkInfo[g.id]?.shared_by || 'Unknown',
    sharedMemberName: linkInfo[g.id]?.member_name || '',
  }));

  const formattedExpenses = (expenses || []).map((e) => ({
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
    lastEditedBy: e.last_edited_by || '',
    lastEditedAt: e.last_edited_at || null,
  }));

  return { groups: formattedGroups, expenses: formattedExpenses };
}

export async function removeSharedGroup(groupId, userId) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('shared_groups').delete().eq('group_id', groupId).eq('user_id', userId);
  if (error) throw error;
}

// ============================================
// EXPENSE LAST EDITED BY
// ============================================

export async function updateExpenseLastEditor(expenseId, editorName) {
  if (!supabase) return;

  await supabase
    .from('expenses')
    .update({ last_edited_by: editorName, last_edited_at: new Date().toISOString() })
    .eq('id', expenseId);
}

export async function findGroupsByMemberMobile(mobileNumbers) {
  if (!supabase || !mobileNumbers || mobileNumbers.length === 0) return [];

  const cleaned = mobileNumbers.filter((n) => n && n.replace(/\D/g, '').length >= 10);
  if (cleaned.length === 0) return [];

  const { data, error } = await supabase.rpc('find_groups_by_member_mobile', {
    mobile_numbers: cleaned,
  });

  if (error) return [];
  return data || [];
}
