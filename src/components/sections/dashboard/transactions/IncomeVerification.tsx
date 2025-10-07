import {
  Box,
  Stack,
  Typography,
  Grid,
  Chip,
  Link,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Transaction, TransactionResponse } from 'config/categories';
import { useMemo, useState, useEffect } from 'react';
import IconifyIcon from 'components/base/IconifyIcon';

interface CompanyInfo {
  name: string;
  number: string;
  status: string;
  address: string;
  incorporated: string;
  companyUrl: string;
}

interface IncomeVerificationProps {
  transactionData: TransactionResponse;
}

interface TransactionRecord {
  transaction: Transaction;
  category: string;
  subcategory: string;
  subsubcategory: string | null;
  payer: string;
  flags: string[];
  flagExplanations: string[];
  frequency: 'monthly' | 'irregular';
  companyInfo?: {
    name: string;
    number: string;
    status: string;
    address: string;
    incorporated: string;
    companyUrl: string;
  };
}

const isIncomeTransaction = (t: Transaction): boolean => {
  return (t.money_in || 0) > 0 && t.category === 'Income Categories';
};

const getPayer = (t: Transaction): string => {
  return t.description || t.raw_description || 'Unknown';
};

const fetchCompanyInfo = async (companyName: string): Promise<CompanyInfo> => {
  try {
    // Clean the company name for search
    const cleanName = companyName.replace(/FPI|DD|TFR|PAYROLL/i, '').trim();

    // In a real implementation, you would call the Companies House API here
    // For demo purposes, we'll simulate an API call that returns different companies for different payers
    // This would be replaced with actual API call to Companies House

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock API response - return different companies for different payers
    let mockApiResponse;

    if (cleanName.toLowerCase().includes('velu')) {
      mockApiResponse = {
        name: 'AHTHAVANN VELU LTD',
        number: '10438364',
        status: 'Active',
        address: '72 Hebdon Road, London, United Kingdom, SW17 7NN',
        incorporated: '20 October 2016',
        companyUrl:
          'https://find-and-update.company-information.service.gov.uk/search?q=AHTHAVANN+VELU+LTD',
      };
    } else if (cleanName.toLowerCase().includes('kamaraj')) {
      mockApiResponse = {
        name: 'KAMARAJ ENTERPRISES LTD',
        number: 'N/A',
        status: 'Active',
        address: '456 Commerce Road, Manchester, M1 1AA',
        incorporated: '19 March 2019',
        companyUrl:
          'https://find-and-update.company-information.service.gov.uk/search?q=KAMARAJ+ENTERPRISES',
      };
    } else if (
      cleanName.toLowerCase().includes('loyd') ||
      cleanName.toLowerCase().includes('broad')
    ) {
      // Handle LOYD 1-3 THE BROAD specifically
      mockApiResponse = {
        name: 'LOYD PROPERTY MANAGEMENT LTD',
        number: 'N/A',
        status: 'Active',
        address: '1-3 The Broad, London, United Kingdom, SW1A 1AA',
        incorporated: '15 March 2018',
        companyUrl:
          'https://find-and-update.company-information.service.gov.uk/search?q=LOYD+PROPERTY+MANAGEMENT',
      };
    } else if (cleanName.toLowerCase().includes('brandvale')) {
      mockApiResponse = {
        name: 'BRANDVALE PROPERTIES LTD',
        number: 'N/A',
        status: 'Active',
        address: '123 Property Street, London, United Kingdom, SW1A 1AA',
        incorporated: '10 January 2017',
        companyUrl:
          'https://find-and-update.company-information.service.gov.uk/search?q=BRANDVALE+PROPERTIES',
      };
    } else if (cleanName.toLowerCase().includes('stanhill')) {
      mockApiResponse = {
        name: 'STANHILL COURT HOTEL LTD',
        number: 'N/A',
        status: 'Active',
        address: 'Stanhill Court, Surrey, United Kingdom, RH1 1AA',
        incorporated: '22 May 2019',
        companyUrl:
          'https://find-and-update.company-information.service.gov.uk/search?q=STANHILL+COURT+HOTEL',
      };
    } else if (
      cleanName.toLowerCase().includes('thamilarasan') ||
      cleanName.toLowerCase().includes('thamilara')
    ) {
      mockApiResponse = {
        name: 'THAMILARASAN ENTERPRISES LTD',
        number: 'N/A',
        status: 'Active',
        address: '789 Business Park, London, United Kingdom, SW1A 1AA',
        incorporated: '12 April 2020',
        companyUrl:
          'https://find-and-update.company-information.service.gov.uk/search?q=THAMILARASAN+ENTERPRISES',
      };
    } else if (
      cleanName.toLowerCase().includes('muthulaks') ||
      cleanName.toLowerCase().includes('muthulak')
    ) {
      mockApiResponse = {
        name: 'MUTHULAKS TRADING LTD',
        number: 'N/A',
        status: 'Active',
        address: '456 Trading Street, Manchester, United Kingdom, M1 1AA',
        incorporated: '08 September 2021',
        companyUrl:
          'https://find-and-update.company-information.service.gov.uk/search?q=MUTHULAKS+TRADING',
      };
    } else if (
      cleanName.toLowerCase().includes('godwin') ||
      cleanName.toLowerCase().includes('selvad')
    ) {
      mockApiResponse = {
        name: 'GODWIN SELVAD CONSULTING LTD',
        number: 'N/A',
        status: 'Active',
        address: '321 Consulting Avenue, Birmingham, United Kingdom, B1 1AA',
        incorporated: '15 November 2019',
        companyUrl:
          'https://find-and-update.company-information.service.gov.uk/search?q=GODWIN+SELVAD+CONSULTING',
      };
    } else {
      // For other payers, create a realistic company but don't link to fake Companies House entries
      mockApiResponse = {
        name: `${cleanName.toUpperCase()} LIMITED`,
        number: 'N/A',
        status: 'Active',
        address: '789 Corporate Avenue, Birmingham, B1 1AA',
        incorporated: '10 June 2021',
        companyUrl: 'https://find-and-update.company-information.service.gov.uk/search', // Link to search instead
      };
    }

    return mockApiResponse;
  } catch (error) {
    console.error('Error fetching company info:', error);
    // Return a fallback company info object instead of null
    return {
      name: 'COMPANY NOT FOUND',
      number: 'N/A',
      status: 'Unknown',
      address: 'Address not available',
      incorporated: 'Date not available',
      companyUrl: 'https://find-and-update.company-information.service.gov.uk/search',
    };
  }
};

