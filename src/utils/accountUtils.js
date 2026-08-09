export const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: '🍽️', color: '#E08244' },
  { name: 'Travel', icon: '🚕', color: '#3A2C5C' },
  { name: 'Rent', icon: '🏠', color: '#C23D3D' },
  { name: 'Shopping', icon: '🛒', color: '#A8D6B8' },
  { name: 'Entertainment', icon: '🎬', color: '#E08244' },
  { name: 'Health', icon: '💊', color: '#C23D3D' },
  { name: 'General', icon: '📦', color: '#3A2C5C' },
];

function normalizeName(name) {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function canonicalPhone(mobile) {
  return (mobile || '').replace(/\D/g, '').slice(-10);
}

// Same person ko ek bucket me milao — naam normalize karke AUR mobile se bhi.
// Union-find taaki naam + mobile dono se groups merge ho.
function bucketByPerson(accounts) {
  const entries = accounts.filter((a) => a.personName && a.personName.trim());
  if (entries.length === 0) return [];

  const parent = Array.from({ length: entries.length }, (_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  const nameIdx = {};
  entries.forEach((e, i) => {
    const k = normalizeName(e.personName);
    if (!k) return;
    if (nameIdx[k] !== undefined) union(nameIdx[k], i);
    else nameIdx[k] = i;
  });

  const phoneIdx = {};
  entries.forEach((e, i) => {
    const p = canonicalPhone(e.mobile);
    if (!p) return;
    if (phoneIdx[p] !== undefined) union(phoneIdx[p], i);
    else phoneIdx[p] = i;
  });

  const groups = new Map();
  entries.forEach((e, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, { name: '', mobile: '', entries: [] });
    const g = groups.get(root);
    g.entries.push(e);
    if (e.mobile && !g.mobile) g.mobile = e.mobile;
  });

  return [...groups.values()].map((g) => {
    const counts = {};
    let best = '';
    g.entries.forEach((e) => {
      const n = e.personName.trim();
      if (!n) return;
      counts[n] = (counts[n] || 0) + 1;
      if (!best || counts[n] > counts[best]) best = n;
    });
    g.name = best || g.entries[0]?.personName?.trim() || '';
    return g;
  });
}

export function calculateRunningBalances(accounts) {
  const balances = {};

  bucketByPerson(accounts).forEach((b) => {
    const active = b.entries.filter((a) => !a.isSettled);
    if (active.length === 0 || !b.name) return;

    balances[b.name] = {
      name: b.name,
      totalDiya: 0,
      totalLiya: 0,
      net: 0,
      mobile: b.mobile,
      entries: active,
    };

    active.forEach((entry) => {
      if (entry.type === 'diya') {
        balances[b.name].totalDiya += entry.amount;
      } else {
        balances[b.name].totalLiya += entry.amount;
      }
    });

    balances[b.name].net = balances[b.name].totalDiya - balances[b.name].totalLiya;
  });

  return balances;
}

export function getFilteredAccounts(accounts, filters) {
  let result = [...accounts];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (a) =>
        a.personName.toLowerCase().includes(q) ||
        a.note.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }

  if (filters.type && filters.type !== 'all') {
    result = result.filter((a) => a.type === filters.type);
  }

  if (filters.category && filters.category !== 'all') {
    result = result.filter((a) => a.category === filters.category);
  }

  if (filters.status === 'active') {
    result = result.filter((a) => !a.isSettled);
  } else if (filters.status === 'settled') {
    result = result.filter((a) => a.isSettled);
  }

  if (filters.dateRange) {
    const now = new Date();
    let start;
    if (filters.dateRange === 'week') {
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
    } else if (filters.dateRange === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    if (start) {
      result = result.filter((a) => new Date(a.date) >= start);
    }
  }

  if (filters.minAmount !== undefined && filters.minAmount !== '') {
    result = result.filter((a) => a.amount >= Number(filters.minAmount));
  }
  if (filters.maxAmount !== undefined && filters.maxAmount !== '') {
    result = result.filter((a) => a.amount <= Number(filters.maxAmount));
  }

  return result;
}

export function optimizeAccountSettlements(balances) {
  const debtors = [];
  const creditors = [];

  Object.values(balances).forEach((b) => {
    const rounded = Math.round(b.net * 100) / 100;
    if (rounded < -0.01) {
      debtors.push({ name: b.name, amount: Math.abs(rounded) });
    } else if (rounded > 0.01) {
      creditors.push({ name: b.name, amount: rounded });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const transfer = Math.min(debtors[i].amount, creditors[j].amount);
    if (transfer > 0.01) {
      settlements.push({
        from: debtors[i].name,
        to: creditors[j].name,
        amount: Math.round(transfer * 100) / 100,
      });
    }
    debtors[i].amount -= transfer;
    creditors[j].amount -= transfer;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return settlements;
}

export function getAccountStats(accounts) {
  const active = accounts.filter((a) => !a.isSettled);
  const totalDiya = accounts.filter((a) => a.type === 'diya' || a.isSettled).reduce((s, a) => s + a.amount, 0);
  const totalLiya = accounts.filter((a) => a.type === 'liya' && !a.isSettled).reduce((s, a) => s + a.amount, 0);
  const netBalance = totalDiya - totalLiya;
  const pendingCount = Object.keys(calculateRunningBalances(active)).length;

  return { totalDiya, totalLiya, netBalance, pendingCount, totalEntries: accounts.length };
}

export function getUniquePersons(accounts) {
  return bucketByPerson(accounts).map((b) => ({ name: b.name, mobile: b.mobile || '' }));
}

export function groupAccountsByPerson(accounts) {
  return bucketByPerson(accounts)
    .map((b) => {
      let totalDiya = 0;
      let totalLiya = 0;
      let total = 0;
      b.entries.forEach((entry) => {
        if (entry.type === 'diya') totalDiya += entry.amount;
        else totalLiya += entry.amount;
        total += entry.amount;
      });
      return { name: b.name, totalDiya, totalLiya, total, entries: b.entries };
    })
    .sort((a, b) => b.total - a.total);
}
