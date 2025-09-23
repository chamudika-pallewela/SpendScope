import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useBreakpoints } from 'providers/useBreakpoints';
import { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  onClearData?: () => void;
  isUploading?: boolean;
}

const FileUpload = ({ onFileUpload, onClearData, isUploading = false }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { up } = useBreakpoints();

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
          onClearData?.(); // Clear existing data when new files are dropped
          onFileUpload(files);
        }
      }
    },
    [onFileUpload, onClearData],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files).filter((file) => file.type === 'application/pdf');
        if (files.length > 0) {
          setSelectedFiles(files);
          onClearData?.(); // Clear existing data when new files are selected
          onFileUpload(files);
        }
      }
      // Reset the input value to allow selecting the same file again
      e.target.value = '';
    },
    [onFileUpload, onClearData],
  );

  const handleUploadClick = () => {
    const input = document.getElementById('file-upload') as HTMLInputElement;
    input?.click();
  };

  const resetFileInput = () => {
    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  };

  return (
    <Card
      sx={{
        backgroundColor: 'common.white',
        width: 1,
        mb: 4,
        mt: 3,
        borderRadius: 3,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={4}>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: 1,
              }}
            >
              Upload Bank Statements
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Upload your bank statement PDFs for comprehensive financial analysis and affordability
              assessment.
            </Typography>
          </Box>

          <Box
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              border: '2px dashed',
              borderColor: dragActive ? 'primary.main' : 'grey.300',
              borderRadius: 3,
              p: 5,
              textAlign: 'center',
              backgroundColor: dragActive ? 'primary.lighter' : 'grey.50',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.lighter',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
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

              <Stack spacing={2}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} PDF file${selectedFiles.length > 1 ? 's' : ''} selected`
                    : 'Drop your bank statement PDFs here or click to browse'}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    maxWidth: 400,
                    mx: 'auto',
                  }}
                >
                  Supports PDF files only • Multiple bank statements allowed • Secure processing
                </Typography>
              </Stack>

              {selectedFiles.length === 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<IconifyIcon icon="material-symbols:upload" />}
                  disabled={isUploading}
                  sx={{
                    minWidth: 160,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
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
                            resetFileInput();
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
                      resetFileInput();
                      onClearData?.(); // Clear transaction data when clearing files
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
