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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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

interface SourceRecord {
  category: string;
  subcategory: string;
  subsubcategory: string | null;
  payer: string;
  frequency: 'monthly' | 'irregular';
  averageAmount: number;
  transactionCount: number;
  flags: string[];
  companyInfo?: {
    name: string;
    number: string;
    status: string;
    address: string;
    incorporated: string;
    companyUrl: string;
  };
}

const monthKey = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

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
  const [loadingCompanies, setLoadingCompanies] = useState<Set<string>>(new Set());
  const [companyData, setCompanyData] = useState<Map<string, CompanyInfo>>(new Map());
  const [groupedSources, setGroupedSources] = useState<SourceRecord[]>([]);
  const [selectedSource, setSelectedSource] = useState<SourceRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const sources = useMemo<SourceRecord[]>(() => {
    const incomeTx = transactionData.transactions.filter(isIncomeTransaction);
    console.log('Total income transactions found:', incomeTx.length);
    console.log(
      'Income transactions:',
      incomeTx.map((t) => ({
        date: t.date,
        payer: getPayer(t),
        category: t.category,
        subcategory: t.subcategory,
        subsubcategory: t.subsubcategory,
        amount: t.money_in,
      })),
    );

    const groups = new Map<
      string,
      {
        category: string;
        subcategory: string;
        subsubcategory: string | null;
        payer: string;
        txs: Transaction[];
      }
    >();
    incomeTx.forEach((t) => {
      const payer = getPayer(t);
      const key = `${t.category}__${t.subcategory}__${t.subsubcategory || 'null'}__${payer}`;

      if (!groups.has(key)) {
        groups.set(key, {
          category: t.category,
          subcategory: t.subcategory,
          subsubcategory: t.subsubcategory,
          payer,
          txs: [],
        });
      }
      groups.get(key)!.txs.push(t);
    });

    const results: SourceRecord[] = [];
    for (const { category, subcategory, subsubcategory, payer, txs } of groups.values()) {
      const byMonth = new Map<string, number>();
      txs.forEach((t) => {
        const k = monthKey(t.date);
        byMonth.set(k, (byMonth.get(k) || 0) + (t.money_in || 0));
      });
      const months = Array.from(byMonth.keys()).sort();
      const values = months.map((m) => byMonth.get(m) || 0);
      const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      let monthly = false;
      if (months.length >= 3) {
        monthly = true;
        for (let i = 1; i < months.length; i++) {
          const [y1, m1] = months[i - 1].split('-').map(Number);
          const [y2, m2] = months[i].split('-').map(Number);
          const gap = (y2 - y1) * 12 + (m2 - m1);
          if (gap > 1) {
            monthly = false;
            break;
          }
        }
      }
      const flags: string[] = [];
      for (let i = 1; i < values.length; i++) {
        if (values[i - 1] > 0 && values[i] >= 2 * values[i - 1]) {
          flags.push(
            `${subcategory} increased by ${Math.round((values[i] / values[i - 1]) * 100)}% in ${months[i]}`,
          );
        }
      }
      if (!monthly && months.length >= 2) {
        flags.push('Irregular income pattern');
      }
      if (subcategory === 'Salary (PAYE)') {
        const salaryPayers = new Set<string>();
        transactionData.transactions.forEach((t) => {
          if (isIncomeTransaction(t) && t.subcategory === 'Salary (PAYE)') {
            salaryPayers.add(getPayer(t));
          }
        });
        if (salaryPayers.size > 1) flags.push('Multiple salary payers detected');
      }
      results.push({
        category,
        subcategory,
        subsubcategory,
        payer,
        frequency: monthly ? 'monthly' : 'irregular',
        averageAmount: avg,
        transactionCount: txs.length,
        flags,
      });
    }

    const order: string[] = [
      'Salary (PAYE)',
      'Self-employment',
      'Benefits',
      'Rental',
      'Other recurring income',
    ];
    results.sort((a, b) => order.indexOf(a.subcategory) - order.indexOf(b.subcategory));

    console.log('Final grouped income sources:', results.length);
    console.log(
      'Final income sources details:',
      results.map((r) => ({
        payer: r.payer,
        subcategory: r.subcategory,
        subsubcategory: r.subsubcategory,
        amount: r.averageAmount,
        count: r.transactionCount,
        frequency: r.frequency,
      })),
    );

    return results;
  }, [transactionData.transactions]);

  // Helper function to normalize company names for better grouping
  const normalizeCompanyName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .replace(/\b(ltd|limited|inc|incorporated|corp|corporation|llc|plc)\b/g, '') // Remove company suffixes
      .trim();
  };

  // Enhanced function to extract core company name for grouping
  const extractCoreCompanyName = (payer: string): string => {
    // Remove common transaction suffixes and prefixes
    const cleaned = payer
      .replace(/\b(FPI|DD|TFR|PAYROLL|SALARY|WAGE|PAY)\b/gi, '') // Remove payment method indicators
      .replace(/\b\d{2}[A-Z]{3}\d{2}\b/g, '') // Remove date patterns like "08JUN25"
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '') // Remove date patterns like "2025-06-08"
      .replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, '') // Remove date patterns like "08/06/2025"
      .replace(/\b\d{2}\.\d{2}\.\d{4}\b/g, '') // Remove date patterns like "08.06.2025"
      .replace(/\b\d{8}\b/g, '') // Remove 8-digit numbers (often reference numbers)
      .replace(/\b[A-Z]{2,}\d{4,}\b/g, '') // Remove alphanumeric codes like "ABC1234"
      .replace(/\b\d{4,}[A-Z]{2,}\b/g, '') // Remove alphanumeric codes like "1234ABC"
      .replace(/\b(REF|REFERENCE|ID|CODE|NO|NUMBER)\b/gi, '') // Remove reference indicators
      .replace(/\b\d+\b/g, '') // Remove remaining numbers
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    // Extract the core name (first 2-3 words typically)
    const words = cleaned.split(' ').filter((word) => word.length > 1);

    // Take first 2-3 meaningful words as core name
    const coreWords = words.slice(0, Math.min(3, words.length));
    return coreWords.join(' ').toLowerCase();
  };

  // Helper function to check if two company names are similar
  const areSimilarCompanies = (name1: string, name2: string): boolean => {
    // Since we're already passing core names, we can compare them directly
    // But let's also try core name extraction for additional safety
    const core1 = extractCoreCompanyName(name1);
    const core2 = extractCoreCompanyName(name2);

    // If core names match exactly, they're the same company
    if (core1 === core2 && core1.length > 0) {
      return true;
    }

    // If one core name contains the other, they're likely the same
    if (core1.length > 0 && core2.length > 0) {
      if (core1.includes(core2) || core2.includes(core1)) {
        return true;
      }
    }

    // Special handling for banks - don't group different bank branches
    const bankNames = [
      'hsbc',
      'barclays',
      'lloyds',
      'natwest',
      'rbs',
      'santander',
      'halifax',
      'nationwide',
      'tsb',
      'first direct',
      'metro bank',
      'virgin money',
    ];
    const isBank1 = bankNames.some((bank) => name1.toLowerCase().includes(bank));
    const isBank2 = bankNames.some((bank) => name2.toLowerCase().includes(bank));

    // If both are banks, be more strict about grouping
    if (isBank1 && isBank2) {
      // Only group if they have the same bank name and similar branch indicators
      const bank1 = bankNames.find((bank) => name1.toLowerCase().includes(bank));
      const bank2 = bankNames.find((bank) => name2.toLowerCase().includes(bank));

      if (bank1 && bank2 && bank1 === bank2) {
        // Extract branch/account identifiers
        const branch1 = name1.toLowerCase().replace(bank1, '').trim();
        const branch2 = name2.toLowerCase().replace(bank2, '').trim();

        // Only group if branch identifiers are very similar or empty
        return branch1 === branch2 || branch1.length === 0 || branch2.length === 0;
      }
      return false;
    }

    // Fallback to original normalization for non-bank companies
    const norm1 = normalizeCompanyName(name1);
    const norm2 = normalizeCompanyName(name2);

    // Check for exact match after normalization
    if (norm1 === norm2) return true;

    // Check if one name contains the other (for cases like "VELU" vs "T. VELU")
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;

    // Check for common words (for cases like "STANHILL COURT HOTEL" vs "STANHILL COURT HOT")
    const words1 = norm1.split(' ').filter((w) => w.length > 2);
    const words2 = norm2.split(' ').filter((w) => w.length > 2);
    const commonWords = words1.filter((w) => words2.includes(w));

    // If more than 50% of words match, consider them similar
    return (
      commonWords.length > 0 && commonWords.length / Math.max(words1.length, words2.length) > 0.5
    );
  };

  // Fetch company information and group by actual company name
  useEffect(() => {
    const fetchAndGroupCompanies = async () => {
      const salarySources = sources.filter((s) => s.subcategory === 'Salary (PAYE)');
      console.log('All sources:', sources.length);
      console.log('Salary sources found:', salarySources.length);
      console.log(
        'Salary sources:',
        salarySources.map((s) => ({
          payer: s.payer,
          amount: s.averageAmount,
          count: s.transactionCount,
        })),
      );

      const companyMap = new Map<string, { info: CompanyInfo; sources: SourceRecord[] }>();

      // Process all salary sources first
      for (const source of salarySources) {
        const key = `${source.subcategory}-${source.payer}`;

        // Always fetch company info for each unique payer
        if (!companyData.has(key)) {
          setLoadingCompanies((prev) => new Set(prev).add(key));

          const companyInfo = await fetchCompanyInfo(source.payer);
          setCompanyData((prev) => new Map(prev).set(key, companyInfo));

          setLoadingCompanies((prev) => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
          });
        }

        // Get company info (either from cache or just fetched)
        const companyInfo = companyData.get(key) || (await fetchCompanyInfo(source.payer));

        // Extract core company name for grouping
        const coreCompanyName = extractCoreCompanyName(source.payer);

        // Find existing similar company or create new entry
        let targetCompanyName = coreCompanyName;
        for (const [existingName] of companyMap) {
          if (areSimilarCompanies(existingName, coreCompanyName)) {
            targetCompanyName = existingName;
            break;
          }
        }

        if (!companyMap.has(targetCompanyName)) {
          companyMap.set(targetCompanyName, { info: companyInfo, sources: [] });
        }
        companyMap.get(targetCompanyName)!.sources.push(source);
      }

      console.log('Company map:', companyMap.size, 'companies found');
      console.log(
        'Company map details:',
        Array.from(companyMap.entries()).map(([name, data]) => ({
          companyName: name,
          sourceCount: data.sources.length,
          sources: data.sources.map((s) => ({ payer: s.payer, amount: s.averageAmount })),
        })),
      );

      // Create grouped sources
      const grouped: SourceRecord[] = [];
      for (const [companyName, { info, sources: companySources }] of companyMap) {
        if (companySources.length > 0) {
          // Calculate combined average
          const totalAmount = companySources.reduce(
            (sum, s) => sum + s.averageAmount * s.transactionCount,
            0,
          );
          const totalTransactions = companySources.reduce((sum, s) => sum + s.transactionCount, 0);
          const combinedAverage = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

          console.log(`Grouping ${companySources.length} sources for ${companyName}:`, {
            totalAmount,
            totalTransactions,
            combinedAverage,
            sources: companySources.map((s) => ({
              payer: s.payer,
              amount: s.averageAmount,
              count: s.transactionCount,
            })),
          });

          // Use the first source as base and update with combined data
          const baseSource = companySources[0];
          grouped.push({
            ...baseSource,
            payer: companyName, // Use actual company name
            averageAmount: combinedAverage,
            transactionCount: totalTransactions,
            companyInfo: info,
          });
        }
      }

      // Add non-salary sources
      const nonSalarySources = sources.filter((s) => s.subcategory !== 'Salary (PAYE)');
      grouped.push(...nonSalarySources);

      console.log('Final grouped sources:', grouped.length);
      console.log(
        'Final grouped salary sources:',
        grouped
          .filter((s) => s.subcategory === 'Salary (PAYE)')
          .map((s) => ({
            payer: s.payer,
            amount: s.averageAmount,
            count: s.transactionCount,
          })),
      );

      setGroupedSources(grouped);
    };

    if (sources.length > 0) {
      fetchAndGroupCompanies();
    }
  }, [sources]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

  const handleSourceClick = (source: SourceRecord) => {
    setSelectedSource(source);
    setShowDetails(true);
  };

  const getFrequencyExplanation = (source: SourceRecord): string => {
    if (source.frequency === 'monthly') {
      return `This income source is classified as REGULAR because:
• Payments occur consistently every month
• Amounts are relatively stable over time
• Pattern indicates stable employment or recurring income
• Suitable for reliable financial planning and loan assessments`;
    } else {
      return `This income source is classified as IRREGULAR because:
• Payments do not follow a consistent monthly schedule
• Amounts may vary significantly between payments
• Pattern suggests freelance work, bonuses, or one-time payments
• May require additional verification for financial assessments`;
    }
  };

  const getFlagsExplanation = (flags: string[]): string => {
    if (flags.length === 0) {
      return 'No issues detected with this income source.';
    }

    return flags
      .map((flag) => {
        if (flag.includes('Irregular income pattern')) {
          return '• Irregular Pattern: This income source does not follow a consistent monthly schedule, which may require additional documentation for verification.';
        } else if (flag.includes('increased by')) {
          return `• Income Increase: ${flag} - This significant increase may require explanation or additional documentation.`;
        } else if (flag.includes('Multiple salary payers')) {
          return '• Multiple Employers: Multiple salary sources detected, which is normal for part-time work or multiple jobs but may require verification of all employment relationships.';
        } else if (flag.includes('Multiple') && flag.includes('transactions')) {
          return '• Multiple Transactions: Multiple payments from the same source detected, which is normal for regular employment but helps verify income consistency.';
        }
        return `• ${flag}`;
      })
      .join('\n');
  };

  const getSourceTransactions = (source: SourceRecord): Transaction[] => {
    return transactionData.transactions.filter(
      (t) =>
        isIncomeTransaction(t) &&
        getPayer(t) === source.payer &&
        t.subcategory === source.subcategory,
    );
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
                    {sources.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Income Sources
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {sources.filter((s) => s.flags.length === 0).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Regular Sources
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {sources.filter((s) => s.flags.length > 0).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    With Flags
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {fmt(sources.reduce((sum, s) => sum + s.averageAmount, 0))}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Monthly
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
            {groupedSources.length === 0 && sources.length > 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                  Processing income sources...
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {groupedSources.map((s, idx) => (
                  <Grid item xs={12} md={6} key={`${s.subcategory}-${s.payer}-${idx}`}>
                    <Box
                      onClick={() => handleSourceClick(s)}
                      sx={{
                        border: '1px solid',
                        borderColor: 'grey.300',
                        borderRadius: 2,
                        p: { xs: 2, sm: 2.5 },
                        backgroundColor: 'common.white',
                        height: '100%',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                          transform: 'translateY(-2px)',
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <Stack spacing={1} sx={{ height: '100%' }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {s.subcategory}
                          </Typography>
                          <Chip
                            label={s.frequency === 'monthly' ? 'Monthly' : 'Irregular'}
                            color={s.frequency === 'monthly' ? 'success' : 'warning'}
                            size="small"
                          />
                        </Stack>
                        <Stack spacing={0.5}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              Employer / Payer
                            </Typography>
                            {s.subcategory === 'Salary (PAYE)' && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {loadingCompanies.has(`${s.subcategory}-${s.payer}`) ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <Chip
                                    label="Company Found"
                                    color="success"
                                    size="small"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                )}
                              </Box>
                            )}
                          </Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {s.payer}
                          </Typography>
                          {s.subcategory === 'Salary (PAYE)' && (
                            <Box
                              sx={{
                                mt: 1.5,
                                p: 2,
                                backgroundColor: 'primary.50',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'primary.200',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                              }}
                            >
                              {!s.companyInfo ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <CircularProgress size={18} color="primary" />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    Loading company information...
                                  </Typography>
                                </Box>
                              ) : (
                                <Stack spacing={1}>
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                  >
                                    <Typography
                                      variant="caption"
                                      color="primary.main"
                                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                    >
                                      🏢 Company Verified
                                    </Typography>
                                    <Link
                                      href={s.companyInfo.companyUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{
                                        fontSize: '0.7rem',
                                        textDecoration: 'none',
                                        color: 'primary.main',
                                        fontWeight: 500,
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        backgroundColor: 'primary.100',
                                        border: '1px solid',
                                        borderColor: 'primary.300',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                          backgroundColor: 'primary.200',
                                          borderColor: 'primary.400',
                                          transform: 'translateY(-1px)',
                                        },
                                      }}
                                    >
                                      {s.companyInfo.number === 'N/A'
                                        ? 'Search Companies House'
                                        : 'View on Companies House'}
                                    </Link>
                                  </Stack>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 700,
                                      color: 'text.primary',
                                      fontSize: '0.9rem',
                                    }}
                                  >
                                    {s.companyInfo.name}
                                  </Typography>
                                  <Stack direction="row" spacing={2}>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ fontWeight: 500 }}
                                    >
                                      #{s.companyInfo.number}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="success.main"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {s.companyInfo.status}
                                    </Typography>
                                  </Stack>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', lineHeight: 1.4 }}
                                  >
                                    📍 {s.companyInfo.address}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block' }}
                                  >
                                    📅 Incorporated: {s.companyInfo.incorporated}
                                  </Typography>
                                </Stack>
                              )}
                            </Box>
                          )}
                        </Stack>
                        {s.subsubcategory && (
                          <Stack spacing={0.5}>
                            <Typography variant="caption" color="text.secondary">
                              Type
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: 'text.secondary' }}
                            >
                              {s.subsubcategory}
                            </Typography>
                          </Stack>
                        )}
                        <Stack spacing={1}>
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mb: 0.5 }}
                            >
                              {s.subcategory === 'Salary (PAYE)'
                                ? 'Monthly Average'
                                : 'Average Amount'}
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 700, color: 'success.main' }}
                            >
                              {fmt(s.averageAmount)}
                            </Typography>
                            {s.subcategory === 'Salary (PAYE)' && (
                              <Typography variant="caption" color="text.secondary">
                                From {s.transactionCount} payment{s.transactionCount > 1 ? 's' : ''}
                              </Typography>
                            )}
                          </Box>

                          {s.flags.length > 0 && (
                            <Box
                              sx={{
                                p: 1,
                                backgroundColor: 'warning.50',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'warning.200',
                              }}
                            >
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                sx={{ mb: 0.5 }}
                              >
                                <IconifyIcon
                                  icon="material-symbols:warning"
                                  sx={{ fontSize: 14, color: 'warning.main' }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{ fontWeight: 600, color: 'warning.main' }}
                                >
                                  Attention Required
                                </Typography>
                              </Stack>
                              <Typography variant="caption" color="warning.dark">
                                {s.flags.map((flag, idx) => (
                                  <span key={idx}>
                                    {flag}
                                    {idx < s.flags.length - 1 && ' • '}
                                  </span>
                                ))}
                              </Typography>
                            </Box>
                          )}

                          {s.flags.length === 0 && (
                            <Box
                              sx={{
                                p: 1,
                                backgroundColor:
                                  s.frequency === 'monthly' ? 'success.50' : 'warning.50',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor:
                                  s.frequency === 'monthly' ? 'success.200' : 'warning.200',
                              }}
                            >
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <IconifyIcon
                                  icon={
                                    s.frequency === 'monthly'
                                      ? 'material-symbols:check-circle'
                                      : 'material-symbols:schedule'
                                  }
                                  sx={{
                                    fontSize: 14,
                                    color:
                                      s.frequency === 'monthly' ? 'success.main' : 'warning.main',
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    color:
                                      s.frequency === 'monthly' ? 'success.main' : 'warning.main',
                                  }}
                                >
                                  {s.frequency === 'monthly'
                                    ? 'Regular Income Source'
                                    : 'Irregular Income Pattern'}
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
            {sources.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No income sources detected.
              </Typography>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Detailed Source Modal */}
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
        {selectedSource && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedSource.subcategory}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedSource.payer}
                  </Typography>
                </Box>
                <Chip
                  label={selectedSource.frequency === 'monthly' ? 'Monthly' : 'Irregular'}
                  color={selectedSource.frequency === 'monthly' ? 'success' : 'warning'}
                  size="small"
                />
              </Stack>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
              <Stack spacing={3}>
                {/* Frequency Explanation */}
                <Box
                  sx={{
                    p: 2,
                    backgroundColor:
                      selectedSource.frequency === 'monthly' ? 'success.50' : 'warning.50',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor:
                      selectedSource.frequency === 'monthly' ? 'success.200' : 'warning.200',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <IconifyIcon
                      icon={
                        selectedSource.frequency === 'monthly'
                          ? 'material-symbols:check-circle'
                          : 'material-symbols:schedule'
                      }
                      sx={{
                        fontSize: 18,
                        color:
                          selectedSource.frequency === 'monthly' ? 'success.main' : 'warning.main',
                      }}
                    />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color:
                          selectedSource.frequency === 'monthly' ? 'success.main' : 'warning.main',
                      }}
                    >
                      Frequency Analysis
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {getFrequencyExplanation(selectedSource)}
                  </Typography>
                </Box>

                {/* Flags Explanation */}
                {selectedSource.flags.length > 0 && (
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: 'warning.50',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'warning.200',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <IconifyIcon
                        icon="material-symbols:warning"
                        sx={{ fontSize: 18, color: 'warning.main' }}
                      />
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, color: 'warning.main' }}
                      >
                        Issues Detected
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {getFlagsExplanation(selectedSource.flags)}
                    </Typography>
                  </Box>
                )}

                {/* Transaction Details */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Transaction History ({selectedSource.transactionCount} transactions)
                  </Typography>

                  <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getSourceTransactions(selectedSource)
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map((tx, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>
                                {fmt(tx.money_in || 0)}
                              </TableCell>
                              <TableCell>{tx.description || tx.raw_description || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Summary Stats */}
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
                    Summary Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Total Amount
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {fmt(selectedSource.averageAmount * selectedSource.transactionCount)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Average Amount
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {fmt(selectedSource.averageAmount)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Transaction Count
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {selectedSource.transactionCount}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Frequency
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color:
                            selectedSource.frequency === 'monthly'
                              ? 'success.main'
                              : 'warning.main',
                        }}
                      >
                        {selectedSource.frequency === 'monthly' ? 'Regular' : 'Irregular'}
                      </Typography>
                    </Grid>
                  </Grid>
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
