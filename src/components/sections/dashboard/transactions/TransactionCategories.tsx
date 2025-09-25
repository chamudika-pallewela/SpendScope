import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import {
  CATEGORY_MAP,
  SUBCATEGORY_ICONS,
  Transaction,
  TransactionResponse,
} from 'config/categories';
import { useMemo, useState } from 'react';
import { analyzeRisks, safeFormatDate } from 'helpers/utils';

interface TransactionCategoriesProps {
  transactionData: TransactionResponse | null;
}

const TransactionCategories = ({ transactionData }: TransactionCategoriesProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedSubsubcategory, setSelectedSubsubcategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  if (!transactionData) {
    return null;
  }

  // Initialize all categories from CATEGORY_MAP
  const groupedTransactions = Object.keys(CATEGORY_MAP).reduce(
    (acc, category) => {
      acc[category] = {};
      return acc;
    },
    {} as Record<string, Record<string, Record<string, Transaction[]>>>,
  );

  // Group transactions by category, subcategory, and sub-subcategory
  transactionData.transactions.forEach((transaction) => {
    const category = transaction.category;
    const subcategory = transaction.subcategory;
    const subsubcategory = transaction.subsubcategory;

    // Initialize category if not exists
    if (!groupedTransactions[category]) {
      groupedTransactions[category] = {};
    }

    // If there's a subcategory, group by subcategory
    if (subcategory && subcategory.trim() !== '') {
      if (!groupedTransactions[category][subcategory]) {
        groupedTransactions[category][subcategory] = {};
      }

      // If there's a sub-subcategory, group by sub-subcategory
      if (subsubcategory && subsubcategory.trim() !== '') {
        if (!groupedTransactions[category][subcategory][subsubcategory]) {
          groupedTransactions[category][subcategory][subsubcategory] = [];
        }
        groupedTransactions[category][subcategory][subsubcategory].push(transaction);
      } else {
        // If no sub-subcategory, add directly under subcategory with a special key
        if (!groupedTransactions[category][subcategory]['_no_subsub']) {
          groupedTransactions[category][subcategory]['_no_subsub'] = [];
        }
        groupedTransactions[category][subcategory]['_no_subsub'].push(transaction);
      }
    } else {
      // If no subcategory, add directly under category with a special key
      if (!groupedTransactions[category]['_no_sub']) {
        groupedTransactions[category]['_no_sub'] = {};
      }
      if (!groupedTransactions[category]['_no_sub']['_no_subsub']) {
        groupedTransactions[category]['_no_sub']['_no_subsub'] = [];
      }
      groupedTransactions[category]['_no_sub']['_no_subsub'].push(transaction);
    }
  });

  // Compute AML risk flags for All Transactions tab
  const riskAnalysis = useMemo(
    () => analyzeRisks(transactionData.transactions),
    [transactionData.transactions],
  );

  // Calculate totals for each category and subcategory
  const calculateTotals = (transactions: Transaction[]) => {
    const totalIn = transactions.reduce((sum, t) => sum + (t.money_in || 0), 0);
    const totalOut = transactions.reduce((sum, t) => sum + (t.money_out || 0), 0);
    return { totalIn, totalOut, net: totalIn - totalOut };
  };

  // Helper functions for managing expanded states

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
    setSelectedSubcategory(null);
    setSelectedSubsubcategory(null);
  };

  const handleSubcategoryClick = (subcategory: string) => {
    setSelectedSubcategory(selectedSubcategory === subcategory ? null : subcategory);
    setSelectedSubsubcategory(null);
  };

  const handleSubsubcategoryClick = (subsubcategory: string) => {
    setSelectedSubsubcategory(selectedSubsubcategory === subsubcategory ? null : subsubcategory);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setExpandedCategories(new Set());
    setSelectedSubcategory(null);
  };

  // Build a flattened data structure for export
  const buildExportRows = () => {
    const rows: Array<Record<string, string | number | null>> = [];
    Object.keys(CATEGORY_MAP).forEach((category) => {
      const subcategories = groupedTransactions[category] || {};
      // Direct transactions first (no subcategory)
      const directTxs = subcategories['_no_sub']?.['_no_subsub'] || [];
      directTxs.forEach((t) => {
        rows.push({
          category,
          subcategory: '',
          subsubcategory: null,
          date: t.date,
          description: t.description,
          money_in: t.money_in || 0,
          money_out: t.money_out || 0,
          net: (t.money_in || 0) - (t.money_out || 0),
          balance: t.balance,
          currency: t.currency,
        });
      });
      // Then mapped subcategories in defined order
      const categoryData = CATEGORY_MAP[category as keyof typeof CATEGORY_MAP];
      if (categoryData && categoryData.subcategories) {
        Object.keys(categoryData.subcategories).forEach((sub) => {
          const subcategoryGroup = subcategories[sub] || {};
          Object.entries(subcategoryGroup).forEach(([subsub, txs]) => {
            txs.forEach((t) => {
              rows.push({
                category,
                subcategory: sub,
                subsubcategory: subsub === '_no_subsub' ? null : subsub,
                date: t.date,
                description: t.description,
                money_in: t.money_in || 0,
                money_out: t.money_out || 0,
                net: (t.money_in || 0) - (t.money_out || 0),
                balance: t.balance,
                currency: t.currency,
              });
            });
          });
        });
      }
    });
    return rows;
  };

  const exportCSV = () => {
    const rows = buildExportRows();
    const headers = [
      'category',
      'subcategory',
      'date',
      'description',
      'money_in',
      'money_out',
      'net',
      'balance',
      'currency',
    ];
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        headers
          .map((h) => {
            const val = r[h as keyof typeof r];
            const s = val === null || val === undefined ? '' : String(val);
            // Escape quotes and commas
            const needsQuotes = /[",\n]/.test(s);
            const escaped = s.replace(/"/g, '""');
            return needsQuotes ? `"${escaped}"` : escaped;
          })
          .join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${transactionData.bank}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    // Create a printable HTML using current grouped data and colors
    const w = window.open('', '_blank');
    if (!w) return;
    const styles = `
      <style>
        body { font-family: Inter, Arial, sans-serif; padding: 16px; color: #111; }
        .title { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
        .category { border-radius: 8px; margin: 12px 0; overflow: hidden; border: 1px solid #e0e0e0; }
        .cat-header { padding: 10px 12px; color: #fff; display: flex; align-items: center; justify-content: space-between; }
        .sub { padding: 8px 12px; background: #fafafa; border-top: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; }
        .tx { padding: 8px 12px; border-top: 1px dashed #eee; display: flex; align-items: flex-start; justify-content: space-between; }
        .meta { color: #666; font-size: 12px; }
        .pos { color: #2e7d32; font-weight: 600; }
        .neg { color: #c62828; font-weight: 600; }
      </style>
    `;
    const fmt = (n: number) => formatCurrency(n);
    let html = `<div class="title">Transactions - ${transactionData.bank}</div>`;
    Object.keys(CATEGORY_MAP).forEach((category) => {
      const color = CATEGORY_MAP[category as keyof typeof CATEGORY_MAP]?.color || '#999';
      const subcategories = groupedTransactions[category] || {};
      const allTx = Object.values(subcategories)
        .flatMap((subcategoryGroup) => Object.values(subcategoryGroup))
        .flat();
      const totals = calculateTotals(allTx);
      html += `<div class="category">
        <div class="cat-header" style="background:${color}">
          <div style="font-weight:700;text-transform:capitalize">${category}</div>
          <div>
            <span class="pos">${fmt(totals.totalIn)}</span>
            &nbsp;|&nbsp;
            <span class="neg">-${fmt(totals.totalOut)}</span>
            &nbsp;|&nbsp;
            <span style="font-weight:700">${fmt(totals.net)}</span>
          </div>
        </div>`;
      // direct (no subcategory)
      const direct = subcategories['_no_sub']?.['_no_subsub'] || [];
      direct.forEach((t) => {
        html += `<div class="tx">
          <div>
            <div style="font-weight:600">${t.description}</div>
            <div class="meta">${safeFormatDate(t.date)} • Balance ${fmt(t.balance)}</div>
          </div>
          <div>${t.money_in ? `<span class='pos'>+${fmt(t.money_in)}</span>` : ''}${t.money_out ? `<span class='neg'>-${fmt(t.money_out)}</span>` : ''}</div>
        </div>`;
      });
      // subcategories in order
      const categoryData = CATEGORY_MAP[category as keyof typeof CATEGORY_MAP];
      if (categoryData && categoryData.subcategories) {
        Object.keys(categoryData.subcategories).forEach((sub) => {
          const subcategoryGroup = subcategories[sub] || {};
          const allSubTxs = Object.values(subcategoryGroup).flat();
          const subtot = calculateTotals(allSubTxs);
          html += `<div class="sub"><div style="text-transform:capitalize">${sub}</div>
            <div>${allSubTxs.length} tx • <span class='pos'>${fmt(subtot.totalIn)}</span> | <span class='neg'>-${fmt(subtot.totalOut)}</span> | <b>${fmt(subtot.net)}</b></div></div>`;

          // Show sub-subcategories
          Object.entries(subcategoryGroup).forEach(([subsub, txs]) => {
            if (subsub !== '_no_subsub' && txs.length > 0) {
              const subsubtot = calculateTotals(txs);
              html += `<div class="subsub" style="margin-left:20px;font-size:0.9em;color:#666">
                <div style="text-transform:capitalize">${subsub}</div>
                <div>${txs.length} tx • <span class='pos'>${fmt(subsubtot.totalIn)}</span> | <span class='neg'>-${fmt(subsubtot.totalOut)}</span> | <b>${fmt(subsubtot.net)}</b></div>
              </div>`;
            }
            txs.forEach((t) => {
              html += `<div class="tx">
                <div>
                  <div style="font-weight:600">${t.description}</div>
                  <div class="meta">${safeFormatDate(t.date)} • Balance ${fmt(t.balance)}</div>
                </div>
                <div>${t.money_in ? `<span class='pos'>+${fmt(t.money_in)}</span>` : ''}${t.money_out ? `<span class='neg'>-${fmt(t.money_out)}</span>` : ''}</div>
              </div>`;
            });
          });
        });
      }
      html += `</div>`;
    });
    w.document.write(
      `<html><head><title>Transactions - ${transactionData.bank}</title>${styles}</head><body>${html}</body></html>`,
    );
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Card sx={{ backgroundColor: 'common.white', width: 1 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography
            sx={{
              fontSize: {
                xs: 'body2.fontSize',
                md: 'h6.fontSize',
                xl: 'h3.fontSize',
              },
              fontWeight: 600,
            }}
          >
            Transactions - {transactionData.bank}
          </Typography>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
              },
            }}
          >
            <Tab
              label="All Transactions"
              icon={<IconifyIcon icon="material-symbols:receipt" />}
              iconPosition="start"
            />
            <Tab
              label="Categories"
              icon={<IconifyIcon icon="material-symbols:category" />}
              iconPosition="start"
            />
          </Tabs>

          {/* All Transactions Tab */}
          {activeTab === 0 && (
            <>
              <List sx={{ width: '100%' }}>
                {transactionData.transactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction, index) => {
                    const categoryInfo =
                      CATEGORY_MAP[transaction.category as keyof typeof CATEGORY_MAP];
                    const netAmount = (transaction.money_in || 0) - (transaction.money_out || 0);
                    const originalIndex = transactionData.transactions.indexOf(transaction);
                    const risk = riskAnalysis.txRisks.get(originalIndex);
                    const isFlagged = !!risk?.flagged && risk.severity !== 'None';

                    return (
                      <ListItem
                        key={index}
                        sx={{
                          border: '1px solid',
                          borderColor: isFlagged ? 'error.main' : 'grey.200',
                          borderRadius: 1,
                          mb: 1,
                          backgroundColor: isFlagged ? 'error.lighter' : 'common.white',
                          '&:hover': {
                            backgroundColor: isFlagged ? 'error.lighter' : 'grey.50',
                          },
                        }}
                      >
                        <ListItemIcon>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '12px',
                              background: `linear-gradient(135deg, ${categoryInfo?.color || '#6B7280'} 0%, ${categoryInfo?.color || '#6B7280'}CC 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: `0 4px 12px ${categoryInfo?.color || '#6B7280'}40`,
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: `0 6px 16px ${categoryInfo?.color || '#6B7280'}50`,
                              },
                            }}
                          >
                            <IconifyIcon
                              icon={categoryInfo?.icon || 'material-symbols:category'}
                              sx={{
                                color: 'white',
                                fontSize: 18,
                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                              }}
                            />
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {transaction.description}
                            </Typography>
                          }
                          secondary={
                            <Stack spacing={0.5}>
                              <Typography variant="body2" color="text.secondary">
                                {safeFormatDate(transaction.date)} • {transaction.category}
                                {transaction.subcategory && ` • ${transaction.subcategory}`}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Balance: {formatCurrency(transaction.balance)}
                              </Typography>
                              {isFlagged && (
                                <Typography
                                  variant="caption"
                                  color="error.main"
                                  sx={{ fontWeight: 600 }}
                                >
                                  Risk: {risk?.severity} — {risk?.reasons.join('; ')}
                                </Typography>
                              )}
                              {transaction.note && (
                                <Typography variant="caption" color="warning.main">
                                  {transaction.note}
                                </Typography>
                              )}
                            </Stack>
                          }
                        />
                        <Box sx={{ textAlign: 'right' }}>
                          {transaction.money_in && (
                            <Typography
                              variant="body2"
                              color="success.main"
                              sx={{ fontWeight: 600 }}
                            >
                              +{formatCurrency(transaction.money_in)}
                            </Typography>
                          )}
                          {transaction.money_out && (
                            <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                              -{formatCurrency(transaction.money_out)}
                            </Typography>
                          )}
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            Net: {formatCurrency(netAmount)}
                          </Typography>
                        </Box>
                      </ListItem>
                    );
                  })}
              </List>
            </>
          )}

          {/* Categories Tab */}
          {activeTab === 1 && (
            <>
              <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
                <ButtonGroup variant="contained" size="small">
                  <Button
                    color="primary"
                    onClick={exportCSV}
                    startIcon={<IconifyIcon icon="material-symbols:table" />}
                  >
                    Export CSV
                  </Button>
                  <Button
                    color="secondary"
                    onClick={exportPDF}
                    startIcon={<IconifyIcon icon="material-symbols:picture-as-pdf" />}
                  >
                    Export PDF
                  </Button>
                </ButtonGroup>
              </Stack>
              <List sx={{ width: '100%' }}>
                {Object.entries(groupedTransactions).map(([category, subcategories]) => {
                  const categoryInfo = CATEGORY_MAP[category as keyof typeof CATEGORY_MAP];
                  const categoryTotals = Object.values(subcategories)
                    .flatMap((subcategoryGroup) => Object.values(subcategoryGroup))
                    .flat()
                    .reduce(
                      (acc, t) => ({
                        totalIn: acc.totalIn + (t.money_in || 0),
                        totalOut: acc.totalOut + (t.money_out || 0),
                      }),
                      { totalIn: 0, totalOut: 0 },
                    );

                  const isExpanded = expandedCategories.has(category);
                  const netAmount = categoryTotals.totalIn - categoryTotals.totalOut;

                  // Check if category has actual subcategories (not just '_no_sub')
                  const hasSubcategories = Object.keys(subcategories).some(
                    (key) => key !== '_no_sub',
                  );
                  const subcategoryCount = Object.keys(subcategories).filter(
                    (key) => key !== '_no_sub',
                  ).length;
                  const hasTransactions =
                    Object.values(subcategories)
                      .flatMap((subcategoryGroup) => Object.values(subcategoryGroup))
                      .flat().length > 0;

                  return (
                    <Box key={category}>
                      <ListItemButton
                        onClick={() => toggleCategory(category)}
                        sx={{
                          border: '1px solid',
                          borderColor: 'grey.200',
                          borderRadius: 2,
                          mb: 2,
                          p: 2,
                          opacity: hasTransactions ? 1 : 0.5,
                          backgroundColor: 'common.white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: hasTransactions ? 'grey.50' : 'grey.100',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        <ListItemIcon>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: '16px',
                              background: hasTransactions
                                ? `linear-gradient(135deg, ${categoryInfo?.color || '#6B7280'} 0%, ${categoryInfo?.color || '#6B7280'}CC 100%)`
                                : 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: hasTransactions
                                ? `0 6px 16px ${categoryInfo?.color || '#6B7280'}40`
                                : '0 2px 4px rgba(0,0,0,0.1)',
                              transition: 'all 0.3s ease-in-out',
                              '&:hover': {
                                transform: 'translateY(-2px) scale(1.05)',
                                boxShadow: hasTransactions
                                  ? `0 8px 24px ${categoryInfo?.color || '#6B7280'}50`
                                  : '0 4px 8px rgba(0,0,0,0.15)',
                              },
                            }}
                          >
                            <IconifyIcon
                              icon={categoryInfo?.icon || 'material-symbols:category'}
                              sx={{
                                color: hasTransactions ? 'white' : '#9CA3AF',
                                fontSize: 22,
                                filter: hasTransactions
                                  ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                                  : 'none',
                                transition: 'all 0.3s ease-in-out',
                              }}
                            />
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 600,
                                textTransform: 'capitalize',
                                color: hasTransactions ? 'text.primary' : 'text.disabled',
                              }}
                            >
                              {category}
                            </Typography>
                          }
                          secondary={
                            hasTransactions ? (
                              <Typography variant="body2" color="text.secondary">
                                {hasSubcategories
                                  ? `${subcategoryCount} subcategories`
                                  : `${Object.values(subcategories).flat().length} transactions`}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.disabled">
                                No transactions
                              </Typography>
                            )
                          }
                        />
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography
                            variant="subtitle1"
                            color={
                              hasTransactions
                                ? netAmount >= 0
                                  ? 'success.main'
                                  : 'error.main'
                                : 'text.disabled'
                            }
                            sx={{ fontWeight: 600 }}
                          >
                            {formatCurrency(netAmount)}
                          </Typography>
                        </Box>
                        <IconifyIcon
                          icon={
                            isExpanded
                              ? 'material-symbols:expand-less'
                              : 'material-symbols:expand-more'
                          }
                          sx={{
                            ml: 1,
                            color: hasTransactions ? 'text.primary' : 'text.disabled',
                          }}
                        />
                      </ListItemButton>

                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {/* Show direct transactions first (no subcategory) */}
                          {subcategories['_no_sub'] &&
                            subcategories['_no_sub']['_no_subsub'] &&
                            subcategories['_no_sub']['_no_subsub'].length > 0 && (
                              <Box key="_no_sub">
                                {subcategories['_no_sub']['_no_subsub'].map(
                                  (transaction, index) => (
                                    <ListItem
                                      key={index}
                                      sx={{
                                        pl: 4,
                                        border: '1px solid',
                                        borderColor: 'grey.100',
                                        borderRadius: 1,
                                        mb: 0.5,
                                        backgroundColor: 'grey.25',
                                      }}
                                    >
                                      <ListItemText
                                        primary={
                                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {transaction.description}
                                          </Typography>
                                        }
                                        secondary={
                                          <Stack spacing={0.5}>
                                            <Typography variant="caption" color="text.secondary">
                                              {safeFormatDate(transaction.date)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                              Balance: {formatCurrency(transaction.balance)}
                                            </Typography>
                                            {transaction.note && (
                                              <Typography variant="caption" color="warning.main">
                                                {transaction.note}
                                              </Typography>
                                            )}
                                          </Stack>
                                        }
                                      />
                                      <Box sx={{ textAlign: 'right' }}>
                                        {transaction.money_in && (
                                          <Typography
                                            variant="body2"
                                            color="success.main"
                                            sx={{ fontWeight: 600 }}
                                          >
                                            +{formatCurrency(transaction.money_in)}
                                          </Typography>
                                        )}
                                        {transaction.money_out && (
                                          <Typography
                                            variant="body2"
                                            color="error.main"
                                            sx={{ fontWeight: 600 }}
                                          >
                                            -{formatCurrency(transaction.money_out)}
                                          </Typography>
                                        )}
                                      </Box>
                                    </ListItem>
                                  ),
                                )}
                              </Box>
                            )}

                          {/* Show all subcategories from CATEGORY_MAP */}
                          {(() => {
                            const categoryData =
                              CATEGORY_MAP[category as keyof typeof CATEGORY_MAP];
                            if (!categoryData || !categoryData.subcategories) return null;
                            return Object.keys(categoryData.subcategories).map(
                              (subcategoryName) => {
                                const subcategoryGroup = subcategories[subcategoryName] || {};
                                const allTransactions = Object.values(subcategoryGroup).flat();
                                const subcategoryTotals = calculateTotals(allTransactions);
                                const subNetAmount = subcategoryTotals.net;
                                const isSelected = selectedSubcategory === subcategoryName;
                                const hasTransactions = allTransactions.length > 0;

                                return (
                                  <Box key={subcategoryName}>
                                    <ListItemButton
                                      onClick={() => handleSubcategoryClick(subcategoryName)}
                                      sx={{
                                        pl: 4,
                                        border: '1px solid',
                                        borderColor: isSelected ? 'primary.main' : 'grey.100',
                                        borderRadius: 1.5,
                                        mb: 1,
                                        p: 1.5,
                                        backgroundColor: isSelected
                                          ? 'primary.lighter'
                                          : 'transparent',
                                        opacity: hasTransactions ? 1 : 0.6,
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                          backgroundColor: isSelected
                                            ? 'primary.lighter'
                                            : 'grey.50',
                                          transform: 'translateX(4px)',
                                        },
                                      }}
                                    >
                                      <ListItemIcon sx={{ minWidth: 40 }}>
                                        <Box
                                          sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '10px',
                                            background: hasTransactions
                                              ? `linear-gradient(135deg, ${categoryInfo?.color || '#6B7280'}80 0%, ${categoryInfo?.color || '#6B7280'}60 100%)`
                                              : 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: hasTransactions
                                              ? `0 3px 8px ${categoryInfo?.color || '#6B7280'}30`
                                              : '0 1px 3px rgba(0,0,0,0.1)',
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': {
                                              transform: 'translateY(-1px)',
                                              boxShadow: hasTransactions
                                                ? `0 4px 12px ${categoryInfo?.color || '#6B7280'}40`
                                                : '0 2px 6px rgba(0,0,0,0.15)',
                                            },
                                          }}
                                        >
                                          <IconifyIcon
                                            icon={
                                              SUBCATEGORY_ICONS[subcategoryName] ||
                                              'material-symbols:category'
                                            }
                                            sx={{
                                              color: hasTransactions ? 'white' : '#9CA3AF',
                                              fontSize: 14,
                                              filter: hasTransactions
                                                ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                                                : 'none',
                                            }}
                                          />
                                        </Box>
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              fontWeight: 500,
                                              textTransform: 'capitalize',
                                              color: hasTransactions
                                                ? 'text.primary'
                                                : 'text.secondary',
                                            }}
                                          >
                                            {subcategoryName}
                                          </Typography>
                                        }
                                        secondary={
                                          <Typography
                                            variant="caption"
                                            color={
                                              hasTransactions ? 'text.secondary' : 'text.disabled'
                                            }
                                          >
                                            {hasTransactions
                                              ? `${allTransactions.length} transactions`
                                              : 'No transactions'}
                                          </Typography>
                                        }
                                      />
                                      <Box sx={{ textAlign: 'right' }}>
                                        <Typography
                                          variant="body2"
                                          color={
                                            hasTransactions
                                              ? subNetAmount >= 0
                                                ? 'success.main'
                                                : 'error.main'
                                              : 'text.disabled'
                                          }
                                          sx={{ fontWeight: 600 }}
                                        >
                                          {formatCurrency(subNetAmount)}
                                        </Typography>
                                      </Box>
                                    </ListItemButton>

                                    {/* Show sub-subcategories for selected subcategory */}
                                    {isSelected && hasTransactions && (
                                      <Collapse in={isSelected} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding>
                                          {Object.entries(subcategoryGroup).map(
                                            ([subsubcategoryName, transactions]) => {
                                              const subsubcategoryTotals =
                                                calculateTotals(transactions);
                                              const subsubNetAmount = subsubcategoryTotals.net;
                                              const hasSubsubTransactions = transactions.length > 0;
                                              const isSubsubSelected =
                                                selectedSubsubcategory === subsubcategoryName;

                                              // If this is the special "_no_subsub" key, show transactions directly under subcategory
                                              if (subsubcategoryName === '_no_subsub') {
                                                return (
                                                  <Box key={subsubcategoryName}>
                                                    {transactions.map((transaction, index) => (
                                                      <ListItem
                                                        key={index}
                                                        sx={{
                                                          pl: 6,
                                                          border: '1px solid',
                                                          borderColor: 'grey.100',
                                                          borderRadius: 1,
                                                          mb: 0.5,
                                                          backgroundColor: 'grey.25',
                                                        }}
                                                      >
                                                        <ListItemText
                                                          primary={
                                                            <Typography
                                                              variant="body2"
                                                              sx={{ fontWeight: 500 }}
                                                            >
                                                              {transaction.description}
                                                            </Typography>
                                                          }
                                                          secondary={
                                                            <Stack spacing={0.5}>
                                                              <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                              >
                                                                {safeFormatDate(transaction.date)}
                                                              </Typography>
                                                              <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                              >
                                                                Balance:{' '}
                                                                {formatCurrency(
                                                                  transaction.balance,
                                                                )}
                                                              </Typography>
                                                              {transaction.note && (
                                                                <Typography
                                                                  variant="caption"
                                                                  color="warning.main"
                                                                >
                                                                  {transaction.note}
                                                                </Typography>
                                                              )}
                                                            </Stack>
                                                          }
                                                        />
                                                        <Box sx={{ textAlign: 'right' }}>
                                                          {transaction.money_in && (
                                                            <Typography
                                                              variant="body2"
                                                              color="success.main"
                                                              sx={{ fontWeight: 600 }}
                                                            >
                                                              +
                                                              {formatCurrency(transaction.money_in)}
                                                            </Typography>
                                                          )}
                                                          {transaction.money_out && (
                                                            <Typography
                                                              variant="body2"
                                                              color="error.main"
                                                              sx={{ fontWeight: 600 }}
                                                            >
                                                              -
                                                              {formatCurrency(
                                                                transaction.money_out,
                                                              )}
                                                            </Typography>
                                                          )}
                                                        </Box>
                                                      </ListItem>
                                                    ))}
                                                  </Box>
                                                );
                                              }

                                              // Regular sub-subcategory with expandable functionality
                                              return (
                                                <Box key={subsubcategoryName}>
                                                  <ListItemButton
                                                    onClick={() =>
                                                      handleSubsubcategoryClick(subsubcategoryName)
                                                    }
                                                    sx={{
                                                      pl: 6,
                                                      border: '1px solid',
                                                      borderColor: 'grey.100',
                                                      borderRadius: 1,
                                                      mb: 0.5,
                                                      p: 1,
                                                      backgroundColor: hasSubsubTransactions
                                                        ? 'grey.25'
                                                        : 'grey.50',
                                                      opacity: hasSubsubTransactions ? 1 : 0.7,
                                                      transition: 'all 0.2s ease-in-out',
                                                      '&:hover': {
                                                        backgroundColor: hasSubsubTransactions
                                                          ? 'grey.50'
                                                          : 'grey.100',
                                                        transform: 'translateX(2px)',
                                                      },
                                                    }}
                                                  >
                                                    <ListItemIcon>
                                                      <Box
                                                        sx={{
                                                          width: 28,
                                                          height: 28,
                                                          borderRadius: '8px',
                                                          background: hasSubsubTransactions
                                                            ? `linear-gradient(135deg, ${categoryInfo?.color || '#6366F1'}60 0%, ${categoryInfo?.color || '#6366F1'}40 100%)`
                                                            : 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          justifyContent: 'center',
                                                          boxShadow: hasSubsubTransactions
                                                            ? `0 2px 6px ${categoryInfo?.color || '#6366F1'}25`
                                                            : '0 1px 2px rgba(0,0,0,0.1)',
                                                          transition: 'all 0.2s ease-in-out',
                                                          '&:hover': {
                                                            transform: 'translateY(-1px)',
                                                            boxShadow: hasSubsubTransactions
                                                              ? `0 3px 8px ${categoryInfo?.color || '#6366F1'}35`
                                                              : '0 2px 4px rgba(0,0,0,0.15)',
                                                          },
                                                        }}
                                                      >
                                                        <IconifyIcon
                                                          icon={
                                                            SUBCATEGORY_ICONS[subsubcategoryName] ||
                                                            'material-symbols:category'
                                                          }
                                                          sx={{
                                                            color: hasSubsubTransactions
                                                              ? 'white'
                                                              : '#9CA3AF',
                                                            fontSize: 12,
                                                            filter: hasSubsubTransactions
                                                              ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                                                              : 'none',
                                                          }}
                                                        />
                                                      </Box>
                                                    </ListItemIcon>
                                                    <ListItemText
                                                      primary={
                                                        <Typography
                                                          variant="body2"
                                                          sx={{
                                                            fontWeight: 500,
                                                            textTransform: 'capitalize',
                                                            color: hasSubsubTransactions
                                                              ? 'text.primary'
                                                              : 'text.secondary',
                                                          }}
                                                        >
                                                          {subsubcategoryName}
                                                        </Typography>
                                                      }
                                                      secondary={
                                                        <Typography
                                                          variant="caption"
                                                          color={
                                                            hasSubsubTransactions
                                                              ? 'text.secondary'
                                                              : 'text.disabled'
                                                          }
                                                        >
                                                          {hasSubsubTransactions
                                                            ? `${transactions.length} transactions`
                                                            : 'No transactions'}
                                                        </Typography>
                                                      }
                                                    />
                                                    <Box sx={{ textAlign: 'right' }}>
                                                      <Typography
                                                        variant="body2"
                                                        color={
                                                          hasSubsubTransactions
                                                            ? subsubNetAmount >= 0
                                                              ? 'success.main'
                                                              : 'error.main'
                                                            : 'text.disabled'
                                                        }
                                                        sx={{ fontWeight: 600 }}
                                                      >
                                                        {formatCurrency(subsubNetAmount)}
                                                      </Typography>
                                                    </Box>
                                                  </ListItemButton>

                                                  {/* Show transactions for selected sub-subcategory */}
                                                  {isSubsubSelected && hasSubsubTransactions && (
                                                    <Collapse
                                                      in={isSubsubSelected}
                                                      timeout="auto"
                                                      unmountOnExit
                                                    >
                                                      <List component="div" disablePadding>
                                                        {transactions.map((transaction, index) => (
                                                          <ListItem
                                                            key={index}
                                                            sx={{
                                                              pl: 8,
                                                              border: '1px solid',
                                                              borderColor: 'grey.100',
                                                              borderRadius: 1,
                                                              mb: 0.5,
                                                              backgroundColor: 'grey.25',
                                                            }}
                                                          >
                                                            <ListItemText
                                                              primary={
                                                                <Typography
                                                                  variant="body2"
                                                                  sx={{ fontWeight: 500 }}
                                                                >
                                                                  {transaction.description}
                                                                </Typography>
                                                              }
                                                              secondary={
                                                                <Stack spacing={0.5}>
                                                                  <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                  >
                                                                    {safeFormatDate(
                                                                      transaction.date,
                                                                    )}
                                                                  </Typography>
                                                                  <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                  >
                                                                    Balance:{' '}
                                                                    {formatCurrency(
                                                                      transaction.balance,
                                                                    )}
                                                                  </Typography>
                                                                  {transaction.note && (
                                                                    <Typography
                                                                      variant="caption"
                                                                      color="warning.main"
                                                                    >
                                                                      {transaction.note}
                                                                    </Typography>
                                                                  )}
                                                                </Stack>
                                                              }
                                                            />
                                                            <Box sx={{ textAlign: 'right' }}>
                                                              {transaction.money_in && (
                                                                <Typography
                                                                  variant="body2"
                                                                  color="success.main"
                                                                  sx={{ fontWeight: 600 }}
                                                                >
                                                                  +
                                                                  {formatCurrency(
                                                                    transaction.money_in,
                                                                  )}
                                                                </Typography>
                                                              )}
                                                              {transaction.money_out && (
                                                                <Typography
                                                                  variant="body2"
                                                                  color="error.main"
                                                                  sx={{ fontWeight: 600 }}
                                                                >
                                                                  -
                                                                  {formatCurrency(
                                                                    transaction.money_out,
                                                                  )}
                                                                </Typography>
                                                              )}
                                                            </Box>
                                                          </ListItem>
                                                        ))}
                                                      </List>
                                                    </Collapse>
                                                  )}
                                                </Box>
                                              );
                                            },
                                          )}
                                        </List>
                                      </Collapse>
                                    )}
                                  </Box>
                                );
                              },
                            );
                          })()}
                        </List>
                      </Collapse>
                    </Box>
                  );
                })}
              </List>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TransactionCategories;
