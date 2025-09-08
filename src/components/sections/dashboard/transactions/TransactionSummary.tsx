import {
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { TransactionResponse } from 'config/categories';
import { useMemo } from 'react';
import { analyzeRisks } from 'helpers/utils';

interface TransactionSummaryProps {
  transactionData: TransactionResponse | null;
}

const TransactionSummary = ({ transactionData }: TransactionSummaryProps) => {
  const summaryData = useMemo(() => {
    if (!transactionData) return null;

    const transactions = transactionData.transactions;
    
    const totalMoneyIn = transactions.reduce((sum, t) => sum + (t.money_in || 0), 0);
    const totalMoneyOut = transactions.reduce((sum, t) => sum + (t.money_out || 0), 0);
    const netAmount = totalMoneyIn - totalMoneyOut;
    
    const totalTransactions = transactions.length;
    const uniqueCategories = new Set(transactions.map(t => t.category)).size;
    
    const currentBalance = transactions[transactions.length - 1]?.balance || 0;
    const startingBalance = transactions[0]?.balance || 0;
    const balanceChange = currentBalance - startingBalance;
    
    const avgTransactionAmount = totalTransactions > 0 ? (totalMoneyIn + totalMoneyOut) / totalTransactions : 0;
    
    const dateRange = transactions.length > 0 ? {
      start: new Date(transactions[0].date),
      end: new Date(transactions[transactions.length - 1].date),
    } : null;

    return {
      totalMoneyIn,
      totalMoneyOut,
      netAmount,
      totalTransactions,
      uniqueCategories,
      currentBalance,
      balanceChange,
      avgTransactionAmount,
      dateRange,
    };
  }, [transactionData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  if (!transactionData || !summaryData) {
    return null;
  }

  // Compute monthly client-level risk score
  const risk = analyzeRisks(transactionData.transactions);
  const monthlyKeys = Array.from(risk.monthly.keys()).sort();
  const latestMonthKey = monthlyKeys[monthlyKeys.length - 1];
  const latestMonthly = latestMonthKey ? risk.monthly.get(latestMonthKey) : undefined;

  const summaryCards = [
    {
      title: 'Total Money In',
      value: formatCurrency(summaryData.totalMoneyIn),
      icon: 'material-symbols:trending-up',
      color: '#4CAF50',
      bgColor: '#E8F5E8',
    },
    {
      title: 'Total Money Out',
      value: formatCurrency(summaryData.totalMoneyOut),
      icon: 'material-symbols:trending-down',
      color: '#F44336',
      bgColor: '#FFEBEE',
    },
    {
      title: 'Net Amount',
      value: formatCurrency(summaryData.netAmount),
      icon: 'material-symbols:account-balance-wallet',
      color: summaryData.netAmount >= 0 ? '#4CAF50' : '#F44336',
      bgColor: summaryData.netAmount >= 0 ? '#E8F5E8' : '#FFEBEE',
    },
    {
      title: 'Current Balance',
      value: formatCurrency(summaryData.currentBalance),
      icon: 'material-symbols:account-balance',
      color: '#2196F3',
      bgColor: '#E3F2FD',
    },
    {
      title: 'Total Transactions',
      value: summaryData.totalTransactions.toString(),
      icon: 'material-symbols:receipt',
      color: '#FF9800',
      bgColor: '#FFF3E0',
    },
    {
      title: 'Categories',
      value: summaryData.uniqueCategories.toString(),
      icon: 'material-symbols:category',
      color: '#9C27B0',
      bgColor: '#F3E5F5',
    },
    {
      title: 'Avg Transaction',
      value: formatCurrency(summaryData.avgTransactionAmount),
      icon: 'material-symbols:calculate',
      color: '#607D8B',
      bgColor: '#ECEFF1',
    },
    {
      title: 'Balance Change',
      value: formatCurrency(summaryData.balanceChange),
      icon: 'material-symbols:show-chart',
      color: summaryData.balanceChange >= 0 ? '#4CAF50' : '#F44336',
      bgColor: summaryData.balanceChange >= 0 ? '#E8F5E8' : '#FFEBEE',
    },
  ];

  return (
    <Card sx={{ backgroundColor: 'common.white', width: 1, mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Typography
            sx={{
              fontSize: {
                xs: 'body2.fontSize',
                md: 'h6.fontSize',
                xl: 'h3.fontSize',
              },
              fontWeight: 600,
            }}
          >
            Transaction Summary - {transactionData.bank}
          </Typography>

          <Grid container spacing={2}>
            {summaryCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    backgroundColor: card.bgColor,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: 2,
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Stack spacing={2} alignItems="center" textAlign="center">
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          backgroundColor: card.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconifyIcon
                          icon={card.icon}
                          sx={{ color: 'white', fontSize: 24 }}
                        />
                      </Box>
                      
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: card.color,
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                          }}
                        >
                          {card.value}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            fontWeight: 500,
                            textAlign: 'center',
                          }}
                        >
                          {card.title}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Client-level Monthly Risk Score */}
          {latestMonthly && (
            <Box
              sx={{
                backgroundColor: latestMonthly.severity === 'High' ? 'error.lighter' : latestMonthly.severity === 'Medium' ? 'warning.lighter' : 'success.lighter',
                borderRadius: 2,
                p: 2,
                border: '1px solid',
                borderColor: latestMonthly.severity === 'High' ? 'error.main' : latestMonthly.severity === 'Medium' ? 'warning.main' : 'success.main',
              }}
            >
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <IconifyIcon
                    icon={latestMonthly.severity === 'High' ? 'material-symbols:warning' : latestMonthly.severity === 'Medium' ? 'material-symbols:priority-high' : 'material-symbols:info'}
                    sx={{ color: latestMonthly.severity === 'High' ? 'error.main' : latestMonthly.severity === 'Medium' ? 'warning.main' : 'success.main', fontSize: 20 }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Client Risk Score — {latestMonthly.monthKey}: {latestMonthly.score} ({latestMonthly.severity})
                  </Typography>
                </Stack>
                {latestMonthly.evidence.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {latestMonthly.evidence.join(' • ')}
                  </Typography>
                )}
              </Stack>
            </Box>
          )}

          {/* Date Range Information */}
          {summaryData.dateRange && (
            <Box
              sx={{
                backgroundColor: 'grey.50',
                borderRadius: 2,
                p: 2,
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <IconifyIcon
                  icon="material-symbols:date-range"
                  sx={{ color: 'primary.main', fontSize: 20 }}
                />
                <Typography variant="body2" color="text.secondary">
                  <strong>Date Range:</strong> {summaryData.dateRange.start.toLocaleDateString('en-GB')} - {summaryData.dateRange.end.toLocaleDateString('en-GB')}
                </Typography>
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TransactionSummary;

