import {
  Box,
  Stack,
  Typography,
  Grid,
  Chip,
  Card,
  CardContent,
  Alert,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useState } from 'react';
import { TransactionResponse } from 'config/categories';
import { analyzeRisks } from 'helpers/utils';
import IconifyIcon from 'components/base/IconifyIcon';

interface AMLRiskIndicatorsProps {
  transactionData: TransactionResponse;
}

const AMLRiskIndicators = ({ transactionData }: AMLRiskIndicatorsProps) => {
  const [expandedSections, setExpandedSections] = useState({
    monthly: true,
    overall: true,
    details: false,
    recommendations: false,
  });
  const [showRiskDetails, setShowRiskDetails] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedRiskCategory, setSelectedRiskCategory] = useState<string>('');
  const [showMonthlyScoreModal, setShowMonthlyScoreModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const risk = analyzeRisks(transactionData.transactions);
  const txFlags = Array.from(risk.txRisks.values());
  const totalFlagged = txFlags.filter((r) => r.flagged && r.severity !== 'None').length;
  const high = txFlags.filter((r) => r.severity === 'High').length;
  const med = txFlags.filter((r) => r.severity === 'Medium').length;
  const low = txFlags.filter((r) => r.severity === 'Low').length;
  const months = Array.from(risk.monthly.values()).sort((a, b) =>
    a.monthKey.localeCompare(b.monthKey),
  );
  const latest = months[months.length - 1];
  const reasons = txFlags.flatMap((r) => r.reasons);

  // Calculate overall period assessment
  const totalMonths = months.length;
  const highRiskMonths = months.filter((m) => m.score >= 50).length;
  const mediumRiskMonths = months.filter((m) => m.score >= 25 && m.score < 50).length;
  const lowRiskMonths = months.filter((m) => m.score < 25).length;

  // Overall risk assessment
  const overallRiskLevel =
    highRiskMonths > totalMonths * 0.5
      ? 'High'
      : mediumRiskMonths > totalMonths * 0.3
        ? 'Medium'
        : 'Low';

  const overallRiskScore = months.reduce((sum, m) => sum + m.score, 0) / totalMonths;

  // Enhanced risk indicator counts with emoji detection
  const gamblingHits = reasons.filter(
    (r) =>
      r.toLowerCase().includes('gambling') ||
      r.includes('🎰') ||
      (r.includes('🚨') && r.includes('gambling')),
  ).length;
  const cashHits = reasons.filter(
    (r) =>
      r.toLowerCase().includes('cash deposit') ||
      r.toLowerCase().includes('cash') ||
      r.includes('💰'),
  ).length;
  const transferHits = reasons.filter(
    (r) =>
      r.toLowerCase().includes('transfer') ||
      r.toLowerCase().includes('remittance') ||
      r.toLowerCase().includes('international') ||
      r.toLowerCase().includes('new payee') ||
      r.includes('🌍') ||
      r.includes('💸'),
  ).length;
  const passThroughHits = reasons.filter((r) => r.toLowerCase().includes('pass-through')).length;

  const riskCategories = {
    gambling: gamblingHits,
    cash: cashHits,
    transfer: transferHits,
    passThrough: passThroughHits,
    overdraft: reasons.filter((r) => r.toLowerCase().includes('overdraft')).length,
    crypto: reasons.filter((r) => r.toLowerCase().includes('crypto')).length,
    lifestyle: reasons.filter((r) => r.toLowerCase().includes('lifestyle')).length,
    highCost: reasons.filter((r) => r.toLowerCase().includes('high-cost')).length,
  };

  // Function to filter transactions by risk category
  const getTransactionsByRiskCategory = (category: string) => {
    const flaggedTransactions = transactionData.transactions.filter((_, idx) => {
      const txRisk = risk.txRisks.get(idx);
      if (!txRisk || !txRisk.flagged) return false;

      const riskReasons = txRisk.reasons.join(' ').toLowerCase();

      switch (category) {
        case 'gambling':
          return riskReasons.includes('gambling') || riskReasons.includes('🎰');
        case 'cash':
          return riskReasons.includes('cash') || riskReasons.includes('💰');
        case 'transfer':
          return (
            riskReasons.includes('transfer') ||
            riskReasons.includes('remittance') ||
            riskReasons.includes('international') ||
            riskReasons.includes('🌍') ||
            riskReasons.includes('💸')
          );
        case 'passThrough':
          return riskReasons.includes('pass-through');
        case 'overdraft':
          return riskReasons.includes('overdraft');
        case 'crypto':
          return riskReasons.includes('crypto');
        case 'lifestyle':
          return riskReasons.includes('lifestyle');
        case 'highCost':
          return riskReasons.includes('high-cost') || riskReasons.includes('payday');
        default:
          return false;
      }
    });

    return flaggedTransactions.map((tx) => {
      const originalIdx = transactionData.transactions.findIndex((t) => t === tx);
      const txRisk = risk.txRisks.get(originalIdx);
      return {
        ...tx,
        riskReasons: txRisk?.reasons || [],
        severity: txRisk?.severity || 'None',
      };
    });
  };

  // Handle risk category click
  const handleRiskCategoryClick = (category: string) => {
    setSelectedRiskCategory(category);
    setShowTransactionModal(true);
  };

  // Handle monthly score click
  const handleMonthlyScoreClick = (monthKey: string) => {
    setSelectedMonth(monthKey);
    setShowMonthlyScoreModal(true);
  };

  // Calculate detailed score breakdown for a specific month
  const getMonthlyScoreBreakdown = (monthKey: string) => {
    const monthTransactions = transactionData.transactions.filter((_, idx) => {
      const txDate = new Date(transactionData.transactions[idx].date);
      const y = txDate.getFullYear();
      const m = String(txDate.getMonth() + 1).padStart(2, '0');
      const monthKeyFromTx = `${y}-${m}`;
      return monthKeyFromTx === monthKey;
    });

    const monthFlaggedTransactions = monthTransactions.filter((_, idx) => {
      const originalIdx = transactionData.transactions.findIndex(
        (t) => t === monthTransactions[idx],
      );
      const txRisk = risk.txRisks.get(originalIdx);
      return txRisk && txRisk.flagged;
    });

    const highRiskCount = monthFlaggedTransactions.filter((_, idx) => {
      const originalIdx = transactionData.transactions.findIndex(
        (t) => t === monthFlaggedTransactions[idx],
      );
      const txRisk = risk.txRisks.get(originalIdx);
      return txRisk && txRisk.severity === 'High';
    }).length;

    const mediumRiskCount = monthFlaggedTransactions.filter((_, idx) => {
      const originalIdx = transactionData.transactions.findIndex(
        (t) => t === monthFlaggedTransactions[idx],
      );
      const txRisk = risk.txRisks.get(originalIdx);
      return txRisk && txRisk.severity === 'Medium';
    }).length;

    const lowRiskCount = monthFlaggedTransactions.filter((_, idx) => {
      const originalIdx = transactionData.transactions.findIndex(
        (t) => t === monthFlaggedTransactions[idx],
      );
      const txRisk = risk.txRisks.get(originalIdx);
      return txRisk && txRisk.severity === 'Low';
    }).length;

    // Calculate individual transaction scores (Industry AML Standards)
    const highRiskScore = highRiskCount * 40; // Critical AML concerns
    const mediumRiskScore = mediumRiskCount * 20; // Significant concerns
    const lowRiskScore = lowRiskCount * 8; // Monitoring required
    const transactionScore = highRiskScore + mediumRiskScore + lowRiskScore;

    // Get pattern-based scores from monthly data
    const monthlyData = risk.monthly.get(monthKey);
    const patternScore = monthlyData ? monthlyData.score - transactionScore : 0;

    return {
      monthKey,
      totalTransactions: monthTransactions.length,
      flaggedTransactions: monthFlaggedTransactions.length,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      highRiskScore,
      mediumRiskScore,
      lowRiskScore,
      transactionScore,
      patternScore,
      totalScore: monthlyData?.score || 0,
      evidence: monthlyData?.evidence || [],
      severity: monthlyData?.severity || 'None',
    };
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Header with Theme Integration */}
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'grey.200',
          backgroundColor: 'common.white',
          borderRadius: 2,
          p: { xs: 2, sm: 3 },
          mb: 3,
        }}
      >
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconifyIcon
                icon="material-symbols:security"
                sx={{ fontSize: 24, color: 'error.main' }}
              />
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 'body2.fontSize', md: 'h6.fontSize' },
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  AML & Risk Indicators
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Comprehensive Anti-Money Laundering Analysis
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" size="small" onClick={() => setShowRiskDetails(true)}>
                View Details
              </Button>
            </Stack>
          </Stack>

          {/* Risk Overview Cards */}
          <Grid container spacing={1.5}>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Flagged transactions
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {totalFlagged}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  High / Med / Low
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {high} / {med} / {low}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 1.25,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Latest month score
                </Typography>
                {latest ? (
                  <Chip
                    label={`${latest.monthKey}: ${latest.score} (${latest.severity})`}
                    color={
                      latest.severity === 'High'
                        ? 'error'
                        : latest.severity === 'Medium'
                          ? 'warning'
                          : 'success'
                    }
                    size="small"
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No data
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Stack>
      </Box>

      {/* Risk Indicators Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <IconifyIcon
              icon="material-symbols:warning"
              sx={{ fontSize: 24, color: 'primary.main' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Risk Indicators Summary
            </Typography>
          </Stack>

          <Grid container spacing={2}>
            {/* 1. Gambling / Betting / Casinos / Lotteries */}
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'error.main',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'error.light',
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                onClick={() => handleRiskCategoryClick('gambling')}
              >
                <Typography variant="h4" sx={{ color: 'error.main', fontWeight: 700 }}>
                  🎰 {gamblingHits}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Gambling / Betting / Casinos
                </Typography>
              </Paper>
            </Grid>

            {/* 2. Cash Deposits */}
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'warning.main',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'warning.light',
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                onClick={() => handleRiskCategoryClick('cash')}
              >
                <Typography variant="h4" sx={{ color: 'warning.main', fontWeight: 700 }}>
                  💰 {cashHits}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Cash Deposits
                </Typography>
              </Paper>
            </Grid>

            {/* 3. Large/Unexplained Transfers */}
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'info.main',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'info.light',
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                onClick={() => handleRiskCategoryClick('transfer')}
              >
                <Typography variant="h4" sx={{ color: 'info.main', fontWeight: 700 }}>
                  🔄 {transferHits}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Large/Unexplained Transfers
                </Typography>
              </Paper>
            </Grid>

            {/* 4. Rapid In–Out Flows ("Pass-Through" Accounts) */}
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'secondary.main',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'secondary.light',
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                onClick={() => handleRiskCategoryClick('passThrough')}
              >
                <Typography variant="h4" sx={{ color: 'secondary.main', fontWeight: 700 }}>
                  ⚡ {passThroughHits}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pass-Through Accounts
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Additional Risk Categories */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {/* Overdraft dependency */}
            <Grid item xs={6} sm={4} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: riskCategories.overdraft > 0 ? 'error.light' : 'success.light',
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                onClick={() => handleRiskCategoryClick('overdraft')}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: riskCategories.overdraft > 0 ? 'error.main' : 'success.main',
                  }}
                >
                  {riskCategories.overdraft}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Overdraft Dependency
                </Typography>
              </Paper>
            </Grid>

            {/* High-cost credit use */}
            <Grid item xs={6} sm={4} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: riskCategories.highCost > 0 ? 'error.light' : 'success.light',
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                onClick={() => handleRiskCategoryClick('highCost')}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: riskCategories.highCost > 0 ? 'error.main' : 'success.main',
                  }}
                >
                  {riskCategories.highCost}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  High-Cost Credit
                </Typography>
              </Paper>
            </Grid>

            {/* Crypto transactions */}
            <Grid item xs={6} sm={4} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: riskCategories.crypto > 0 ? 'error.light' : 'success.light',
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                onClick={() => handleRiskCategoryClick('crypto')}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: riskCategories.crypto > 0 ? 'error.main' : 'success.main',
                  }}
                >
                  {riskCategories.crypto}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Crypto Transactions
                </Typography>
              </Paper>
            </Grid>

            {/* Lifestyle mismatch */}
            <Grid item xs={6} sm={4} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: riskCategories.lifestyle > 0 ? 'error.light' : 'success.light',
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                onClick={() => handleRiskCategoryClick('lifestyle')}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: riskCategories.lifestyle > 0 ? 'error.main' : 'success.main',
                  }}
                >
                  {riskCategories.lifestyle}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Lifestyle Mismatch
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Monthly Risk Breakdown */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconifyIcon
                icon="material-symbols:calendar-month"
                sx={{ fontSize: 24, color: 'primary.main' }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Monthly Risk Assessment
              </Typography>
            </Stack>
            <IconButton
              onClick={() => setExpandedSections((prev) => ({ ...prev, monthly: !prev.monthly }))}
            >
              <IconifyIcon
                icon={
                  expandedSections.monthly
                    ? 'material-symbols:expand-less'
                    : 'material-symbols:expand-more'
                }
              />
            </IconButton>
          </Stack>

          <Collapse in={expandedSections.monthly}>
            <Grid container spacing={2}>
              {months.map((month) => {
                const riskLevel = month.score >= 50 ? 'High' : month.score >= 25 ? 'Medium' : 'Low';
                const riskColor =
                  riskLevel === 'High' ? 'error' : riskLevel === 'Medium' ? 'warning' : 'success';

                return (
                  <Grid item xs={12} sm={6} md={4} key={month.monthKey}>
                    <Card
                      sx={{
                        border: '2px solid',
                        borderColor:
                          riskLevel === 'High'
                            ? 'error.main'
                            : riskLevel === 'Medium'
                              ? 'warning.main'
                              : 'success.main',
                        height: '100%',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 4,
                          borderWidth: '3px',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                      onClick={() => handleMonthlyScoreClick(month.monthKey)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {month.monthKey}
                            </Typography>
                            <Chip
                              label={riskLevel}
                              color={riskColor}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </Stack>

                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, color: `${riskColor}.main` }}
                          >
                            Score: {month.score.toFixed(0)}
                          </Typography>

                          {month.evidence.length > 0 && (
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mb: 0.5 }}
                              >
                                Key Issues:
                              </Typography>
                              {month.evidence.slice(0, 2).map((evidence, idx) => (
                                <Typography
                                  key={idx}
                                  variant="caption"
                                  sx={{ display: 'block', fontSize: '0.7rem' }}
                                >
                                  • {evidence}
                                </Typography>
                              ))}
                              {month.evidence.length > 2 && (
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: '0.7rem', color: 'text.secondary' }}
                                >
                                  +{month.evidence.length - 2} more issues
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Collapse>
        </CardContent>
      </Card>

      {/* Overall Period Assessment */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconifyIcon
                icon="material-symbols:analytics"
                sx={{ fontSize: 24, color: 'primary.main' }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Overall Period Assessment
              </Typography>
            </Stack>
            <IconButton
              onClick={() => setExpandedSections((prev) => ({ ...prev, overall: !prev.overall }))}
            >
              <IconifyIcon
                icon={
                  expandedSections.overall
                    ? 'material-symbols:expand-less'
                    : 'material-symbols:expand-more'
                }
              />
            </IconButton>
          </Stack>

          <Collapse in={expandedSections.overall}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Risk Distribution
                  </Typography>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        High Risk Months:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                        {highRiskMonths} of {totalMonths}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Medium Risk Months:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                        {mediumRiskMonths} of {totalMonths}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Low Risk Months:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {lowRiskMonths} of {totalMonths}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Overall Assessment
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Overall Risk Level:
                      </Typography>
                      <Chip
                        label={overallRiskLevel}
                        color={
                          overallRiskLevel === 'High'
                            ? 'error'
                            : overallRiskLevel === 'Medium'
                              ? 'warning'
                              : 'success'
                        }
                        sx={{ fontWeight: 600 }}
                      />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Average Risk Score:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {overallRiskScore.toFixed(1)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Total Flagged Transactions:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {totalFlagged}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Grid>
            </Grid>

            {/* Overall Risk Alert */}
            <Alert
              severity={
                overallRiskLevel === 'High'
                  ? 'error'
                  : overallRiskLevel === 'Medium'
                    ? 'warning'
                    : 'success'
              }
              sx={{ mt: 3 }}
              icon={
                <IconifyIcon
                  icon={
                    overallRiskLevel === 'High'
                      ? 'material-symbols:error'
                      : overallRiskLevel === 'Medium'
                        ? 'material-symbols:warning'
                        : 'material-symbols:check-circle'
                  }
                />
              }
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {overallRiskLevel === 'High'
                  ? '🚨 High Risk Period'
                  : overallRiskLevel === 'Medium'
                    ? '⚠️ Medium Risk Period'
                    : '✅ Low Risk Period'}
              </Typography>
              <Typography variant="body2">
                {overallRiskLevel === 'High'
                  ? `This period shows significant AML risk indicators with ${highRiskMonths} high-risk months. Immediate review recommended.`
                  : overallRiskLevel === 'Medium'
                    ? `This period shows moderate AML risk indicators with ${mediumRiskMonths} medium-risk months. Regular monitoring advised.`
                    : `This period shows minimal AML risk indicators with ${lowRiskMonths} low-risk months. Good compliance profile.`}
              </Typography>
            </Alert>
          </Collapse>
        </CardContent>
      </Card>

      {/* Risk Details Dialog */}
      <Dialog
        open={showRiskDetails}
        onClose={() => setShowRiskDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconifyIcon
              icon="material-symbols:security"
              sx={{ fontSize: 24, color: 'primary.main' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Detailed Risk Analysis
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {/* Risk Alerts */}
            {reasons.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Recent Risk Alerts ({reasons.length})
                </Typography>
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {reasons.map((reason, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon>
                        <IconifyIcon
                          icon={
                            reason.includes('🚨')
                              ? 'material-symbols:error'
                              : reason.includes('⚠️')
                                ? 'material-symbols:warning'
                                : 'material-symbols:info'
                          }
                          sx={{
                            color: reason.includes('🚨')
                              ? 'error.main'
                              : reason.includes('⚠️')
                                ? 'warning.main'
                                : 'info.main',
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={reason}
                        sx={{
                          '& .MuiListItemText-primary': {
                            fontSize: '0.875rem',
                            fontWeight: reason.includes('🚨') ? 600 : 400,
                          },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRiskDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Modal */}
      <Dialog
        open={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconifyIcon
              icon="material-symbols:receipt"
              sx={{ fontSize: 24, color: 'primary.main' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedRiskCategory.charAt(0).toUpperCase() + selectedRiskCategory.slice(1)}{' '}
              Transactions
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {getTransactionsByRiskCategory(selectedRiskCategory).length > 0 ? (
              getTransactionsByRiskCategory(selectedRiskCategory).map((transaction, index) => (
                <Card key={index} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {transaction.description}
                        </Typography>
                        <Chip
                          label={transaction.severity}
                          color={
                            transaction.severity === 'High'
                              ? 'error'
                              : transaction.severity === 'Medium'
                                ? 'warning'
                                : 'success'
                          }
                          size="small"
                        />
                      </Stack>

                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Date: {new Date(transaction.date).toLocaleDateString()}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: transaction.money_out ? 'error.main' : 'success.main',
                          }}
                        >
                          {transaction.money_out
                            ? `-£${transaction.money_out.toLocaleString('en-GB')}`
                            : `+£${transaction.money_in?.toLocaleString('en-GB')}`}
                        </Typography>
                      </Stack>

                      {transaction.riskReasons.length > 0 && (
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}
                          >
                            Why this transaction was flagged:
                          </Typography>
                          {transaction.riskReasons.map((reason, reasonIdx) => (
                            <Box key={reasonIdx} sx={{ mb: 0.5 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  fontSize: '0.75rem',
                                  color: reason.includes('🚨')
                                    ? 'error.main'
                                    : reason.includes('⚠️')
                                      ? 'warning.main'
                                      : 'text.secondary',
                                  fontWeight: reason.includes('🚨') ? 600 : 400,
                                }}
                              >
                                • {reason}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <IconifyIcon
                  icon="material-symbols:check-circle"
                  sx={{ fontSize: 48, color: 'success.main', mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary">
                  No {selectedRiskCategory} transactions found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This risk category has no flagged transactions.
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTransactionModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Monthly Score Breakdown Modal */}
      <Dialog
        open={showMonthlyScoreModal}
        onClose={() => setShowMonthlyScoreModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconifyIcon
              icon="material-symbols:analytics"
              sx={{ fontSize: 24, color: 'primary.main' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Monthly Risk Score Breakdown - {selectedMonth}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedMonth &&
            (() => {
              const breakdown = getMonthlyScoreBreakdown(selectedMonth);
              return (
                <Stack spacing={3}>
                  {/* Score Overview */}
                  <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {breakdown.totalScore}
                      </Typography>
                      <Chip
                        label={breakdown.severity}
                        color={
                          breakdown.severity === 'High'
                            ? 'error'
                            : breakdown.severity === 'Medium'
                              ? 'warning'
                              : 'success'
                        }
                        sx={{ fontWeight: 600 }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Total Risk Score (out of 100)
                    </Typography>
                  </Box>

                  {/* Transaction Breakdown */}
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      📊 Transaction Risk Breakdown
                    </Typography>
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'error.main',
                          borderRadius: 1,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                            🚨 High Risk Transactions: {breakdown.highRiskCount}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            +{breakdown.highRiskScore} points
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Each high-risk transaction adds 40 points (Critical AML concerns)
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'warning.main',
                          borderRadius: 1,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                            ⚠️ Medium Risk Transactions: {breakdown.mediumRiskCount}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            +{breakdown.mediumRiskScore} points
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Each medium-risk transaction adds 20 points (Significant concerns)
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'success.main',
                          borderRadius: 1,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                            🟡 Low Risk Transactions: {breakdown.lowRiskCount}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            +{breakdown.lowRiskScore} points
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Each low-risk transaction adds 8 points (Monitoring required)
                        </Typography>
                      </Box>

                      <Box sx={{ p: 2, backgroundColor: 'primary.light', borderRadius: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: 'primary.main' }}
                          >
                            📈 Total Transaction Score
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {breakdown.transactionScore} points
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>

                  {/* Pattern-Based Scoring */}
                  {breakdown.patternScore > 0 && (
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        🔍 Pattern-Based Risk Factors
                      </Typography>
                      <Box
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'info.main',
                          borderRadius: 1,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="info.main" sx={{ fontWeight: 600 }}>
                            📊 Behavioral Patterns
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            +{breakdown.patternScore} points
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Based on Basel III, FATF guidelines: gambling patterns, cash deposits,
                          transfers, overdraft usage
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Detailed Calculation Breakdown */}
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      🧮 How the Score is Calculated
                    </Typography>
                    <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                        Step-by-Step Calculation:
                      </Typography>

                      <Stack spacing={1.5}>
                        {/* Transaction Scores */}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            1. Individual Transaction Risks:
                          </Typography>
                          <Box sx={{ ml: 2 }}>
                            {breakdown.highRiskCount > 0 && (
                              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                • {breakdown.highRiskCount} High Risk × 40 points ={' '}
                                {breakdown.highRiskScore} points
                              </Typography>
                            )}
                            {breakdown.mediumRiskCount > 0 && (
                              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                • {breakdown.mediumRiskCount} Medium Risk × 20 points ={' '}
                                {breakdown.mediumRiskScore} points
                              </Typography>
                            )}
                            {breakdown.lowRiskCount > 0 && (
                              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                • {breakdown.lowRiskCount} Low Risk × 8 points ={' '}
                                {breakdown.lowRiskScore} points
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              sx={{ display: 'block', fontWeight: 600, mt: 1 }}
                            >
                              Subtotal: {breakdown.transactionScore} points
                            </Typography>
                          </Box>
                        </Box>

                        {/* Pattern Scores */}
                        {breakdown.patternScore > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                              2. Behavioral Pattern Risks:
                            </Typography>
                            <Box sx={{ ml: 2 }}>
                              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                • Gambling {'>'}20% of income: +50 points
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                • Large cash deposits ≥£9k: +45 points
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                • Overdraft dependency {'>'}50%: +35 points
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                • Pass-through accounts ≥3 days: +25 points
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                • High outbound transfers ≥£5k: +20 points
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ display: 'block', fontWeight: 600, mt: 1 }}
                              >
                                Pattern Subtotal: {breakdown.patternScore} points
                              </Typography>
                            </Box>
                          </Box>
                        )}

                        {/* Final Calculation */}
                        <Box sx={{ p: 1.5, backgroundColor: 'primary.light', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            3. Final Score Calculation:
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                            Transaction Score: {breakdown.transactionScore} points
                          </Typography>
                          {breakdown.patternScore > 0 && (
                            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                              + Pattern Score: {breakdown.patternScore} points
                            </Typography>
                          )}
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', fontWeight: 600, mt: 1 }}
                          >
                            = Total Score: {breakdown.totalScore} points
                          </Typography>
                        </Box>

                        {/* Risk Level Determination */}
                        <Box sx={{ p: 1.5, backgroundColor: 'warning.light', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            4. Risk Level Determination:
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                            • ≥70 points = High Risk (Critical AML concerns)
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                            • 40-69 points = Medium Risk (Significant concerns)
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                            • 1-39 points = Low Risk (Monitoring required)
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', fontWeight: 600, mt: 1 }}
                          >
                            Result: {breakdown.severity} Risk ({breakdown.totalScore} points)
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Box>

                  {/* Evidence */}
                  {breakdown.evidence.length > 0 && (
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        📋 Key Risk Evidence
                      </Typography>
                      <List>
                        {breakdown.evidence.map((evidence, idx) => (
                          <ListItem key={idx} sx={{ py: 0.5 }}>
                            <ListItemIcon>
                              <IconifyIcon
                                icon="material-symbols:warning"
                                sx={{ fontSize: 16, color: 'warning.main' }}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={evidence}
                              sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem' } }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Summary */}
                  <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      📊 Month Summary
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Transactions:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {breakdown.totalTransactions}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Flagged Transactions:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {breakdown.flaggedTransactions}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Risk Level:
                      </Typography>
                      <Chip
                        label={breakdown.severity}
                        color={
                          breakdown.severity === 'High'
                            ? 'error'
                            : breakdown.severity === 'Medium'
                              ? 'warning'
                              : 'success'
                        }
                        size="small"
                      />
                    </Stack>
                  </Box>
                </Stack>
              );
            })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMonthlyScoreModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AMLRiskIndicators;
