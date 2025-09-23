import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Divider,
  Chip,
  InputAdornment,
  Grid,
} from '@mui/material';
import { TransactionResponse } from 'config/categories';
import { useMemo, useState } from 'react';

interface AffordabilityReportProps {
  transactionData: TransactionResponse;
  defaultMortgageEstimate?: number; // monthly, GBP
}

const AffordabilityReport = ({
  transactionData,
  defaultMortgageEstimate = 1200,
}: AffordabilityReportProps) => {
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

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

  if (!latest) return null;

  return (
    <Box sx={{ mt: 3, height: '100%', display: 'flex' }}>
      {/* Section container with improved styling */}
      <Box
        sx={{
          flex: 1,
          border: '1px solid',
          borderColor: 'grey.200',
          backgroundColor: 'common.white',
          borderRadius: 3,
          p: { xs: 3, sm: 4 },
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: 1,
              }}
            >
              Affordability Report
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Comprehensive analysis of your financial capacity for loan commitments. 
              Calculates surplus, debt-to-income ratio, and provides risk assessment.
            </Typography>
          </Box>

          <Box sx={{ 
            p: 3, 
            backgroundColor: 'grey.50', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              alignItems={{ xs: 'stretch', sm: 'flex-end' }}
            >
              <TextField
                type="number"
                label="Estimated Monthly Repayment"
                value={estimateInput}
                onChange={(e) => setEstimateInput(e.target.value)}
                size="medium"
                sx={{ minWidth: 280 }}
                inputProps={{ min: 0 }}
                helperText="Enter your expected monthly mortgage, rent, or loan payment"
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
                size="large"
                onClick={() => {
                  const v = Number(estimateInput || 0);
                  setMortgageEstimate(isNaN(v) ? 0 : v);
                }}
                sx={{ minWidth: 120 }}
              >
                Calculate
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Analysis Period: <strong>{latest.monthKey}</strong>
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                p: 2.5, 
                border: '1px solid', 
                borderColor: 'grey.200', 
                borderRadius: 2,
                backgroundColor: 'common.white',
                textAlign: 'center'
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Net Income
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {fmt(latest.income)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                p: 2.5, 
                border: '1px solid', 
                borderColor: 'grey.200', 
                borderRadius: 2,
                backgroundColor: 'common.white',
                textAlign: 'center'
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Total Expenses
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                  {fmt(latest.expenses)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                p: 2.5, 
                border: '1px solid', 
                borderColor: 'grey.200', 
                borderRadius: 2,
                backgroundColor: 'common.white',
                textAlign: 'center'
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Surplus/Deficit
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: latest.surplus >= 0 ? 'success.main' : 'error.main',
                  }}
                >
                  {fmt(latest.surplus)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                p: 2.5, 
                border: '1px solid', 
                borderColor: 'grey.200', 
                borderRadius: 2,
                backgroundColor: 'common.white',
                textAlign: 'center'
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  DTI Ratio
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {(latest.dti * 100).toFixed(1)}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                p: 2.5, 
                border: '1px solid', 
                borderColor: 'grey.200', 
                borderRadius: 2,
                backgroundColor: 'common.white',
                textAlign: 'center'
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Monthly Repayment
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {fmt(mortgageEstimate)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                p: 2.5, 
                border: '1px solid', 
                borderColor: 'grey.200', 
                borderRadius: 2,
                backgroundColor: 'common.white',
                textAlign: 'center'
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Remaining Surplus
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: latest.surplus - mortgageEstimate >= 0 ? 'success.main' : 'error.main',
                  }}
                >
                  {fmt(latest.surplus - mortgageEstimate)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                p: 2.5, 
                border: '1px solid', 
                borderColor: 'grey.200', 
                borderRadius: 2,
                backgroundColor: 'common.white',
                textAlign: 'center'
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Coverage Ratio
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {mortgageEstimate > 0 ? Math.round((latest.surplus / mortgageEstimate) * 100) : 0}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                p: 2.5, 
                border: '1px solid', 
                borderColor: 'grey.200', 
                borderRadius: 2,
                backgroundColor: 'common.white',
                textAlign: 'center'
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Risk Assessment
                </Typography>
                <Chip
                  label={latest.verdict}
                  color={
                    latest.verdict === 'Green'
                      ? 'success'
                      : latest.verdict === 'Amber'
                        ? 'warning'
                        : 'error'
                  }
                  size="medium"
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    </Box>
  );
};

export default AffordabilityReport;
