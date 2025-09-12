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

  transactions.forEach((t, idx) => {
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

    // Track totals
    if (t.money_in) m.totalIncome += t.money_in;
    if (t.category === 'enjoyment' && t.subcategory === 'gambling' && t.money_out)
      m.gamblingOut += t.money_out;
    if (t.category === 'other income' && t.subcategory === 'cash deposits' && t.money_in)
      m.cashIn.push(t.money_in);
    if (
      (t.category === 'bank transactions' && /transfer/i.test(t.subcategory)) ||
      (/transfer|remittance|international/i.test(t.description) && t.money_out)
    ) {
      if (t.money_out) m.transfersOut += t.money_out;
    }
    if ((t.category === 'salary' || /salary|payroll/i.test(t.description)) && t.money_in) {
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

    // Gambling → frequency, % of income, bursts after salary
    if (t.category === 'enjoyment' && t.subcategory === 'gambling' && t.money_out) {
      const pctIncome = m.totalIncome > 0 ? (t.money_out / m.totalIncome) * 100 : 0;
      if (pctIncome >= 20) {
        reasons.push(`Gambling outflow ${pctIncome.toFixed(1)}% of monthly income`);
        severity = 'High';
      } else if (pctIncome >= 10) {
        reasons.push(`Gambling outflow ${pctIncome.toFixed(1)}% of monthly income`);
        severity = 'Medium';
      } else {
        reasons.push('Gambling transaction');
        severity = 'Low';
      }
      const recentSalary = m.salaryDates.some(
        (sd) =>
          Math.abs((new Date(t.date).getTime() - new Date(sd).getTime()) / (1000 * 3600 * 24)) <= 3,
      );
      if (recentSalary) {
        reasons.push('Gambling burst within 3 days after salary');
        if (severity === 'Low') severity = 'Medium';
      }
    }

    // Cash deposits → large single, frequent, or near-threshold deposits
    if (t.category === 'other income' && t.subcategory === 'cash deposits' && t.money_in) {
      if (t.money_in >= 9000) {
        reasons.push(`Large cash deposit £${t.money_in.toLocaleString('en-GB')}`);
        severity = 'High';
      }
      if (t.money_in >= 8500 && t.money_in < 9000) {
        reasons.push(`Near-threshold cash deposit £${t.money_in.toLocaleString('en-GB')}`);
        if (severity !== 'High') severity = 'Medium';
      }
    }

    // Large/Unexplained Transfers → new payees, international remittances
    if (
      t.money_out &&
      (/transfer|remittance|international|swift|iban|sepa/i.test(t.description) ||
        (t.category === 'bank transactions' && /transfer/i.test(t.subcategory)))
    ) {
      const desc = (t.raw_description || t.description || '').toLowerCase();
      const isInternational = /international|swift|iban|sepa|fx|foreign/i.test(desc);
      const isNewPayee = !knownPayees.has(desc) && t.money_out >= 1000;
      if (isInternational && t.money_out >= 500) {
        reasons.push('International remittance');
        severity = 'High';
      }
      if (isNewPayee) {
        reasons.push('Transfer to new payee');
        if (severity !== 'High') severity = 'Medium';
      }
      knownPayees.add(desc);
    }

    // Rapid In–Out Flows → pass-through patterns
    const sameDay = m.passThroughDays.get(dayKey)!;
    const totalSameDay = sameDay.in + sameDay.out;
    const passThrough =
      totalSameDay > 0 &&
      Math.min(sameDay.in, sameDay.out) / Math.max(sameDay.in, sameDay.out) >= 0.7 &&
      Math.abs((t.money_in || 0) - (t.money_out || 0)) < 50;
    if (passThrough && totalSameDay >= 1000) {
      reasons.push('Rapid in-out pass-through detected');
      if (severity === 'None') severity = 'Medium';
    }

    const flagged = reasons.length > 0 && severity !== 'None';
    txRisks.set(idx, { flagged, severity: flagged ? severity : 'None', reasons });
  });

  // Build monthly scores and evidence
  for (const [monthKey, m] of monthlyMap.entries()) {
    const evidence: string[] = [];
    let score = 0;
    const gamblingPct = m.totalIncome > 0 ? (m.gamblingOut / m.totalIncome) * 100 : 0;
    if (gamblingPct >= 20) {
      score += 40;
      evidence.push(`Gambling equals ${gamblingPct.toFixed(1)}% of income`);
    } else if (gamblingPct >= 10) {
      score += 20;
      evidence.push(`Gambling equals ${gamblingPct.toFixed(1)}% of income`);
    }
    const largeCash = m.cashIn.filter((v) => v >= 9000);
    const nearThreshold = m.cashIn.filter((v) => v >= 8500 && v < 9000);
    if (largeCash.length) {
      score += 30;
      evidence.push(`${largeCash.length} large cash deposit(s) ≥ £9,000`);
    }
    if (nearThreshold.length >= 3) {
      score += 20;
      evidence.push(`${nearThreshold.length} near-threshold deposits (£8.5k–£9k)`);
    }
    if (m.transfersOut >= 5000) {
      score += 15;
      evidence.push(`High outbound transfers £${m.transfersOut.toLocaleString('en-GB')}`);
    }
    const passDays = Array.from(m.passThroughDays.values()).filter(
      (d) => d.in + d.out >= 1000 && Math.min(d.in, d.out) / Math.max(d.in, d.out) >= 0.7,
    ).length;
    if (passDays >= 3) {
      score += 15;
      evidence.push(`${passDays} pass-through days`);
    }

    if (score > 100) score = 100;
    monthlyMap.set(monthKey, { ...m, evidence, score });
  }

  const monthly = new Map<string, MonthlyRiskScore>();
  for (const [k, v] of monthlyMap.entries()) {
    const severity: RiskSeverity =
      v.score >= 60 ? 'High' : v.score >= 30 ? 'Medium' : v.score > 0 ? 'Low' : 'None';
    monthly.set(k, { monthKey: k, score: v.score, severity, evidence: v.evidence });
  }

  return { txRisks, monthly };
}
