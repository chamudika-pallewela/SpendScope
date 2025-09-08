import { Box, Stack, Typography, Grid, Chip } from '@mui/material';
import { TransactionResponse } from 'config/categories';
import { analyzeRisks } from 'helpers/utils';

interface AMLRiskIndicatorsProps {
  transactionData: TransactionResponse;
}

const AMLRiskIndicators = ({ transactionData }: AMLRiskIndicatorsProps) => {
  const risk = analyzeRisks(transactionData.transactions);
  const txFlags = Array.from(risk.txRisks.values());
  const totalFlagged = txFlags.filter((r) => r.flagged && r.severity !== 'None').length;
  const high = txFlags.filter((r) => r.severity === 'High').length;
  const med = txFlags.filter((r) => r.severity === 'Medium').length;
  const low = txFlags.filter((r) => r.severity === 'Low').length;
  const months = Array.from(risk.monthly.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  const latest = months[months.length - 1];
  const reasons = txFlags.flatMap((r) => r.reasons);
  const gamblingHits = reasons.filter((r) => r.toLowerCase().includes('gambling')).length;
  const cashHits = reasons.filter((r) => r.toLowerCase().includes('cash deposit')).length;
  const transferHits = reasons.filter((r) => r.toLowerCase().includes('transfer') || r.toLowerCase().includes('remittance') || r.toLowerCase().includes('international')).length;
  const passThroughHits = reasons.filter((r) => r.toLowerCase().includes('pass-through')).length;

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ border: '1px solid', borderColor: 'grey.200', backgroundColor: 'common.white', borderRadius: 2, p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography
            sx={{
              fontSize: { xs: 'body2.fontSize', md: 'h6.fontSize' },
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            D. AML & Risk Indicators
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Flagged transactions</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{totalFlagged}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">High / Med / Low</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{high} / {med} / {low}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 1.25, border: '1px solid', borderColor: 'grey.200', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Latest month score</Typography>
                {latest ? (
                  <Chip label={`${latest.monthKey}: ${latest.score} (${latest.severity})`} color={latest.severity === 'High' ? 'error' : latest.severity === 'Medium' ? 'warning' : 'success'} size="small" />
                ) : (
                  <Chip label="N/A" size="small" />
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Indicators: Gambling ({gamblingHits}), Cash Deposits ({cashHits}), Transfers ({transferHits}), Rapid In–Out ({passThroughHits})
              </Typography>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    </Box>
  );
};

export default AMLRiskIndicators;


