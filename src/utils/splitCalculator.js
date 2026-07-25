export function calculateSplit(expense, members) {
  const presentCount = expense.presentMembers.length;
  if (presentCount === 0) return [];

  const isCustom = expense.splitMode === 'custom' && expense.splitDetails;

  if (isCustom) {
    const totalQty = Object.values(expense.splitDetails).reduce((sum, qty) => sum + (qty || 0), 0);
    if (totalQty === 0) return calculateSplit({ ...expense, splitMode: 'equal' }, members);

    return members.map((member) => {
      const isPayer = member.id === expense.payerId;
      const qty = expense.splitDetails[member.id] || 0;
      const perPersonShare = qty > 0 ? (qty / totalQty) * expense.amount : 0;
      let balanceChange = 0;
      if (isPayer) balanceChange += expense.amount;
      if (qty > 0) balanceChange -= perPersonShare;

      return {
        memberId: member.id,
        name: member.name,
        balanceChange: Math.round(balanceChange * 100) / 100,
        perPersonShare: Math.round(perPersonShare * 100) / 100,
        quantity: qty,
      };
    });
  }

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
      quantity: isPresent ? 1 : 0,
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

    const isCustom = expense.splitMode === 'custom' && expense.splitDetails;

    if (isCustom) {
      const totalQty = Object.values(expense.splitDetails).reduce((sum, qty) => sum + (qty || 0), 0);
      if (totalQty > 0) {
        if (balances[expense.payerId]) {
          balances[expense.payerId].paid += expense.amount;
        }
        Object.entries(expense.splitDetails).forEach(([memberId, qty]) => {
          if (balances[memberId] && qty > 0) {
            balances[memberId].owes += (qty / totalQty) * expense.amount;
          }
        });
      }
    } else {
      const perPerson = expense.amount / presentCount;

      if (balances[expense.payerId]) {
        balances[expense.payerId].paid += expense.amount;
      }

      expense.presentMembers.forEach((memberId) => {
        if (balances[memberId]) {
          balances[memberId].owes += perPerson;
        }
      });
    }
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
