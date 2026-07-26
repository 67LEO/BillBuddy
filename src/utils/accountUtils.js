export const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: '🍽️', color: '#E08244' },
  { name: 'Travel', icon: '🚕', color: '#3A2C5C' },
  { name: 'Rent', icon: '🏠', color: '#C23D3D' },
  { name: 'Shopping', icon: '🛒', color: '#A8D6B8' },
  { name: 'Entertainment', icon: '🎬', color: '#E08244' },
  { name: 'Health', icon: '💊', color: '#C23D3D' },
  { name: 'General', icon: '📦', color: '#3A2C5C' },
];

export function calculateRunningBalances(accounts) {
  const balances = {};

  accounts
    .filter((a) => !a.isSettled)
    .forEach((entry) => {
      const name = entry.personName.trim();
      if (!name) return;

      if (!balances[name]) {
        balances[name] = { name, totalDiya: 0, totalLiya: 0, net: 0, mobile: entry.mobile || '', entries: [] };
      }

      balances[name].entries.push(entry);

      if (entry.type === 'diya') {
        balances[name].totalDiya += entry.amount;
      } else {
        balances[name].totalLiya += entry.amount;
      }

      if (entry.mobile && !balances[name].mobile) {
        balances[name].mobile = entry.mobile;
      }
    });

  Object.values(balances).forEach((b) => {
    b.net = b.totalDiya - b.totalLiya;
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
  const persons = {};
  accounts.forEach((a) => {
    const name = a.personName.trim();
    if (name && !persons[name]) {
      persons[name] = { name, mobile: a.mobile || '' };
    } else if (name && a.mobile && !persons[name].mobile) {
      persons[name].mobile = a.mobile;
    }
  });
  return Object.values(persons);
}
