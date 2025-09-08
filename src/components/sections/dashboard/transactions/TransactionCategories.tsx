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
import { analyzeRisks } from 'helpers/utils';

interface TransactionCategoriesProps {
  transactionData: TransactionResponse | null;
}

const TransactionCategories = ({ transactionData }: TransactionCategoriesProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
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
    {} as Record<string, Record<string, Transaction[]>>,
  );

  // Group transactions by category and subcategory
  transactionData.transactions.forEach((transaction) => {
    const category = transaction.category;
    const subcategory = transaction.subcategory;

    // If there's a subcategory, group by subcategory
    if (subcategory && subcategory.trim() !== '') {
      if (!groupedTransactions[category][subcategory]) {
        groupedTransactions[category][subcategory] = [];
      }
      groupedTransactions[category][subcategory].push(transaction);
    } else {
      // If no subcategory, add to a special 'direct' key
      if (!groupedTransactions[category]['direct']) {
        groupedTransactions[category]['direct'] = [];
      }
      groupedTransactions[category]['direct'].push(transaction);
    }
  });

  // Compute AML risk flags for All Transactions tab
  const riskAnalysis = useMemo(() => analyzeRisks(transactionData.transactions), [transactionData.transactions]);

  // Calculate totals for each category and subcategory
  const calculateTotals = (transactions: Transaction[]) => {
    const totalIn = transactions.reduce((sum, t) => sum + (t.money_in || 0), 0);
    const totalOut = transactions.reduce((sum, t) => sum + (t.money_out || 0), 0);
    return { totalIn, totalOut, net: totalIn - totalOut };
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
    setSelectedSubcategory(null);
  };

  const handleSubcategoryClick = (subcategory: string) => {
    setSelectedSubcategory(selectedSubcategory === subcategory ? null : subcategory);
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
      // Direct transactions first
      const directTxs = subcategories['direct'] || [];
      directTxs.forEach((t) => {
        rows.push({
          category,
          subcategory: '',
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
      CATEGORY_MAP[category as keyof typeof CATEGORY_MAP]?.subcategories.forEach((sub) => {
        const txs = subcategories[sub] || [];
        txs.forEach((t) => {
          rows.push({
            category,
            subcategory: sub,
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
      const allTx = Object.values(subcategories).flat();
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
      // direct
      const direct = subcategories['direct'] || [];
      direct.forEach((t) => {
        html += `<div class="tx">
          <div>
            <div style="font-weight:600">${t.description}</div>
            <div class="meta">${new Date(t.date).toLocaleDateString('en-GB')} • Balance ${fmt(t.balance)}</div>
          </div>
          <div>${t.money_in ? `<span class='pos'>+${fmt(t.money_in)}</span>` : ''}${t.money_out ? `<span class='neg'>-${fmt(t.money_out)}</span>` : ''}</div>
        </div>`;
      });
      // subcategories in order
      CATEGORY_MAP[category as keyof typeof CATEGORY_MAP]?.subcategories.forEach((sub) => {
        const txs = subcategories[sub] || [];
        const subtot = calculateTotals(txs);
        html += `<div class="sub"><div style="text-transform:capitalize">${sub}</div>
          <div>${txs.length} tx • <span class='pos'>${fmt(subtot.totalIn)}</span> | <span class='neg'>-${fmt(subtot.totalOut)}</span> | <b>${fmt(subtot.net)}</b></div></div>`;
        txs.forEach((t) => {
          html += `<div class="tx">
            <div>
              <div style="font-weight:600">${t.description}</div>
              <div class="meta">${new Date(t.date).toLocaleDateString('en-GB')} • Balance ${fmt(t.balance)}</div>
            </div>
            <div>${t.money_in ? `<span class='pos'>+${fmt(t.money_in)}</span>` : ''}${t.money_out ? `<span class='neg'>-${fmt(t.money_out)}</span>` : ''}</div>
          </div>`;
        });
      });
      html += `</div>`;
    });
    w.document.write(`<html><head><title>Transactions - ${transactionData.bank}</title>${styles}</head><body>${html}</body></html>`);
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
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: categoryInfo?.color || 'grey.400',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconifyIcon
                            icon={categoryInfo?.icon || 'material-symbols:category'}
                            sx={{ color: 'white', fontSize: 16 }}
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
                              {new Date(transaction.date).toLocaleDateString('en-GB')} •{' '}
                              {transaction.category}
                              {transaction.subcategory && ` • ${transaction.subcategory}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Balance: {formatCurrency(transaction.balance)}
                            </Typography>
                            {isFlagged && (
                              <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
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
                          <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
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
                  <Button color="primary" onClick={exportCSV} startIcon={<IconifyIcon icon="material-symbols:table" />}>
                    Export CSV
                  </Button>
                  <Button color="secondary" onClick={exportPDF} startIcon={<IconifyIcon icon="material-symbols:picture-as-pdf" />}>
                    Export PDF
                  </Button>
                </ButtonGroup>
              </Stack>
              <List sx={{ width: '100%' }}>
              {Object.entries(groupedTransactions).map(([category, subcategories]) => {
                const categoryInfo = CATEGORY_MAP[category as keyof typeof CATEGORY_MAP];
                const categoryTotals = Object.values(subcategories)
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

                // Check if category has actual subcategories (not just 'direct')
                const hasSubcategories = Object.keys(subcategories).some((key) => key !== 'direct');
                const subcategoryCount = Object.keys(subcategories).filter(
                  (key) => key !== 'direct',
                ).length;
                const hasTransactions = Object.values(subcategories).flat().length > 0;

                return (
                  <Box key={category}>
                    <ListItemButton
                      onClick={() => toggleCategory(category)}
                      sx={{
                        border: '1px solid',
                        borderColor: 'grey.200',
                        borderRadius: 1,
                        mb: 1,
                        opacity: hasTransactions ? 1 : 0.5,
                        '&:hover': {
                          backgroundColor: hasTransactions ? 'grey.50' : 'grey.100',
                        },
                      }}
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: hasTransactions
                              ? categoryInfo?.color || 'grey.400'
                              : 'grey.300',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconifyIcon
                            icon={categoryInfo?.icon || 'material-symbols:category'}
                            sx={{
                              color: hasTransactions ? 'white' : 'grey.500',
                              fontSize: 16,
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
                        {/* Show direct transactions first */}
                        {subcategories['direct'] && subcategories['direct'].length > 0 && (
                          <Box key="direct">
                            {subcategories['direct'].map((transaction, index) => (
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
                                        {new Date(transaction.date).toLocaleDateString('en-GB')}
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
                            ))}
                          </Box>
                        )}

                        {/* Show all subcategories from CATEGORY_MAP */}
                        {CATEGORY_MAP[category as keyof typeof CATEGORY_MAP]?.subcategories.map(
                          (subcategoryName) => {
                            const transactions = subcategories[subcategoryName] || [];
                            const subcategoryTotals = calculateTotals(transactions);
                            const subNetAmount = subcategoryTotals.net;
                            const isSelected = selectedSubcategory === subcategoryName;
                            const hasTransactions = transactions.length > 0;

                            return (
                              <Box key={subcategoryName}>
                                <ListItemButton
                                  onClick={() => handleSubcategoryClick(subcategoryName)}
                                  sx={{
                                    pl: 4,
                                    border: '1px solid',
                                    borderColor: isSelected ? 'primary.main' : 'grey.100',
                                    borderRadius: 1,
                                    mb: 0.5,
                                    backgroundColor: isSelected ? 'primary.lighter' : 'transparent',
                                    opacity: hasTransactions ? 1 : 0.6,
                                    '&:hover': {
                                      backgroundColor: isSelected ? 'primary.lighter' : 'grey.50',
                                    },
                                  }}
                                >
                                  <ListItemIcon sx={{ minWidth: 32 }}>
                                    <Box
                                      sx={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        backgroundColor: hasTransactions
                                          ? categoryInfo?.color || 'grey.400'
                                          : 'grey.300',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <IconifyIcon
                                        icon={
                                          SUBCATEGORY_ICONS[subcategoryName] ||
                                          'material-symbols:category'
                                        }
                                        sx={{
                                          color: hasTransactions ? 'white' : 'grey.500',
                                          fontSize: 12,
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
                                        color={hasTransactions ? 'text.secondary' : 'text.disabled'}
                                      >
                                        {hasTransactions
                                          ? `${transactions.length} transactions`
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

                                {/* Show transactions for selected subcategory */}
                                {isSelected && hasTransactions && (
                                  <Collapse in={isSelected} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
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
                                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {transaction.description}
                                              </Typography>
                                            }
                                            secondary={
                                              <Stack spacing={0.5}>
                                                <Typography
                                                  variant="caption"
                                                  color="text.secondary"
                                                >
                                                  {new Date(transaction.date).toLocaleDateString(
                                                    'en-GB',
                                                  )}
                                                </Typography>
                                                <Typography
                                                  variant="caption"
                                                  color="text.secondary"
                                                >
                                                  Balance: {formatCurrency(transaction.balance)}
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
