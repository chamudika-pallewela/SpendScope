import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireEmailVerification = false,
}) => {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  // Debug logging
  console.log('ProtectedRoute - Loading:', loading);
  console.log('ProtectedRoute - CurrentUser:', currentUser);
  console.log('ProtectedRoute - UserProfile:', userProfile);
  console.log('ProtectedRoute - Location:', location.pathname);
  console.log('ProtectedRoute - Will redirect to login:', !currentUser && !loading);
  console.log('ProtectedRoute - Will show children:', currentUser && !loading);

  if (loading) {
    console.log('ProtectedRoute - Still loading, showing spinner');
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!currentUser) {
    console.log('ProtectedRoute - No current user, redirecting to signup');
    // Redirect to signup page with return url
    return <Navigate to="/authentication/sign-up" state={{ from: location }} replace />;
  }

  if (requireEmailVerification && !currentUser.emailVerified) {
    return <Navigate to="/authentication/verify-email" replace />;
  }

  console.log('ProtectedRoute - User authenticated, showing children');
  return <>{children}</>;
};

export default ProtectedRoute;
