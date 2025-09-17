export const rootPaths = {
  root: '/',
  pagesRoot: '/dashboard/',
  authRoot: '/authentication',
  errorRoot: '/error',
};

/**
 * Object containing various paths used in the application.
 */
const paths = {
  default: `${rootPaths.root}`,
  dashboard: `${rootPaths.pagesRoot}dashboard`,
  transactions: `${rootPaths.pagesRoot}dashboard/transactions`,
  creditCards: `${rootPaths.pagesRoot}dashboard/credit-cards`,
  investments: `${rootPaths.pagesRoot}dashboard/investments`,
  loans: `${rootPaths.pagesRoot}dashboard/loans`,
  accounts: `${rootPaths.pagesRoot}dashboard/accounts`,
  profile: `${rootPaths.pagesRoot}dashboard/profile`,
  uploads: `${rootPaths.pagesRoot}dashboard/uploads`,
  uploadDetail: `${rootPaths.pagesRoot}dashboard/uploads/:id`,
  login: `${rootPaths.authRoot}/login`,
  signup: `${rootPaths.authRoot}/sign-up`,
  forgetPassword: `${rootPaths.authRoot}/forget-password`,
  resetPassword: `${rootPaths.authRoot}/reset-password`,
  verifyEmail: `${rootPaths.authRoot}/verify-email`,
  notFound: `${rootPaths.errorRoot}/404`,
};

export default paths;
