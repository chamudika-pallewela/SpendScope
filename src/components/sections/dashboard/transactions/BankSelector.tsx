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
} from '@mui/material';
import { useState } from 'react';

export interface BankData {
  bank: string;
  customer_name: string;
  transactionCount: number;
  logo?: string;
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

  if (banks.length <= 1) {
    return null; // Don't show selector if there's only one bank or no banks
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
              <Chip
                label="ALL"
                size="small"
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '11px',
                  height: 20,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  All Banks
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {banks.reduce((sum, bank) => sum + bank.transactionCount, 0)} transactions
                </Typography>
              </Box>
            </Stack>
          </MenuItem>
          {banks.map((bank) => (
            <MenuItem key={bank.bank} value={bank.bank}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                <Chip
                  label={bank.bank}
                  size="small"
                  sx={{
                    backgroundColor: getBankColor(bank.bank),
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '11px',
                    height: 20,
                    minWidth: 60,
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {bank.customer_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {bank.transactionCount} transactions
                  </Typography>
                </Box>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default BankSelector;
