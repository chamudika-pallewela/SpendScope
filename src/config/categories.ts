// Category mapping with icons and colors
export const CATEGORY_MAP = {
  'Essential Living Costs': {
    icon: 'material-symbols:home-app-logo',
    color: '#1E88E5',
    subcategories: {
      'Housing & Utilities': [
        'Rent / Mortgage payments',
        'Council Tax',
        'Electricity',
        'Gas',
        'Electricity and Gas',
        'Water',
        'Internet / Telephone / TV',
      ],
      'Food & Household': [
        'Groceries / Supermarkets',
        'Household goods (cleaning, toiletries, etc.)',
        'Dining / Takeaway / Restaurants',
      ],
    },
  },
  'Transport & Travel': {
    icon: 'material-symbols:directions-car',
    color: '#43A047',
    subcategories: {
      'Fuel / Petrol / Diesel': [],
      'Public transport (bus, train, rail, underground)': [],
      'Taxis / Ride-hailing (Uber, PickMe, Bolt, etc.)': [],
      'Vehicle maintenance & insurance': [],
      'Parking fees / tolls': [],
      'Flights / Hotels / Holidays': [],
    },
  },
  'Family & Dependents': {
    icon: 'material-symbols:family-restroom',
    color: '#8E24AA',
    subcategories: {
      'Childcare / Nursery / Babysitting': [],
      'School fees / Tuition': [],
      'Clothing & footwear': [],
      'Healthcare / Medicines / Insurance': [],
      'Elderly care / Family support payments': [],
    },
  },
  'Financial Commitments': {
    icon: 'material-symbols:credit-card',
    color: '#EF6C00',
    subcategories: {
      'Credit card payments': [],
      'Personal loans / HP agreements': [],
      'Overdraft fees': [],
      'Bank charges / Interest': [],
      'Bank transactions': ['Transfer out', 'Cash withdrawal'],
      'Other mortgages / secured loans': [],
    },
  },
  'Lifestyle & Discretionary': {
    icon: 'material-symbols:celebration',
    color: '#D81B60',
    subcategories: {
      Entertainment: [],
      'Subscriptions / Memberships': [],
      'Hobbies & Sports': [],
      Retail: [
        'clothing and fashion',
        'general retail',
        'gifts, postage & stationery',
        'personal technology',
      ],
      'Dining out / Coffee shops': [],
      'Travel & Holidays': [],
    },
  },
  'Income Categories': {
    icon: 'material-symbols:trending-up',
    color: '#4CAF50',
    subcategories: {
      'Salary (PAYE)': [],
      'Self-employment income': [],
      'Rental income': [],
      'Benefits / Government support': ['Universal Credit', 'Child Benefit'],
      'Other recurring income': [],
    },
  },
};

// Subcategory icon mapping
export const SUBCATEGORY_ICONS: Record<string, string> = {
  // Essential Living Costs - Housing & Utilities
  'Housing & Utilities': 'material-symbols:home',
  'Rent / Mortgage payments': 'material-symbols:home',
  'Council Tax': 'material-symbols:account-balance',
  Electricity: 'material-symbols:bolt',
  Gas: 'material-symbols:local-fire-department',
  'Electricity and Gas': 'material-symbols:electrical-services',
  Water: 'material-symbols:water',
  'Internet / Telephone / TV': 'material-symbols:router',

  // Essential Living Costs - Food & Household
  'Food & Household': 'material-symbols:shopping-cart',
  'Groceries / Supermarkets': 'material-symbols:shopping-cart',
  'Household goods (cleaning, toiletries, etc.)': 'material-symbols:cleaning-services',
  'Dining / Takeaway / Restaurants': 'material-symbols:restaurant',

  // Transport & Travel
  'Transport & Travel': 'material-symbols:directions-car',
  'Fuel / Petrol / Diesel': 'material-symbols:local-gas-station',
  'Public transport (bus, train, rail, underground)': 'material-symbols:directions-subway',
  'Taxis / Ride-hailing (Uber, PickMe, Bolt, etc.)': 'material-symbols:local-taxi',
  'Vehicle maintenance & insurance': 'material-symbols:build',
  'Parking fees / tolls': 'material-symbols:local-parking',
  'Flights / Hotels / Holidays': 'material-symbols:flight',

  // Family & Dependents
  'Family & Dependents': 'material-symbols:family-restroom',
  'Childcare / Nursery / Babysitting': 'material-symbols:child-care',
  'School fees / Tuition': 'material-symbols:school',
  'Clothing & footwear': 'material-symbols:checkroom',
  'Healthcare / Medicines / Insurance': 'material-symbols:medical-services',
  'Elderly care / Family support payments': 'material-symbols:diversity-3',

  // Financial Commitments
  'Financial Commitments': 'material-symbols:credit-card',
  'Credit card payments': 'material-symbols:credit-card',
  'Personal loans / HP agreements': 'material-symbols:request-quote',
  'Overdraft fees': 'material-symbols:savings',
  'Bank charges / Interest': 'material-symbols:account-balance',
  'Bank transactions': 'material-symbols:account-balance',
  'Transfer out': 'material-symbols:send',
  'Cash withdrawal': 'material-symbols:atm',
  'Other mortgages / secured loans': 'material-symbols:apartment',

  // Lifestyle & Discretionary
  'Lifestyle & Discretionary': 'material-symbols:celebration',
  Entertainment: 'material-symbols:movie',
  'Subscriptions / Memberships': 'material-symbols:subscriptions',
  'Hobbies & Sports': 'material-symbols:sports-tennis',
  Retail: 'material-symbols:shopping-bag',
  'clothing and fashion': 'material-symbols:checkroom',
  'general retail': 'material-symbols:store',
  'gifts, postage & stationery': 'material-symbols:card-giftcard',
  'personal technology': 'material-symbols:devices',
  'Dining out / Coffee shops': 'material-symbols:local-cafe',
  'Travel & Holidays': 'material-symbols:flight',

  // Income Categories
  'Income Categories': 'material-symbols:trending-up',
  'Salary (PAYE)': 'material-symbols:work',
  'Self-employment income': 'material-symbols:business-center',
  'Rental income': 'material-symbols:store',
  'Benefits / Government support': 'material-symbols:handshake',
  'Universal Credit': 'material-symbols:handshake',
  'Child Benefit': 'material-symbols:child-care',
  'Other recurring income': 'material-symbols:attach-money',
};

export interface Transaction {
  date: string;
  raw_description: string;
  description: string;
  balance: number;
  currency: string;
  bank: string;
  money_in: number | null;
  money_out: number | null;
  category: string;
  subcategory: string;
  subsubcategory: string | null;
  note?: string;
}

export interface TransactionResponse {
  bank: string;
  transactions: Transaction[];
}
