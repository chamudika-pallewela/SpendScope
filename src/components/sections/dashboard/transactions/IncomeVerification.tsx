import { Box, Stack, Typography, Grid, Chip } from '@mui/material';
import { Transaction, TransactionResponse } from 'config/categories';
import { useMemo } from 'react';

interface IncomeVerificationProps {
  transactionData: TransactionResponse;
}

type SourceType = 'Salary' | 'Self-employment' | 'Benefits' | 'Rental' | 'Other recurring income';

interface SourceRecord {
  sourceType: SourceType;
  payer: string;
  frequency: 'monthly' | 'irregular';
  averageAmount: number;
  flags: string[];
}

const monthKey = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getSourceType = (t: Transaction): SourceType => {
  const desc = (t.raw_description || t.description || '').toLowerCase();
  if (t.category === 'salary' || /\bsalary\b|\bpayroll\b|\bwages\b/.test(desc)) return 'Salary';
  if (t.category === 'other income' && /\bbenefit\b|\bpension\b|\buniversal credit\b/.test(desc))
    return 'Benefits';
  if (/\brent\b|\brental\b/.test(desc) && (t.money_in || 0) > 0) return 'Rental';
  if (/\binvoice\b|\bupwork\b|\bfreelance\b|\bcontract\b|\bconsult/.test(desc))
    return 'Self-employment';
  return 'Other recurring income';
};

const getPayer = (t: Transaction): string => {
  return t.description || t.raw_description || 'Unknown';
};

const IncomeVerification = ({ transactionData }: IncomeVerificationProps) => {
  const sources = useMemo<SourceRecord[]>(() => {
    const incomeTx = transactionData.transactions.filter((t) => (t.money_in || 0) > 0);
    const groups = new Map<string, { type: SourceType; payer: string; txs: Transaction[] }>();
    incomeTx.forEach((t) => {
      const type = getSourceType(t);
      const payer = getPayer(t);
      const key = `${type}__${payer}`;
      if (!groups.has(key)) groups.set(key, { type, payer, txs: [] });
      groups.get(key)!.txs.push(t);
    });

    const results: SourceRecord[] = [];
    for (const { type, payer, txs } of groups.values()) {
      const byMonth = new Map<string, number>();
      txs.forEach((t) => {
        const k = monthKey(t.date);
        byMonth.set(k, (byMonth.get(k) || 0) + (t.money_in || 0));
      });
      const months = Array.from(byMonth.keys()).sort();
      const values = months.map((m) => byMonth.get(m) || 0);
      const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      let monthly = false;
      if (months.length >= 3) {
        monthly = true;
        for (let i = 1; i < months.length; i++) {
          const [y1, m1] = months[i - 1].split('-').map(Number);
          const [y2, m2] = months[i].split('-').map(Number);
          const gap = (y2 - y1) * 12 + (m2 - m1);
          if (gap > 1) {
            monthly = false;
            break;
          }
        }
      }
      const flags: string[] = [];
      for (let i = 1; i < values.length; i++) {
        if (values[i - 1] > 0 && values[i] >= 2 * values[i - 1]) {
          flags.push(
            `${type} increased by ${Math.round((values[i] / values[i - 1]) * 100)}% in ${months[i]}`,
          );
        }
      }
      if (!monthly && months.length >= 2) {
        flags.push('Irregular income pattern');
      }
      if (type === 'Salary') {
        const salaryPayers = new Set<string>();
        transactionData.transactions.forEach((t) => {
          if ((t.money_in || 0) > 0 && getSourceType(t) === 'Salary') salaryPayers.add(getPayer(t));
        });
        if (salaryPayers.size > 1) flags.push('Multiple salary payers detected');
      }
      results.push({
        sourceType: type,
        payer,
        frequency: monthly ? 'monthly' : 'irregular',
        averageAmount: avg,
        flags,
      });
    }

    const order: SourceType[] = [
      'Salary',
      'Self-employment',
      'Benefits',
      'Rental',
      'Other recurring income',
    ];
    results.sort((a, b) => order.indexOf(a.sourceType) - order.indexOf(b.sourceType));
    return results;
  }, [transactionData.transactions]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

  const kpis = useMemo(() => {
    const mainTypes = Array.from(new Set(sources.map((s) => s.sourceType)));
    const mainSources = mainTypes.slice(0, 3).join(', ') + (mainTypes.length > 3 ? '…' : '') || '—';
    const regularCount = sources.filter((s) => s.frequency === 'monthly').length;
    const irregularCount = sources.filter((s) => s.frequency === 'irregular').length;
    const suddenFlags = sources.reduce(
      (acc, s) => acc + s.flags.filter((f) => /increased/i.test(f)).length,
      0,
    );
    const avgMonthlyIncome = sources.reduce((acc, s) => acc + s.averageAmount, 0);
    return { mainSources, regularCount, irregularCount, suddenFlags, avgMonthlyIncome };
  }, [sources]);

  return (
    <Box sx={{ mt: 2, height: '100%', display: 'flex' }}>
      <Box
        sx={{
          flex: 1,
          border: '1px solid',
          borderColor: 'grey.200',
          backgroundColor: 'common.white',
          borderRadius: 2,
          p: { xs: 2, sm: 3 },
        }}
      >
        <Stack spacing={2}>
          <Typography
            sx={{
              fontSize: { xs: 'body2.fontSize', md: 'h6.fontSize' },
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            B. Income Verification
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            Checks Performed: Identify main income sources • Confirm regularity • Flag sudden
            increases/irregularities • Compare average monthly income
          </Typography>

          {/* <Box sx={{ border: '1px dashed', borderColor: 'grey.200', borderRadius: 1, p: { xs: 1.5, sm: 2 }, backgroundColor: 'grey.50' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="text.secondary">Main income sources</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{kpis.mainSources}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">Regular</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{kpis.regularCount}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">Irregular</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{kpis.irregularCount}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">Sudden increases</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{kpis.suddenFlags}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">Avg monthly income</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{fmt(kpis.avgMonthlyIncome)}</Typography>
              </Grid>
            </Grid>
          </Box> */}

          <Stack spacing={2}>
            <Grid container spacing={2}>
              {sources.map((s, idx) => (
                <Grid
                  item
                  xs={12}
                  md={sources.length === 1 ? 12 : 6}
                  key={`${s.sourceType}-${s.payer}-${idx}`}
                >
                  <Box
                    sx={{
                      border: '1px dashed',
                      borderColor: 'grey.200',
                      borderRadius: 1,
                      p: { xs: 2, sm: 2.5 },
                      backgroundColor: 'grey.50',
                      height: '100%',
                    }}
                  >
                    <Stack spacing={1.25} sx={{ height: '100%' }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {s.sourceType}
                        </Typography>
                        <Chip
                          label={s.frequency === 'monthly' ? 'Monthly' : 'Irregular'}
                          color={s.frequency === 'monthly' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Stack>
                      <Stack spacing={0.75}>
                        <Typography variant="caption" color="text.secondary">
                          Employer / Payer
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {s.payer}
                        </Typography>
                      </Stack>
                      <Stack spacing={0.75}>
                        <Typography variant="caption" color="text.secondary">
                          Average amount
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {fmt(s.averageAmount)}
                        </Typography>
                      </Stack>
                      {s.flags.length > 0 && (
                        <Box sx={{ mt: 'auto', pt: 0.5 }}>
                          <Typography variant="caption" color="warning.main">
                            Flags: {s.flags.join(' • ')}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </Grid>
              ))}
            </Grid>
            {sources.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No income sources detected.
              </Typography>
            )}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default IncomeVerification;
