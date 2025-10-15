import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stack,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { getBankLogoWithFallback } from '../../../../helpers/utils';
import { PersonalDetailsType, Transaction } from '../../../../config/categories';

interface BankInfo {
  bank: string;
  customer: string;
  personalDetails: PersonalDetailsType;
  transactions: Transaction[];
  logo?: string;
}

interface PersonalDetailsProps {
  personalDetails: PersonalDetailsType;
  bankName?: string;
  multiBankData?: BankInfo[] | null;
  onBankSelectionChange?: (selectedBank: string | null) => void;
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({
  personalDetails,
  bankName,
  multiBankData,
  onBankSelectionChange,
}) => {
  const [selectedBankForDetails, setSelectedBankForDetails] = useState<string>('all');

  const formatValue = (value: string): string => {
    return value === 'Unknown' ? 'Not Available' : value;
  };

  // Determine if we're in multi-bank mode
  const isMultiBank = multiBankData && multiBankData.length > 1;

  // Get the current bank data to display
  const currentBankData = useMemo(() => {
    if (!isMultiBank) {
      return {
        personalDetails,
        bankName: bankName || 'Unknown Bank',
        transactions: [],
      };
    }

    if (selectedBankForDetails === 'all') {
      // Show combined data for all banks
      const allTransactions = multiBankData.flatMap((bank) => bank.transactions);
      return {
        personalDetails: multiBankData[0].personalDetails, // Use first bank's details as default
        bankName: `Multiple Banks (${multiBankData.length} accounts)`,
        transactions: allTransactions,
      };
    }

    // Show specific bank data
    const selectedBank = multiBankData.find((bank) => bank.bank === selectedBankForDetails);
    if (selectedBank) {
      return {
        personalDetails: selectedBank.personalDetails,
        bankName: selectedBank.bank,
        transactions: selectedBank.transactions,
      };
    }

    return {
      personalDetails,
      bankName: bankName || 'Unknown Bank',
      transactions: [],
    };
  }, [isMultiBank, selectedBankForDetails, multiBankData, personalDetails, bankName]);

  const handleBankChange = (event: SelectChangeEvent<string>) => {
    const newSelection = event.target.value;
    setSelectedBankForDetails(newSelection);

    // Notify parent component about the bank selection change
    if (onBankSelectionChange) {
      onBankSelectionChange(newSelection === 'all' ? null : newSelection);
    }
  };

  const getFieldIcon = (field: string): string => {
    switch (field) {
      case 'customer':
        return 'material-symbols:person';
      case 'customer_address':
        return 'material-symbols:location-on';
      case 'account_number':
        return 'material-symbols:account-balance';
      case 'account_number_masked':
        return 'material-symbols:account-balance-wallet';
      case 'sort_code':
        return 'material-symbols:sort';
      case 'email':
        return 'material-symbols:email';
      case 'customer_id':
        return 'material-symbols:badge';
      default:
        return 'material-symbols:info';
    }
  };

  const getFieldColor = (field: string): string => {
    switch (field) {
      case 'customer':
        return '#1976d2'; // Blue
      case 'customer_address':
        return '#388e3c'; // Green
      case 'account_number':
        return '#f57c00'; // Orange
      case 'account_number_masked':
        return '#f57c00'; // Orange
      case 'sort_code':
        return '#7b1fa2'; // Purple
      case 'email':
        return '#0288d1'; // Light Blue
      case 'customer_id':
        return '#5d4037'; // Brown
      default:
        return '#616161'; // Grey
    }
  };

  const getFieldLabel = (field: string): string => {
    switch (field) {
      case 'customer':
        return 'Customer Name';
      case 'customer_address':
        return 'Address';
      case 'account_number':
        return 'Account Number';
      case 'account_number_masked':
        return 'Account Number (Masked)';
      case 'sort_code':
        return 'Sort Code';
      case 'email':
        return 'Email Address';
      case 'customer_id':
        return 'Customer ID';
      default:
        return field;
    }
  };

  const personalFields = [
    'customer',
    'customer_address',
    'account_number_masked',
    'sort_code',
    'email',
  ];

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'grey.100',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
            p: 2.5,
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {currentBankData.bankName &&
              (() => {
                const { logo, initials } = getBankLogoWithFallback(
                  currentBankData.bankName,
                  currentBankData.personalDetails.customer,
                  currentBankData.personalDetails.sort_code,
                );
                return (
                  <Avatar
                    src={logo}
                    sx={{
                      width: 40,
                      height: 40,
                      mr: 2,
                      border: '3px solid',
                      borderColor: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      backgroundColor: 'primary.main',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                    alt={currentBankData.bankName}
                    onError={(e) => {
                      // Hide the image if it fails to load, showing initials instead
                      e.currentTarget.style.display = 'none';
                    }}
                  >
                    {!logo ? initials : null}
                  </Avatar>
                );
              })()}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}
              >
                Personal Details
              </Typography>
              {currentBankData.bankName && (
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {currentBankData.bankName}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Bank Selector for Multi-Bank Scenarios */}
          {isMultiBank && (
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel sx={{ fontWeight: 600 }}>Select Bank</InputLabel>
              <Select
                value={selectedBankForDetails}
                label="Select Bank"
                onChange={handleBankChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid',
                    borderColor: 'grey.300',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused': {
                      borderColor: 'primary.main',
                      boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                    },
                  },
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  },
                }}
              >
                <MenuItem value="all">
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                    <Avatar
                      sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: 'primary.main',
                        fontSize: '10px',
                        fontWeight: 600,
                      }}
                    >
                      ALL
                    </Avatar>
                    <Typography variant="body2">All Banks ({multiBankData.length})</Typography>
                  </Stack>
                </MenuItem>
                {multiBankData.map((bank, index) => {
                  const { logo, initials } = getBankLogoWithFallback(
                    bank.bank,
                    bank.customer,
                    bank.personalDetails.sort_code,
                  );
                  return (
                    <MenuItem key={`${bank.bank}-${index}`} value={bank.bank}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                        <Avatar
                          src={bank.logo || logo}
                          sx={{
                            width: 20,
                            height: 20,
                            backgroundColor: 'primary.main',
                            fontSize: '8px',
                            fontWeight: 600,
                          }}
                          alt={bank.bank}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        >
                          {!bank.logo && !logo ? initials : null}
                        </Avatar>
                        <Typography variant="body2">{bank.bank}</Typography>
                        <Chip
                          label={bank.transactions.length}
                          size="small"
                          sx={{
                            fontSize: '8px',
                            height: 14,
                            minWidth: 16,
                          }}
                        />
                      </Stack>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          )}
        </Box>

        <Grid container spacing={3}>
          {personalFields
            .filter((field) => {
              const value = currentBankData.personalDetails[field as keyof PersonalDetailsType];
              return value && value !== 'Unknown' && value.trim() !== '';
            })
            .map((field) => {
              const value = currentBankData.personalDetails[field as keyof PersonalDetailsType];
              const fieldColor = getFieldColor(field);

              return (
                <Grid item xs={12} sm={6} md={4} key={field}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      p: 2.5,
                      borderRadius: 2,
                      backgroundColor: 'white',
                      border: '1px solid',
                      borderColor: 'grey.200',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease-in-out',
                      minHeight: 120, // Ensure all boxes are the same height
                      '&:hover': {
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                        borderColor: fieldColor,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: fieldColor,
                        mr: 2,
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                    >
                      <IconifyIcon
                        icon={getFieldIcon(field)}
                        width={24}
                        height={24}
                        sx={{ color: 'white' }}
                      />
                    </Box>
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          mb: 1,
                        }}
                      >
                        {getFieldLabel(field)}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 500,
                          color: 'text.primary',
                          wordBreak: 'break-word',
                          lineHeight: 1.4,
                        }}
                      >
                        {formatValue(value)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PersonalDetails;
