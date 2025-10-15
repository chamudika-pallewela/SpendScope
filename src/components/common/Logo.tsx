import { Box, Typography, Divider } from '@mui/material';
import Image from 'components/base/Image';

const Logo = () => {
  return (
    <Box textAlign="center">
      <br />
      {/* Logo + Title Row */}
      <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
        <Image src="/bankdash.svg" alt="Logo" sx={{ width: 40, height: 40 }} />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            letterSpacing: 0.5,
          }}
        >
          Spently
        </Typography>
      </Box>

      {/* Divider Line */}
      <Divider
        sx={{
          width: 180,
          mx: 'auto',
          my: 0.8,
          borderColor: 'divider',
        }}
      />

      {/* Tagline */}
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          fontSize: 13,
        }}
      >
        Smart insights from every pound spent
      </Typography>
    </Box>
  );
};

export default Logo;
