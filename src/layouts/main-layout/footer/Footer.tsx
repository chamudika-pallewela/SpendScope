import { Box, Container, Typography } from '@mui/material';
const Footer = () => {
  return (
    <>
      <Box component="section" textAlign="center">
        <Container maxWidth="xl" disableGutters>
          <Box pb={2.5}>
            <Typography
              fontWeight="regular"
              sx={{ fontSize: { xs: 'caption.fontSize', md: 'body2.fontSize' } }}
            >
              &copy; {new Date().getFullYear()}, WIS Morgrates.
            </Typography>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default Footer;
