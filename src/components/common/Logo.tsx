import { Typography } from '@mui/material';
import Image from 'components/base/Image';
import { Fragment } from 'react/jsx-runtime';

const Logo = () => {
  return (
    <Fragment>
      <Image src="/analyzr-ai/bankdash.svg" alt="Logo" sx={{ width: 36 }} />
      <Typography variant="h2">Analyzr.AI</Typography>
    </Fragment>
  );
};

export default Logo;
