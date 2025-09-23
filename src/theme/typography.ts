import { Theme } from '@mui/material';
import type { TypographyOptions } from '@mui/material/styles/createTypography';
import pxToRem from 'theme/functions/pxToRem';

// ----------------------------------------------------------------------

declare module '@mui/material/styles' {
  interface TypographyVariants {
    fontSecondaryFamily: React.CSSProperties['fontFamily'];
    fontWeightSemiBold: React.CSSProperties['fontWeight'];
    fontWeightLight: React.CSSProperties['fontWeight'];
    fontWeightExtraBold: React.CSSProperties['fontWeight'];
  }
  interface TypographyVariantsOptions {
    fontSecondaryFamily?: React.CSSProperties['fontFamily'];
    fontWeightLight?: React.CSSProperties['fontWeight'];
    fontWeightSemiBold?: React.CSSProperties['fontWeight'];
    fontWeightExtraBold?: React.CSSProperties['fontWeight'];
  }
  interface ThemeVars {
    typography: Theme['typography'];
  }
}

const typography: TypographyOptions = {
  fontFamily: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ].join(','),
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightSemiBold: 600,
  fontWeightBold: 700,
  fontWeightExtraBold: 800,
  h1: {
    fontWeight: 700,
    fontSize: pxToRem(32), // 32px - more prominent
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontWeight: 600,
    fontSize: pxToRem(28), // 28px
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontWeight: 600,
    fontSize: pxToRem(24), // 24px
    lineHeight: 1.3,
  },
  h4: {
    fontWeight: 600,
    fontSize: pxToRem(20), // 20px
    lineHeight: 1.35,
  },
  h5: {
    fontWeight: 600,
    fontSize: pxToRem(18), // 18px
    lineHeight: 1.4,
  },
  h6: {
    fontWeight: 600,
    fontSize: pxToRem(16), // 16px
    lineHeight: 1.4,
  },
  subtitle1: {
    fontWeight: 500,
    fontSize: pxToRem(16), // 16px
    lineHeight: 1.5,
  },
  subtitle2: {
    fontWeight: 500,
    fontSize: pxToRem(14), // 14px
    lineHeight: 1.4,
  },
  body1: {
    fontWeight: 400,
    fontSize: pxToRem(16), // 16px
    lineHeight: 1.6,
  },
  body2: {
    fontWeight: 400,
    fontSize: pxToRem(14), // 14px
    lineHeight: 1.5,
  },
  button: {
    fontWeight: 500,
    fontSize: pxToRem(14), // 14px
    lineHeight: 1.4,
    textTransform: 'none', // Remove capitalization for professional look
  },
  caption: {
    fontWeight: 400,
    fontSize: pxToRem(12), // 12px
    lineHeight: 1.4,
  },
  overline: {
    fontWeight: 500,
    fontSize: pxToRem(11), // 11px
    lineHeight: 1.3,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};

export default typography;
