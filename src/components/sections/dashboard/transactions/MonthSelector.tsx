import React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';

export interface MonthOption {
  label: string;
  value: string;
  count: number;
}

interface MonthSelectorProps {
  months: MonthOption[];
  selectedMonth: string | null;
  onMonthChange: (monthValue: string | null) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ months, selectedMonth, onMonthChange }) => {
  if (months.length <= 1) {
    return null; // Don't show selector if there's only one month or no months
  }

  const handleMonthClick = (monthValue: string) => {
    // Toggle selection - if already selected, deselect
    if (selectedMonth === monthValue) {
      onMonthChange(null);
    } else {
      onMonthChange(monthValue);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Filter by Month
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip
          label={`All Months (${months.reduce((sum, month) => sum + month.count, 0)} transactions)`}
          onClick={() => onMonthChange(null)}
          variant={selectedMonth === null ? 'filled' : 'outlined'}
          color={selectedMonth === null ? 'primary' : 'default'}
          sx={{
            mb: 1,
            '&:hover': {
              backgroundColor: selectedMonth === null ? 'primary.dark' : 'action.hover',
            },
          }}
        />
        {months.map((month) => (
          <Chip
            key={month.value}
            label={`${month.label} (${month.count})`}
            onClick={() => handleMonthClick(month.value)}
            variant={selectedMonth === month.value ? 'filled' : 'outlined'}
            color={selectedMonth === month.value ? 'primary' : 'default'}
            sx={{
              mb: 1,
              '&:hover': {
                backgroundColor: selectedMonth === month.value ? 'primary.dark' : 'action.hover',
              },
            }}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default MonthSelector;
