import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useAuth } from '../../../contexts/AuthContext';
import { ref, set, get, remove } from 'firebase/database';
import { database } from '../../../config/firebase';
import { sendVerificationCode } from '../../../services/emailService';

interface TwoFactorAuthProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ onSuccess, onCancel }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const { currentUser } = useAuth();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Generate and send verification code
  const generateAndSendCode = async () => {
    if (!currentUser?.email) return;

    try {
      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Store the code in the database with expiration time
      const codeRef = ref(database, `verification-codes/${currentUser.uid}`);
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes from now

      await set(codeRef, {
        code,
        expiresAt,
        email: currentUser.email,
        createdAt: Date.now(),
      });

      // Send the code via email service
      const emailSent = await sendVerificationCode(currentUser.email, code);

      if (emailSent) {
        setTimeLeft(300); // Reset timer
        setError(
          `Verification code sent! Check your email inbox. Code: ${code} (also in console for testing)`,
        );
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      setError('Failed to send verification code');
    }
  };

  // Send initial code when component mounts (only once)
  useEffect(() => {
    if (!hasInitialized.current) {
      console.log('TwoFactorAuth component mounted - sending initial code');
      hasInitialized.current = true;
      generateAndSendCode();
    }
  }, []); // Empty dependency array - only run once on mount

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with code:', verificationCode);

    if (!verificationCode || verificationCode.length !== 6) {
      console.log('Invalid code length:', verificationCode.length);
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    if (!currentUser?.uid) {
      setError('No user found');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Get the stored verification code
      const codeRef = ref(database, `verification-codes/${currentUser.uid}`);
      const snapshot = await get(codeRef);

      if (!snapshot.exists()) {
        setError('Verification code not found or expired');
        return;
      }

      const storedData = snapshot.val();

      // Check if code has expired
      if (Date.now() > storedData.expiresAt) {
        setError('Verification code has expired');
        await remove(codeRef); // Clean up expired code
        return;
      }

      // Verify the code
      if (storedData.code !== verificationCode) {
        setError('Invalid verification code');
        return;
      }

      // Code is valid, clean up and proceed
      await remove(codeRef);
      console.log('✅ Verification successful, redirecting to dashboard...');
      console.log('Calling onSuccess callback...');
      onSuccess();
    } catch (error: unknown) {
      setError((error as Error).message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setError('');
      setLoading(true);

      // Only resend if enough time has passed (prevent spam)
      if (timeLeft > 240) {
        // Can only resend after 1 minute
        setError('Please wait before requesting a new code');
        setLoading(false);
        return;
      }

      await generateAndSendCode();
      setError('New verification code sent!');
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    console.log('Code changed to:', value, 'Length:', value.length);
    setVerificationCode(value);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <IconifyIcon
              icon="eva:shield-outline"
              sx={{
                fontSize: 60,
                color: 'primary.main',
                mb: 2,
              }}
            />

            <Typography variant="h5" sx={{ mb: 1 }}>
              Two-Factor Authentication
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Enter the 6-digit verification code sent to your email
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {currentUser?.email}
            </Typography>

            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
              For testing: Check the browser console for the verification code
            </Typography>
          </Box>

          {error && (
            <Alert severity={error.includes('sent') ? 'success' : 'error'} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box>
            <TextField
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={handleCodeChange}
              placeholder="000000"
              inputProps={{
                maxLength: 6,
                style: {
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  letterSpacing: '0.5rem',
                  fontFamily: 'monospace',
                },
              }}
              disabled={loading}
              sx={{ mb: 2 }}
              onKeyPress={(e) => {
                if (
                  e.key === 'Enter' &&
                  verificationCode.length === 6 &&
                  !loading &&
                  timeLeft > 0
                ) {
                  handleSubmit(e as React.FormEvent);
                }
              }}
            />

            <Stack spacing={2}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || verificationCode.length !== 6 || timeLeft === 0}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                onClick={(e) => {
                  console.log('Verify button clicked');
                  console.log('Button state:', {
                    loading,
                    codeLength: verificationCode.length,
                    timeLeft,
                    disabled: loading || verificationCode.length !== 6 || timeLeft === 0,
                  });
                  handleSubmit(e as React.FormEvent);
                }}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleResendCode}
                disabled={loading || timeLeft > 240} // Can resend after 1 minute
                startIcon={<IconifyIcon icon="eva:refresh-outline" />}
              >
                Resend Code {timeLeft > 240 && `(${formatTime(timeLeft - 240)})`}
              </Button>

              <Button fullWidth variant="text" size="large" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            </Stack>
          </Box>

          {timeLeft > 0 && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Code expires in: {formatTime(timeLeft)}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TwoFactorAuth;
