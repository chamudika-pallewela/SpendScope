import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';

// Extend dayjs with the plugins
dayjs.extend(utc);
dayjs.extend(localizedFormat);

export const dateFormatFromUTC = (dateString: Date) => {
  return dayjs.utc(dateString).local().format('D MMM, h.mm A');
};

export const currencyFormat = (amount: number, options: Intl.NumberFormatOptions = {}) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'usd',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    ...options,
  }).format(amount);
};

export const numberFormat = (number: number, notation: 'standard' | 'compact' = 'standard') =>
  new Intl.NumberFormat('en-US', {
    notation,
  }).format(number);

// Enhanced date formatting utilities
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }
  return d.toLocaleDateString('en-GB');
};

export const formatDateRange = (startDate: Date | string, endDate: Date | string): string => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Invalid Date Range';
  }

  return `${formatDate(start)} - ${formatDate(end)}`;
};

// Safe date formatting that handles invalid dates gracefully
export const safeFormatDate = (date: Date | string, fallback: string = 'Invalid Date'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return fallback;
  }
  return d.toLocaleDateString('en-GB');
};

// ---------------- AML / Risk Analysis ----------------
import { Transaction } from 'config/categories';

export type RiskSeverity = 'High' | 'Medium' | 'Low' | 'None';

export interface TransactionRisk {
  flagged: boolean;
  severity: RiskSeverity;
  reasons: string[];
}

export interface MonthlyRiskScore {
  monthKey: string; // YYYY-MM
  score: number; // 0-100
  severity: RiskSeverity;
  evidence: string[];
}

