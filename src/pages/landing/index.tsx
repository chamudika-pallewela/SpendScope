import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  alpha,
  Card,
  Grid,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from 'components/common/Logo';

// Transaction Row Component
const TransactionRow = ({
  icon,
  label,
  amount,
  positive,
}: {
  icon: string;
  label: string;
  amount: string;
  positive?: boolean;
}) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ fontSize: '1.25rem' }}>{icon}</Box>
      <Typography variant="body2" sx={{ fontSize: '0.813rem', opacity: 0.95 }}>
        {label}
      </Typography>
    </Stack>
    <Typography
      variant="body2"
      sx={{
        fontWeight: 600,
        fontSize: '0.813rem',
        color: positive ? '#41D4A8' : 'rgba(255, 255, 255, 0.95)',
      }}
    >
      {amount}
    </Typography>
  </Stack>
);

// Category Bar Component
const CategoryBar = ({
  label,
  percentage,
  color,
}: {
  label: string;
  percentage: number;
  color: string;
}) => (
  <Box>
    <Stack direction="row" justifyContent="space-between" mb={0.5}>
      <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
        {percentage}%
      </Typography>
    </Stack>
    <Box
      sx={{
        width: '100%',
        height: 6,
        borderRadius: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </Box>
  </Box>
);

// Dashboard Card Component
const DashboardCard = ({
  variant,
}: {
  variant: 'main' | 'transactions' | 'analytics' | 'risk' | 'income' | 'chart';
}) => {
  if (variant === 'main') {
    return (
      <Card
        sx={{
          width: { xs: '280px', sm: '340px' },
          borderRadius: 3,
          p: 3,
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.2)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.03)',
          },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem' }}
          >
            Affordability Report
          </Typography>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: (theme) => alpha(theme.palette.success.main, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}
          >
            ✓
          </Box>
        </Stack>
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" mb={1}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              Monthly Income
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              £4,850
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" mb={1}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              Total Expenses
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              £3,240
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" mb={1}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              Monthly Surplus
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
              £1,610
            </Typography>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              DTI Ratio
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
              28%
            </Typography>
          </Stack>
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: (theme) => alpha(theme.palette.success.main, 0.1),
            textAlign: 'center',
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: 'success.dark', fontWeight: 700, fontSize: '0.813rem' }}
          >
            ✓ AFFORDABLE
          </Typography>
        </Box>
      </Card>
    );
  }

  if (variant === 'transactions') {
    return (
      <Card
        sx={{
          width: { xs: '260px', sm: '300px' },
          borderRadius: 3,
          p: 2.5,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.18)',
          background: 'linear-gradient(135deg, #1814F3 0%, #4C49ED 100%)',
          color: 'white',
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.03)',
          },
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '0.938rem' }}>
          Recent Transactions
        </Typography>
        <Stack spacing={1.5}>
          <TransactionRow icon="🏠" label="Mortgage Payment" amount="-£1,250" />
          <TransactionRow icon="🛒" label="Tesco Groceries" amount="-£85.40" />
          <TransactionRow icon="💰" label="Salary - ABC Ltd" amount="+£4,850" positive />
          <TransactionRow icon="⚡" label="Electricity Bill" amount="-£120.00" />
        </Stack>
      </Card>
    );
  }

  if (variant === 'risk') {
    return (
      <Card
        sx={{
          width: { xs: '240px', sm: '280px' },
          borderRadius: 3,
          p: 2.5,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          background: 'linear-gradient(135deg, #FE5C73 0%, #FF8A9B 100%)',
          color: 'white',
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.03)',
          },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.938rem' }}>
            AML Risk Alert
          </Typography>
          <Box sx={{ fontSize: '1.25rem' }}>⚠️</Box>
        </Stack>
        <Stack spacing={1.5}>
          <Box>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.95 }}>
                Gambling Transactions
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                HIGH
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ fontSize: '0.813rem', opacity: 0.9 }}>
              5 transactions totaling £850
            </Typography>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.3)' }} />
          <Box>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.95 }}>
                Cash Deposits
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                MEDIUM
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ fontSize: '0.813rem', opacity: 0.9 }}>
              3 deposits near threshold
            </Typography>
          </Box>
        </Stack>
      </Card>
    );
  }

  if (variant === 'income') {
    return (
      <Card
        sx={{
          width: { xs: '240px', sm: '280px' },
          borderRadius: 3,
          p: 2.5,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          background: 'linear-gradient(135deg, #41D4A8 0%, #34aa86 100%)',
          color: 'white',
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.03)',
          },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.938rem' }}>
            Income Sources
          </Typography>
          <Box sx={{ fontSize: '1.25rem' }}>✓</Box>
        </Stack>
        <Stack spacing={1.5}>
          <Box>
            <Typography
              variant="caption"
              sx={{ fontSize: '0.75rem', opacity: 0.9, mb: 0.5, display: 'block' }}
            >
              Primary Income
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.938rem', fontWeight: 700 }}>
              £4,850/month
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
              ABC Ltd - Regular
            </Typography>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.3)' }} />
          <Stack direction="row" justifyContent="space-between">
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.688rem', opacity: 0.9 }}>
                Consistency
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.813rem', fontWeight: 600 }}>
                100%
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.688rem', opacity: 0.9 }}>
                Status
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.813rem', fontWeight: 600 }}>
                Verified ✓
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Card>
    );
  }

  if (variant === 'chart') {
    return (
      <Card
        sx={{
          width: { xs: '260px', sm: '300px' },
          borderRadius: 3,
          p: 2.5,
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.2)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.03)',
          },
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: 'text.primary', mb: 2, fontSize: '0.938rem' }}
        >
          Monthly Cash Flow
        </Typography>
        <Box sx={{ position: 'relative', height: '140px', mb: 2 }}>
          {/* Simple bar chart visualization */}
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="flex-end"
            justifyContent="space-between"
            height="100%"
          >
            <BarChart height={60} color="#1814F3" />
            <BarChart height={85} color="#4C49ED" />
            <BarChart height={70} color="#718EBF" />
            <BarChart height={95} color="#1814F3" />
            <BarChart height={80} color="#4C49ED" />
            <BarChart height={100} color="#41D4A8" />
          </Stack>
        </Box>
        <Stack direction="row" justifyContent="space-between">
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.688rem' }}>
              Avg. Income
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.875rem' }}
            >
              £4,850
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.688rem' }}>
              Trend
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'success.main', fontWeight: 700, fontSize: '0.875rem' }}
            >
              +12% ↗
            </Typography>
          </Box>
        </Stack>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        width: { xs: '260px', sm: '300px' },
        borderRadius: 3,
        p: 2.5,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.18)',
        background: 'linear-gradient(135deg, #343c6a 0%, #123288 100%)',
        color: 'white',
        transition: 'transform 0.3s ease',
        '&:hover': {
          transform: 'scale(1.03)',
        },
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '0.938rem' }}>
        Expense Breakdown
      </Typography>
      <Stack spacing={1.5}>
        <CategoryBar label="Housing" percentage={35} color="#41D4A8" />
        <CategoryBar label="Food & Household" percentage={18} color="#1814F3" />
        <CategoryBar label="Transport" percentage={12} color="#fc7900" />
        <CategoryBar label="Financial" percentage={25} color="#718EBF" />
        <CategoryBar label="Lifestyle" percentage={10} color="#FE5C73" />
      </Stack>
    </Card>
  );
};

