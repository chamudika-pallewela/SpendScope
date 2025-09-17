import { SvgIconProps } from '@mui/material';
import HomeIcon from 'components/icons/menu-icons/HomeIcon';
import UserIcon from 'components/icons/menu-icons/UserIcon';
import TransferIcon from 'components/icons/menu-icons/TransferIcon';
// import paths from 'routes/path';

export enum linkEnum {
  Dashboard = 'dashboard',
  Profile = 'profile',
  Uploads = 'uploads',
  // Transactions = 'transactions',
  // Accounts = 'accounts',
  // Investments = 'investments',
  // Credit = 'credit-cards',
  // Loans = 'loans',
  // Services = 'Services',
  // Setting = 'Setting',
  // Login = 'login',
  // Signup = 'sign-up',
  // ForgetPassword = 'forget-password',
  // ResetPassword = 'reset-password',
}

export interface MenuLinkType {
  id: number;
  title: string;
  link: string;
  icon?: (props: SvgIconProps) => JSX.Element;
  available: boolean;
}
export const menuLinks: MenuLinkType[] = [
  {
    id: 1,
    title: linkEnum.Dashboard,
    link: '/dashboard',
    icon: HomeIcon,
    available: true,
  },
  {
    id: 2,
    title: linkEnum.Profile,
    link: '/dashboard/profile',
    icon: UserIcon,
    available: true,
  },
  {
    id: 3,
    title: linkEnum.Uploads,
    link: '/dashboard/uploads',
    icon: TransferIcon,
    available: true,
  },
  // {
  //   id: 2,
  //   title: linkEnum.Transactions,
  //   link: '#!',
  //   icon: TransferIcon,
  //   available: false,
  // },
  // {
  //   id: 3,
  //   title: linkEnum.Accounts,
  //   link: '#!',
  //   icon: UserIcon,
  //   available: false,
  // },
  // {
  //   id: 4,
  //   title: linkEnum.Investments,
  //   link: '#!',
  //   icon: InvestIcon,
  //   available: false,
  // },
  // {
  //   id: 5,
  //   title: linkEnum.Credit,
  //   link: '#!',
  //   icon: CreditCardIcon,
  //   available: false,
  // },
  // {
  //   id: 6,
  //   title: linkEnum.Loans,
  //   link: '#!',
  //   icon: LoanIcon,
  //   available: false,
  // },
  // {
  //   id: 7,
  //   title: linkEnum.Services,
  //   link: '#!',
  //   icon: ServiceIcon,
  //   available: false,
  // },
  // {
  //   id: 8,
  //   title: linkEnum.Setting,
  //   link: '#!',
  //   icon: SettingsIcon,
  //   available: false,
  // },
  // {
  //   id: 9,
  //   title: linkEnum.Login,
  //   link: '/authentication/login',
  //   icon: SignInIcon,
  //   available: true,
  // },
  // {
  //   id: 10,
  //   title: linkEnum.Signup,
  //   link: '/authentication/sign-up',
  //   icon: SignUpIcon,
  //   available: true,
  // },
];
