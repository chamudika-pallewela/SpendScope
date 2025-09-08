import { Box, SxProps, Theme } from '@mui/material';
import { ImgHTMLAttributes } from 'react';

interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src: string;
  alt: string;
  sx?: SxProps<Theme>;
}

const Image = ({ src, alt, sx, ...rest }: ImageProps) => {
  return <Box component="img" src={src} alt={alt} sx={sx} {...rest} />;
};

export default Image;