// Simple Bar Chart Component
const BarChart = ({ height, color }: { height: number; color: string }) => (
  <Box
    sx={{
      flex: 1,
      height: `${height}%`,
      backgroundColor: color,
      borderRadius: '4px 4px 0 0',
      minWidth: '20px',
      opacity: 0.9,
    }}
  />
);

// Feature Card Component
const FeatureCard = ({
  icon,
  title,
  description,
  features,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  features: string[];
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
  >
    <Card
      sx={{
        p: 4,
        height: '100%',
        borderRadius: 3,
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        backgroundColor: (theme) => alpha(theme.palette.common.white, 0.8),
        backdropFilter: 'blur(10px)',
        transition: 'all 0.4s ease',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: (theme) => `0 20px 60px ${alpha(theme.palette.primary.main, 0.15)}`,
          borderColor: 'primary.main',
        },
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: 3,
          background: (theme) => alpha(theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          mb: 3,
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          mb: 2,
          fontSize: '1.25rem',
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          mb: 3,
          lineHeight: 1.7,
        }}
      >
        {description}
      </Typography>
      <Stack spacing={1.5}>
        {features.map((feature, index) => (
          <Stack key={index} direction="row" spacing={1.5} alignItems="flex-start">
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                mt: 0.25,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                }}
              />
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem',
                lineHeight: 1.6,
              }}
            >
              {feature}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Card>
  </motion.div>
);

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(
            theme.palette.primary.light,
            0.08,
          )} 50%, ${alpha(theme.palette.common.white, 1)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: (theme) =>
            `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 70%)`,
          filter: 'blur(80px)',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: (theme) =>
            `radial-gradient(circle, ${alpha(theme.palette.primary.light, 0.1)} 0%, transparent 70%)`,
          filter: 'blur(80px)',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <Box
        component="header"
        sx={{
          py: 3,
          px: { xs: 2, md: 4 },
          position: 'relative',
          zIndex: 10,
          backdropFilter: 'blur(10px)',
          backgroundColor: (theme) => alpha(theme.palette.common.white, 0.8),
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        }}
      >
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Logo />
            <Stack direction="row" spacing={2}>
              <Button
                variant="text"
                onClick={() => navigate('/authentication/login')}
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  px: 3,
                  '&:hover': {
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/authentication/sign-up')}
                sx={{
                  background: (theme) => theme.palette.gradients.blueGradient,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: (theme) => `0 12px 32px ${alpha(theme.palette.primary.main, 0.35)}`,
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Get Started
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          alignItems="center"
          spacing={{ xs: 6, lg: 10 }}
          sx={{ py: { xs: 8, md: 10 } }}
        >
          {/* Left Content */}
          <Box sx={{ flex: 1, maxWidth: { xs: '100%', lg: '600px' }, pl: { xs: 0, lg: 4 } }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2.5,
                  py: 1,
                  borderRadius: 10,
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    },
                  }}
                />
                <Typography
                  variant="overline"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    fontSize: '0.813rem',
                  }}
                >
                  Intelligent Bank Statement Analysis
                </Typography>
              </Box>

              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.75rem', md: '3.75rem', lg: '4.5rem' },
                  fontWeight: 800,
                  color: 'text.primary',
                  lineHeight: 1.1,
                  mb: 3,
                  letterSpacing: '-0.02em',
                }}
              >
                Transform How You
                <br />
                Analyze{' '}
                <Box
                  component="span"
                  sx={{
                    background: (theme) => theme.palette.gradients.blueGradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    position: 'relative',
                    display: 'inline-block',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 8,
                      left: 0,
                      right: 0,
                      height: '12px',
                      background: (theme) => alpha(theme.palette.primary.main, 0.15),
                      zIndex: -1,
                      borderRadius: 1,
                    },
                  }}
                >
                  Bank Statements
                </Box>
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  fontSize: '1.188rem',
                  lineHeight: 1.8,
                  mb: 5,
                  maxWidth: '560px',
                  fontWeight: 400,
                }}
              >
                A compliance-driven, automation-focused platform for mortgage professionals.
                Streamline affordability assessments, verify income sources, and identify AML risks
                with AI-powered transaction categorization.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/authentication/sign-up')}
                  sx={{
                    background: (theme) => theme.palette.gradients.blueGradient,
                    px: 5,
                    py: 2.5,
                    fontSize: '1.063rem',
                    fontWeight: 600,
                    borderRadius: 2.5,
                    textTransform: 'none',
                    boxShadow: (theme) => `0 12px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: (theme) => `0 16px 48px ${alpha(theme.palette.primary.main, 0.4)}`,
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Get Started
                </Button>
              </Stack>
            </motion.div>
          </Box>

          {/* Right Content - Dashboard Mockups */}
          <Box
            sx={{
              flex: 1,
              position: 'relative',
              width: '100%',
              minHeight: { xs: '600px', md: '750px' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Row 1 - Top */}
            {/* Transaction List - Top Left */}
            <motion.div
              initial={{ opacity: 0, x: -60, rotate: -6 }}
              animate={{ opacity: 1, x: 0, rotate: -6 }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '0%',
                left: '0%',
                zIndex: 5,
              }}
            >
              <DashboardCard variant="transactions" />
            </motion.div>

            {/* Risk Alert - Top Center-Left */}
            <motion.div
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '2%',
                left: '35%',
                transform: 'rotate(4deg)',
                zIndex: 4,
              }}
            >
              <DashboardCard variant="risk" />
            </motion.div>

            {/* Income Verification - Top Right */}
            <motion.div
              initial={{ opacity: 0, x: 60, rotate: 6 }}
              animate={{ opacity: 1, x: 0, rotate: 6 }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '0%',
                right: '0%',
                zIndex: 5,
              }}
            >
              <DashboardCard variant="income" />
            </motion.div>

            {/* Row 2 - Middle */}
            {/* Main Dashboard - Center Left */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '38%',
                left: '5%',
                zIndex: 6,
              }}
            >
              <DashboardCard variant="main" />
            </motion.div>

            {/* Cash Flow Chart - Center Right */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.7, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '36%',
                right: '5%',
                transform: 'rotate(-3deg)',
                zIndex: 6,
              }}
            >
              <DashboardCard variant="chart" />
            </motion.div>

            {/* Row 3 - Bottom */}
            {/* Expense Analytics - Bottom Center */}
            <motion.div
              initial={{ opacity: 0, y: 60, rotate: -4 }}
              animate={{ opacity: 1, y: 0, rotate: -4 }}
              transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                bottom: '-8%',
                left: '50%',
                transform: 'translateX(-50%) rotate(-4deg)',
                zIndex: 5,
              }}
            >
              <DashboardCard variant="analytics" />
            </motion.div>

            {/* Decorative elements */}
            <Box
              sx={{
                position: 'absolute',
                top: '30%',
                right: '30%',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: (theme) =>
                  `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 70%)`,
                filter: 'blur(90px)',
                zIndex: 0,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: '20%',
                left: '20%',
                width: '350px',
                height: '350px',
                borderRadius: '50%',
                background: (theme) =>
                  `radial-gradient(circle, ${alpha(theme.palette.success.main, 0.06)} 0%, transparent 70%)`,
                filter: 'blur(80px)',
                zIndex: 0,
              }}
            />
          </Box>
        </Stack>
      </Container>

      {/* Features Section */}
      <Box
        sx={{
          py: { xs: 10, md: 14 },
          position: 'relative',
          zIndex: 1,
          backgroundColor: (theme) => alpha(theme.palette.common.white, 0.6),
          backdropFilter: 'blur(10px)',
          mt: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography
                variant="overline"
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  letterSpacing: 2,
                  fontSize: '0.875rem',
                }}
              >
                POWERFUL FEATURES
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2rem', md: '2.75rem' },
                  fontWeight: 700,
                  color: 'text.primary',
                  mt: 2,
                  mb: 2,
                }}
              >
                Everything You Need for
                <br />
                <Box
                  component="span"
                  sx={{
                    background: (theme) => theme.palette.gradients.blueGradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Comprehensive Analysis
                </Box>
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  fontSize: '1.125rem',
                  maxWidth: '600px',
                  mx: 'auto',
                }}
              >
                Advanced tools designed specifically for mortgage professionals
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} lg={3}>
              <FeatureCard
                icon="📊"
                title="Budget Planner"
                description="Comprehensive expense breakdown with category-wise analysis, recurring spend detection, and visual insights through pie and bar charts."
                features={[
                  'Category & subcategory breakdown',
                  'Monthly spend tracking',
                  '% of income analysis',
                  'Recurring vs one-off markers',
                ]}
                delay={0.1}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <FeatureCard
                icon="✅"
                title="Income Verification"
                description="Automated income source identification with regularity checks, employer verification, and anomaly detection for complete validation."
                features={[
                  'Multi-source income tracking',
                  'Employer confirmation',
                  'Pattern irregularity flags',
                  'Average income calculation',
                ]}
                delay={0.2}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <FeatureCard
                icon="💰"
                title="Affordability Report"
                description="Instant affordability assessment with DTI ratio calculation, surplus/deficit analysis, and color-coded verdict system."
                features={[
                  'Net income vs expenses',
                  'Debt-to-Income ratio',
                  'Monthly surplus tracking',
                  'Mortgage affordability verdict',
                ]}
                delay={0.3}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <FeatureCard
                icon="🛡️"
                title="AML & Risk Detection"
                description="Advanced risk monitoring with gambling detection, suspicious cash deposits, unusual transfers, and comprehensive risk scoring."
                features={[
                  'Gambling pattern analysis',
                  'Cash deposit monitoring',
                  'Unexplained transfer alerts',
                  'Monthly risk scoring',
                ]}
                delay={0.4}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 6,
          mt: 8,
          textAlign: 'center',
          borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          position: 'relative',
          zIndex: 1,
          backgroundColor: (theme) => alpha(theme.palette.common.white, 0.5),
          backdropFilter: 'blur(10px)',
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={3}
          >
            <Logo />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              © 2025 Spently. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={3}>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  cursor: 'pointer',
                  fontWeight: 500,
                  '&:hover': { color: 'primary.main' },
                  transition: 'color 0.2s ease',
                }}
              >
                Privacy Policy
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  cursor: 'pointer',
                  fontWeight: 500,
                  '&:hover': { color: 'primary.main' },
                  transition: 'color 0.2s ease',
                }}
              >
                Terms of Service
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
