import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
// import paths, { rootPaths } from './path';
import ProtectedRoute from 'components/common/ProtectedRoute';

/* ---------------- Lazy loads various components ------------------------- */
const App = lazy(() => import('App'));
const MainLayout = lazy(() => import('layouts/main-layout'));
const AuthLayout = lazy(() => import('layouts/auth-layout'));
const Dashboard = lazy(() => import('pages/dashboard'));
const Spinner = lazy(() => import('components/loading/Splash'));
const LoadingProgress = lazy(() => import('components/loading/LoadingProgress'));

const LoginPage = lazy(() => import('pages/authentication/login'));
const SignUpPage = lazy(() => import('pages/authentication/signup'));
const ForgetPasswordPage = lazy(() => import('pages/authentication/forget-password'));
const ResetPasswordPage = lazy(() => import('pages/authentication/reset-password'));
const VerifyEmailPage = lazy(() => import('pages/authentication/verify-email'));

const ProfilePage = lazy(() => import('pages/profile'));
const UploadsPage = lazy(() => import('pages/uploads'));
const UploadDetailPage = lazy(() => import('pages/uploads/[id]'));

const NotFoundPage = lazy(() => import('pages/not-found'));
/* -------------------------------------------------------------------------- */

/**
 * @Defines the routes for the application using React Router.
 */
export const routes = [
  {
    element: (
      <Suspense fallback={<Spinner />}>
        <App />
      </Suspense>
    ),
    children: [
      {
        path: '/',
        element: <Navigate to="/authentication/sign-up" replace />,
      },
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <MainLayout>
              <Suspense fallback={<LoadingProgress />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: 'transactions',
            element: <Dashboard />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            path: 'uploads',
            element: <UploadsPage />,
          },
          {
            path: 'uploads/:id',
            element: <UploadDetailPage />,
          },
        ],
      },
      {
        path: '/authentication',
        element: <AuthLayout />,
        children: [
          {
            path: 'login',
            element: <LoginPage />,
          },
          {
            path: 'sign-up',
            element: <SignUpPage />,
          },
          {
            path: 'forget-password',
            element: <ForgetPasswordPage />,
          },
          {
            path: 'reset-password',
            element: <ResetPasswordPage />,
          },
          {
            path: 'verify-email',
            element: <VerifyEmailPage />,
          },
        ],
      },
      {
        path: '/error',
        children: [
          {
            path: '404',
            element: <NotFoundPage />,
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/error/404" replace />,
      },
    ],
  },
];

const router = createBrowserRouter(routes, {
  basename: '/',
});

// Debug router
console.log('Router created with basename:', '/');

export default router;
