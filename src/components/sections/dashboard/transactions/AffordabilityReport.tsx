import { Box, Stack, Typography, TextField, Button, Divider, Chip, InputAdornment, Grid } from '@mui/material';
import { TransactionResponse } from 'config/categories';
import { useMemo, useState } from 'react';

interface AffordabilityReportProps {
  transactionData: TransactionResponse;
  defaultMortgageEstimate?: number; // monthly, GBP
}

const AffordabilityReport = ({ transactionData, defaultMortgageEstimate = 1200 }: AffordabilityReportProps) => {
  const [mortgageEstimate, setMortgageEstimate] = useState<number>(defaultMortgageEstimate);
  const [estimateInput, setEstimateInput] = useState<string>(String(defaultMortgageEstimate));

  const latest = useMemo(() => {
    const toMonthKey = (dateStr: string) => {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };
    const months = new Map<string, { income: number; expenses: number }>();
    transactionData.transactions.forEach((t) => {
      const k = toMonthKey(t.date);
      if (!months.has(k)) months.set(k, { income: 0, expenses: 0 });
      const m = months.get(k)!;
      m.income += t.money_in || 0;
      m.expenses += t.money_out || 0;
    });
    const keys = Array.from(months.keys()).sort();
    const latestKey = keys[keys.length - 1];
    if (!latestKey) return null;
    const { income, expenses } = months.get(latestKey)!;
    const surplus = income - expenses;
    const dti = income > 0 ? expenses / income : 0;
    let verdict: 'Green' | 'Amber' | 'Red' = 'Red';
    if (surplus >= mortgageEstimate && dti < 0.35) verdict = 'Green';
    else if (surplus >= 0.8 * mortgageEstimate || dti < 0.5) verdict = 'Amber';
    else verdict = 'Red';
    return { monthKey: latestKey, income, expenses, surplus, dti, verdict };
  }, [transactionData.transactions, mortgageEstimate]);

  const fmt = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

  if (!latest) return null;

  const verdictColor = latest.verdict === 'Green' ? 'success.main' : latest.verdict === 'Amber' ? 'warning.main' : 'error.main';

  return (
    <Box sx={{ mt: 2, height: '100%', display: 'flex' }}>
      {/* Section container (not a Card) */}
      <Box sx={{ flex: 1, border: '1px solid', borderColor: 'grey.200', backgroundColor: 'common.white', borderRadius: 2, p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography
            sx={{
              fontSize: { xs: 'body2.fontSize', md: 'h6.fontSize' },
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            C. Affordability Report
          </Typography>

          <Typography variant="caption" color="text.secondary">
            How It Works: Net Income – Total Expenses = Surplus/Deficit • Debt-to-Income Ratio (DTI) • Monthly Surplus • Compare against estimated mortgage repayment • Verdict
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              type="number"
              label="Estimated Repayment (per month)"
              value={estimateInput}
              onChange={(e) => setEstimateInput(e.target.value)}
              size="small"
              sx={{ maxWidth: 260 }}
              inputProps={{ min: 0 }}
              helperText="Enter any monthly commitment (mortgage, rent, loan, etc.)"
              InputProps={{
                startAdornment: <InputAdornment position="start">£</InputAdornment>,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = Number(estimateInput || 0);
                  setMortgageEstimate(isNaN(v) ? 0 : v);
                }
              }}
            />
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {
                const v = Number(estimateInput || 0);
                setMortgageEstimate(isNaN(v) ? 0 : v);
              }}
            >
              Apply
            </Button>
            <Typography variant="caption" color="text.secondary">
              Month: <b>{latest.monthKey}</b>
            </Typography>
          </Stack>

          <Divider sx={{ my: 1 }} />
          <Grid container spacing={1.5}>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Net income</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{fmt(latest.income)}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Total expenses</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>-{fmt(latest.expenses)}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Surplus/deficit</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: latest.surplus >= 0 ? 'success.main' : 'error.main' }}>{fmt(latest.surplus)}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">DTI ratio</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{(latest.dti * 100).toFixed(1)}%</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Repayment (applied)</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{fmt(mortgageEstimate)}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Surplus after repay.</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: (latest.surplus - mortgageEstimate) >= 0 ? 'success.main' : 'error.main' }}>{fmt(latest.surplus - mortgageEstimate)}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Coverage</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{mortgageEstimate > 0 ? Math.round((latest.surplus / mortgageEstimate) * 100) : 0}%</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'grey.200', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Verdict</Typography>
                <Chip label={latest.verdict} color={latest.verdict === 'Green' ? 'success' : latest.verdict === 'Amber' ? 'warning' : 'error'} size="small" sx={{ fontWeight: 700 }} />
              </Box>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    </Box>
  );
};

export default AffordabilityReport;


