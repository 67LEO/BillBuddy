export function calculateSplit(expense, members) {
  const presentCount = expense.presentMembers.length;
  if (presentCount === 0) return [];

  const perPerson = expense.amount / presentCount;

  return members.map((member) => {
    const isPayer = member.id === expense.payerId;
    const isPresent = expense.presentMembers.includes(member.id);

    let balanceChange = 0;
    if (isPayer) {
      balanceChange += expense.amount;
    }
    if (isPresent) {
      balanceChange -= perPerson;
    }

    return {
      memberId: member.id,
      name: member.name,
      balanceChange: Math.round(balanceChange * 100) / 100,
      perPersonShare: isPresent ? Math.round(perPerson * 100) / 100 : 0,
    };
  });
}

export function calculateAllBalances(expenses, members) {
  const balances = {};
  members.forEach((m) => {
    balances[m.id] = { paid: 0, owes: 0, net: 0, name: m.name };
  });

  expenses.forEach((expense) => {
    const presentCount = expense.presentMembers.length;
    if (presentCount === 0) return;
    const perPerson = expense.amount / presentCount;

    if (balances[expense.payerId]) {
      balances[expense.payerId].paid += expense.amount;
    }

    expense.presentMembers.forEach((memberId) => {
      if (balances[memberId]) {
        balances[memberId].owes += perPerson;
      }
    });
  });

  Object.keys(balances).forEach((id) => {
    balances[id].net = Math.round((balances[id].paid - balances[id].owes) * 100) / 100;
    balances[id].paid = Math.round(balances[id].paid * 100) / 100;
    balances[id].owes = Math.round(balances[id].owes * 100) / 100;
  });

  return balances;
}

export function getBalancesForPeriod(expenses, members, startDate, endDate) {
  const filtered = expenses.filter((e) => {
    const d = new Date(e.date);
    return d >= new Date(startDate) && d <= new Date(endDate);
  });
  return calculateAllBalances(filtered, members);
}

export function getWeeklyBalances(expenses, members) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return getBalancesForPeriod(expenses, members, startOfWeek, now);
}

export function getMonthlyBalances(expenses, members) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return getBalancesForPeriod(expenses, members, startOfMonth, now);
}
