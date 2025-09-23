import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles/components';
import pxToRem from 'theme/functions/pxToRem';

declare module '@mui/material' {
  interface ButtonPropsColorOverrides {
    neutral: true;
  }
}

const ButtonComponent: Components<Omit<Theme, 'components'>>['MuiButton'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      ...theme.typography.button,
      borderRadius: theme.shape.borderRadius * 2, // More modern rounded corners
      textTransform: 'none', // Remove capitalization
      fontWeight: 500,
      '&.Mui-disabled': {
        backgroundColor: theme.palette.action.disabled,
        boxShadow: 'none',
        color: theme.palette.text.disabled,
      },
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transform: 'translateY(-1px)',
        transition: 'all 0.2s ease-in-out',
      },
    }),
    text: ({ theme }) => ({
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
        boxShadow: 'none',
        transform: 'none',
      },
    }),
    outlined: ({ theme }) => ({
      ...theme.typography.button,
      fontWeight: 500,
      paddingTop: theme.spacing(1.5),
      paddingBottom: theme.spacing(1.5),
      borderRadius: theme.shape.borderRadius * 2,
      borderWidth: '1.5px',
    }),
    textPrimary: ({ theme }) => ({
      '&.Mui-disabled': {
        color: theme.palette.action.disabled,
      },
    }),
    outlinedPrimary: ({ theme }) => ({
      color: theme.palette.primary.darker,
      borderColor: theme.palette.primary.darker,
      '&:hover': {
        color: theme.palette.primary.main,
        borderColor: theme.palette.primary.main,
      },
      '&.Mui-disabled': {
        backgroundColor: theme.palette.action.disabledBackground,
        color: theme.palette.action.disabled,
      },
    }),
    sizeSmall: ({ theme }) => ({
      ...theme.typography.button,
      fontSize: theme.typography.pxToRem(12),
      lineHeight: 1.4,
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
    }),
    sizeMedium: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(14),
      lineHeight: 1.4,
      paddingTop: theme.spacing(1.5),
      paddingBottom: theme.spacing(1.5),
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
    }),
    sizeLarge: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(16),
      lineHeight: 1.4,
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      paddingLeft: theme.spacing(4),
      paddingRight: theme.spacing(4),
    }),
  },
};

export default ButtonComponent;