const IncomeVerification = ({ transactionData }: IncomeVerificationProps) => {
  const [companyData, setCompanyData] = useState<Map<string, CompanyInfo>>(new Map());
  const [transactionRecords, setTransactionRecords] = useState<TransactionRecord[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const incomeTransactions = useMemo<Transaction[]>(() => {
    const incomeTx = transactionData.transactions.filter(isIncomeTransaction);
    console.log('Total income transactions found:', incomeTx.length);
    return incomeTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactionData.transactions]);

  // Function to analyze individual transaction and generate flags with explanations
  const analyzeTransaction = (
    transaction: Transaction,
  ): { flags: string[]; explanations: string[]; frequency: 'monthly' | 'irregular' } => {
    const flags: string[] = [];
    const explanations: string[] = [];
    const payer = getPayer(transaction);
    const amount = transaction.money_in || 0;
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Get all transactions from the same payer
    const samePayerTransactions = incomeTransactions.filter((t) => getPayer(t) === payer);

    // Analyze frequency pattern
    const byMonth = new Map<string, number>();
    samePayerTransactions.forEach((t) => {
      const tDate = new Date(t.date);
      const tMonthKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(tMonthKey, (byMonth.get(tMonthKey) || 0) + (t.money_in || 0));
    });

    const months = Array.from(byMonth.keys()).sort();
    let isMonthly = false;

    if (months.length >= 3) {
      isMonthly = true;
      for (let i = 1; i < months.length; i++) {
        const [y1, m1] = months[i - 1].split('-').map(Number);
        const [y2, m2] = months[i].split('-').map(Number);
        const gap = (y2 - y1) * 12 + (m2 - m1);
        if (gap > 1) {
          isMonthly = false;
          break;
        }
      }
    }

    // Flag 1: Frequency analysis - Monthly vs Irregular
    if (months.length >= 2) {
      if (isMonthly) {
        flags.push(`Regular monthly income pattern`);
        explanations.push(
          `This income source shows a consistent monthly pattern with payments occurring every month. This indicates stable employment or recurring income.`,
        );
      } else {
        flags.push(`Irregular income pattern`);
        explanations.push(
          `This income source does not follow a consistent monthly schedule. Payments are irregular, which may indicate freelance work, bonuses, or one-time payments.`,
        );
      }
    }

    // Flag 2: Multiple transactions from same payer in same month
    const samePayerSameMonth = samePayerTransactions.filter((t) => {
      const tDate = new Date(t.date);
      const tMonthKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
      return tMonthKey === monthKey;
    });

    if (samePayerSameMonth.length > 1) {
      flags.push(`Multiple payments from ${payer} in ${monthKey}`);
      explanations.push(
        `This payer made ${samePayerSameMonth.length} payments in ${monthKey}. This could indicate multiple salary payments, bonuses, or irregular payment patterns.`,
      );
    }

    // Flag 3: Significant amount increase compared to previous months
    if (samePayerTransactions.length > 1) {
      const previousAmounts = samePayerTransactions
        .filter((t) => new Date(t.date) < date)
        .map((t) => t.money_in || 0);

      if (previousAmounts.length > 0) {
        const avgPreviousAmount =
          previousAmounts.reduce((sum, amount) => sum + amount, 0) / previousAmounts.length;

        if (amount >= 2 * avgPreviousAmount && avgPreviousAmount > 0) {
          const increasePercent = Math.round(
            ((amount - avgPreviousAmount) / avgPreviousAmount) * 100,
          );
          flags.push(`Significant increase: ${increasePercent}% higher than average`);
          explanations.push(
            `This payment of ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)} is ${increasePercent}% higher than the average of ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(avgPreviousAmount)} from previous months. This could indicate a salary increase, bonus, or irregular payment.`,
          );
        }
      }
    }

    // Flag 4: Very high amount (potential outlier)
    const allAmounts = incomeTransactions.map((t) => t.money_in || 0);
    const avgAllAmounts = allAmounts.reduce((sum, amount) => sum + amount, 0) / allAmounts.length;
    if (amount >= 3 * avgAllAmounts && avgAllAmounts > 0) {
      flags.push(`Unusually high amount`);
      explanations.push(
        `This payment of ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)} is significantly higher than the average income transaction of ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(avgAllAmounts)}. This may require additional verification.`,
      );
    }

    // Flag 5: Multiple salary payers (for salary transactions)
    if (transaction.subcategory === 'Salary (PAYE)') {
      const salaryPayers = new Set<string>();
      incomeTransactions.forEach((t) => {
        if (t.subcategory === 'Salary (PAYE)') {
          salaryPayers.add(getPayer(t));
        }
      });
      if (salaryPayers.size > 1) {
        flags.push(`Multiple salary sources detected`);
        explanations.push(
          `Multiple salary payers detected: ${Array.from(salaryPayers).join(', ')}. This could indicate multiple jobs or employment changes.`,
        );
      }
    }

    // Flag 6: Weekend or unusual timing
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      flags.push(`Weekend payment`);
      explanations.push(
        `This payment was made on a weekend (${date.toLocaleDateString('en-GB', { weekday: 'long' })}), which is unusual for regular salary payments.`,
      );
    }

    // Flag 7: Very recent transaction (within last 7 days)
    const daysSinceTransaction = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceTransaction <= 7) {
      flags.push(`Recent transaction`);
      explanations.push(
        `This payment was made ${daysSinceTransaction} day${daysSinceTransaction === 1 ? '' : 's'} ago, which is very recent and may not reflect regular income patterns.`,
      );
    }

    return { flags, explanations, frequency: isMonthly ? 'monthly' : 'irregular' };
  };

  // Process individual transactions and fetch company info
  useEffect(() => {
    const processTransactions = async () => {
      const records: TransactionRecord[] = [];
      const processedPayers = new Set<string>();

      for (const transaction of incomeTransactions) {
        const payer = getPayer(transaction);
        const key = `${transaction.subcategory}-${payer}`;

        // Analyze transaction for flags
        const { flags, explanations, frequency } = analyzeTransaction(transaction);

        let companyInfo: CompanyInfo | undefined;

        // Fetch company info for salary transactions
        if (transaction.subcategory === 'Salary (PAYE)' && !processedPayers.has(payer)) {
          if (!companyData.has(key)) {
            const info = await fetchCompanyInfo(payer);
            setCompanyData((prev) => new Map(prev).set(key, info));
          }

          companyInfo = companyData.get(key) || (await fetchCompanyInfo(payer));
          processedPayers.add(payer);
        }

        records.push({
          transaction,
          category: transaction.category,
          subcategory: transaction.subcategory,
          subsubcategory: transaction.subsubcategory,
          payer,
          flags,
          flagExplanations: explanations,
          frequency,
          companyInfo,
        });
      }

      setTransactionRecords(records);
    };

    if (incomeTransactions.length > 0) {
      processTransactions();
    }
  }, [incomeTransactions]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

  const handleTransactionClick = (record: TransactionRecord) => {
    setSelectedTransaction(record);
    setShowDetails(true);
  };

  const getTransactionDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Function to determine if payer is a person's name (first name + last name pattern)
  const isPersonName = (payer: string): boolean => {
    const originalPayer = payer.toUpperCase();

    // First check for obvious non-person indicators
    const nonPersonIndicators = [
      'CLUB',
      'LLOYDS',
      'BANK',
      'BANKING',
      'FINANCIAL',
      'CREDIT',
      'LOAN',
      'MORTGAGE',
      'INTEREST',
      'GROSS',
      'NET',
      'TAX',
      'VAT',
      'PAYMENT',
      'TRANSFER',
      'DEPOSIT',
      'WITHDRAWAL',
      'REFUND',
      'CASHBACK',
      'REWARD',
      'BONUS',
      'DIVIDEND',
      'INVESTMENT',
      'PENSION',
      'INSURANCE',
      'PREMIUM',
      'CLAIM',
      'SETTLEMENT',
      'ADJUSTMENT',
      'WAIVED',
      'CHARGED',
      'FEE',
      'COMMISSION',
      'SERVICE',
      'MAINTENANCE',
      'SUBSCRIPTION',
      'MEMBERSHIP',
      'RENTAL',
      'LEASE',
      'UTILITY',
      'BILL',
      'GOVERNMENT',
      'HMRC',
      'DWP',
      'BENEFIT',
      'ALLOWANCE',
      'GRANT',
      'SALARY',
      'WAGE',
      'PAYROLL',
      'EMPLOYMENT',
      'JOB',
      'WORK',
      'BUSINESS',
      'ENTERPRISE',
      'COMPANY',
      'CORPORATION',
      'ORGANIZATION',
      'LTD',
      'LIMITED',
      'INC',
      'INCORPORATED',
      'CORP',
      'LLC',
      'PLC',
      'GROUP',
      'HOLDINGS',
      'ENTERPRISES',
      'TRADING',
      'SERVICES',
      'SOLUTIONS',
      'SYSTEMS',
      'TECHNOLOGIES',
      'INTERNATIONAL',
      'GLOBAL',
      'WORLDWIDE',
      'ACCOUNT',
      'CARD',
      'DEBIT',
      'CREDIT',
      'OVERDRAFT',
      'LOAN',
      'SAVINGS',
      'CURRENT',
      'BUSINESS',
      'PERSONAL',
      'JOINT',
      // Business types and locations
      'HOTEL',
      'COURT',
      'HOT',
      'RESTAURANT',
      'CAFE',
      'SHOP',
      'STORE',
      'MARKET',
      'CENTER',
      'CENTRE',
      'PARK',
      'SQUARE',
      'STREET',
      'ROAD',
      'AVENUE',
      'LANE',
      'BUILDING',
      'TOWER',
      'PLAZA',
      'MALL',
      'SHOPPING',
      'RETAIL',
      'OUTLET',
      'OFFICE',
      'SUITE',
      'FLOOR',
      'LEVEL',
      'UNIT',
      'BLOCK',
      'WING',
      'MANAGEMENT',
      'PROPERTY',
      'REAL',
      'ESTATE',
      'DEVELOPMENT',
      'CONSTRUCTION',
      'HOSPITAL',
      'CLINIC',
      'MEDICAL',
      'HEALTH',
      'CARE',
      'CENTER',
      'CENTRE',
      'SCHOOL',
      'COLLEGE',
      'UNIVERSITY',
      'ACADEMY',
      'INSTITUTE',
      'EDUCATION',
      'MUSEUM',
      'GALLERY',
      'THEATER',
      'THEATRE',
      'CINEMA',
      'STADIUM',
      'ARENA',
      'SPORTS',
      'FITNESS',
      'GYM',
      'POOL',
      'SWIMMING',
      'TENNIS',
      'GOLF',
      'CHURCH',
      'TEMPLE',
      'MOSQUE',
      'SYNAGOGUE',
      'CATHEDRAL',
      'CHAPEL',
      'STATION',
      'TERMINAL',
      'AIRPORT',
      'HARBOR',
      'HARBOUR',
      'PORT',
      'GARDEN',
      'PARK',
      'ZOO',
      'AQUARIUM',
      'BOTANICAL',
      'NATURE',
      'LIBRARY',
      'MUSEUM',
      'ARCHIVE',
      'RECORDS',
      'DATA',
      'INFORMATION',
      'TECHNOLOGY',
      'SOFTWARE',
      'HARDWARE',
      'COMPUTER',
      'DIGITAL',
      'ONLINE',
      'MEDIA',
      'NEWS',
      'PRESS',
      'PUBLISHING',
      'BROADCAST',
      'TELEVISION',
      'RADIO',
      'INTERNET',
      'WEBSITE',
      'DOMAIN',
      'HOSTING',
      'SERVER',
      'SECURITY',
      'PROTECTION',
      'INSURANCE',
      'LEGAL',
      'LAW',
      'ATTORNEY',
      'CONSULTING',
      'ADVISORY',
      'PROFESSIONAL',
      'EXPERT',
      'SPECIALIST',
      'RESEARCH',
      'DEVELOPMENT',
      'INNOVATION',
      'CREATIVE',
      'DESIGN',
      'MARKETING',
      'ADVERTISING',
      'PROMOTION',
      'SALES',
      'RETAIL',
      'DISTRIBUTION',
      'LOGISTICS',
      'TRANSPORT',
      'SHIPPING',
      'DELIVERY',
      'MANUFACTURING',
      'PRODUCTION',
      'FACTORY',
      'PLANT',
      'FACILITY',
      'WAREHOUSE',
      'STORAGE',
      'DEPOT',
      'YARD',
      'SITE',
      'LOCATION',
      'FPI',
      'DD',
      'TFR',
      'PAYROLL',
      'SALARY',
      'WAGE',
      'PAY',
    ];

    // Check if the payer contains any non-person indicators
    const hasNonPersonIndicator = nonPersonIndicators.some((indicator) =>
      originalPayer.includes(indicator),
    );

    if (hasNonPersonIndicator) {
      return false; // It's not a person
    }

    // Remove common suffixes and clean the name for further analysis
    const cleanName = payer
      .replace(/\b(LTD|LIMITED|INC|INCORPORATED|CORP|CORPORATION|LLC|PLC|COMPANY|CO)\b/gi, '')
      .replace(/\b(FPI|DD|TFR|PAYROLL|SALARY|WAGE|PAY)\b/gi, '')
      .replace(/\b\d{2}[A-Z]{3}\d{2}\b/g, '') // Remove date patterns
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '') // Remove date patterns
      .replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, '') // Remove date patterns
      .replace(/\b\d{2}\.\d{2}\.\d{4}\b/g, '') // Remove date patterns
      .replace(/\b\d{8}\b/g, '') // Remove 8-digit numbers
      .replace(/\b[A-Z]{2,}\d{4,}\b/g, '') // Remove alphanumeric codes
      .replace(/\b\d{4,}[A-Z]{2,}\b/g, '') // Remove alphanumeric codes
      .replace(/\b(REF|REFERENCE|ID|CODE|NO|NUMBER)\b/gi, '') // Remove reference indicators
      .replace(/\b\d+\b/g, '') // Remove remaining numbers
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    // Split into words and check if it looks like a person's name
    const words = cleanName.split(' ').filter((word) => word.length > 1);

    // Must have exactly 2-3 words to be considered a person's name
    if (words.length < 2 || words.length > 3) {
      return false;
    }

    // Check if words contain only letters (no numbers or special characters)
    const allWordsAreLetters = words.every((word) => /^[A-Za-z]+$/.test(word));

    if (!allWordsAreLetters) {
      return false;
    }

    // Check for common first names and last names patterns
    const commonFirstNames = [
      'john',
      'jane',
      'michael',
      'sarah',
      'david',
      'emma',
      'james',
      'lisa',
      'robert',
      'mary',
      'william',
      'jennifer',
      'richard',
      'linda',
      'charles',
      'elizabeth',
      'thomas',
      'barbara',
      'christopher',
      'susan',
      'daniel',
      'jessica',
      'matthew',
      'sarah',
      'anthony',
      'helen',
      'mark',
      'patricia',
      'donald',
      'debra',
      'steven',
      'dorothy',
      'paul',
      'lisa',
      'andrew',
      'nancy',
      'joshua',
      'karen',
      'kenneth',
      'betty',
      'kevin',
      'helen',
      'brian',
      'sandra',
      'george',
      'donna',
      'timothy',
      'carol',
      'ronald',
      'ruth',
      'jason',
      'sharon',
      'edward',
      'michelle',
      'jeffrey',
      'laura',
      'ryan',
      'sarah',
      'jacob',
      'kimberly',
      'gary',
      'deborah',
      'nicholas',
      'donna',
      'jonathan',
      'cynthia',
      'stephen',
      'rachel',
      'jerry',
      'carolyn',
      'tyler',
      'janet',
      'sean',
      'virginia',
      'eric',
      'maria',
      'jordan',
      'heather',
      'adam',
      'diane',
      'nathan',
      'julie',
      'zachary',
      'joyce',
      'kyle',
      'victoria',
      'noah',
      'judith',
      'brandon',
      'martha',
      'benjamin',
      'cheryl',
      'samuel',
      'frances',
      'logan',
      'gloria',
      'alexander',
      'rose',
      'patrick',
      'janice',
      'jack',
      'jean',
      'dennis',
      'alice',
      'jerry',
      'madison',
      'walter',
      'marilyn',
      'alan',
      'katherine',
      'wayne',
      'lois',
      'roy',
      'jane',
      'ralph',
      'lillian',
      'eugene',
      'phyllis',
      'arthur',
      'robin',
      'louis',
      'gloria',
      'harry',
      'tina',
      'lawrence',
      'sandra',
      'jeremy',
      'donna',
      'eugene',
      'carol',
      'wayne',
      'janet',
    ];

    const commonLastNames = [
      'smith',
      'johnson',
      'williams',
      'brown',
      'jones',
      'garcia',
      'miller',
      'davis',
      'rodriguez',
      'martinez',
      'hernandez',
      'lopez',
      'gonzalez',
      'wilson',
      'anderson',
      'thomas',
      'taylor',
      'moore',
      'jackson',
      'martin',
      'lee',
      'perez',
      'thompson',
      'white',
      'harris',
      'sanchez',
      'clark',
      'ramirez',
      'lewis',
      'robinson',
      'walker',
      'young',
      'allen',
      'king',
      'wright',
      'scott',
      'torres',
      'nguyen',
      'hill',
      'flores',
      'green',
      'adams',
      'nelson',
      'baker',
      'hall',
      'rivera',
      'campbell',
      'mitchell',
      'carter',
      'roberts',
      'gomez',
      'phillips',
      'evans',
      'turner',
      'diaz',
      'parker',
      'cruz',
      'edwards',
      'collins',
      'reyes',
      'stewart',
      'morris',
      'morales',
      'murphy',
      'cook',
      'rogers',
      'gutierrez',
      'ortiz',
      'morgan',
      'cooper',
      'peterson',
      'bailey',
      'reed',
      'kelly',
      'howard',
      'ramos',
      'kim',
      'cox',
      'ward',
      'richardson',
      'watson',
      'brooks',
      'chavez',
      'wood',
      'james',
      'bennett',
      'gray',
      'mendoza',
      'ruiz',
      'hughes',
      'price',
      'alvarez',
      'castillo',
      'sanders',
      'patel',
      'myers',
      'long',
      'ross',
      'foster',
      'jimenez',
      'powell',
      'jenkins',
      'perry',
      'russell',
      'sullivan',
      'bell',
      'coleman',
      'butler',
      'henderson',
      'barnes',
      'gonzales',
      'fisher',
      'vasquez',
      'simmons',
      'romero',
      'jordan',
      'patterson',
      'alexander',
      'hamilton',
      'graham',
      'reynolds',
      'griffin',
      'wallace',
      'moreno',
      'west',
      'cole',
      'hayes',
      'bryant',
      'herrera',
      'gibson',
      'ellis',
      'tran',
      'medina',
      'aguilar',
      'stevens',
      'murray',
      'ford',
      'castro',
      'marshall',
      'owens',
      'harrison',
      'fernandez',
      'mcdonald',
    ];

    // Check if the first word looks like a first name and second word looks like a last name
    const firstWord = words[0].toLowerCase();
    const lastWord = words[1].toLowerCase();

    const looksLikeFirstName =
      commonFirstNames.includes(firstWord) ||
      (firstWord.length >= 3 && /^[A-Za-z]+$/.test(firstWord));
    const looksLikeLastName =
      commonLastNames.includes(lastWord) || (lastWord.length >= 3 && /^[A-Za-z]+$/.test(lastWord));

    // If it has 2 words and both look like names, it's likely a person
    if (words.length === 2 && looksLikeFirstName && looksLikeLastName) {
      return true;
    }

    // If it has 3 words, check if first two look like names
    if (words.length === 3) {
      const middleWord = words[1].toLowerCase();
      const looksLikeMiddleName = /^[A-Za-z]+$/.test(middleWord) && middleWord.length >= 2;
      if (looksLikeFirstName && looksLikeMiddleName && looksLikeLastName) {
        return true;
      }
    }

    return false;
  };

  return (
    <Box sx={{ mt: 2, height: '100%', display: 'flex' }}>
      <Box
        sx={{
          flex: 1,
          border: '1px solid',
          borderColor: 'grey.200',
          backgroundColor: 'common.white',
          borderRadius: 2,
          p: { xs: 2, sm: 3 },
        }}
      >
        <Stack spacing={2}>
          <Typography
            sx={{
              fontSize: { xs: 'body2.fontSize', md: 'h6.fontSize' },
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            Income Verification
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              We analyze your income patterns to verify financial stability and identify any
              concerns:
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconifyIcon
                    icon="material-symbols:search"
                    sx={{ fontSize: 16, color: 'primary.main' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Identify main income sources
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconifyIcon
                    icon="material-symbols:schedule"
                    sx={{ fontSize: 16, color: 'success.main' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Confirm regularity
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconifyIcon
                    icon="material-symbols:warning"
                    sx={{ fontSize: 16, color: 'warning.main' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Flag irregularities
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconifyIcon
                    icon="material-symbols:analytics"
                    sx={{ fontSize: 16, color: 'info.main' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Compare monthly averages
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Income Summary */}
          <Box
            sx={{
              p: 2,
              backgroundColor: 'grey.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200',
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              📊 Income Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {transactionRecords.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Transactions
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {transactionRecords.filter((t) => t.flags.length === 0).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Clean Transactions
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {transactionRecords.filter((t) => t.flags.length > 0).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Flagged Transactions
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {fmt(
                      transactionRecords.reduce((sum, t) => sum + (t.transaction.money_in || 0), 0),
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Income
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* <Box sx={{ border: '1px dashed', borderColor: 'grey.200', borderRadius: 1, p: { xs: 1.5, sm: 2 }, backgroundColor: 'grey.50' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="text.secondary">Main income sources</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{kpis.mainSources}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">Regular</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{kpis.regularCount}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">Irregular</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{kpis.irregularCount}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">Sudden increases</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{kpis.suddenFlags}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">Avg monthly income</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{fmt(kpis.avgMonthlyIncome)}</Typography>
              </Grid>
            </Grid>
          </Box> */}

          <Stack spacing={2}>
            {transactionRecords.length === 0 && incomeTransactions.length > 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                  Processing transactions...
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {transactionRecords.map((record, idx) => (
                  <Grid
                    item
                    xs={12}
                    md={6}
                    key={`${record.payer}-${record.transaction.date}-${idx}`}
                  >
                    <Box
                      onClick={() => handleTransactionClick(record)}
                      sx={{
                        border: '1px solid',
                        borderColor: record.flags.length > 0 ? 'warning.300' : 'grey.300',
                        borderRadius: 2,
                        p: { xs: 2, sm: 2.5 },
                        backgroundColor: 'common.white',
                        height: '100%',
                        boxShadow:
                          record.flags.length > 0
                            ? '0 2px 8px rgba(255,152,0,0.1)'
                            : '0 2px 8px rgba(0,0,0,0.08)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow:
                            record.flags.length > 0
                              ? '0 4px 16px rgba(255,152,0,0.15)'
                              : '0 4px 16px rgba(0,0,0,0.12)',
                          transform: 'translateY(-2px)',
                          borderColor: record.flags.length > 0 ? 'warning.main' : 'primary.main',
                        },
                      }}
                    >
                      <Stack spacing={1.5} sx={{ height: '100%' }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {record.subcategory}
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            {record.flags.length > 0 && (
                              <Chip
                                label={`${record.flags.length} Flag${record.flags.length > 1 ? 's' : ''}`}
                                color="warning"
                                size="small"
                                icon={<IconifyIcon icon="material-symbols:warning" />}
                              />
                            )}
                            <Chip
                              label={record.frequency === 'monthly' ? 'Monthly' : 'Irregular'}
                              color={record.frequency === 'monthly' ? 'success' : 'warning'}
                              size="small"
                            />
                            <Chip
                              label={getTransactionDate(record.transaction.date)}
                              color="info"
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        </Stack>

                        <Stack spacing={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            {isPersonName(record.payer) ? 'Payer' : 'Employer'}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {record.payer}
                          </Typography>

                          {record.subcategory === 'Salary (PAYE)' && record.companyInfo && (
                            <Box
                              sx={{
                                mt: 1,
                                p: 1.5,
                                backgroundColor: 'primary.50',
                                borderRadius: 1.5,
                                border: '1px solid',
                                borderColor: 'primary.200',
                              }}
                            >
                              <Stack spacing={0.5}>
                                <Typography
                                  variant="caption"
                                  color="primary.main"
                                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                >
                                  🏢 {record.companyInfo.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontSize: '0.7rem' }}
                                >
                                  #{record.companyInfo.number} • {record.companyInfo.status}
                                </Typography>
                              </Stack>
                            </Box>
                          )}
                        </Stack>

                        <Stack spacing={1}>
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mb: 0.5 }}
                            >
                              Amount
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 700, color: 'success.main' }}
                            >
                              {fmt(record.transaction.money_in || 0)}
                            </Typography>
                          </Box>

                          {record.flags.length > 0 && (
                            <Box
                              sx={{
                                p: 1.5,
                                backgroundColor: 'warning.50',
                                borderRadius: 1.5,
                                border: '1px solid',
                                borderColor: 'warning.200',
                              }}
                            >
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                <IconifyIcon
                                  icon="material-symbols:warning"
                                  sx={{ fontSize: 16, color: 'warning.main' }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{ fontWeight: 600, color: 'warning.main' }}
                                >
                                  Flags Detected
                                </Typography>
                              </Stack>
                              <Stack spacing={0.5}>
                                {record.flags.slice(0, 2).map((flag, flagIdx) => (
                                  <Typography
                                    key={flagIdx}
                                    variant="caption"
                                    color="warning.dark"
                                    sx={{ display: 'block', fontSize: '0.75rem' }}
                                  >
                                    • {flag}
                                  </Typography>
                                ))}
                                {record.flags.length > 2 && (
                                  <Typography
                                    variant="caption"
                                    color="warning.dark"
                                    sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}
                                  >
                                    +{record.flags.length - 2} more...
                                  </Typography>
                                )}
                              </Stack>
                            </Box>
                          )}

                          {record.flags.length === 0 && (
                            <Box
                              sx={{
                                p: 1,
                                backgroundColor: 'success.50',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'success.200',
                              }}
                            >
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <IconifyIcon
                                  icon="material-symbols:check-circle"
                                  sx={{ fontSize: 14, color: 'success.main' }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{ fontWeight: 600, color: 'success.main' }}
                                >
                                  No Issues Detected
                                </Typography>
                              </Stack>
                            </Box>
                          )}
                        </Stack>
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
            {incomeTransactions.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No income transactions detected.
              </Typography>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Detailed Transaction Modal */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        {selectedTransaction && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedTransaction.subcategory}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isPersonName(selectedTransaction.payer) ? 'Payer' : 'Employer'}:{' '}
                    {selectedTransaction.payer}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  {selectedTransaction.flags.length > 0 && (
                    <Chip
                      label={`${selectedTransaction.flags.length} Flag${selectedTransaction.flags.length > 1 ? 's' : ''}`}
                      color="warning"
                      size="small"
                      icon={<IconifyIcon icon="material-symbols:warning" />}
                    />
                  )}
                  <Chip
                    label={selectedTransaction.frequency === 'monthly' ? 'Monthly' : 'Irregular'}
                    color={selectedTransaction.frequency === 'monthly' ? 'success' : 'warning'}
                    size="small"
                  />
                  <Chip
                    label={getTransactionDate(selectedTransaction.transaction.date)}
                    color="info"
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </Stack>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
              <Stack spacing={3}>
                {/* Transaction Details */}
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: 'grey.50',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Transaction Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Amount
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {fmt(selectedTransaction.transaction.money_in || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {new Date(selectedTransaction.transaction.date).toLocaleDateString('en-GB')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Category
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedTransaction.subcategory}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color:
                            selectedTransaction.flags.length === 0
                              ? 'success.main'
                              : 'warning.main',
                        }}
                      >
                        {selectedTransaction.flags.length === 0 ? 'Clean' : 'Flagged'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Frequency Analysis */}
                <Box
                  sx={{
                    p: 2,
                    backgroundColor:
                      selectedTransaction.frequency === 'monthly' ? 'success.50' : 'warning.50',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor:
                      selectedTransaction.frequency === 'monthly' ? 'success.200' : 'warning.200',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <IconifyIcon
                      icon={
                        selectedTransaction.frequency === 'monthly'
                          ? 'material-symbols:check-circle'
                          : 'material-symbols:schedule'
                      }
                      sx={{
                        fontSize: 18,
                        color:
                          selectedTransaction.frequency === 'monthly'
                            ? 'success.main'
                            : 'warning.main',
                      }}
                    />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color:
                          selectedTransaction.frequency === 'monthly'
                            ? 'success.main'
                            : 'warning.main',
                      }}
                    >
                      Frequency Analysis
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTransaction.frequency === 'monthly'
                      ? 'This income source shows a consistent monthly pattern with payments occurring every month. This indicates stable employment or recurring income.'
                      : 'This income source does not follow a consistent monthly schedule. Payments are irregular, which may indicate freelance work, bonuses, or one-time payments.'}
                  </Typography>
                </Box>

                {/* Company Information */}
                {selectedTransaction.subcategory === 'Salary (PAYE)' &&
                  selectedTransaction.companyInfo && (
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: 'primary.50',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'primary.200',
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <IconifyIcon
                          icon="material-symbols:business"
                          sx={{ fontSize: 18, color: 'primary.main' }}
                        />
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, color: 'primary.main' }}
                        >
                          Company Information
                        </Typography>
                      </Stack>
                      <Stack spacing={1}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {selectedTransaction.companyInfo.name}
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          <Typography variant="caption" color="text.secondary">
                            #{selectedTransaction.companyInfo.number}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="success.main"
                            sx={{ fontWeight: 600 }}
                          >
                            {selectedTransaction.companyInfo.status}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          📍 {selectedTransaction.companyInfo.address}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          📅 Incorporated: {selectedTransaction.companyInfo.incorporated}
                        </Typography>
                        <Link
                          href={selectedTransaction.companyInfo.companyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            color: 'primary.main',
                            fontWeight: 500,
                            display: 'inline-block',
                            mt: 1,
                          }}
                        >
                          View on Companies House →
                        </Link>
                      </Stack>
                    </Box>
                  )}

                {/* Flags Explanation */}
                {selectedTransaction.flags.length > 0 && (
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: 'warning.50',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'warning.200',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <IconifyIcon
                        icon="material-symbols:warning"
                        sx={{ fontSize: 18, color: 'warning.main' }}
                      />
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, color: 'warning.main' }}
                      >
                        Why This Transaction Was Flagged
                      </Typography>
                    </Stack>
                    <Stack spacing={1.5}>
                      {selectedTransaction.flags.map((flag, idx) => (
                        <Box key={idx}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: 'warning.dark', mb: 0.5 }}
                          >
                            {flag}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: '0.9rem' }}
                          >
                            {selectedTransaction.flagExplanations[idx]}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* No Flags Message */}
                {selectedTransaction.flags.length === 0 && (
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: 'success.50',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'success.200',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <IconifyIcon
                        icon="material-symbols:check-circle"
                        sx={{ fontSize: 18, color: 'success.main' }}
                      />
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, color: 'success.main' }}
                      >
                        No Issues Detected
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      This transaction appears to be normal with no irregularities detected. It
                      follows expected patterns for this type of income.
                    </Typography>
                  </Box>
                )}

                {/* Transaction Description */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Transaction Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTransaction.transaction.description ||
                      selectedTransaction.transaction.raw_description ||
                      'No description available'}
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2, pt: 1 }}>
              <Button
                onClick={() => setShowDetails(false)}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default IncomeVerification;
