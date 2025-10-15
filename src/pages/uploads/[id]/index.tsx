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
import { TransactionResponse, Transaction } from '../../../config/categories';
import {
  processMultiBankResponse,
  groupBanksByName,
  extractMonthsFromTransactions,
  filterTransactionsByMonth,
} from '../../../helpers/utils';
import { BackendResponse } from '../../../config/categories';
// import paths from '../../../routes/path';
import TransactionSummary from 'components/sections/dashboard/transactions/TransactionSummary';
import TransactionCategories from 'components/sections/dashboard/transactions/TransactionCategories';
import TransactionCharts from 'components/sections/dashboard/transactions/TransactionCharts';
import AffordabilityReport from 'components/sections/dashboard/transactions/AffordabilityReport';
import AMLRiskIndicators from 'components/sections/dashboard/transactions/AMLRiskIndicators';
import IncomeVerification from 'components/sections/dashboard/transactions/IncomeVerification';
import BankSelector, { BankData } from 'components/sections/dashboard/transactions/BankSelector';
import PersonalDetails from 'components/sections/dashboard/transactions/PersonalDetails';
import MonthSelector from 'components/sections/dashboard/transactions/MonthSelector';

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
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

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
  const transactionData = useMemo(() => {
    if (!upload || !upload.originalResponse) return null;

    try {
      // Try to process using the new backend response format
      // Check if the response has the expected structure
      if (
        typeof upload.originalResponse === 'object' &&
        upload.originalResponse !== null &&
        'results' in upload.originalResponse &&
        Array.isArray((upload.originalResponse as { results: unknown[] }).results)
      ) {
        // Process all results and group by bank name (same logic as dashboard)
        const processedMultiBankData = processMultiBankResponse(
          upload.originalResponse as BackendResponse,
        );
        const groupedBanks = groupBanksByName(processedMultiBankData);

        // For uploads page, we'll use the first bank or combine all if multiple
        if (groupedBanks.length === 1) {
          const singleBankData = groupedBanks[0];
          return {
            bank: singleBankData.bank,
            transactions: singleBankData.transactions,
            personalDetails: singleBankData.personalDetails,
          };
        } else if (groupedBanks.length > 1) {
          // Multiple banks - combine all transactions
          const allTransactions = groupedBanks.flatMap((bank) => bank.transactions);
          const firstBank = groupedBanks[0];
          return {
            bank: `Multiple Banks (${groupedBanks.length} accounts)`,
            transactions: allTransactions,
            personalDetails: firstBank.personalDetails,
          };
        }
      } else {
        throw new Error('Response does not have expected BackendResponse structure');
      }
    } catch (error) {
      console.warn('Failed to process with new format, falling back to legacy format:', error);

      // Fallback to legacy format processing
      if (
        typeof upload.originalResponse === 'object' &&
        'transactions' in upload.originalResponse
      ) {
        return {
          bank: upload.bank,
          transactions: (
            upload.originalResponse as {
              transactions: Array<{ bank: string; [key: string]: unknown }>;
            }
          ).transactions,
          personalDetails: undefined, // Legacy format doesn't have personal details
        };
      } else if (
        typeof upload.originalResponse === 'object' &&
        'results' in upload.originalResponse &&
        Array.isArray((upload.originalResponse as { results: unknown[] }).results) &&
        (upload.originalResponse as { results: unknown[] }).results.length > 0
      ) {
        return {
          bank: upload.bank,
          transactions: (
            upload.originalResponse as {
              results: Array<{ transactions?: Array<{ bank: string; [key: string]: unknown }> }>;
            }
          ).results.flatMap((result) => result.transactions || []),
          personalDetails: undefined, // Legacy format doesn't have personal details
        };
      }

      return null;
    }
  }, [upload]);

  // Extract bank data from transaction data using the same grouping logic as dashboard
  const bankData = useMemo(() => {
    if (!upload || !upload.originalResponse) return [];

    try {
      // Check if the response has the expected structure
      if (
        typeof upload.originalResponse === 'object' &&
        upload.originalResponse !== null &&
        'results' in upload.originalResponse &&
        Array.isArray((upload.originalResponse as { results: unknown[] }).results)
      ) {
        // Process all results and group by bank name (same logic as dashboard)
        const processedMultiBankData = processMultiBankResponse(
          upload.originalResponse as BackendResponse,
        );
        const groupedBanks = groupBanksByName(processedMultiBankData);

        // Convert grouped banks to BankData format
        return groupedBanks.map((bankInfo) => ({
          bank: bankInfo.bank,
          customer_name: bankInfo.customer,
          transactionCount: bankInfo.transactions.length,
          logo: bankInfo.logo,
          account_number_masked: bankInfo.personalDetails.account_number_masked,
          sort_code: bankInfo.personalDetails.sort_code,
          accountCount: bankInfo.accountCount,
          accounts: bankInfo.accounts,
        }));
      }
    } catch (error) {
      console.warn('Failed to process bank data for selector:', error);
    }

    // Fallback to simple bank data extraction
    if (!transactionData) return [];

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
  }, [upload, transactionData]);

  // Extract months from current transaction data
  const availableMonths = useMemo(() => {
    if (transactionData && transactionData.transactions) {
      // Filter out non-Transaction objects and extract months
      const validTransactions = transactionData.transactions.filter(
        (transaction): transaction is Transaction =>
          transaction &&
          typeof transaction === 'object' &&
          'date' in transaction &&
          'description' in transaction,
      );
      return extractMonthsFromTransactions(validTransactions);
    }
    return [];
  }, [transactionData]);

  // Filter transactions based on selected bank and month
  const filteredTransactionData = useMemo(() => {
    if (!transactionData) return null;

    // Get the grouped bank data to ensure consistency with bank selector
    let sourceTransactions: (Transaction | { [key: string]: unknown; bank: string })[] = [];

    if (
      upload &&
      upload.originalResponse &&
      typeof upload.originalResponse === 'object' &&
      upload.originalResponse !== null &&
      'results' in upload.originalResponse &&
      Array.isArray((upload.originalResponse as { results: unknown[] }).results)
    ) {
      try {
        // Use the same grouped bank logic as bankData
        const processedMultiBankData = processMultiBankResponse(
          upload.originalResponse as BackendResponse,
        );
        const groupedBanks = groupBanksByName(processedMultiBankData);

        if (selectedBank) {
          // Find the selected bank and get its transactions
          const selectedBankData = groupedBanks.find((bank) => bank.bank === selectedBank);
          if (selectedBankData) {
            sourceTransactions = selectedBankData.transactions;
          }
        } else {
          // Get all transactions from all banks
          sourceTransactions = groupedBanks.flatMap((bank) => bank.transactions);
        }
      } catch (error) {
        console.warn('Failed to process grouped banks for filtering:', error);
        // Fallback to original transactionData
        sourceTransactions = transactionData.transactions;
      }
    } else {
      // Fallback to original transactionData
      sourceTransactions = transactionData.transactions;
    }

    let filteredTransactions = sourceTransactions;

    // Apply month filtering if selected
    if (selectedMonth) {
      // Filter out non-Transaction objects before month filtering
      const validTransactions = filteredTransactions.filter(
        (transaction): transaction is Transaction =>
          transaction &&
          typeof transaction === 'object' &&
          'date' in transaction &&
          'description' in transaction,
      );
      const monthFilteredTransactions = filterTransactionsByMonth(validTransactions, selectedMonth);

      // Combine month-filtered transactions with non-Transaction objects
      const nonTransactionObjects = filteredTransactions.filter(
        (transaction) =>
          !(
            transaction &&
            typeof transaction === 'object' &&
            'date' in transaction &&
            'description' in transaction
          ),
      );

      filteredTransactions = [...monthFilteredTransactions, ...nonTransactionObjects];
    }

    return {
      ...transactionData,
      transactions: filteredTransactions,
    };
  }, [transactionData, selectedBank, selectedMonth, upload]);

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
      {transactionData && bankData.length > 0 && (
        <Grid item xs={12} sx={{ mb: 3 }}>
          <BankSelector
            banks={bankData}
            selectedBank={selectedBank}
            onBankChange={setSelectedBank}
          />
        </Grid>
      )}

      {/* Month Selector */}
      {filteredTransactionData && availableMonths.length > 1 && (
        <Grid item xs={12} sx={{ mb: 3 }}>
          <MonthSelector
            months={availableMonths}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </Grid>
      )}

      {/* Transaction Analysis */}
      {filteredTransactionData ? (
        <Grid container spacing={3}>
          {/* Personal Details */}
          {filteredTransactionData.personalDetails && (
            <Grid item xs={12}>
              <PersonalDetails
                personalDetails={filteredTransactionData.personalDetails}
                bankName={filteredTransactionData.bank}
                multiBankData={null} // Upload detail page doesn't have multi-bank data yet
              />
            </Grid>
          )}

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
