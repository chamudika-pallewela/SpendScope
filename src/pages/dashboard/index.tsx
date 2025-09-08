import { Grid, Stack, Button, ButtonGroup } from '@mui/material';
import WeeklyActivity from 'components/sections/dashboard/activity/WeeklyActivity';
import BalanceHistory from 'components/sections/dashboard/balance/BalanceHistory';
// import MyCards from 'components/sections/dashboard/creditCards/MyCards';
import ExpenseStatistics from 'components/sections/dashboard/expense/ExpenseStatistics';
import InvoiceOverviewTable from 'components/sections/dashboard/invoice/InvoiceOverviewTable';
import RecentTransactions from 'components/sections/dashboard/transactions/RecentTransaction';
import TransactionCategories from 'components/sections/dashboard/transactions/TransactionCategories';
import TransactionCharts from 'components/sections/dashboard/transactions/TransactionCharts';
import AffordabilityReport from 'components/sections/dashboard/transactions/AffordabilityReport';
import IncomeVerification from 'components/sections/dashboard/transactions/IncomeVerification';
import AMLRiskIndicators from 'components/sections/dashboard/transactions/AMLRiskIndicators';
import IconifyIcon from 'components/base/IconifyIcon';
import TransactionSummary from 'components/sections/dashboard/transactions/TransactionSummary';
import QuickTransfer from 'components/sections/dashboard/transfer/QuickTransfer';
import FileUpload from 'components/sections/dashboard/upload/FileUpload';
import { buildApiUrl } from 'config/api';
import { TransactionResponse, CATEGORY_MAP } from 'config/categories';
import { useState } from 'react';

