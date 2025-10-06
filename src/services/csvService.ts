/**
 * CSV Service for handling CSV export functionality
 */

export interface CSVRow {
  [key: string]: string | number | null | undefined;
}

export interface CSVExportOptions {
  filename?: string;
  headers?: string[];
  delimiter?: string;
}

/**
 * Converts an array of objects to CSV format
 */
export const arrayToCSV = (data: CSVRow[], options: CSVExportOptions = {}): string => {
  const { headers, delimiter = ',' } = options;

  if (!data.length) return '';

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    csvHeaders.join(delimiter),
    ...data.map((row) =>
      csvHeaders
        .map((header) => {
          const value = row[header];
          const stringValue = value === null || value === undefined ? '' : String(value);

          // Escape values that contain delimiter, newline, or quotes
          const needsEscaping = /[",\n]/.test(stringValue);
          const escapedValue = stringValue.replace(/"/g, '""');

          return needsEscaping ? `"${escapedValue}"` : escapedValue;
        })
        .join(delimiter),
    ),
  ].join('\n');

  return csvContent;
};

/**
 * Downloads CSV content as a file
 */
export const downloadCSV = (csvContent: string, filename: string = 'export.csv'): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Exports data to CSV and downloads it
 */
export const exportToCSV = (
  data: CSVRow[],
  filename: string = 'export.csv',
  options: CSVExportOptions = {},
): void => {
  const csvContent = arrayToCSV(data, options);
  downloadCSV(csvContent, filename);
};

/**
 * Formats currency for CSV export
 */
export const formatCurrencyForCSV = (amount: number, currency: string = 'GBP'): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formats date for CSV export
 */
export const formatDateForCSV = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }
  return d.toLocaleDateString('en-GB');
};

/**
 * Transaction-specific CSV export utilities
 */
export const exportTransactionsToCSV = (
  transactions: Array<{
    date: string;
    description: string;
    money_in?: number;
    money_out?: number;
    balance: number;
    currency: string;
    category?: string;
    subcategory?: string;
  }>,
  filename: string = 'transactions.csv',
): void => {
  const csvData = transactions.map((transaction) => ({
    date: formatDateForCSV(transaction.date),
    description: transaction.description,
    money_in: transaction.money_in || 0,
    money_out: transaction.money_out || 0,
    net: (transaction.money_in || 0) - (transaction.money_out || 0),
    balance: transaction.balance,
    currency: transaction.currency,
    category: transaction.category || '',
    subcategory: transaction.subcategory || '',
  }));

  const headers = [
    'date',
    'description',
    'money_in',
    'money_out',
    'net',
    'balance',
    'currency',
    'category',
    'subcategory',
  ];

  exportToCSV(csvData, filename, { headers });
};
