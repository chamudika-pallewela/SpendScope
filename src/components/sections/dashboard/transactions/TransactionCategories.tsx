import {
  Box,
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
import { useState } from 'react';

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
            <List sx={{ width: '100%' }}>
              {transactionData.transactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((transaction, index) => {
                  const categoryInfo =
                    CATEGORY_MAP[transaction.category as keyof typeof CATEGORY_MAP];
                  const netAmount = (transaction.money_in || 0) - (transaction.money_out || 0);

                  return (
                    <ListItem
                      key={index}
                      sx={{
                        border: '1px solid',
                        borderColor: 'grey.200',
                        borderRadius: 1,
                        mb: 1,
                        backgroundColor: 'common.white',
                        '&:hover': {
                          backgroundColor: 'grey.50',
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
          )}

          {/* Categories Tab */}
          {activeTab === 1 && (
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
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TransactionCategories;
