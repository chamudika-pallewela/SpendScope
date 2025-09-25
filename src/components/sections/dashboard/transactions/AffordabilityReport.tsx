import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Chip,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import { TransactionResponse } from 'config/categories';
import { useMemo, useState } from 'react';
import IconifyIcon from 'components/base/IconifyIcon';

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
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Early return if no transaction data
  if (!transactionData || !transactionData.transactions) {
    return (
      <Box sx={{ mt: 3, p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No transaction data available for analysis
        </Typography>
      </Box>
    );
  }

  const analysis = useMemo(() => {
    try {
      if (!transactionData?.transactions || transactionData.transactions.length === 0) {
        return null;
      }

      const toMonthKey = (dateStr: string) => {
        const d = new Date(dateStr);

        // Validate the date
        if (isNaN(d.getTime())) {
          console.warn(`Invalid date encountered in AffordabilityReport: ${dateStr}`);
          // Return a fallback date (current month)
          const now = new Date();
          return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }

        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      };

      // Enhanced monthly analysis
      const months = new Map<
        string,
        {
          income: number;
          expenses: number;
          essentialExpenses: number;
          discretionaryExpenses: number;
          transactionCount: number;
        }
      >();

      transactionData.transactions.forEach((t) => {
        // Skip transactions with invalid dates
        if (!t.date || isNaN(new Date(t.date).getTime())) {
          return;
        }

        const k = toMonthKey(t.date);
        if (!months.has(k))
          months.set(k, {
            income: 0,
            expenses: 0,
            essentialExpenses: 0,
            discretionaryExpenses: 0,
            transactionCount: 0,
          });
        const m = months.get(k)!;
        m.income += t.money_in || 0;
        m.expenses += t.money_out || 0;
        m.transactionCount += 1;

        // Categorize expenses
        if (t.money_out) {
          const isEssential = [
            'Essential Living Costs',
            'Family & Dependents',
            'Financial Commitments',
          ].includes(t.category);

          if (isEssential) {
            m.essentialExpenses += t.money_out;
          } else {
            m.discretionaryExpenses += t.money_out;
          }
        }
      });

      const keys = Array.from(months.keys()).sort();
      if (keys.length === 0) return null;

      // Calculate overall statistics across all months
      let totalIncome = 0;
      let totalExpenses = 0;
      let totalEssentialExpenses = 0;
      let totalDiscretionaryExpenses = 0;
      let totalTransactions = 0;

      keys.forEach((key) => {
        const month = months.get(key)!;
        totalIncome += month.income;
        totalExpenses += month.expenses;
        totalEssentialExpenses += month.essentialExpenses;
        totalDiscretionaryExpenses += month.discretionaryExpenses;
        totalTransactions += month.transactionCount;
      });

      // Calculate averages
      const monthsCount = keys.length;
      const avgIncome = totalIncome / monthsCount;
      const avgExpenses = totalExpenses / monthsCount;
      const avgSurplus = avgIncome - avgExpenses;
      const dti = avgIncome > 0 ? avgExpenses / avgIncome : 0;
      const essentialRatio = avgIncome > 0 ? totalEssentialExpenses / monthsCount / avgIncome : 0;
      const discretionaryRatio =
        avgIncome > 0 ? totalDiscretionaryExpenses / monthsCount / avgIncome : 0;

      // Get latest month for trend analysis
      const latestKey = keys[keys.length - 1];
      const latest = months.get(latestKey)!;

      // Enhanced verdict logic based on average monthly performance
      let verdict: 'Green' | 'Amber' | 'Red' = 'Red';
      let verdictReason = '';

      console.log('Calculating verdict:', { avgSurplus, mortgageEstimate, dti });

      if (avgSurplus >= mortgageEstimate && dti < 0.35) {
        verdict = 'Green';
        verdictReason =
          'Excellent financial position with strong average surplus and low debt ratio';
      } else if (avgSurplus >= 0.8 * mortgageEstimate && dti < 0.5) {
        verdict = 'Amber';
        verdictReason = 'Good position but consider reducing discretionary spending';
      } else if (avgSurplus < 0) {
        verdict = 'Red';
        verdictReason = 'Negative average surplus - not recommended for additional commitments';
      } else if (dti > 0.5) {
        verdict = 'Red';
        verdictReason = 'High debt-to-income ratio - focus on debt reduction first';
      } else {
        verdict = 'Amber';
        verdictReason = 'Marginal affordability - consider budget optimization';
      }

      console.log('Verdict result:', { verdict, verdictReason });

      // Calculate trends
      const previousMonth = keys.length > 1 ? months.get(keys[keys.length - 2]) : null;
      const incomeTrend = previousMonth
        ? ((latest.income - previousMonth.income) / previousMonth.income) * 100
        : 0;
      const expenseTrend = previousMonth
        ? ((latest.expenses - previousMonth.expenses) / previousMonth.expenses) * 100
        : 0;

      // Calculate individual monthly analysis
      const monthlyAnalysis = keys.map((key) => {
        const month = months.get(key)!;
        const monthSurplus = month.income - month.expenses;
        const monthDti = month.income > 0 ? month.expenses / month.income : 0;
        const monthEssentialRatio = month.income > 0 ? month.essentialExpenses / month.income : 0;
        const monthDiscretionaryRatio =
          month.income > 0 ? month.discretionaryExpenses / month.income : 0;

        // Monthly verdict
        let monthVerdict: 'Green' | 'Amber' | 'Red' = 'Red';
        if (monthSurplus >= mortgageEstimate && monthDti < 0.35) {
          monthVerdict = 'Green';
        } else if (monthSurplus >= 0.8 * mortgageEstimate && monthDti < 0.5) {
          monthVerdict = 'Amber';
        } else if (monthSurplus < 0) {
          monthVerdict = 'Red';
        } else if (monthDti > 0.5) {
          monthVerdict = 'Red';
        } else {
          monthVerdict = 'Amber';
        }

        return {
          monthKey: key,
          income: month.income,
          expenses: month.expenses,
          essentialExpenses: month.essentialExpenses,
          discretionaryExpenses: month.discretionaryExpenses,
          surplus: monthSurplus,
          dti: monthDti,
          essentialRatio: monthEssentialRatio,
          discretionaryRatio: monthDiscretionaryRatio,
          verdict: monthVerdict,
          transactionCount: month.transactionCount,
        };
      });

      return {
        monthKey: latestKey,
        income: avgIncome,
        expenses: avgExpenses,
        essentialExpenses: totalEssentialExpenses / monthsCount,
        discretionaryExpenses: totalDiscretionaryExpenses / monthsCount,
        surplus: avgSurplus,
        dti,
        essentialRatio,
        discretionaryRatio,
        verdict,
        verdictReason,
        incomeTrend,
        expenseTrend,
        transactionCount: totalTransactions,
        monthsAnalyzed: keys.length,
        // Additional data for comprehensive analysis
        totalIncome,
        totalExpenses,
        dateRange: {
          start: keys[0],
          end: keys[keys.length - 1],
        },
        monthlyAnalysis,
      };
    } catch (error) {
      console.error('Error in affordability analysis:', error);
      return null;
    }
  }, [transactionData.transactions, mortgageEstimate]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

  if (!analysis) {
    return (
      <Box sx={{ mt: 3, p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No transaction data available for analysis
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      {/* Professional Header Section */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconifyIcon
              icon="material-symbols:analytics"
              sx={{ fontSize: 24, color: 'primary.main' }}
            />
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Affordability Analysis
            </Typography>
          </Stack>

          {/* Help Button */}
          <Tooltip title="How is this calculated?">
            <IconButton
              onClick={() => setHelpModalOpen(true)}
              size="small"
              sx={{
                backgroundColor: 'grey.100',
                '&:hover': {
                  backgroundColor: 'grey.200',
                },
              }}
            >
              <IconifyIcon icon="material-symbols:help" sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>

        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 800 }}>
          Comprehensive financial assessment to determine your capacity for loan commitments.
          Analysis based on {analysis.monthsAnalyzed} month{analysis.monthsAnalyzed > 1 ? 's' : ''}{' '}
          of transaction data ({analysis.dateRange.start} to {analysis.dateRange.end}).
        </Typography>
      </Box>

      {/* Mortgage Input Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <IconifyIcon
              icon="material-symbols:home"
              sx={{ fontSize: 24, color: 'primary.main' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Loan Commitment Calculator
            </Typography>
          </Stack>

          <Grid container spacing={3} alignItems="end">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Estimated Monthly Repayment"
                value={estimateInput}
                onChange={(e) => {
                  setEstimateInput(e.target.value);
                  const v = Number(e.target.value || 0);
                  const newValue = isNaN(v) ? 0 : v;
                  console.log('Input changed:', { input: e.target.value, parsed: v, newValue });
                  setMortgageEstimate(newValue);
                }}
                size="medium"
                inputProps={{ min: 0, step: 50 }}
                helperText="Enter your expected monthly mortgage, rent, or loan payment"
                InputProps={{
                  startAdornment: <InputAdornment position="start">£</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Analysis Period:{' '}
                <strong>
                  {analysis.dateRange.start} to {analysis.dateRange.end}
                </strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Testing: <strong>£{mortgageEstimate.toLocaleString()}/month</strong>
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Risk Assessment Alert */}
      <Alert
        severity={
          analysis.verdict === 'Green'
            ? 'success'
            : analysis.verdict === 'Amber'
              ? 'warning'
              : 'error'
        }
        sx={{ mb: 3 }}
        icon={
          <IconifyIcon
            icon={
              analysis.verdict === 'Green'
                ? 'material-symbols:check-circle'
                : analysis.verdict === 'Amber'
                  ? 'material-symbols:warning'
                  : 'material-symbols:error'
            }
          />
        }
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Risk Assessment: {analysis.verdict}
        </Typography>
        <Typography variant="body2">{analysis.verdictReason}</Typography>
      </Alert>

      {/* Monthly Analysis Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <IconifyIcon
              icon="material-symbols:calendar-month"
              sx={{ fontSize: 24, color: 'primary.main' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Monthly Breakdown Analysis
            </Typography>
          </Stack>

          <Grid container spacing={2}>
            {analysis.monthlyAnalysis.map((month) => {
              // Dynamic sizing for balanced grid layout
              const getGridSize = () => {
                const monthCount = analysis.monthlyAnalysis.length;

                // For mobile: always 1 per row
                if (monthCount === 1) return { xs: 12, sm: 12, md: 12 };
                if (monthCount === 2) return { xs: 12, sm: 6, md: 6 }; // 2x1
                if (monthCount === 3) return { xs: 12, sm: 6, md: 4 }; // 3x1
                if (monthCount === 4) return { xs: 12, sm: 6, md: 6 }; // 2x2
                if (monthCount === 5) return { xs: 12, sm: 6, md: 4 }; // 3x2 (5th in second row)
                if (monthCount === 6) return { xs: 12, sm: 6, md: 4 }; // 3x2
                if (monthCount === 7) return { xs: 12, sm: 6, md: 4 }; // 3x3 (7th in third row)
                if (monthCount === 8) return { xs: 12, sm: 6, md: 4 }; // 3x3 (8th in third row)
                if (monthCount === 9) return { xs: 12, sm: 6, md: 4 }; // 3x3
                // For 10+ months, use 4 columns
                return { xs: 12, sm: 6, md: 3 }; // 4x3, 4x4, etc.
              };

              return (
                <Grid item {...getGridSize()} key={month.monthKey}>
                  <Card
                    sx={{
                      height: '100%',
                      border: '2px solid',
                      borderColor:
                        month.verdict === 'Green'
                          ? 'success.main'
                          : month.verdict === 'Amber'
                            ? 'warning.main'
                            : 'error.main',
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        {/* Month Header */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {month.monthKey}
                          </Typography>
                          <Chip
                            label={month.verdict}
                            color={
                              month.verdict === 'Green'
                                ? 'success'
                                : month.verdict === 'Amber'
                                  ? 'warning'
                                  : 'error'
                            }
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </Stack>

                        {/* Financial Metrics */}
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">
                              Income:
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600, color: 'success.main' }}
                            >
                              {fmt(month.income)}
                            </Typography>
                          </Stack>

                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">
                              Expenses:
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600, color: 'error.main' }}
                            >
                              {fmt(month.expenses)}
                            </Typography>
                          </Stack>

                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">
                              Surplus:
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                color: month.surplus >= 0 ? 'success.main' : 'error.main',
                              }}
                            >
                              {fmt(month.surplus)}
                            </Typography>
                          </Stack>

                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">
                              DTI:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {(month.dti * 100).toFixed(1)}%
                            </Typography>
                          </Stack>
                        </Stack>

                        {/* Expense Breakdown */}
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mb: 0.5 }}
                          >
                            Expense Breakdown:
                          </Typography>
                          <Stack spacing={0.5}>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="caption">Essential:</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {(month.essentialRatio * 100).toFixed(1)}%
                              </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="caption">Discretionary:</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {(month.discretionaryRatio * 100).toFixed(1)}%
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>

                        {/* Transaction Count */}
                        <Typography variant="caption" color="text.secondary">
                          {month.transactionCount} transactions
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Income Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', border: '2px solid', borderColor: 'success.main' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <IconifyIcon
                icon="material-symbols:trending-up"
                sx={{ fontSize: 32, color: 'success.main', mb: 1 }}
              />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                {fmt(analysis.income)}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Average Monthly Income
              </Typography>
              {analysis.incomeTrend !== 0 && (
                <Chip
                  label={`${analysis.incomeTrend > 0 ? '+' : ''}${analysis.incomeTrend.toFixed(1)}% vs last month`}
                  color={analysis.incomeTrend > 0 ? 'success' : 'error'}
                  size="small"
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Expenses Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', border: '2px solid', borderColor: 'error.main' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <IconifyIcon
                icon="material-symbols:trending-down"
                sx={{ fontSize: 32, color: 'error.main', mb: 1 }}
              />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main', mb: 1 }}>
                {fmt(analysis.expenses)}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Average Monthly Expenses
              </Typography>
              {analysis.expenseTrend !== 0 && (
                <Chip
                  label={`${analysis.expenseTrend > 0 ? '+' : ''}${analysis.expenseTrend.toFixed(1)}% vs last month`}
                  color={analysis.expenseTrend > 0 ? 'error' : 'success'}
                  size="small"
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Surplus Card */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              height: '100%',
              border: '2px solid',
              borderColor: analysis.surplus >= 0 ? 'success.main' : 'error.main',
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <IconifyIcon
                icon={
                  analysis.surplus >= 0
                    ? 'material-symbols:account-balance-wallet'
                    : 'material-symbols:warning'
                }
                sx={{
                  fontSize: 32,
                  color: analysis.surplus >= 0 ? 'success.main' : 'error.main',
                  mb: 1,
                }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: analysis.surplus >= 0 ? 'success.main' : 'error.main',
                  mb: 1,
                }}
              >
                {fmt(analysis.surplus)}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {analysis.surplus >= 0 ? 'Average Monthly Surplus' : 'Average Monthly Deficit'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Overall Summary Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <IconifyIcon
              icon="material-symbols:analytics"
              sx={{ fontSize: 24, color: 'primary.main' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Overall Date Range Summary
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Financial Performance Summary
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Total Income:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {fmt(analysis.totalIncome)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Total Expenses:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {fmt(analysis.totalExpenses)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Net Position:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color:
                          analysis.totalIncome - analysis.totalExpenses >= 0
                            ? 'success.main'
                            : 'error.main',
                      }}
                    >
                      {fmt(analysis.totalIncome - analysis.totalExpenses)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Total Transactions:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {analysis.transactionCount}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Monthly Averages
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Avg Monthly Income:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {fmt(analysis.income)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Avg Monthly Expenses:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {fmt(analysis.expenses)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Avg Monthly Surplus:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: analysis.surplus >= 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      {fmt(analysis.surplus)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Months Analyzed:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {analysis.monthsAnalyzed}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <Grid container spacing={3}>
        {/* Financial Ratios */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Financial Health Metrics
              </Typography>

              <Stack spacing={3}>
                {/* DTI Ratio */}
                <Box>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Debt-to-Income Ratio
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {(analysis.dti * 100).toFixed(1)}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(analysis.dti * 100, 100)}
                    color={
                      analysis.dti < 0.35 ? 'success' : analysis.dti < 0.5 ? 'warning' : 'error'
                    }
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: 'block' }}
                  >
                    {analysis.dti < 0.35
                      ? 'Excellent'
                      : analysis.dti < 0.5
                        ? 'Good'
                        : 'Needs Improvement'}
                  </Typography>
                </Box>

                {/* Essential vs Discretionary */}
                <Box>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Essential Expenses
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {(analysis.essentialRatio * 100).toFixed(1)}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={analysis.essentialRatio * 100}
                    color="info"
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>

                <Box>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Discretionary Expenses
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {(analysis.discretionaryRatio * 100).toFixed(1)}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={analysis.discretionaryRatio * 100}
                    color="secondary"
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Affordability Analysis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Affordability Assessment
              </Typography>

              <Stack spacing={3}>
                <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Monthly Repayment
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {fmt(mortgageEstimate)}
                    </Typography>
                  </Stack>
                </Box>

                <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Remaining Surplus
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color:
                          analysis.surplus - mortgageEstimate >= 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      {fmt(analysis.surplus - mortgageEstimate)}
                    </Typography>
                  </Stack>
                </Box>

                <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Coverage Ratio
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {mortgageEstimate > 0
                        ? Math.round((analysis.surplus / mortgageEstimate) * 100)
                        : 0}
                      %
                    </Typography>
                  </Stack>
                </Box>

                {/* Recommendations */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Recommendations
                  </Typography>
                  <List dense>
                    {analysis.verdict === 'Green' && (
                      <ListItem>
                        <ListItemIcon>
                          <IconifyIcon
                            icon="material-symbols:check-circle"
                            sx={{ color: 'success.main' }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary="Strong financial position"
                          secondary="You have excellent capacity for additional commitments"
                        />
                      </ListItem>
                    )}
                    {analysis.verdict === 'Amber' && (
                      <>
                        <ListItem>
                          <ListItemIcon>
                            <IconifyIcon
                              icon="material-symbols:warning"
                              sx={{ color: 'warning.main' }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary="Consider budget optimization"
                            secondary="Reduce discretionary spending to improve affordability"
                          />
                        </ListItem>
                      </>
                    )}
                    {analysis.verdict === 'Red' && (
                      <>
                        <ListItem>
                          <ListItemIcon>
                            <IconifyIcon
                              icon="material-symbols:error"
                              sx={{ color: 'error.main' }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary="Focus on debt reduction"
                            secondary="Improve financial position before taking on new commitments"
                          />
                        </ListItem>
                      </>
                    )}
                    {analysis.discretionaryRatio > 0.3 && (
                      <ListItem>
                        <ListItemIcon>
                          <IconifyIcon
                            icon="material-symbols:shopping-cart"
                            sx={{ color: 'info.main' }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary="High discretionary spending"
                          secondary="Consider reducing non-essential expenses"
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Help Modal */}
      <Dialog open={helpModalOpen} onClose={() => setHelpModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            How Affordability Analysis is Calculated
          </Typography>
          <IconButton onClick={() => setHelpModalOpen(false)} size="small">
            <IconifyIcon icon="material-symbols:close" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {/* Overview */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                📊 Overview
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                The affordability analysis evaluates your financial capacity for loan commitments by
                analyzing your transaction history across multiple months.
              </Typography>
            </Box>

            <Divider />

            {/* Monthly Analysis */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                📅 Monthly Breakdown
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Each month is analyzed individually with:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <IconifyIcon
                      icon="material-symbols:trending-up"
                      sx={{ color: 'success.main' }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Income Calculation"
                    secondary="Sum of all money_in transactions (salary, benefits, interest, etc.)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <IconifyIcon
                      icon="material-symbols:trending-down"
                      sx={{ color: 'error.main' }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Expense Calculation"
                    secondary="Sum of all money_out transactions categorized as Essential or Discretionary"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <IconifyIcon icon="material-symbols:calculate" sx={{ color: 'info.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Surplus Calculation"
                    secondary="Monthly Income - Monthly Expenses"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <IconifyIcon icon="material-symbols:percent" sx={{ color: 'warning.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Debt-to-Income (DTI)"
                    secondary="Monthly Expenses ÷ Monthly Income × 100"
                  />
                </ListItem>
              </List>
            </Box>

            <Divider />

            {/* Expense Categories */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                🏷️ Expense Categories
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, backgroundColor: 'error.50' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: 'error.main', mb: 1 }}
                    >
                      Essential Expenses
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • Essential Living Costs (housing, utilities, food)
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • Family & Dependents (childcare, healthcare)
                    </Typography>
                    <Typography variant="body2">
                      • Financial Commitments (loans, credit cards)
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, backgroundColor: 'warning.50' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: 'warning.main', mb: 1 }}
                    >
                      Discretionary Expenses
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • Lifestyle & Discretionary (entertainment, dining)
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • Retail purchases
                    </Typography>
                    <Typography variant="body2">• Non-essential services</Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Verdict Logic */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                🎯 Affordability Verdict
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ p: 2, border: '2px solid', borderColor: 'success.main' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: 'success.main', mb: 1 }}
                    >
                      🟢 Green (Excellent)
                    </Typography>
                    <Typography variant="body2">
                      • Surplus ≥ Mortgage Estimate
                      <br />• DTI &lt; 35%
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ p: 2, border: '2px solid', borderColor: 'warning.main' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: 'warning.main', mb: 1 }}
                    >
                      🟡 Amber (Good)
                    </Typography>
                    <Typography variant="body2">
                      • Surplus ≥ 80% of Mortgage
                      <br />• DTI &lt; 50%
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ p: 2, border: '2px solid', borderColor: 'error.main' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: 'error.main', mb: 1 }}
                    >
                      🔴 Red (Needs Attention)
                    </Typography>
                    <Typography variant="body2">
                      • Negative Surplus
                      <br />• DTI &gt; 50%
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Monthly Repayment Calculator */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                💰 Monthly Repayment Calculator
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                The "Estimated Monthly Repayment" field lets you test different loan commitments:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, backgroundColor: 'info.50' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: 'info.main', mb: 1 }}
                    >
                      What to Enter
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • Mortgage payments (e.g., £1,200/month)
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • Car loan payments (e.g., £300/month)
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • Rent increases (e.g., £500/month)
                    </Typography>
                    <Typography variant="body2">• Any monthly financial commitment</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, backgroundColor: 'success.50' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: 'success.main', mb: 1 }}
                    >
                      How It Works
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • Type any amount (e.g., £1,200)
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • Analysis updates instantly
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • See if you can afford it
                    </Typography>
                    <Typography variant="body2">
                      • Try different amounts to find your limit
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Average Calculations */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                📈 Average Calculations
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                The overall analysis uses <strong>average monthly values</strong> across all
                analyzed months:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Average Monthly Income"
                    secondary="Total Income ÷ Number of Months"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Average Monthly Expenses"
                    secondary="Total Expenses ÷ Number of Months"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Average Monthly Surplus"
                    secondary="Average Income - Average Expenses"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Overall DTI Ratio"
                    secondary="Average Expenses ÷ Average Income × 100"
                  />
                </ListItem>
              </List>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setHelpModalOpen(false)}
            variant="contained"
            startIcon={<IconifyIcon icon="material-symbols:check" />}
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AffordabilityReport;
