export const rootPaths = {
  root: '/',
  pagesRoot: '/dashboard',
  authRoot: '/authentication',
  errorRoot: '/error',
};

/**
 * Object containing various paths used in the application.
 */
const paths = {
  default: `${rootPaths.root}`,
  dashboard: `${rootPaths.pagesRoot}`,
  transactions: `${rootPaths.pagesRoot}/transactions`,
  creditCards: `${rootPaths.pagesRoot}/credit-cards`,
  investments: `${rootPaths.pagesRoot}/investments`,
  loans: `${rootPaths.pagesRoot}/loans`,
  accounts: `${rootPaths.pagesRoot}/accounts`,
  profile: `${rootPaths.pagesRoot}/profile`,
  uploads: `${rootPaths.pagesRoot}/uploads`,
  uploadDetail: `${rootPaths.pagesRoot}/uploads/:id`,
  login: `${rootPaths.authRoot}/login`,
  signup: `${rootPaths.authRoot}/sign-up`,
  forgetPassword: `${rootPaths.authRoot}/forget-password`,
  resetPassword: `${rootPaths.authRoot}/reset-password`,
  verifyEmail: `${rootPaths.authRoot}/verify-email`,
  notFound: `${rootPaths.errorRoot}/404`,
};

export default paths;
