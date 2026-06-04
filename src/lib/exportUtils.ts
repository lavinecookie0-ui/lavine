// src/lib/exportUtils.ts

export function downloadCSV(filename: string, csvContent: string) {
  // Prepend BOM for Excel Turkish character support
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // If value contains comma, newline, or double quote, wrap it in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function generateCSV(headers: string[], data: any[][]): string {
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = data.map(row => row.map(escapeCSV).join(','));
  return [headerRow, ...dataRows].join('\n');
}

export function formatDateForFilename(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateTime(date: Date | any): string {
  if (!date) return '';
  // Handle Firestore Timestamp
  if (date && typeof date.toDate === 'function') {
    date = date.toDate();
  }
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');

  return `${dd}.${mm}.${yyyy} ${hh}:${mins}`;
}

export function formatNumberCSV(num: number | undefined | null): string {
  if (num === null || num === undefined) return '0';
  // You might want to use 10,50 format depending on Excel locale. 
  // We'll use the raw string format or a comma-replaced format.
  // Replacing dot with comma can be risky if standard CSV uses comma for separation, 
  // but Excel in TR locale expects comma as decimal separator. 
  // For safety, let's keep dot, or if we use comma decimal, we MUST quote it (escapeCSV handles that).
  return num.toString().replace('.', ',');
}
