import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useAuth } from '../../../contexts/AuthContext';
import { getUploadById, deleteUpload, SavedUpload } from '../../../services/uploadService';
import { TransactionResponse } from '../../../config/categories';
// import paths from '../../../routes/path';
import TransactionSummary from 'components/sections/dashboard/transactions/TransactionSummary';
import TransactionCategories from 'components/sections/dashboard/transactions/TransactionCategories';
import TransactionCharts from 'components/sections/dashboard/transactions/TransactionCharts';
import AffordabilityReport from 'components/sections/dashboard/transactions/AffordabilityReport';
import AMLRiskIndicators from 'components/sections/dashboard/transactions/AMLRiskIndicators';
import IncomeVerification from 'components/sections/dashboard/transactions/IncomeVerification';
import BankSelector, { BankData } from 'components/sections/dashboard/transactions/BankSelector';

const UploadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [upload, setUpload] = useState<SavedUpload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  useEffect(() => {
    if (id && currentUser) {
      loadUploadData();
    }
  }, [id, currentUser]);

  const loadUploadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');

      const uploadData = await getUploadById(id);

      if (!uploadData) {
        setError('Upload not found');
        return;
      }

      // Check if user owns this upload
      if (uploadData.userId !== currentUser?.uid) {
        setError('Access denied');
        return;
      }

      setUpload(uploadData);
    } catch (err) {
      console.error('Error loading upload:', err);
      setError('Failed to load upload');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;

    try {
      setDeleting(true);
      await deleteUpload(id);
      navigate('/dashboard/uploads');
    } catch (err) {
      console.error('Error deleting upload:', err);
      setError('Failed to delete upload');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  // Convert the saved response to the format expected by components
  const transactionData =
    upload &&
    upload.originalResponse &&
    typeof upload.originalResponse === 'object' &&
    'transactions' in upload.originalResponse
      ? {
          bank: upload.bank,
          transactions: (
            upload.originalResponse as {
              transactions: Array<{ bank: string; [key: string]: unknown }>;
            }
          ).transactions,
        }
      : upload &&
          upload.originalResponse &&
          typeof upload.originalResponse === 'object' &&
          'results' in upload.originalResponse &&
          Array.isArray((upload.originalResponse as { results: unknown[] }).results) &&
          (upload.originalResponse as { results: unknown[] }).results.length > 0
        ? {
            bank: upload.bank,
            transactions: (
              upload.originalResponse as {
                results: Array<{ transactions?: Array<{ bank: string; [key: string]: unknown }> }>;
              }
            ).results.flatMap((result) => result.transactions || []),
          }
        : null;

  // Extract bank data from transaction data
  const bankData = useMemo(() => {
    if (!transactionData || !upload) return [];

    const banks: BankData[] = [];
    const bankMap = new Map<string, { customer_name: string; transactionCount: number }>();

    transactionData.transactions.forEach((transaction: { bank: string }) => {
      const bankName = transaction.bank;
      if (bankMap.has(bankName)) {
        const existing = bankMap.get(bankName)!;
        existing.transactionCount += 1;
      } else {
        bankMap.set(bankName, {
          customer_name: upload.customerName,
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
  }, [transactionData, upload?.customerName]);

  // Filter transactions based on selected bank
  const filteredTransactionData = useMemo(() => {
    if (!transactionData) return null;
    if (!selectedBank) return transactionData;

    const filtered = {
      ...transactionData,
      transactions: transactionData.transactions.filter(
        (transaction: { bank: string }) => transaction.bank === selectedBank,
      ),
    };

    return filtered;
  }, [transactionData, selectedBank]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !upload) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Upload not found'}
        </Alert>
        <Button
          variant="contained"
          startIcon={<IconifyIcon icon="material-symbols:arrow-back" />}
          onClick={() => navigate('/uploads')}
        >
          Back to Uploads
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Button
            variant="outlined"
            startIcon={<IconifyIcon icon="material-symbols:arrow-back" />}
            onClick={() => navigate('/dashboard/uploads')}
            sx={{ mb: 2 }}
          >
            Back to Uploads
          </Button>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            {upload.customerName}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body1" color="text.secondary">
              {upload.bank}
            </Typography>
            <Chip
              label={`${upload.dateRange.start} to ${upload.dateRange.end}`}
              size="small"
              color="primary"
            />
            <Typography variant="body2" color="text.secondary">
              Uploaded: {new Date(upload.uploadDate).toLocaleDateString()}
            </Typography>
          </Stack>
        </Box>

        <IconButton color="error" onClick={handleDeleteClick} disabled={deleting}>
          <IconifyIcon icon="material-symbols:delete" />
        </IconButton>
      </Stack>

      {/* Bank Selector */}
      {transactionData && bankData.length > 1 && (
        <Grid item xs={12} sx={{ mb: 3 }}>
          <BankSelector
            banks={bankData}
            selectedBank={selectedBank}
            onBankChange={setSelectedBank}
          />
        </Grid>
      )}

      {/* Transaction Analysis */}
      {filteredTransactionData ? (
        <Grid container spacing={3}>
          {/* Transaction Summary */}
          <Grid item xs={12}>
            <TransactionSummary
              transactionData={filteredTransactionData as unknown as TransactionResponse}
            />
          </Grid>

          {/* Transaction Categories */}
          <Grid item xs={12}>
            <TransactionCategories
              transactionData={filteredTransactionData as unknown as TransactionResponse}
            />
          </Grid>

          {/* Transaction Charts */}
          <Grid item xs={12}>
            <TransactionCharts
              transactionData={filteredTransactionData as unknown as TransactionResponse}
            />
          </Grid>

          {/* Income Verification & Affordability Report */}
          <Grid item xs={12}>
            <IncomeVerification
              transactionData={filteredTransactionData as unknown as TransactionResponse}
            />
          </Grid>
          <Grid item xs={12}>
            <AffordabilityReport
              transactionData={filteredTransactionData as unknown as TransactionResponse}
            />
          </Grid>

          {/* AML Risk Indicators */}
          <Grid item xs={12}>
            <AMLRiskIndicators
              transactionData={filteredTransactionData as unknown as TransactionResponse}
            />
          </Grid>
        </Grid>
      ) : (
        <Alert severity="warning">No transaction data available for this upload.</Alert>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Upload</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this upload? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : null}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UploadDetailPage;
