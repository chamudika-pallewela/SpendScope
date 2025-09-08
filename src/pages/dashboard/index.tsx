import { Grid } from '@mui/material';
import WeeklyActivity from 'components/sections/dashboard/activity/WeeklyActivity';
import BalanceHistory from 'components/sections/dashboard/balance/BalanceHistory';
// import MyCards from 'components/sections/dashboard/creditCards/MyCards';
import ExpenseStatistics from 'components/sections/dashboard/expense/ExpenseStatistics';
import InvoiceOverviewTable from 'components/sections/dashboard/invoice/InvoiceOverviewTable';
import RecentTransactions from 'components/sections/dashboard/transactions/RecentTransaction';
import TransactionCategories from 'components/sections/dashboard/transactions/TransactionCategories';
import TransactionCharts from 'components/sections/dashboard/transactions/TransactionCharts';
import TransactionSummary from 'components/sections/dashboard/transactions/TransactionSummary';
import QuickTransfer from 'components/sections/dashboard/transfer/QuickTransfer';
import FileUpload from 'components/sections/dashboard/upload/FileUpload';
import { buildApiUrl } from 'config/api';
import { TransactionResponse } from 'config/categories';
import { useState } from 'react';

const Dashboard = () => {
  const [transactionData, setTransactionData] = useState<TransactionResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(buildApiUrl('/extract-transactions'), {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result: TransactionResponse = await response.json();
        console.log('Transaction extraction result:', result);
        setTransactionData(result);
      } else {
        console.error('Failed to extract transactions');
        // Handle error
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      // Handle error
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Grid container spacing={{ xs: 2.5, sm: 3 }} mb={3}>
      {/* ------------- File Upload section ---------------- */}
      <Grid item xs={12}>
        <FileUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
      </Grid>

      {/* ------------- Transaction Summary section ---------------- */}
      {transactionData && (
        <Grid item xs={12}>
          <TransactionSummary transactionData={transactionData} />
        </Grid>
      )}

      {/* ------------- Transaction Categories section ---------------- */}
      {transactionData && (
        <Grid item xs={12}>
          <TransactionCategories transactionData={transactionData} />
        </Grid>
      )}

      {/* ------------- Transaction Charts section ---------------- */}
      {transactionData && (
        <Grid item xs={12}>
          <TransactionCharts transactionData={transactionData} />
        </Grid>
      )}

      {/* ------------- Card section ---------------- */}
      {/* <Grid item xs={12} xl={8} zIndex={1}>
        <MyCards />
      </Grid> */}

      {/* ------------- Slider section ---------------- */}

      {/* ------------- Data-Grid section ---------------- */}
      <Grid item xs={12}></Grid>
    </Grid>
  );
};

export default Dashboard;
