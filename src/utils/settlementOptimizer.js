export function optimizeSettlements(balances) {
  const debtors = [];
  const creditors = [];

  Object.entries(balances).forEach(([id, data]) => {
    const net = Math.round(data.net * 100) / 100;
    if (net < -0.01) {
      debtors.push({ id, name: data.name, amount: Math.abs(net) });
    } else if (net > 0.01) {
      creditors.push({ id, name: data.name, amount: net });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > 0.01) {
      settlements.push({
        from: { id: debtor.id, name: debtor.name },
        to: { id: creditor.id, name: creditor.name },
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    debtor.amount = Math.round((debtor.amount - settleAmount) * 100) / 100;
    creditor.amount = Math.round((creditor.amount - settleAmount) * 100) / 100;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return settlements;
}

export function getTotalExpenses(expenses) {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function getExpensesByPeriod(expenses, period) {
  const now = new Date();
  return expenses.filter((e) => {
    const d = new Date(e.date);
    if (period === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return d >= startOfWeek;
    }
    if (period === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

export function getMemberExpenseSummary(expenses, members) {
  return members.map((member) => {
    const paid = expenses
      .filter((e) => e.payerId === member.id)
      .reduce((sum, e) => sum + e.amount, 0);
    const involved = expenses.filter((e) =>
      e.presentMembers.includes(member.id) ||
      (e.splitDetails && e.splitDetails[member.id] > 0)
    );
    const owes = involved.reduce((sum, e) => {
      const isCustom = e.splitMode === 'custom' && e.splitDetails;
      if (isCustom) {
        const totalQty = Object.values(e.splitDetails).reduce((s, qty) => s + (qty || 0), 0);
        const memberQty = e.splitDetails[member.id] || 0;
        return totalQty > 0 ? sum + (memberQty / totalQty) * e.amount : sum;
      }
      return sum + e.amount / e.presentMembers.length;
    }, 0);
    return {
      ...member,
      totalPaid: Math.round(paid * 100) / 100,
      totalOwes: Math.round(owes * 100) / 100,
      net: Math.round((paid - owes) * 100) / 100,
      expenseCount: involved.length,
    };
  });
}
