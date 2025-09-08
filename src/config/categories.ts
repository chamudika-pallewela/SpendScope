// Category mapping with icons and colors
export const CATEGORY_MAP = {
  "salary": {
    icon: "material-symbols:work",
    color: "#4CAF50",
    subcategories: []
  },
  "other income": {
    icon: "material-symbols:trending-up",
    color: "#2196F3",
    subcategories: [
      "benefits", "cash deposits", "cash back", "e-commerce", "gambling payout",
      "insurance payout", "interest", "loan income", "investments",
      "other income", "payday loan", "pension", "refunded purchase",
      "tax rebate", "transfer"
    ]
  },
  "bank transactions": {
    icon: "material-symbols:account-balance",
    color: "#FF9800",
    subcategories: ["transfer out", "cash withdrawal"]
  },
  "bill": {
    icon: "material-symbols:receipt",
    color: "#F44336",
    subcategories: ["council tax", "mortgage rent", "tv, internet, communication", "utilities", "bank charges"]
  },
  "credit repayment": {
    icon: "material-symbols:credit-card",
    color: "#9C27B0",
    subcategories: []
  },
  "education": {
    icon: "material-symbols:school",
    color: "#3F51B5",
    subcategories: []
  },
  "enjoyment": {
    icon: "material-symbols:celebration",
    color: "#E91E63",
    subcategories: ["entertainment", "food and drink", "gambling", "hobbies and interests", "social activities"]
  },
  "groceries and housekeeping": {
    icon: "material-symbols:shopping-cart",
    color: "#795548",
    subcategories: []
  },
  "health": {
    icon: "material-symbols:health-and-safety",
    color: "#00BCD4",
    subcategories: ["healthcare", "health and beauty", "sports and fitness"]
  },
  "home": {
    icon: "material-symbols:home",
    color: "#8BC34A",
    subcategories: ["furniture and appliance rentals", "family", "home"]
  },
  "insurance": {
    icon: "material-symbols:security",
    color: "#607D8B",
    subcategories: []
  },
  "other expenses": {
    icon: "material-symbols:more-horiz",
    color: "#9E9E9E",
    subcategories: []
  },
  "professional services": {
    icon: "material-symbols:business-center",
    color: "#FF5722",
    subcategories: ["legal", "professional service"]
  },
  "rental": {
    icon: "material-symbols:store",
    color: "#FFC107",
    subcategories: ["clothing and fashion", "general retail", "gifts, postage & stationery", "personal technology"]
  },
  "savings and investments": {
    icon: "material-symbols:savings",
    color: "#4CAF50",
    subcategories: []
  },
  "travel": {
    icon: "material-symbols:flight",
    color: "#00BCD4",
    subcategories: ["transport and travel", "accommodations"]
  }
};

// Subcategory icon mapping
export const SUBCATEGORY_ICONS: Record<string, string> = {
  // Other Income
  "benefits": "material-symbols:handshake",
  "cash deposits": "material-symbols:payments",
  "cash back": "material-symbols:money",
  "e-commerce": "material-symbols:shopping-bag",
  "gambling payout": "material-symbols:casino",
  "insurance payout": "material-symbols:security",
  "interest": "material-symbols:trending-up",
  "loan income": "material-symbols:account-balance-wallet",
  "investments": "material-symbols:trending-up",
  "other income": "material-symbols:attach-money",
  "payday loan": "material-symbols:schedule",
  "pension": "material-symbols:elderly",
  "refunded purchase": "material-symbols:undo",
  "tax rebate": "material-symbols:receipt",
  "transfer": "material-symbols:swap-horiz",

  // Bank Transactions
  "transfer out": "material-symbols:send",
  "cash withdrawal": "material-symbols:atm",

  // Bills
  "council tax": "material-symbols:account-balance",
  "mortgage rent": "material-symbols:home",
  "tv, internet, communication": "material-symbols:router",
  "utilities": "material-symbols:electrical-services",
  "bank charges": "material-symbols:account-balance",

  // Enjoyment
  "entertainment": "material-symbols:movie",
  "food and drink": "material-symbols:restaurant",
  "gambling": "material-symbols:casino",
  "hobbies and interests": "material-symbols:palette",
  "social activities": "material-symbols:groups",

  // Health
  "healthcare": "material-symbols:local-hospital",
  "health and beauty": "material-symbols:face",
  "sports and fitness": "material-symbols:fitness-center",

  // Home
  "furniture and appliance rentals": "material-symbols:chair",
  "family": "material-symbols:family-restroom",
  "home": "material-symbols:home",

  // Professional Services
  "legal": "material-symbols:gavel",
  "professional service": "material-symbols:business-center",

  // Rental/Retail
  "clothing and fashion": "material-symbols:checkroom",
  "general retail": "material-symbols:store",
  "gifts, postage & stationery": "material-symbols:card-giftcard",
  "personal technology": "material-symbols:devices",

  // Travel
  "transport and travel": "material-symbols:directions-car",
  "accommodations": "material-symbols:hotel"
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
  note?: string;
}

export interface TransactionResponse {
  bank: string;
  transactions: Transaction[];
}

