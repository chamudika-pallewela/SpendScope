import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useBreakpoints } from 'providers/useBreakpoints';
import { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isUploading?: boolean;
}

const FileUpload = ({ onFileUpload, isUploading = false }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { up } = useBreakpoints();
  const upSM = up('sm');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type === 'application/pdf' || file.type.includes('image/')) {
          setSelectedFile(file);
          onFileUpload(file);
        }
      }
    },
    [onFileUpload],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setSelectedFile(file);
        onFileUpload(file);
      }
    },
    [onFileUpload],
  );

  const handleUploadClick = () => {
    const input = document.getElementById('file-upload') as HTMLInputElement;
    input?.click();
  };

  return (
    <Card sx={{ backgroundColor: 'common.white', width: 1, mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Typography
            sx={{
              fontSize: {
                xs: 'body2.fontSize',
                md: 'h6.fontSize',
                xl: 'h3.fontSize',
              },
              fontWeight: 600,
            }}
          >
            Upload Transaction File
          </Typography>

          <Box
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              border: '2px dashed',
              borderColor: dragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              backgroundColor: dragActive ? 'primary.lighter' : 'grey.50',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.lighter',
              },
            }}
            onClick={handleUploadClick}
          >
            <Stack spacing={2} alignItems="center">
              <IconifyIcon
                icon="material-symbols:cloud-upload"
                sx={{
                  fontSize: { xs: 40, sm: 60 },
                  color: 'primary.main',
                }}
              />

              <Stack spacing={1}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {selectedFile ? selectedFile.name : 'Drop your file here or click to browse'}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  Supports PDF and image files (PNG, JPG, JPEG)
                </Typography>
              </Stack>

              {!selectedFile && (
                <Button
                  variant="contained"
                  color="primary"
                  size={upSM ? 'large' : 'medium'}
                  startIcon={<IconifyIcon icon="material-symbols:upload" />}
                  disabled={isUploading}
                >
                  Choose File
                </Button>
              )}

              {selectedFile && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2" color="success.main">
                    ✓ File selected: {selectedFile.name}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              )}
            </Stack>
          </Box>

          <input
            id="file-upload"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />

          {isUploading && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                <IconifyIcon
                  icon="eos-icons:loading"
                  sx={{
                    fontSize: 20,
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
                <Typography variant="body2" color="primary.main">
                  Processing file...
                </Typography>
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default FileUpload;


