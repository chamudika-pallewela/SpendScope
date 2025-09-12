import { Grid } from '@mui/material';
import CardContainer from 'components/common/CardContainter';
import ReactEchart from 'components/base/ReactEchart';
import { TransactionResponse } from 'config/categories';
import { useChartResize } from 'providers/useEchartResize';
import { useRef, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { PieChart, BarChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register ECharts components
echarts.use([
  PieChart,
  BarChart,
  LineChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent,
  CanvasRenderer,
]);

interface TransactionChartsProps {
  transactionData: TransactionResponse | null;
}

const TransactionCharts = ({ transactionData }: TransactionChartsProps) => {
  const pieChartRef = useRef<ReactECharts>(null);
  const barChartRef = useRef<ReactECharts>(null);
  const lineChartRef = useRef<ReactECharts>(null);

  useChartResize(pieChartRef);
  useChartResize(barChartRef);
  useChartResize(lineChartRef);

  // Process transaction data for charts
  const chartData = useMemo(() => {
    if (!transactionData) return null;

    // Group by category
    const categoryData = transactionData.transactions.reduce(
      (acc, transaction) => {
        const category = transaction.category;
        if (!acc[category]) {
          acc[category] = { totalIn: 0, totalOut: 0, count: 0 };
        }
        acc[category].totalIn += transaction.money_in || 0;
        acc[category].totalOut += transaction.money_out || 0;
        acc[category].count += 1;
        return acc;
      },
      {} as Record<string, { totalIn: number; totalOut: number; count: number }>,
    );

    // Group by date for line chart
    const dateData = transactionData.transactions.reduce(
      (acc, transaction) => {
        const date = transaction.date;
        if (!acc[date]) {
          acc[date] = { totalIn: 0, totalOut: 0, balance: 0 };
        }
        acc[date].totalIn += transaction.money_in || 0;
        acc[date].totalOut += transaction.money_out || 0;
        acc[date].balance = transaction.balance;
        return acc;
      },
      {} as Record<string, { totalIn: number; totalOut: number; balance: number }>,
    );

    return { categoryData, dateData };
  }, [transactionData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  // Pie Chart Options - Category Distribution
  const pieChartOptions = useMemo(() => {
    if (!chartData) return {};

    const pieData = Object.entries(chartData.categoryData).map(([category, data]) => ({
      name: category,
      value: Math.abs(data.totalIn - data.totalOut),
    }));

    return {
      title: {
        text: 'Transaction Distribution',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: {
          fontSize: 12,
        },
      },
      series: [
        {
          name: 'Transactions',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: pieData,
        },
      ],
    };
  }, [chartData]);

  // Bar Chart Options - Category Comparison
  const barChartOptions = useMemo(() => {
    if (!chartData) return {};

    const categories = Object.keys(chartData.categoryData);
    const moneyInData = categories.map((cat) => chartData.categoryData[cat].totalIn);
    const moneyOutData = categories.map((cat) => chartData.categoryData[cat].totalOut);

    return {
      title: {
        text: 'Money In vs Money Out by Category',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: unknown) => {
          const paramsArray = params as Array<{
            marker: string;
            seriesName: string;
            value: number;
            axisValue: string;
          }>;
          let result = `${paramsArray[0].axisValue}<br/>`;
          paramsArray.forEach((param) => {
            result += `${param.marker}${param.seriesName}: ${formatCurrency(param.value)}<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: ['Money In', 'Money Out'],
        top: 30,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: categories.map((cat) => cat.charAt(0).toUpperCase() + cat.slice(1)),
        axisLabel: {
          rotate: 45,
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatCurrency(value),
        },
      },
      series: [
        {
          name: 'Money In',
          type: 'bar',
          data: moneyInData,
          itemStyle: {
            color: '#4CAF50',
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: 'Money Out',
          type: 'bar',
          data: moneyOutData,
          itemStyle: {
            color: '#F44336',
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [chartData]);

  // Line Chart Options - Balance Over Time
  const lineChartOptions = useMemo(() => {
    if (!chartData) return {};

    const sortedDates = Object.keys(chartData.dateData).sort();
    const balanceData = sortedDates.map((date) => chartData.dateData[date].balance);

    return {
      title: {
        text: 'Account Balance Over Time',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const data = (params as Array<{ axisValue: string; value: number }>)[0];
          return `${data.axisValue}<br/>Balance: ${formatCurrency(data.value)}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: sortedDates.map((date) => new Date(date).toLocaleDateString('en-GB')),
        axisLabel: {
          rotate: 45,
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatCurrency(value),
        },
      },
      series: [
        {
          name: 'Balance',
          type: 'line',
          data: balanceData,
          smooth: true,
          lineStyle: {
            color: '#2196F3',
            width: 3,
          },
          itemStyle: {
            color: '#2196F3',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(33, 150, 243, 0.3)' },
                { offset: 1, color: 'rgba(33, 150, 243, 0.1)' },
              ],
            },
          },
        },
      ],
    };
  }, [chartData]);

  if (!transactionData || !chartData) {
    return null;
  }

  return (
    <Grid container spacing={3}>
      {/* Pie Chart */}
      <Grid item xs={12} md={6}>
        <CardContainer title="Transaction Distribution">
          <ReactEchart
            echarts={echarts}
            option={pieChartOptions}
            ref={pieChartRef}
            sx={{
              width: 1,
              height: 1,
              maxHeight: 350,
              minWidth: 1,
            }}
          />
        </CardContainer>
      </Grid>

      {/* Bar Chart */}
      <Grid item xs={12} md={6}>
        <CardContainer title="Category Comparison">
          <ReactEchart
            echarts={echarts}
            option={barChartOptions}
            ref={barChartRef}
            sx={{
              width: 1,
              height: 1,
              maxHeight: 350,
              minWidth: 1,
            }}
          />
        </CardContainer>
      </Grid>

      {/* Line Chart */}
      <Grid item xs={12}>
        <CardContainer title="Balance Trend">
          <ReactEchart
            echarts={echarts}
            option={lineChartOptions}
            ref={lineChartRef}
            sx={{
              width: 1,
              height: 1,
              maxHeight: 350,
              minWidth: 1,
            }}
          />
        </CardContainer>
      </Grid>
    </Grid>
  );
};

export default TransactionCharts;