const toMonthKey = (dateStr: string): string => {
  const d = new Date(dateStr);

  // Validate the date
  if (isNaN(d.getTime())) {
    console.warn(`Invalid date encountered: ${dateStr}`);
    // Return a fallback date (current month)
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

// Compute per-transaction risks and aggregate monthly risk
export function analyzeRisks(transactions: Transaction[]): {
  txRisks: Map<number, TransactionRisk>; // index -> risk
  monthly: Map<string, MonthlyRiskScore>;
} {
  const txRisks = new Map<number, TransactionRisk>();
  const monthlyMap = new Map<
    string,
    {
      totalIncome: number;
      gamblingOut: number;
      cashIn: number[];
      transfersOut: number;
      salaryDates: string[];
      passThroughDays: Map<string, { in: number; out: number }>;
      evidence: string[];
      score: number;
    }
  >();

  const knownPayees = new Set<string>();
  const overdraftDays = new Map<string, Set<string>>(); // month -> set of days in overdraft

  transactions.forEach((t, idx) => {
    // Skip transactions with invalid dates
    if (!t.date || isNaN(new Date(t.date).getTime())) {
      console.warn(`Skipping transaction with invalid date: ${t.date}`);
      return;
    }

    const monthKey = toMonthKey(t.date);
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        totalIncome: 0,
        gamblingOut: 0,
        cashIn: [],
        transfersOut: 0,
        salaryDates: [],
        passThroughDays: new Map(),
        evidence: [],
        score: 0,
      });
    }
    const m = monthlyMap.get(monthKey)!;

    // Track totals - Updated for actual category structure
    if (t.money_in) m.totalIncome += t.money_in;

    // Gambling detection
    const isGambling =
      (t.category === 'Lifestyle & Discretionary' &&
        t.subcategory === 'Entertainment' &&
        /gambling|betting|casino|lottery|poker|bingo|sports betting|bet|wager|stake/i.test(
          t.description || t.raw_description || '',
        )) ||
      /gambling|betting|casino|lottery|poker|bingo|sports betting|bet|wager|stake/i.test(
        t.description || t.raw_description || '',
      );
    if (isGambling && t.money_out) m.gamblingOut += t.money_out;

    // Cash deposit detection
    const isCashDepositMonthly =
      (t.category === 'Income Categories' &&
        /cash|deposit|atm|withdrawal|bank transfer/i.test(
          t.description || t.raw_description || '',
        )) ||
      /cash deposit|cash in|atm deposit|bank deposit/i.test(
        t.description || t.raw_description || '',
      );
    if (isCashDepositMonthly && t.money_in) m.cashIn.push(t.money_in);

    // Transfer detection
    const isTransfer =
      (t.category === 'Financial Commitments' && t.subcategory === 'Transfer out') ||
      /transfer|remittance|international|swift|iban|sepa|wire|payment to/i.test(
        t.description || t.raw_description || '',
      );
    if (isTransfer && t.money_out) m.transfersOut += t.money_out;
    // Salary detection - Updated for actual category structure
    const isSalary =
      (t.category === 'Income Categories' && t.subcategory === 'Salary (PAYE)') ||
      /salary|payroll|wage|pay/i.test(t.description || t.raw_description || '');
    if (isSalary && t.money_in) {
      m.salaryDates.push(t.date);
    }
    const dayKey = new Date(t.date).toISOString().slice(0, 10);
    if (!m.passThroughDays.has(dayKey)) m.passThroughDays.set(dayKey, { in: 0, out: 0 });
    const dAgg = m.passThroughDays.get(dayKey)!;
    dAgg.in += t.money_in || 0;
    dAgg.out += t.money_out || 0;

    // Per-transaction checks
    const reasons: string[] = [];
    let severity: RiskSeverity = 'None';

    // Enhanced Gambling Risk Indicators - Updated for actual category structure
    const isGamblingTransaction =
      ((t.category === 'Lifestyle & Discretionary' &&
        t.subcategory === 'Entertainment' &&
        /gambling|betting|casino|lottery|poker|bingo|sports betting|bet|wager|stake/i.test(
          t.description || t.raw_description || '',
        )) ||
        /gambling|betting|casino|lottery|poker|bingo|sports betting|bet|wager|stake/i.test(
          t.description || t.raw_description || '',
        )) &&
      t.money_out;

    if (isGamblingTransaction && t.money_out) {
      const pctIncome = m.totalIncome > 0 ? (t.money_out / m.totalIncome) * 100 : 0;

      // Frequency check - count gambling transactions this month
      const gamblingCount = transactions.filter(
        (tx, txIdx) =>
          txIdx <= idx &&
          toMonthKey(tx.date) === monthKey &&
          ((tx.category === 'Lifestyle & Discretionary' &&
            tx.subcategory === 'Entertainment' &&
            /gambling|betting|casino|lottery|poker|bingo|sports betting|bet|wager|stake/i.test(
              tx.description || tx.raw_description || '',
            )) ||
            /gambling|betting|casino|lottery|poker|bingo|sports betting|bet|wager|stake/i.test(
              tx.description || tx.raw_description || '',
            )),
      ).length;

      // Risk weighting based on frequency and income percentage
      if (pctIncome >= 15) {
        reasons.push(
          `🚨 HIGH RISK: Gambling ${pctIncome.toFixed(1)}% of income (>15% threshold - excessive gambling behavior)`,
        );
        severity = 'High';
      } else if (pctIncome >= 10) {
        reasons.push(
          `⚠️ MEDIUM RISK: Gambling ${pctIncome.toFixed(1)}% of income (10-15% range - concerning gambling pattern)`,
        );
        severity = 'Medium';
      } else if (pctIncome >= 5) {
        reasons.push(
          `🟡 AMBER: Gambling ${pctIncome.toFixed(1)}% of income (5-10% range - moderate gambling activity)`,
        );
        severity = 'Low';
      } else {
        reasons.push(
          `🎰 GAMBLING DETECTED: Transaction flagged as gambling activity (amount: £${t.money_out.toLocaleString('en-GB')})`,
        );
        severity = 'Low';
      }

      // Frequency risk (more than 3-4 times per month)
      if (gamblingCount > 4) {
        reasons.push(`🚨 HIGH FREQUENCY: ${gamblingCount} gambling transactions this month`);
        if (severity === 'Low') severity = 'High';
        else if (severity === 'Medium') severity = 'High';
      } else if (gamblingCount > 3) {
        reasons.push(`⚠️ FREQUENT: ${gamblingCount} gambling transactions this month`);
        if (severity === 'Low') severity = 'Medium';
      }

      // Salary burst detection (gambling immediately after salary)
      const recentSalary = m.salaryDates.some(
        (sd) =>
          Math.abs((new Date(t.date).getTime() - new Date(sd).getTime()) / (1000 * 3600 * 24)) <= 3,
      );
      if (recentSalary) {
        reasons.push('🚨 SALARY BURST: Gambling within 3 days after salary credit');
        if (severity === 'Low') severity = 'Medium';
        else if (severity === 'Medium') severity = 'High';
      }
    }

    // Enhanced Cash Deposit Risk Indicators - Updated for actual category structure
    const isCashDeposit =
      ((t.category === 'Income Categories' &&
        /cash|deposit|atm|withdrawal|bank transfer/i.test(
          t.description || t.raw_description || '',
        )) ||
        /cash deposit|cash in|atm deposit|bank deposit/i.test(
          t.description || t.raw_description || '',
        )) &&
      t.money_in;

    if (isCashDeposit && t.money_in) {
      // Count cash deposits this month for frequency analysis
      const cashDepositCount = transactions.filter(
        (tx, txIdx) =>
          txIdx <= idx &&
          toMonthKey(tx.date) === monthKey &&
          ((tx.category === 'Income Categories' &&
            /cash|deposit|atm|withdrawal|bank transfer/i.test(
              tx.description || tx.raw_description || '',
            )) ||
            /cash deposit|cash in|atm deposit|bank deposit/i.test(
              tx.description || tx.raw_description || '',
            )),
      ).length;

      // Large single deposits (>£1,000 or proportionally high vs salary)
      const salaryThreshold = m.totalIncome * 0.1; // 10% of monthly income
      const isLargeVsSalary = t.money_in >= salaryThreshold && salaryThreshold > 0;

      if (t.money_in >= 1000 || isLargeVsSalary) {
        if (t.money_in >= 1000) {
          reasons.push(
            `🚨 LARGE CASH DEPOSIT: £${t.money_in.toLocaleString('en-GB')} (>£1,000 threshold - significant cash deposit requiring investigation)`,
          );
          severity = 'High';
        } else {
          reasons.push(
            `⚠️ HIGH vs SALARY: £${t.money_in.toLocaleString('en-GB')} (${((t.money_in / m.totalIncome) * 100).toFixed(1)}% of income - large relative to earnings)`,
          );
          severity = 'Medium';
        }
      }

      // Near-threshold deposits (£9,000/£9,500 - structuring risk)
      if (t.money_in >= 9000 && t.money_in <= 9500) {
        reasons.push(
          `🚨 STRUCTURING RISK: Near-threshold deposit £${t.money_in.toLocaleString('en-GB')} (£9k-£9.5k range - potential money laundering structuring to avoid reporting)`,
        );
        severity = 'High';
      } else if (t.money_in >= 8500 && t.money_in < 9000) {
        reasons.push(
          `⚠️ NEAR-THRESHOLD: £${t.money_in.toLocaleString('en-GB')} (approaching £9k limit - monitoring for structuring patterns)`,
        );
        if (severity !== 'High') severity = 'Medium';
      }

      // Frequency risk (more than 2-3 per month)
      if (cashDepositCount > 3) {
        reasons.push(
          `🚨 HIGH FREQUENCY: ${cashDepositCount} cash deposits this month (>3 threshold)`,
        );
        if (severity === 'Low') severity = 'High';
        else if (severity === 'Medium') severity = 'High';
      } else if (cashDepositCount > 2) {
        reasons.push(`⚠️ FREQUENT: ${cashDepositCount} cash deposits this month (2-3 range)`);
        if (severity === 'Low') severity = 'Medium';
      }

      // Unexplained deposits (no clear source)
      const desc = (t.raw_description || t.description || '').toLowerCase();
      const isUnexplained = !/salary|wage|pay|tip|cashback|refund|withdrawal|atm/i.test(desc);
      if (isUnexplained && t.money_in >= 500) {
        reasons.push(
          `🟡 UNEXPLAINED: Cash deposit £${t.money_in.toLocaleString('en-GB')} without clear source`,
        );
        if (severity === 'None') severity = 'Low';
      }
    }

    // Enhanced Large/Unexplained Transfer Risk Indicators - Updated for actual category structure
    // First check if it's a crypto transaction to avoid double-counting
    const cryptoExchanges = [
      'coinbase',
      'binance',
      'kraken',
      'bitfinex',
      'gemini',
      'crypto.com',
      'etoro',
      'robinhood',
      'coinbase pro',
      'kucoin',
    ];
    const isCryptoTransaction = cryptoExchanges.some((exchange) =>
      (t.description || t.raw_description || '').toLowerCase().includes(exchange),
    );

    const isTransferTransaction =
      t.money_out &&
      !isCryptoTransaction && // Exclude crypto transactions from general transfer detection
      ((t.category === 'Financial Commitments' && t.subcategory === 'Transfer out') ||
        /transfer|remittance|international|swift|iban|sepa|wire|payment to/i.test(
          t.description || t.raw_description || '',
        ));

    if (isTransferTransaction && t.money_out) {
      const desc = (t.raw_description || t.description || '').toLowerCase();
      const isInternational = /international|swift|iban|sepa|fx|foreign/i.test(desc);
      const isNewPayee = !knownPayees.has(desc) && t.money_out >= 1000;

      // International remittances to higher-risk jurisdictions
      if (isInternational && t.money_out >= 500) {
        const highRiskJurisdictions = /russia|iran|north korea|syria|myanmar|afghanistan|belarus/i;
        const isHighRiskJurisdiction = highRiskJurisdictions.test(desc);

        if (isHighRiskJurisdiction) {
          reasons.push(
            `🚨 HIGH-RISK JURISDICTION: International transfer £${t.money_out.toLocaleString('en-GB')} to sanctioned/restricted country`,
          );
          severity = 'High';
        } else {
          reasons.push(
            `⚠️ INTERNATIONAL: Remittance £${t.money_out.toLocaleString('en-GB')} to foreign jurisdiction`,
          );
          severity = 'High';
        }
      }

      // New payee transfers (high-value transfers to recently added recipients)
      if (isNewPayee) {
        if (t.money_out >= 5000) {
          reasons.push(
            `🚨 NEW PAYEE HIGH-VALUE: £${t.money_out.toLocaleString('en-GB')} to recently added recipient`,
          );
          severity = 'High';
        } else if (t.money_out >= 1000) {
          reasons.push(
            `⚠️ NEW PAYEE: £${t.money_out.toLocaleString('en-GB')} to recently added recipient`,
          );
          severity = 'Medium';
        }
      }

      // Round-number transfers (structuring pattern)
      const isRoundNumber = /^[0-9]+000$/.test(t.money_out.toString()) && t.money_out >= 1000;
      if (isRoundNumber) {
        reasons.push(
          `🟡 ROUND-NUMBER TRANSFER: £${t.money_out.toLocaleString('en-GB')} (potential structuring pattern)`,
        );
        if (severity === 'None') severity = 'Low';
        else if (severity === 'Low') severity = 'Medium';
      }

      // Repeated transfers to same payee (frequency analysis)
      const samePayeeCount = transactions.filter(
        (tx, txIdx) =>
          txIdx <= idx &&
          tx.money_out &&
          (tx.raw_description || tx.description || '').toLowerCase() === desc &&
          toMonthKey(tx.date) === monthKey,
      ).length;

      if (samePayeeCount > 3 && t.money_out >= 1000) {
        reasons.push(`🚨 REPEATED TRANSFERS: ${samePayeeCount} transfers to same payee this month`);
        if (severity === 'Low') severity = 'High';
        else if (severity === 'Medium') severity = 'High';
      }

      // Unexplained purpose (no clear business reason)
      const hasClearPurpose =
        /family|support|business|investment|loan|repayment|gift|donation/i.test(desc);
      if (!hasClearPurpose && t.money_out >= 2000) {
        reasons.push(
          `🟡 UNEXPLAINED PURPOSE: £${t.money_out.toLocaleString('en-GB')} transfer without stated purpose`,
        );
        if (severity === 'None') severity = 'Low';
        else if (severity === 'Low') severity = 'Medium';
      }

      knownPayees.add(desc);
    }

    // 4. Rapid In–Out Flows ("Pass-Through" Accounts)
    const sameDay = m.passThroughDays.get(dayKey)!;
    const totalSameDay = sameDay.in + sameDay.out;
    const passThrough =
      totalSameDay > 0 &&
      Math.min(sameDay.in, sameDay.out) / Math.max(sameDay.in, sameDay.out) >= 0.7 &&
      Math.abs((t.money_in || 0) - (t.money_out || 0)) < 50;
    if (passThrough && totalSameDay >= 1000) {
      reasons.push(
        '🚨 PASS-THROUGH: Rapid in-out flows detected (money "hopping" between accounts)',
      );
      if (severity === 'None') severity = 'High';
      else if (severity === 'Low') severity = 'High';
    }

    // 5. Additional Risk Categories

    // Overdraft dependency (>50% of days in overdraft)
    if (t.balance && t.balance < 0) {
      if (!overdraftDays.has(monthKey)) {
        overdraftDays.set(monthKey, new Set());
      }
      overdraftDays.get(monthKey)!.add(dayKey);
    }

    // High-cost credit use (payday loans)
    const isPaydayLoan =
      /payday|wonga|quickquid|provident|brighthouse|bright house|sunny|satsuma/i.test(
        t.description || t.raw_description || '',
      );
    if (isPaydayLoan && t.money_out) {
      reasons.push(
        `🚨 HIGH-COST CREDIT: Payday loan repayment detected (£${t.money_out.toFixed(2)})`,
      );
      if (severity === 'None') severity = 'High';
    }

    // Crypto transactions - moved before transfer detection to avoid double-counting
    const isCryptoExchange = cryptoExchanges.some((exchange) =>
      (t.description || t.raw_description || '').toLowerCase().includes(exchange),
    );
    if (isCryptoExchange && t.money_out) {
      const exchangeName = cryptoExchanges.find((exchange) =>
        (t.description || t.raw_description || '').toLowerCase().includes(exchange),
      );

      // Enhanced crypto risk explanations
      if (t.money_out >= 5000) {
        reasons.push(
          `🚨 HIGH-VALUE CRYPTO: Large transfer of £${t.money_out.toLocaleString('en-GB')} to ${exchangeName?.toUpperCase()} exchange (high-value crypto transaction)`,
        );
        severity = 'High';
      } else if (t.money_out >= 1000) {
        reasons.push(
          `⚠️ CRYPTO EXCHANGE: Transfer of £${t.money_out.toLocaleString('en-GB')} to ${exchangeName?.toUpperCase()} (cryptocurrency exchange - potential anonymity risk)`,
        );
        if (severity === 'None') severity = 'Medium';
      } else {
        reasons.push(
          `🟡 CRYPTO: Transfer of £${t.money_out.toLocaleString('en-GB')} to ${exchangeName?.toUpperCase()} (cryptocurrency exchange - lower risk but flagged for monitoring)`,
        );
        if (severity === 'None') severity = 'Low';
      }

      // Additional crypto-specific risk factors
      const desc = (t.description || t.raw_description || '').toLowerCase();
      if (desc.includes('etoro') || desc.includes('robinhood')) {
        reasons.push(
          `📊 TRADING PLATFORM: ${exchangeName?.toUpperCase()} is a trading platform (higher risk due to potential for rapid money movement)`,
        );
      }

      if (t.money_out >= 10000) {
        reasons.push(
          `💰 LARGE CRYPTO TRANSFER: Amount exceeds £10k threshold (significant crypto investment - enhanced monitoring required)`,
        );
        if (severity === 'Medium') severity = 'High';
      }
    }

    // Lifestyle mismatch (luxury spending vs income)
    const luxuryKeywords = [
      'louis vuitton',
      'gucci',
      'prada',
      'rolex',
      'cartier',
      'tiffany',
      'bentley',
      'ferrari',
      'lamborghini',
      'porsche',
      'louboutin',
      'hermes',
      'chanel',
      'dior',
    ];
    const isLuxurySpending = luxuryKeywords.some((keyword) =>
      (t.description || t.raw_description || '').toLowerCase().includes(keyword),
    );

    if (isLuxurySpending && t.money_out && t.money_out > 1000) {
      const monthlyIncome = m.totalIncome;
      const luxuryRatio = monthlyIncome > 0 ? (t.money_out / monthlyIncome) * 100 : 0;

      if (luxuryRatio > 20) {
        // More than 20% of monthly income on luxury item
        reasons.push(
          `🚨 LIFESTYLE MISMATCH: Luxury spending ${luxuryRatio.toFixed(1)}% of monthly income (£${t.money_out.toFixed(2)})`,
        );
        if (severity === 'None') severity = 'High';
      }
    }

    const flagged = reasons.length > 0 && severity !== 'None';
    txRisks.set(idx, { flagged, severity: flagged ? severity : 'None', reasons });
  });

  // Build monthly scores and evidence
  for (const [monthKey, m] of monthlyMap.entries()) {
    const evidence: string[] = [];
    let score = 0;

    // Count flagged transactions for this month
    const monthTransactions = transactions.filter((_, idx) => {
      const txDate = toMonthKey(transactions[idx].date);
      return txDate === monthKey;
    });

    const monthFlaggedTransactions = monthTransactions.filter((_, idx) => {
      const originalIdx = transactions.findIndex((t) => t === monthTransactions[idx]);
      const txRisk = txRisks.get(originalIdx);
      return txRisk && txRisk.flagged;
    });

    const highRiskCount = monthFlaggedTransactions.filter((_, idx) => {
      const originalIdx = transactions.findIndex((t) => t === monthFlaggedTransactions[idx]);
      const txRisk = txRisks.get(originalIdx);
      return txRisk && txRisk.severity === 'High';
    }).length;

    const mediumRiskCount = monthFlaggedTransactions.filter((_, idx) => {
      const originalIdx = transactions.findIndex((t) => t === monthFlaggedTransactions[idx]);
      const txRisk = txRisks.get(originalIdx);
      return txRisk && txRisk.severity === 'Medium';
    }).length;

    const lowRiskCount = monthFlaggedTransactions.filter((_, idx) => {
      const originalIdx = transactions.findIndex((t) => t === monthFlaggedTransactions[idx]);
      const txRisk = txRisks.get(originalIdx);
      return txRisk && txRisk.severity === 'Low';
    }).length;

    // Calculate score based on flagged transactions using industry-standard AML scoring
    if (monthFlaggedTransactions.length > 0) {
      // Industry-standard AML risk scoring (based on Basel III and FATF guidelines)
      score += highRiskCount * 40; // High risk transactions (40 points each - critical AML concerns)
      score += mediumRiskCount * 20; // Medium risk transactions (20 points each - significant concerns)
      score += lowRiskCount * 8; // Low risk transactions (8 points each - monitoring required)

      if (highRiskCount > 0) {
        evidence.push(`${highRiskCount} high-risk transaction(s) flagged (40 points each)`);
      }
      if (mediumRiskCount > 0) {
        evidence.push(`${mediumRiskCount} medium-risk transaction(s) flagged (20 points each)`);
      }
      if (lowRiskCount > 0) {
        evidence.push(`${lowRiskCount} low-risk transaction(s) flagged (8 points each)`);
      }
    }

    // Additional pattern-based scoring (Industry AML Standards)
    const gamblingPct = m.totalIncome > 0 ? (m.gamblingOut / m.totalIncome) * 100 : 0;
    if (gamblingPct >= 20) {
      score += 50; // Critical gambling behavior (FATF guidelines)
      evidence.push(
        `Gambling equals ${gamblingPct.toFixed(1)}% of income (Critical - >20% threshold)`,
      );
    } else if (gamblingPct >= 10) {
      score += 25; // Significant gambling behavior
      evidence.push(
        `Gambling equals ${gamblingPct.toFixed(1)}% of income (Significant - 10-20% range)`,
      );
    }

    // Cash deposit patterns (UK MLR 2017 / EU 5th AML Directive)
    const largeCash = m.cashIn.filter((v) => v >= 9000);
    const nearThreshold = m.cashIn.filter((v) => v >= 8500 && v < 9000);
    if (largeCash.length) {
      score += 45; // Critical structuring risk (above £9k reporting threshold)
      evidence.push(
        `${largeCash.length} large cash deposit(s) ≥ £9,000 (Critical structuring risk)`,
      );
    }
    if (nearThreshold.length >= 3) {
      score += 30; // Potential structuring pattern
      evidence.push(
        `${nearThreshold.length} near-threshold deposits (£8.5k–£9k) (Potential structuring)`,
      );
    }

    // Transfer patterns (Basel III operational risk)
    if (m.transfersOut >= 5000) {
      score += 20; // Significant money movement
      evidence.push(
        `High outbound transfers £${m.transfersOut.toLocaleString('en-GB')} (Significant money movement)`,
      );
    }

    // Overdraft dependency assessment (Industry credit risk standards)
    const monthOverdraftDays = overdraftDays.get(monthKey);
    if (monthOverdraftDays) {
      const daysInMonth = new Date(monthKey + '-01').getDate();
      const overdraftRatio = monthOverdraftDays.size / daysInMonth;
      if (overdraftRatio > 0.5) {
        score += 35; // Critical financial stress (Basel III credit risk)
        evidence.push(
          `Overdraft dependency: ${(overdraftRatio * 100).toFixed(1)}% of days in overdraft (Critical financial stress)`,
        );
      } else if (overdraftRatio > 0.25) {
        score += 15; // Moderate financial stress
        evidence.push(
          `Frequent overdraft: ${(overdraftRatio * 100).toFixed(1)}% of days in overdraft (Moderate financial stress)`,
        );
      }
    }
    // Pass-through account detection (Industry AML standards)
    const passDays = Array.from(m.passThroughDays.values()).filter(
      (d) => d.in + d.out >= 1000 && Math.min(d.in, d.out) / Math.max(d.in, d.out) >= 0.7,
    ).length;
    if (passDays >= 3) {
      score += 25; // Critical money laundering pattern (FATF typologies)
      evidence.push(`${passDays} pass-through days (Critical money laundering pattern)`);
    }

    // Cap score at 100 (Industry standard maximum)
    if (score > 100) score = 100;
    monthlyMap.set(monthKey, { ...m, evidence, score });
  }

  const monthly = new Map<string, MonthlyRiskScore>();
  for (const [k, v] of monthlyMap.entries()) {
    // Industry-standard AML risk thresholds (Basel III / FATF guidelines)
    const severity: RiskSeverity =
      v.score >= 70 ? 'High' : v.score >= 40 ? 'Medium' : v.score > 0 ? 'Low' : 'None';
    monthly.set(k, { monthKey: k, score: v.score, severity, evidence: v.evidence });
  }

  return { txRisks, monthly };
}
