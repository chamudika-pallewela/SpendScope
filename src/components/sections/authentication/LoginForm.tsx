import {
  Button,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useBreakpoints } from 'providers/useBreakpoints';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import TwoFactorAuth from './TwoFactorAuth';

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  const navigate = useNavigate();
  const { up } = useBreakpoints();
  const { login } = useAuth();
  const upSM = up('sm');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password, keepLoggedIn);

      // If user didn't check "keep logged in", show 2FA
      if (!keepLoggedIn) {
        console.log('Keep logged in is false - showing 2FA');
        setShowTwoFactor(true);
      } else {
        console.log('Keep logged in is true - navigating to dashboard...');
        navigate('/dashboard', { replace: true });
      }
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSuccess = () => {
    console.log('2FA Success callback called - Navigating to dashboard...');
    setShowTwoFactor(false);
    console.log('About to navigate to /dashboard');
    navigate('/dashboard', { replace: true });
    console.log('Navigation called');
  };

  const handleTwoFactorCancel = () => {
    setShowTwoFactor(false);
  };
  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 2.5 }}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            size={upSM ? 'medium' : 'small'}
            name="email"
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            size={upSM ? 'medium' : 'small'}
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    <IconifyIcon icon={showPassword ? 'majesticons:eye' : 'majesticons:eye-off'} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      <Grid container justifyContent="space-between" sx={{ my: 2 }}>
        <Grid item>
          <FormControlLabel
            control={
              <Checkbox
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                size="small"
              />
            }
            label="Keep me logged in"
          />
        </Grid>
        <Grid item>
          <Link href="/authentication/forget-password" variant="subtitle2" underline="hover">
            Forgot password?
          </Link>
        </Grid>
      </Grid>

      <Button
        fullWidth
        size={upSM ? 'large' : 'medium'}
        type="submit"
        variant="contained"
        color="primary"
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Login'}
      </Button>

      {showTwoFactor && (
        <TwoFactorAuth onSuccess={handleTwoFactorSuccess} onCancel={handleTwoFactorCancel} />
      )}
    </form>
  );
};

export default LoginForm;
