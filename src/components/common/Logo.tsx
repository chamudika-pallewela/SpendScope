import { Typography } from '@mui/material';
import Image from 'components/base/Image';
import { Fragment } from 'react/jsx-runtime';

const Logo = () => {
  return (
    <Fragment>
      <Image src="/bankdash.svg" alt="Logo" sx={{ width: 40 }} />
      <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
        Analyzr.AI
      </Typography>
    </Fragment>
  );
};

export default Logo;
