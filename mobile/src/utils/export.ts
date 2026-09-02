import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

// flatRows same as frontend/src/utils/export.ts:41
function flatRows(data: any) {
  const transactions: any[] = [];
  const categories: any[] = [];
  const groups: any[] = [];
  const months: any[] = [];
  for (const m of data.months) {
    months.push({ Month: m.name, Budget: m.total_budget, Expenses: m.total_expenses, Remaining: m.remaining_budget, Utilization: `${m.utilization_percentage}%` });
    for (const g of m.groups) {
      groups.push({ Month: m.name, Group: g.name, Budget: g.allocated_budget, Actual: g.actual_spending, Remaining: g.remaining_budget, Utilization: `${g.utilization_percentage}%` });
      for (const c of g.categories) {
        categories.push({ Month: m.name, Group: g.name, Category: c.name, Budget: c.allocated_budget, Actual: c.actual_spending, Remaining: c.remaining_budget, Utilization: `${c.utilization_percentage}%` });
        for (const t of c.transactions) {
          transactions.push({ Month: m.name, Group: g.name, Category: c.name, Description: t.description, Amount: t.amount, Date: t.date });
        }
      }
    }
  }
  return { transactions, categories, groups, months };
}

function toCSV(rows: any[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","));
  }
  return lines.join("\n");
}

async function writeAndShare(content: string, filename: string, mimeType: string) {
  if (Platform.OS === "web") {
    // Web fallback: trigger download via anchor
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  const fileUri = FileSystem.cacheDirectory + filename;
  await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: filename });
  }
}

async function writeBase64AndShare(base64: string, filename: string, mimeType: string) {
  if (Platform.OS === "web") {
    const blob = new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }
  const fileUri = FileSystem.cacheDirectory + filename;
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: filename });
  }
}

export async function exportCSV(data: any, yearName: string, _symbol?: string) {
  const { transactions, categories, groups, months } = flatRows(data);
  // combine sheets into one CSV with section headers for mobile simplicity
  const sections: string[] = [];
  sections.push("Monthly Summary");
  sections.push(toCSV(months));
  sections.push("\nGroups");
  sections.push(toCSV(groups));
  sections.push("\nCategories");
  sections.push(toCSV(categories));
  sections.push("\nTransactions");
  sections.push(toCSV(transactions));
  const csv = sections.join("\n");
  await writeAndShare(csv, `budget-${yearName}.csv`, "text/csv");
}

export async function exportXLSX(data: any, yearName: string, _symbol?: string) {
  // Lazy import xlsx to avoid bundling if not installed; fallback to CSV
  let XLSX: any;
  try {
    XLSX = await import("xlsx");
  } catch {
    return exportCSV(data, yearName, _symbol);
  }
  const { transactions, categories, groups, months } = flatRows(data);
  const wb = XLSX.utils.book_new();
  const sheets: [string, any[]][] = [
    ["Monthly Summary", months],
    ["Groups", groups],
    ["Categories", categories],
    ["Transactions", transactions],
  ];
  for (const [name, rows] of sheets) {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  await writeBase64AndShare(base64, `budget-${yearName}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

export async function exportPDF(data: any, yearName: string, symbol = "$") {
  // Lightweight PDF fallback: generate simple text PDF via xlsx-like or share as text
  // Try jspdf if available, else share summary as text
  let jsPDF: any;
  try {
    const mod = await import("jspdf");
    jsPDF = mod.default ?? mod.jsPDF ?? mod;
    await import("jspdf-autotable");
  } catch {
    // fallback: share summary as CSV text named .pdf
    const summary = `Budget Report - ${yearName}\nTotal Budget: ${symbol}${data.summary.total_budget.toFixed(2)}\nTotal Expenses: ${symbol}${data.summary.total_expenses.toFixed(2)}\nRemaining: ${symbol}${data.summary.remaining_budget.toFixed(2)}\nUtilization: ${data.summary.utilization_percentage}%\n`;
    await writeAndShare(summary, `budget-${yearName}-summary.txt`, "text/plain");
    return;
  }

  const { transactions, groups, months } = flatRows(data);
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFontSize(18);
  doc.text(`Budget Report - ${yearName}`, pageW / 2, 20, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Total Budget: ${symbol}${data.summary.total_budget.toFixed(2)}`, 14, 32);
  doc.text(`Total Expenses: ${symbol}${data.summary.total_expenses.toFixed(2)}`, 14, 40);
  doc.text(`Remaining: ${symbol}${data.summary.remaining_budget.toFixed(2)}`, 14, 48);
  doc.text(`Utilization: ${data.summary.utilization_percentage}%`, 14, 56);

  let y = 68;
  if (months.length > 0) {
    doc.setFontSize(14);
    doc.text("Monthly Summary", 14, y);
    y += 6;
    (doc as any).autoTable({
      startY: y,
      head: [["Month", "Budget", "Expenses", "Remaining", "Utilization"]],
      body: months.map((r: any) => [r.Month, `${symbol}${r.Budget.toFixed(2)}`, `${symbol}${r.Expenses.toFixed(2)}`, `${symbol}${r.Remaining.toFixed(2)}`, r.Utilization]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (groups.length > 0) {
    doc.setFontSize(14);
    doc.text("Groups Breakdown", 14, y);
    y += 6;
    (doc as any).autoTable({
      startY: y,
      head: [["Month", "Group", "Budget", "Actual", "Remaining", "Utilization"]],
      body: groups.map((r: any) => [r.Month, r.Group, `${symbol}${r.Budget.toFixed(2)}`, `${symbol}${r.Actual.toFixed(2)}`, `${symbol}${r.Remaining.toFixed(2)}`, r.Utilization]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (transactions.length > 0) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.text("All Transactions", 14, y);
    y += 6;
    (doc as any).autoTable({
      startY: y,
      head: [["Month", "Group", "Category", "Description", "Amount", "Date"]],
      body: transactions.map((r: any) => [r.Month, r.Group, r.Category, r.Description, `${symbol}${r.Amount.toFixed(2)}`, r.Date]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] },
    });
  }

  // Save: in RN get base64 via output
  const pdfBase64 = doc.output("datauristring").split(",")[1];
  await writeBase64AndShare(pdfBase64, `budget-${yearName}.pdf`, "application/pdf");
}
