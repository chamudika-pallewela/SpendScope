import { Typography } from '@mui/material';
import Image from 'components/base/Image';
import { Fragment } from 'react/jsx-runtime';

const Logo = () => {
  return (
    <Fragment>
      <Image src="/analyzr-ai/bankdash.svg" alt="Logo" sx={{ width: 40 }} />
      <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
        BankWise
      </Typography>
    </Fragment>
  );
};

export default Logo;
