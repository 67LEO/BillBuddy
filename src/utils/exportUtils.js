import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SITE_URL = 'https://billbuddy-x00g.onrender.com';

function formatDate(a) {
  const raw = a.date || a.createdAt;
  if (!raw) return 'N/A';
  return new Date(raw).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function exportCSV(accounts, categories) {
  const catMap = {};
  categories.forEach((c) => { catMap[c.name] = c.icon; });

  const header = 'Date,Person,Type,Amount,Category,Note,Status';
  const rows = accounts.map((a) => {
    const d = formatDate(a);
    const cat = `${catMap[a.category] || ''} ${a.category}`;
    const note = (a.note || '').replace(/"/g, '""');
    return `${d},${a.personName},${a.type === 'diya' ? 'Diya (Gave)' : 'Liya (Received)'},${a.amount},${cat},"${note}",${a.isSettled ? 'Settled' : 'Active'}`;
  });

  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `billbuddy-account-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportPDF(accounts, categories) {
  const catMap = {};
  categories.forEach((c) => { catMap[c.name] = c.icon; });

  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const INK = [58, 44, 92];
  const CREAM = [244, 233, 208];
  const PUMPKIN = [224, 130, 68];
  const CRIMSON = [194, 61, 61];

  let logoDataUrl = null;
  try {
    const resp = await fetch('/billbuddy-logo.png');
    if (resp.ok) {
      const blob = await resp.blob();
      logoDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }
  } catch (e) {
    // logo fetch failed — continue without logo
  }

  function drawHeader() {
    doc.setFillColor(...PUMPKIN);
    doc.rect(0, 0, pageW, 6, 'F');

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 14, 18, 22, 22);
    } else {
      doc.setFillColor(...INK);
      doc.roundedRect(14, 18, 22, 22, 3, 3, 'F');
      doc.setFontSize(16);
      doc.setTextColor(...CREAM);
      doc.text('B', 25, 32, { align: 'center' });
    }

    doc.setFontSize(20);
    doc.setTextColor(...INK);
    doc.text('BillBuddy', 42, 31);

    doc.setFontSize(8);
    doc.setTextColor(...INK);
    doc.setGState(new doc.GState({ opacity: 0.45 }));
    doc.text('A calmer way to split', 42, 37);
    doc.setGState(new doc.GState({ opacity: 1 }));

    const genDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(`Hisab Report  |  ${genDate}`, pageW - 14, 31, { align: 'right' });

    doc.setDrawColor(...INK);
    doc.setLineWidth(0.4);
    doc.line(14, 44, pageW - 14, 44);
  }

  function drawFooter() {
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 20, pageW - 14, pageH - 20);

    doc.setFillColor(...PUMPKIN);
    doc.roundedRect(14, pageH - 16, 3.5, 3.5, 0.8, 0.8, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...INK);
    doc.setGState(new doc.GState({ opacity: 0.6 }));
    doc.text('Track expenses smartly', 20, pageH - 13.5);

    doc.setTextColor(...PUMPKIN);
    doc.textWithLink(SITE_URL, 72, pageH - 13.5, { url: SITE_URL });

    doc.setTextColor(...INK);
    doc.setGState(new doc.GState({ opacity: 0.45 }));
    doc.text('Your hisab, your way', 14, pageH - 9);

    doc.setGState(new doc.GState({ opacity: 0.5 }));
    const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
    doc.text(`Page ${pageNum}`, pageW - 14, pageH - 9, { align: 'right' });
    doc.setGState(new doc.GState({ opacity: 1 }));
  }

  drawHeader();

  const active = accounts.filter((a) => !a.isSettled);
  const settled = accounts.filter((a) => a.isSettled);
  const totalDiya = accounts.filter((a) => a.type === 'diya' || a.isSettled).reduce((s, a) => s + a.amount, 0);
  const totalLiya = accounts.filter((a) => a.type === 'liya' && !a.isSettled).reduce((s, a) => s + a.amount, 0);

  doc.setFillColor(...CREAM);
  doc.roundedRect(14, 48, pageW - 28, 18, 2, 2, 'F');
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 48, pageW - 28, 18, 2, 2, 'S');

  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(`Active: ${active.length}`, 20, 55);
  doc.text(`Settled: ${settled.length}`, 56, 55);
  doc.text(`Total: ${accounts.length}`, 92, 55);

  doc.setFontSize(10);
  doc.setTextColor(...CRIMSON);
  doc.text(`Diya: Rs.${totalDiya.toLocaleString('en-IN')}`, 20, 62);
  doc.setTextColor(...INK);
  doc.text(`Liya: Rs.${totalLiya.toLocaleString('en-IN')}`, 80, 62);

  const tableData = accounts.map((a) => [
    formatDate(a),
    a.personName,
    a.type === 'diya' ? 'Diya (Gave)' : 'Liya (Received)',
    `Rs.${a.amount.toLocaleString('en-IN')}`,
    `${catMap[a.category] || ''} ${a.category}`,
    a.note || '-',
    a.isSettled ? 'Settled' : 'Active',
  ]);

  autoTable(doc, {
    startY: 70,
    head: [['Date', 'Person', 'Type', 'Amount', 'Category', 'Note', 'Status']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2.5, textColor: INK },
    headStyles: { fillColor: INK, textColor: CREAM, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 245, 238] },
    columnStyles: {
      3: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 6) {
        if (data.cell.raw === 'Settled') {
          data.cell.styles.textColor = [34, 197, 94];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = PUMPKIN;
          data.cell.styles.fontStyle = 'bold';
        }
      }
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw && data.cell.raw.includes('Diya')) {
          data.cell.styles.textColor = CRIMSON;
        } else {
          data.cell.styles.textColor = [34, 197, 94];
        }
      }
    },
    didDrawPage: () => {
      drawHeader();
      drawFooter();
    },
  });

  doc.save(`billbuddy-account-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function generateShareText(stats, settlements, balances) {
  const lines = [];
  lines.push('🧾 BillBuddy Hisab Summary');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  lines.push(`Total Diya: ₹${stats.totalDiya.toLocaleString('en-IN')}`);
  lines.push(`Total Liya: ₹${stats.totalLiya.toLocaleString('en-IN')}`);

  const netLabel = stats.netBalance >= 0 ? 'Net: You are owed' : 'Net: You owe';
  lines.push(`${netLabel}: ₹${Math.abs(stats.netBalance).toLocaleString('en-IN')}`);
  lines.push('');

  if (settlements.length > 0) {
    lines.push('Settlement Plan:');
    lines.push('────────────────');
    settlements.forEach((s) => {
      lines.push(`${s.from} → ${s.to}: ₹${s.amount.toLocaleString('en-IN')}`);
    });
    lines.push('');
  }

  const pendingPersons = Object.values(balances).filter((b) => Math.abs(b.net) > 0.01);
  if (pendingPersons.length > 0) {
    lines.push('Balances:');
    lines.push('────────────────');
    pendingPersons.forEach((b) => {
      const status = b.net > 0 ? `owes you ₹${b.net.toLocaleString('en-IN')}` : `you owe ₹${Math.abs(b.net).toLocaleString('en-IN')}`;
      lines.push(`• ${b.name}: ${status}`);
    });
    lines.push('');
  }

  lines.push(`📊 Track expenses: ${SITE_URL}`);

  return lines.join('\n');
}

export function generateShareTextWithLink() {
  return `Check out BillBuddy - a smart expense tracker and hisab manager!\n\n🧾 Track groups, split bills, manage personal accounts\n📒 Quick Bill Calculator\n📊 Smart Settlement Plans\n\n🌐 ${SITE_URL}`;
}

export function shareToWhatsApp(text) {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

export function shareGeneric(text) {
  if (navigator.share) {
    navigator.share({ text }).catch(() => {
      navigator.clipboard.writeText(text);
    });
  } else {
    navigator.clipboard.writeText(text);
  }
}
