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
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{ p: 2, textAlign: 'center', border: '1px solid', borderColor: 'error.main' }}
              >
                <Typography variant="h4" sx={{ color: 'error.main', fontWeight: 700 }}>
                  🎰 {gamblingHits}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Gambling
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{ p: 2, textAlign: 'center', border: '1px solid', borderColor: 'warning.main' }}
              >
                <Typography variant="h4" sx={{ color: 'warning.main', fontWeight: 700 }}>
                  💰 {cashHits}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Cash Deposits
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{ p: 2, textAlign: 'center', border: '1px solid', borderColor: 'info.main' }}
              >
                <Typography variant="h4" sx={{ color: 'info.main', fontWeight: 700 }}>
                  🔄 {transferHits}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Transfers
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'secondary.main',
                }}
              >
                <Typography variant="h4" sx={{ color: 'secondary.main', fontWeight: 700 }}>
                  ⚡ {passThroughHits}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pass-Through
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Additional Risk Categories */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {Object.entries(riskCategories)
              .slice(4)
              .map(([category, count]) => (
                <Grid item xs={6} sm={4} md={3} key={category}>
                  <Paper
                    sx={{ p: 2, textAlign: 'center', border: '1px solid', borderColor: 'grey.200' }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: count > 0 ? 'error.main' : 'success.main' }}
                    >
                      {count}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ textTransform: 'capitalize', color: 'text.secondary' }}
                    >
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
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
                      }}
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
    </Box>
  );
};

export default AMLRiskIndicators;
