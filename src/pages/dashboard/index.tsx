import { Grid, Stack, Button, ButtonGroup } from '@mui/material';
import TransactionCategories from 'components/sections/dashboard/transactions/TransactionCategories';
import TransactionCharts from 'components/sections/dashboard/transactions/TransactionCharts';
import AffordabilityReport from 'components/sections/dashboard/transactions/AffordabilityReport';
import IncomeVerification from 'components/sections/dashboard/transactions/IncomeVerification';
import AMLRiskIndicators from 'components/sections/dashboard/transactions/AMLRiskIndicators';
import BankSelector, { BankData } from 'components/sections/dashboard/transactions/BankSelector';
import IconifyIcon from 'components/base/IconifyIcon';
import TransactionSummary from 'components/sections/dashboard/transactions/TransactionSummary';
import FileUpload from 'components/sections/dashboard/upload/FileUpload';
import { buildApiUrl } from 'config/api';
import { TransactionResponse, CATEGORY_MAP } from 'config/categories';
import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { saveUpload, testFirebaseConnection } from '../../services/uploadService';

const Dashboard = () => {
  const [transactionData, setTransactionData] = useState<TransactionResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [originalApiResponse, setOriginalApiResponse] = useState<unknown>(null);
  const { currentUser } = useAuth();

  const handleClearData = () => {
    setTransactionData(null);
    setSelectedBank(null);
    setOriginalApiResponse(null);
  };

  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(buildApiUrl('/extract-transactions'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Transaction extraction result:', result);

      // Store the original API response for bank data extraction
      setOriginalApiResponse(result);

      // Save the upload to Firebase if user is logged in
      console.log('Current user status:', {
        isLoggedIn: !!currentUser,
        userId: currentUser?.uid,
        email: currentUser?.email,
      });

      if (currentUser) {
        // Test Firebase connection first
        const firebaseConnected = await testFirebaseConnection(currentUser.uid);
        console.log('Firebase connection status:', firebaseConnected);

        if (!firebaseConnected) {
          console.error('Firebase connection failed - cannot save upload');
          return;
        }

        // Extract customer name and date range from the response
        let customerName = 'Unknown Customer';
        const dateRange = { start: '', end: '' };
        let bank = 'Unknown Bank';

        try {
          if (result.results && result.results.length > 0) {
            const firstResult = result.results[0];
            customerName =
              firstResult.customer_name || firstResult.customerName || 'Unknown Customer';
            bank = files.length > 1 ? `Multiple Banks (${files.length} files)` : firstResult.bank;

            // Extract date range from transactions
            const allTransactions = result.results.flatMap(
              (fileResult: { transactions: Array<{ date?: string; transaction_date?: string }> }) =>
                fileResult.transactions || [],
            );

            if (allTransactions.length > 0) {
              const dates = allTransactions
                .map(
                  (t: { date?: string; transaction_date?: string }) =>
                    new Date(t.date || t.transaction_date || ''),
                )
                .filter((date: Date) => !isNaN(date.getTime()))
                .sort((a: Date, b: Date) => a.getTime() - b.getTime());

              if (dates.length > 0) {
                dateRange.start = dates[0].toISOString().split('T')[0];
                dateRange.end = dates[dates.length - 1].toISOString().split('T')[0];
              }
            }
          } else if (result.transactions) {
            customerName = result.customer_name || result.customerName || 'Unknown Customer';
            bank = result.bank;

            // Extract date range from transactions
            const dates = result.transactions
              .map(
                (t: { date?: string; transaction_date?: string }) =>
                  new Date(t.date || t.transaction_date || ''),
              )
              .filter((date: Date) => !isNaN(date.getTime()))
              .sort((a: Date, b: Date) => a.getTime() - b.getTime());

            if (dates.length > 0) {
              dateRange.start = dates[0].toISOString().split('T')[0];
              dateRange.end = dates[dates.length - 1].toISOString().split('T')[0];
            }
          }

          // Save to Firebase
          console.log('Attempting to save upload to Firebase...', {
            userId: currentUser.uid,
            customerName,
            bank,
            dateRange,
            resultKeys: Object.keys(result),
          });

          const uploadId = await saveUpload(currentUser.uid, customerName, bank, dateRange, result);
          console.log('Upload saved successfully with ID:', uploadId);
        } catch (saveError) {
          console.error('Error saving upload:', saveError);
          console.error('Save error details:', {
            error: saveError,
            userId: currentUser.uid,
            customerName,
            bank,
            dateRange,
          });
          // Don't fail the upload if saving fails
        }
      }

      // Handle the response format
      if (result.results && result.results.length > 0) {
        // Handle multiple files response format
        const allTransactions = result.results.flatMap(
          (fileResult: { transactions: unknown[] }) => fileResult.transactions,
        );
        const firstResult = result.results[0];

        setTransactionData({
          bank: files.length > 1 ? `Multiple Banks (${files.length} files)` : firstResult.bank,
          transactions: allTransactions,
        });
        setSelectedBank(null); // Reset bank selection when new data is loaded
      } else if (result.transactions) {
        // Handle single file response format
        setTransactionData({
          bank: result.bank,
          transactions: result.transactions,
        });
        setSelectedBank(null); // Reset bank selection when new data is loaded
      } else {
        console.error('No results found in response');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      // Handle error - you might want to show this to the user
    } finally {
      setIsUploading(false);
    }
  };

  // Extract bank data from transaction data
  const bankData = useMemo(() => {
    if (!transactionData) return [];

    // If we have results from multiple files, extract bank info from each
    const banks: BankData[] = [];
    const bankMap = new Map<string, { customer_name: string; transactionCount: number }>();

    // Try to extract customer names from the original API response structure
    // This assumes the API response has the structure you showed with results array
    const originalResults = (originalApiResponse as { results?: unknown[] })?.results || [];

    transactionData.transactions.forEach((transaction) => {
      const bankName = transaction.bank;
      if (bankMap.has(bankName)) {
        const existing = bankMap.get(bankName)!;
        existing.transactionCount += 1;
      } else {
        // Try to find customer name from original results
        const originalResult = originalResults.find(
          (result: unknown) => (result as { bank: string }).bank === bankName,
        ) as { customer_name?: string } | undefined;
        const customerName = originalResult?.customer_name || 'Customer';

        bankMap.set(bankName, {
          customer_name: customerName,
          transactionCount: 1,
        });
      }
    });

    // Convert map to array
    bankMap.forEach((data, bankName) => {
      banks.push({
        bank: bankName,
        customer_name: data.customer_name,
        transactionCount: data.transactionCount,
      });
    });

    return banks;
  }, [transactionData, originalApiResponse]);

  // Filter transactions based on selected bank
  const filteredTransactionData = useMemo(() => {
    if (!transactionData) return null;
    if (!selectedBank) return transactionData;

    const filtered = {
      ...transactionData,
      transactions: transactionData.transactions.filter(
        (transaction) => transaction.bank === selectedBank,
      ),
    };

    console.log(
      `Filtered transactions for ${selectedBank}:`,
      filtered.transactions.length,
      'transactions',
    );
    return filtered;
  }, [transactionData, selectedBank]);

  // Export helpers (buttons under upload area)
  const buildExportRows = () => {
    if (!filteredTransactionData) return [] as Array<Record<string, string | number | null>>;
    // Group by category/subcategory like the Categories view
    const grouped: Record<string, Record<string, unknown[]>> = Object.keys(CATEGORY_MAP).reduce(
      (acc, cat) => {
        acc[cat] = {};
        return acc;
      },
      {} as Record<string, Record<string, unknown[]>>,
    );
    filteredTransactionData.transactions.forEach((t) => {
      const cat = t.category;
      const sub = t.subcategory && t.subcategory.trim() !== '' ? t.subcategory : 'direct';
      if (!grouped[cat]) grouped[cat] = {};
      if (!grouped[cat][sub]) grouped[cat][sub] = [];
      grouped[cat][sub].push(t);
    });
    const rows: Array<Record<string, string | number | null>> = [];
    Object.keys(CATEGORY_MAP).forEach((cat) => {
      const subs = grouped[cat] || {};
      const direct = subs['direct'] || [];
      direct.forEach((t) => {
        const transaction = t as {
          date: string;
          description: string;
          money_in?: number;
          money_out?: number;
          balance: number;
          currency: string;
        };
        rows.push({
          category: cat,
          subcategory: '',
          date: transaction.date,
          description: transaction.description,
          money_in: transaction.money_in || 0,
          money_out: transaction.money_out || 0,
          net: (transaction.money_in || 0) - (transaction.money_out || 0),
          balance: transaction.balance,
          currency: transaction.currency,
        });
      });
      const categoryData = CATEGORY_MAP[cat as keyof typeof CATEGORY_MAP];
      if (categoryData && categoryData.subcategories) {
        Object.keys(categoryData.subcategories).forEach((sub) => {
          (subs[sub] || []).forEach((t: unknown) => {
            const transaction = t as {
              date: string;
              description: string;
              money_in?: number;
              money_out?: number;
              balance: number;
              currency: string;
            };
            rows.push({
              category: cat,
              subcategory: sub,
              date: transaction.date,
              description: transaction.description,
              money_in: transaction.money_in || 0,
              money_out: transaction.money_out || 0,
              net: (transaction.money_in || 0) - (transaction.money_out || 0),
              balance: transaction.balance,
              currency: transaction.currency,
            });
          });
        });
      }
    });
    return rows;
  };

  const exportCSV = () => {
    const rows = buildExportRows();
    if (!rows.length) return;
    const headers = [
      'category',
      'subcategory',
      'date',
      'description',
      'money_in',
      'money_out',
      'net',
      'balance',
      'currency',
    ];
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        headers
          .map((h) => {
            const v = r[h as keyof typeof r];
            const s = v === null || v === undefined ? '' : String(v);
            const needs = /[",\n]/.test(s);
            const esc = s.replace(/"/g, '""');
            return needs ? `"${esc}"` : esc;
          })
          .join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${filteredTransactionData?.bank}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!filteredTransactionData) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const fmt = (n: number) =>
      new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
    const styles = `
      <style>
        :root { --muted:#6b7280; --border:#e5e7eb; --bg:#ffffff; --stripe:#fafafa; }
        * { box-sizing: border-box; }
        body { font-family: Inter, Arial, sans-serif; padding: 20px; color: #0f172a; background: var(--bg); }
        header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 16px; }
        .title { font-size: 22px; font-weight: 800; }
        .meta { font-size: 12px; color: var(--muted); }
        .category { margin: 18px 0; page-break-inside: avoid; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
        .cat-header { padding: 12px 14px; color: #fff; display:flex; align-items:center; justify-content:space-between; font-weight:700; }
        .totals { font-weight:700; }
        table { width: 100%; border-collapse: collapse; }
        thead th { text-align:left; font-size:12px; color:#1f2937; padding:10px 12px; background:#f3f4f6; border-bottom:1px solid var(--border); position: sticky; top: 0; }
        tbody td { padding:10px 12px; border-bottom:1px solid var(--border); vertical-align: top; font-size:12px; }
        tbody tr:nth-child(odd) { background: var(--stripe); }
        .right { text-align:right; white-space: nowrap; }
        .desc { font-weight:600; }
        .note { display:block; color:#d97706; margin-top:2px; }
        .pos { color: #16a34a; font-weight: 700; }
        .neg { color: #dc2626; font-weight: 700; }
        .subrow { background:#f9fafb; font-weight:600; }
        .footer { background:#f3f4f6; font-weight:800; }
        @media print { thead { display: table-header-group; } }
      </style>`;
    // Build grouped like above
    const grouped: Record<string, Record<string, unknown[]>> = Object.keys(CATEGORY_MAP).reduce(
      (acc, cat) => {
        acc[cat] = {};
        return acc;
      },
      {} as Record<string, Record<string, unknown[]>>,
    );
    filteredTransactionData.transactions.forEach((t) => {
      const cat = t.category;
      const sub = t.subcategory && t.subcategory.trim() !== '' ? t.subcategory : 'direct';
      if (!grouped[cat]) grouped[cat] = {};
      if (!grouped[cat][sub]) grouped[cat][sub] = [];
      grouped[cat][sub].push(t);
    });
    const generatedAt = new Date().toLocaleString('en-GB');
    let html = `<header>
      <div class="title">Transactions - ${filteredTransactionData.bank}</div>
      <div class="meta">Generated: ${generatedAt}</div>
    </header>`;
    Object.keys(CATEGORY_MAP).forEach((cat) => {
      const color = CATEGORY_MAP[cat as keyof typeof CATEGORY_MAP]?.color || '#64748b';
      const subs = grouped[cat] || {};
      const allTx = Object.values(subs).flat();
      const totals = allTx.reduce(
        (acc: { totalIn: number; totalOut: number }, t: unknown) => ({
          totalIn: acc.totalIn + ((t as { money_in?: number }).money_in || 0),
          totalOut: acc.totalOut + ((t as { money_out?: number }).money_out || 0),
        }),
        { totalIn: 0, totalOut: 0 },
      );
      const net = totals.totalIn - totals.totalOut;
      html += `<section class="category">`;
      html += `<div class="cat-header" style="background:${color}">`;
      html += `<div style="text-transform:capitalize">${cat}</div>`;
      html += `<div class="totals"><span class="pos">${fmt(totals.totalIn)}</span> &nbsp;|&nbsp; <span class="neg">-${fmt(totals.totalOut)}</span> &nbsp;|&nbsp; ${fmt(net)}</div>`;
      html += `</div>`;
      html += `<table>
        <thead>
          <tr>
            <th style="width:90px">Date</th>
            <th>Subcategory</th>
            <th>Description</th>
            <th class="right">Money In</th>
            <th class="right">Money Out</th>
            <th class="right">Net</th>
            <th class="right">Balance</th>
          </tr>
        </thead>
        <tbody>`;
      // direct
      (subs['direct'] || []).forEach((t: unknown) => {
        const transaction = t as {
          money_in?: number;
          money_out?: number;
          date: string;
          description: string;
          note?: string;
          balance: number;
        };
        const netRow = (transaction.money_in || 0) - (transaction.money_out || 0);
        html += `<tr>
          <td>${(() => {
            const date = new Date(transaction.date);
            return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-GB');
          })()}</td>
          <td></td>
          <td class="desc">${transaction.description}${transaction.note ? `<span class="note">${transaction.note}</span>` : ''}</td>
          <td class="right">${transaction.money_in ? `<span class="pos">${fmt(transaction.money_in)}</span>` : ''}</td>
          <td class="right">${transaction.money_out ? `<span class="neg">-${fmt(transaction.money_out)}</span>` : ''}</td>
          <td class="right">${netRow >= 0 ? `<span class="pos">${fmt(netRow)}</span>` : `<span class="neg">${fmt(netRow)}</span>`}</td>
          <td class="right">${fmt(transaction.balance)}</td>
        </tr>`;
      });
      // subcategories
      const categoryData = CATEGORY_MAP[cat as keyof typeof CATEGORY_MAP];
      if (categoryData && categoryData.subcategories) {
        Object.keys(categoryData.subcategories).forEach((sub) => {
          const txs = subs[sub] || [];
          if (!txs.length) {
            // show a muted subcategory row to keep structure
            html += `<tr class="subrow"><td></td><td colspan="6" style="color:var(--muted)">${sub} • No transactions</td></tr>`;
            return;
          }
          const subt = txs.reduce(
            (acc: { totalIn: number; totalOut: number }, t: unknown) => ({
              totalIn: acc.totalIn + ((t as { money_in?: number }).money_in || 0),
              totalOut: acc.totalOut + ((t as { money_out?: number }).money_out || 0),
            }),
            { totalIn: 0, totalOut: 0 },
          );
          const snet = subt.totalIn - subt.totalOut;
          html += `<tr class="subrow"><td></td><td colspan="2" style="text-transform:capitalize">${sub}</td><td class="right"><span class="pos">${fmt(subt.totalIn)}</span></td><td class="right"><span class="neg">-${fmt(subt.totalOut)}</span></td><td class="right">${snet >= 0 ? `<span class="pos">${fmt(snet)}</span>` : `<span class="neg">${fmt(snet)}</span>`}</td><td></td></tr>`;
          txs.forEach((t: unknown) => {
            const transaction = t as {
              money_in?: number;
              money_out?: number;
              date: string;
              description: string;
              note?: string;
              balance: number;
            };
            const netRow = (transaction.money_in || 0) - (transaction.money_out || 0);
            html += `<tr>
              <td>${(() => {
                const date = new Date(transaction.date);
                return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-GB');
              })()}</td>
              <td style="text-transform:capitalize">${sub}</td>
              <td class="desc">${transaction.description}${transaction.note ? `<span class="note">${transaction.note}</span>` : ''}</td>
              <td class="right">${transaction.money_in ? `<span class="pos">${fmt(transaction.money_in)}</span>` : ''}</td>
              <td class="right">${transaction.money_out ? `<span class="neg">-${fmt(transaction.money_out)}</span>` : ''}</td>
              <td class="right">${netRow >= 0 ? `<span class="pos">${fmt(netRow)}</span>` : `<span class="neg">${fmt(netRow)}</span>`}</td>
              <td class="right">${fmt(transaction.balance)}</td>
            </tr>`;
          });
        });
      }
      // footer
      html += `<tr class="footer"><td></td><td colspan="2">Category totals</td><td class="right"><span class="pos">${fmt(totals.totalIn)}</span></td><td class="right"><span class="neg">-${fmt(totals.totalOut)}</span></td><td class="right">${net >= 0 ? `<span class="pos">${fmt(net)}</span>` : `<span class="neg">${fmt(net)}</span>`}</td><td></td></tr>`;
      html += `</tbody></table></section>`;
    });
    w.document.write(
      `<html><head><title>Transactions - ${filteredTransactionData.bank}</title>${styles}</head><body>${html}</body></html>`,
    );
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Grid container spacing={{ xs: 2.5, sm: 3 }} mb={3}>
      {/* ------------- File Upload section ---------------- */}
      <Grid item xs={12}>
        <FileUpload
          onFileUpload={handleFileUpload}
          onClearData={handleClearData}
          isUploading={isUploading}
        />
        {transactionData && (
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
            <ButtonGroup variant="contained" size="small">
              <Button
                color="primary"
                onClick={exportCSV}
                startIcon={<IconifyIcon icon="material-symbols:table" />}
              >
                Export CSV
              </Button>
              <Button
                color="secondary"
                onClick={exportPDF}
                startIcon={<IconifyIcon icon="material-symbols:picture-as-pdf" />}
              >
                Export PDF
              </Button>
            </ButtonGroup>
          </Stack>
        )}
      </Grid>

      {/* ------------- Bank Selector section ---------------- */}
      {transactionData && bankData.length > 1 && (
        <Grid item xs={12}>
          <BankSelector
            banks={bankData}
            selectedBank={selectedBank}
            onBankChange={setSelectedBank}
          />
        </Grid>
      )}

      {/* ------------- Transaction Summary section ---------------- */}
      {filteredTransactionData && (
        <Grid item xs={12}>
          <TransactionSummary transactionData={filteredTransactionData} />
        </Grid>
      )}

      {/* ------------- Transaction Categories section ---------------- */}
      {filteredTransactionData && (
        <Grid item xs={12}>
          <TransactionCategories transactionData={filteredTransactionData} />
        </Grid>
      )}

      {/* ------------- Income Verification (separate, above AML & Affordability) ---------------- */}
      {filteredTransactionData && (
        <>
          <Grid item xs={12}>
            <IncomeVerification transactionData={filteredTransactionData} />
          </Grid>
          <Grid item xs={12}>
            <AffordabilityReport transactionData={filteredTransactionData} />
          </Grid>
        </>
      )}

      {/* ------------- AML & Risk Indicators section (separate, after affordability) ------------- */}
      {filteredTransactionData && (
        <Grid item xs={12}>
          <AMLRiskIndicators transactionData={filteredTransactionData} />
        </Grid>
      )}

      {/* ------------- Transaction Charts section ---------------- */}
      {filteredTransactionData && (
        <Grid item xs={12}>
          <TransactionCharts transactionData={filteredTransactionData} />
        </Grid>
      )}

      {/* ------------- Card section ---------------- */}
      {/* <Grid item xs={12} xl={8} zIndex={1}>
        <MyCards />
      </Grid> */}

      {/* ------------- Slider section ---------------- */}

      {/* ------------- Data-Grid section ---------------- */}
      <Grid item xs={12}></Grid>
    </Grid>
  );
};

export default Dashboard;
