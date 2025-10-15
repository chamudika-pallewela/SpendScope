import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
  Chip,
  Avatar,
} from '@mui/material';
import { useState } from 'react';
import { getBankLogoWithFallback } from '../../../../helpers/utils';

export interface BankData {
  bank: string;
  customer_name: string;
  transactionCount: number;
  logo?: string;
  account_number_masked?: string;
  sort_code?: string;
  accountCount?: number;
  accounts?: Array<{
    customer: string;
    account_number_masked: string;
    sort_code: string;
    transactionCount: number;
  }>;
}

interface BankSelectorProps {
  banks: BankData[];
  selectedBank: string | null;
  onBankChange: (bankName: string | null) => void;
}

const BankSelector = ({ banks, selectedBank, onBankChange }: BankSelectorProps) => {
  const [open, setOpen] = useState(false);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onBankChange(value === 'all' ? null : value);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  // Get bank color for consistent styling
  const getBankColor = (bankName: string): string => {
    const colorMap: Record<string, string> = {
      Lloyds: '#0066cc',
      Halifax: '#00a651',
      Barclays: '#00aeef',
      HSBC: '#db0032',
      NatWest: '#e31837',
      Santander: '#ec0000',
      TSB: '#ff6600',
      Nationwide: '#0072ce',
    };
    return colorMap[bankName] || '#666666';
  };

  if (banks.length === 0) {
    return null; // Don't show anything if there are no banks
  }

  // If there's only one bank, show a nice display instead of dropdown
  if (banks.length === 1) {
    const bank = banks[0];
    const { logo, initials } = getBankLogoWithFallback(bank.bank, bank.customer_name);
    return (
      <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: logo ? 'transparent' : 'primary.main',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {logo ? (
              <img
                src={logo}
                alt={bank.bank}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.style.display = 'block';
                  }
                }}
              />
            ) : null}
            <span style={{ display: logo ? 'none' : 'block' }}>{initials}</span>
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {bank.bank}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {bank.transactionCount} transactions
              {bank.accountCount && bank.accountCount > 1 && ` • ${bank.accountCount} accounts`}
            </Typography>
            {bank.accounts && bank.accounts.length > 1 && (
              <Box sx={{ mt: 1 }}>
                {bank.accounts.map((account, index) => (
                  <Chip
                    key={index}
                    label={`${account.account_number_masked} (${account.transactionCount} txns)`}
                    size="small"
                    sx={{ mr: 1, mb: 0.5 }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <FormControl fullWidth>
        <InputLabel id="bank-selector-label">Select Bank</InputLabel>
        <Select
          labelId="bank-selector-label"
          id="bank-selector"
          value={selectedBank || 'all'}
          label="Select Bank"
          onChange={handleChange}
          open={open}
          onClose={handleClose}
          onOpen={handleOpen}
          sx={{
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
                  width: 32,
                  height: 32,
                  backgroundColor: 'primary.main',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                ALL
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  All Banks ({banks.length} accounts)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {banks.reduce((sum, bank) => sum + bank.transactionCount, 0)} transactions
                </Typography>
              </Box>
            </Stack>
          </MenuItem>
          {banks.map((bank, index) => {
            const { logo, initials } = getBankLogoWithFallback(
              bank.bank,
              bank.customer_name,
              bank.sort_code,
            );
            return (
              <MenuItem key={`${bank.bank}-${index}`} value={bank.bank}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                  <Avatar
                    src={bank.logo || logo}
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: getBankColor(bank.bank),
                      fontSize: '10px',
                      fontWeight: 600,
                    }}
                    alt={bank.bank}
                    onError={(e) => {
                      // Hide the image if it fails to load, showing initials instead
                      e.currentTarget.style.display = 'none';
                    }}
                  >
                    {!bank.logo && !logo ? initials : null}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {bank.bank}
                      </Typography>
                      <Chip
                        label={bank.transactionCount}
                        size="small"
                        sx={{
                          backgroundColor: getBankColor(bank.bank),
                          color: 'white',
                          fontSize: '10px',
                          height: 16,
                          minWidth: 20,
                        }}
                      />
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                      {bank.customer_name}
                    </Typography>
                    {bank.account_number_masked && bank.sort_code && (
                      <Typography variant="caption" color="text.secondary">
                        {bank.sort_code} • {bank.account_number_masked}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
};

export default BankSelector;
