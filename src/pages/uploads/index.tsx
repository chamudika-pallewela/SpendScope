import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useAuth } from '../../contexts/AuthContext';
import { getUserUploads, deleteUpload, UploadSummary } from '../../services/uploadService';

const UploadsPage = () => {
  const [uploads, setUploads] = useState<UploadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadToDelete, setUploadToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      loadUploads();
    }
  }, [currentUser]);

  const loadUploads = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError('');
      const userUploads = await getUserUploads(currentUser.uid);
      setUploads(userUploads);
    } catch (err) {
      console.error('Error loading uploads:', err);
      setError('Failed to load uploads');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUpload = (uploadId: string) => {
    navigate(`/uploads/${uploadId}`);
  };

  const handleDeleteClick = (uploadId: string) => {
    setUploadToDelete(uploadId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!uploadToDelete) return;

    try {
      setDeleting(true);
      await deleteUpload(uploadToDelete);
      await loadUploads(); // Reload the list
      setDeleteDialogOpen(false);
      setUploadToDelete(null);
    } catch (err) {
      console.error('Error deleting upload:', err);
      setError('Failed to delete upload');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUploadToDelete(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Uploads
        </Typography>
        <Button
          variant="contained"
          startIcon={<IconifyIcon icon="material-symbols:upload" />}
          onClick={() => navigate('/')}
        >
          New Upload
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {uploads.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <IconifyIcon
              icon="material-symbols:cloud-upload"
              sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No uploads found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload your first PDF to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<IconifyIcon icon="material-symbols:upload" />}
              onClick={() => navigate('/')}
            >
              Upload PDF
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {uploads.map((upload) => (
            <Grid item xs={12} md={6} lg={4} key={upload.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                  cursor: 'pointer',
                }}
                onClick={() => handleViewUpload(upload.id)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                          {upload.customerName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {upload.bank}
                        </Typography>
                      </Box>
                      {upload.isLinked && (
                        <Chip
                          label={`${upload.linkedCount} files`}
                          size="small"
                          color="primary"
                          icon={<IconifyIcon icon="material-symbols:link" />}
                        />
                      )}
                    </Stack>

                    <Divider />

                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Date Range:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {upload.dateRange}
                        </Typography>
                      </Stack>

                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Upload Date:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {upload.uploadDate}
                        </Typography>
                      </Stack>

                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Transactions:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {upload.transactionCount}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<IconifyIcon icon="material-symbols:visibility" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewUpload(upload.id);
                      }}
                    >
                      View
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(upload.id);
                      }}
                    >
                      <IconifyIcon icon="material-symbols:delete" />
                    </IconButton>
                  </Stack>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Upload</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this upload? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : null}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UploadsPage;