const Dashboard = () => {
  const [transactionData, setTransactionData] = useState<TransactionResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(buildApiUrl('/extract-transactions'), {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result: TransactionResponse = await response.json();
        console.log('Transaction extraction result:', result);
        setTransactionData(result);
      } else {
        console.error('Failed to extract transactions');
        // Handle error
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      // Handle error
    } finally {
      setIsUploading(false);
    }
  };

  // Export helpers (buttons under upload area)
  const buildExportRows = () => {
    if (!transactionData) return [] as Array<Record<string, string | number | null>>;
    // Group by category/subcategory like the Categories view
    const grouped: Record<string, Record<string, any[]>> = Object.keys(CATEGORY_MAP).reduce(
      (acc, cat) => {
        acc[cat] = {};
        return acc;
      },
      {} as Record<string, Record<string, any[]>>,
    );
    transactionData.transactions.forEach((t) => {
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
      direct.forEach((t) =>
        rows.push({
          category: cat,
          subcategory: '',
          date: t.date,
          description: t.description,
          money_in: t.money_in || 0,
          money_out: t.money_out || 0,
          net: (t.money_in || 0) - (t.money_out || 0),
          balance: t.balance,
          currency: t.currency,
        }),
      );
      CATEGORY_MAP[cat as keyof typeof CATEGORY_MAP]?.subcategories.forEach((sub) => {
        (subs[sub] || []).forEach((t) =>
          rows.push({
            category: cat,
            subcategory: sub,
            date: t.date,
            description: t.description,
            money_in: t.money_in || 0,
            money_out: t.money_out || 0,
            net: (t.money_in || 0) - (t.money_out || 0),
            balance: t.balance,
            currency: t.currency,
          }),
        );
      });
    });
    return rows;
  };

  const exportCSV = () => {
    const rows = buildExportRows();
    if (!rows.length) return;
    const headers = ['category', 'subcategory', 'date', 'description', 'money_in', 'money_out', 'net', 'balance', 'currency'];
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
    a.download = `transactions_${transactionData?.bank}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!transactionData) return;
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
    const grouped: Record<string, Record<string, any[]>> = Object.keys(CATEGORY_MAP).reduce(
      (acc, cat) => {
        acc[cat] = {};
        return acc;
      },
      {} as Record<string, Record<string, any[]>>,
    );
    transactionData.transactions.forEach((t) => {
      const cat = t.category;
      const sub = t.subcategory && t.subcategory.trim() !== '' ? t.subcategory : 'direct';
      if (!grouped[cat]) grouped[cat] = {};
      if (!grouped[cat][sub]) grouped[cat][sub] = [];
      grouped[cat][sub].push(t);
    });
    const generatedAt = new Date().toLocaleString('en-GB');
    let html = `<header>
      <div class=\"title\">Transactions - ${transactionData.bank}</div>
      <div class=\"meta\">Generated: ${generatedAt}</div>
    </header>`;
    Object.keys(CATEGORY_MAP).forEach((cat) => {
      const color = CATEGORY_MAP[cat as keyof typeof CATEGORY_MAP]?.color || '#64748b';
      const subs = grouped[cat] || {};
      const allTx = Object.values(subs).flat();
      const totals = allTx.reduce(
        (acc, t: any) => ({
          totalIn: acc.totalIn + (t.money_in || 0),
          totalOut: acc.totalOut + (t.money_out || 0),
        }),
        { totalIn: 0, totalOut: 0 },
      );
      const net = totals.totalIn - totals.totalOut;
      html += `<section class=\"category\">`;
      html += `<div class=\"cat-header\" style=\"background:${color}\">`;
      html += `<div style=\"text-transform:capitalize\">${cat}</div>`;
      html += `<div class=\"totals\"><span class=\"pos\">${fmt(totals.totalIn)}</span> &nbsp;|&nbsp; <span class=\"neg\">-${fmt(totals.totalOut)}</span> &nbsp;|&nbsp; ${fmt(net)}</div>`;
      html += `</div>`;
      html += `<table>
        <thead>
          <tr>
            <th style=\"width:90px\">Date</th>
            <th>Subcategory</th>
            <th>Description</th>
            <th class=\"right\">Money In</th>
            <th class=\"right\">Money Out</th>
            <th class=\"right\">Net</th>
            <th class=\"right\">Balance</th>
          </tr>
        </thead>
        <tbody>`;
      // direct
      (subs['direct'] || []).forEach((t: any) => {
        const netRow = (t.money_in || 0) - (t.money_out || 0);
        html += `<tr>
          <td>${new Date(t.date).toLocaleDateString('en-GB')}</td>
          <td></td>
          <td class=\"desc\">${t.description}${t.note ? `<span class=\"note\">${t.note}</span>` : ''}</td>
          <td class=\"right\">${t.money_in ? `<span class=\"pos\">${fmt(t.money_in)}</span>` : ''}</td>
          <td class=\"right\">${t.money_out ? `<span class=\"neg\">-${fmt(t.money_out)}</span>` : ''}</td>
          <td class=\"right\">${netRow >= 0 ? `<span class=\"pos\">${fmt(netRow)}</span>` : `<span class=\"neg\">${fmt(netRow)}</span>`}</td>
          <td class=\"right\">${fmt(t.balance)}</td>
        </tr>`;
      });
      // subcategories
      CATEGORY_MAP[cat as keyof typeof CATEGORY_MAP]?.subcategories.forEach((sub) => {
        const txs = subs[sub] || [];
        if (!txs.length) {
          // show a muted subcategory row to keep structure
          html += `<tr class=\"subrow\"><td></td><td colspan=\"6\" style=\"color:var(--muted)\">${sub} • No transactions</td></tr>`;
          return;
        }
        const subt = txs.reduce(
          (acc, t: any) => ({ totalIn: acc.totalIn + (t.money_in || 0), totalOut: acc.totalOut + (t.money_out || 0) }),
          { totalIn: 0, totalOut: 0 },
        );
        const snet = subt.totalIn - subt.totalOut;
        html += `<tr class=\"subrow\"><td></td><td colspan=\"2\" style=\"text-transform:capitalize\">${sub}</td><td class=\"right\"><span class=\"pos\">${fmt(subt.totalIn)}</span></td><td class=\"right\"><span class=\"neg\">-${fmt(subt.totalOut)}</span></td><td class=\"right\">${snet >= 0 ? `<span class=\"pos\">${fmt(snet)}</span>` : `<span class=\"neg\">${fmt(snet)}</span>`}</td><td></td></tr>`;
        txs.forEach((t: any) => {
          const netRow = (t.money_in || 0) - (t.money_out || 0);
          html += `<tr>
            <td>${new Date(t.date).toLocaleDateString('en-GB')}</td>
            <td style=\"text-transform:capitalize\">${sub}</td>
            <td class=\"desc\">${t.description}${t.note ? `<span class=\"note\">${t.note}</span>` : ''}</td>
            <td class=\"right\">${t.money_in ? `<span class=\"pos\">${fmt(t.money_in)}</span>` : ''}</td>
            <td class=\"right\">${t.money_out ? `<span class=\"neg\">-${fmt(t.money_out)}</span>` : ''}</td>
            <td class=\"right\">${netRow >= 0 ? `<span class=\"pos\">${fmt(netRow)}</span>` : `<span class=\"neg\">${fmt(netRow)}</span>`}</td>
            <td class=\"right\">${fmt(t.balance)}</td>
          </tr>`;
        });
      });
      // footer
      html += `<tr class=\"footer\"><td></td><td colspan=\"2\">Category totals</td><td class=\"right\"><span class=\"pos\">${fmt(totals.totalIn)}</span></td><td class=\"right\"><span class=\"neg\">-${fmt(totals.totalOut)}</span></td><td class=\"right\">${net >= 0 ? `<span class=\"pos\">${fmt(net)}</span>` : `<span class=\"neg\">${fmt(net)}</span>`}</td><td></td></tr>`;
      html += `</tbody></table></section>`;
    });
    w.document.write(`<html><head><title>Transactions - ${transactionData.bank}</title>${styles}</head><body>${html}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Grid container spacing={{ xs: 2.5, sm: 3 }} mb={3}>
      {/* ------------- File Upload section ---------------- */}
      <Grid item xs={12}>
        <FileUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
        {transactionData && (
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
            <ButtonGroup variant="contained" size="small">
              <Button color="primary" onClick={exportCSV} startIcon={<IconifyIcon icon="material-symbols:table" />}>
                Export CSV
              </Button>
              <Button color="secondary" onClick={exportPDF} startIcon={<IconifyIcon icon="material-symbols:picture-as-pdf" />}>
                Export PDF
              </Button>
            </ButtonGroup>
          </Stack>
        )}
      </Grid>

      {/* ------------- Transaction Summary section ---------------- */}
      {transactionData && (
        <Grid item xs={12}>
          <TransactionSummary transactionData={transactionData} />
        </Grid>
      )}

      {/* ------------- Transaction Categories section ---------------- */}
      {transactionData && (
        <Grid item xs={12}>
          <TransactionCategories transactionData={transactionData} />
        </Grid>
      )}

      {/* ------------- Income Verification (separate, above AML & Affordability) ---------------- */}
      {transactionData && (
        <>
          <Grid item xs={12} md={6}>
            <IncomeVerification transactionData={transactionData} />
          </Grid>
          <Grid item xs={12} md={6}>
            <AffordabilityReport transactionData={transactionData} />
          </Grid>
        </>
      )}

      {/* ------------- AML & Risk Indicators section (separate, after affordability) ------------- */}
      {transactionData && (
        <Grid item xs={12}>
          <AMLRiskIndicators transactionData={transactionData} />
        </Grid>
      )}

      {/* ------------- Transaction Charts section ---------------- */}
      {transactionData && (
        <Grid item xs={12}>
          <TransactionCharts transactionData={transactionData} />
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
