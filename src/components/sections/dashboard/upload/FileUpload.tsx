import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useBreakpoints } from 'providers/useBreakpoints';
import { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  isUploading?: boolean;
}

const FileUpload = ({ onFileUpload, isUploading = false }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).filter(
          (file) => file.type === 'application/pdf',
        );
        if (files.length > 0) {
          setSelectedFiles(files);
          onFileUpload(files);
        }
      }
    },
    [onFileUpload],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files).filter((file) => file.type === 'application/pdf');
        if (files.length > 0) {
          setSelectedFiles(files);
          onFileUpload(files);
        }
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
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} PDF file${selectedFiles.length > 1 ? 's' : ''} selected`
                    : 'Drop your PDF files here or click to browse'}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  Supports PDF files only • Multiple files allowed
                </Typography>
              </Stack>

              {selectedFiles.length === 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  size={upSM ? 'large' : 'medium'}
                  startIcon={<IconifyIcon icon="material-symbols:upload" />}
                  disabled={isUploading}
                >
                  Choose Files
                </Button>
              )}

              {selectedFiles.length > 0 && (
                <Stack spacing={2} alignItems="center">
                  <Typography variant="body2" color="success.main">
                    ✓ {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                  </Typography>
                  <Stack spacing={1} sx={{ maxHeight: 120, overflowY: 'auto', width: '100%' }}>
                    {selectedFiles.map((file, index) => (
                      <Stack
                        key={index}
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography variant="caption" sx={{ flex: 1, textAlign: 'left' }}>
                          {file.name}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newFiles = selectedFiles.filter((_, i) => i !== index);
                            setSelectedFiles(newFiles);
                            if (newFiles.length > 0) {
                              onFileUpload(newFiles);
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFiles([]);
                    }}
                  >
                    Clear All
                  </Button>
                </Stack>
              )}
            </Stack>
          </Box>

          <input
            id="file-upload"
            type="file"
            accept=".pdf"
            multiple
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
                  Processing {selectedFiles.length > 1 ? 'files' : 'file'}...
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
