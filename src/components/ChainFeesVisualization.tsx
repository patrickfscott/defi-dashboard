import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { ChainFeesData } from '../types/chain';

interface ChainFeesProps {
  dates: string[];
  chainData: ChainFeesData['chainData'];
}

interface ChainData {
  [date: string]: number;
}

// Chart selections
type DateRange = '1M' | '3M' | '1Y' | 'MAX';
type TimeFrame = 'DAY' | 'WEEK' | 'MONTH';

// Table selections
type SortColumn = '1D' | '7D' | '30D' | '1D%' | '7D%' | '30D%';
type SortDirection = 'asc' | 'desc';

interface ChainMetrics {
  chain: string;
  oneDayFees: number;
  sevenDayFees: number;
  thirtyDayFees: number;
  oneDayChange: number;
  sevenDayChange: number;
  thirtyDayChange: number;
}

interface ChainFeesProps {
  dates: string[];
  chainData: {
    [chain: string]: ChainData;
  };
}

const ChainFeesVisualization: React.FC<ChainFeesProps> = ({ dates, chainData }) => {
  const [showTable, setShowTable] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('1Y');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('DAY');
  const [sortColumn, setSortColumn] = useState<SortColumn>('1D');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const filteredDates = useMemo(() => {
    const endDate = customEndDate || dates[dates.length - 1];
    let startDate: string;
  
    if (customStartDate) {
      startDate = customStartDate;
    } else {
      const lastDate = new Date(endDate);
      switch (dateRange) {
        case '1M':
          startDate = new Date(lastDate.setMonth(lastDate.getMonth() - 1)).toISOString().split('T')[0];
          break;
        case '3M':
          startDate = new Date(lastDate.setMonth(lastDate.getMonth() - 3)).toISOString().split('T')[0];
          break;
        case '1Y':
          startDate = new Date(lastDate.setFullYear(lastDate.getFullYear() - 1)).toISOString().split('T')[0];
          break;
        default:
          startDate = dates[0];
      }
    }
    return dates.filter(date => date >= startDate && date <= endDate);
  }, [dates, dateRange, customStartDate, customEndDate]);
  
  // Process data for line chart
  const consolidatedData = useMemo(() => {
    const interval = timeFrame === 'WEEK' ? 7 : timeFrame === 'MONTH' ? 30 : 1;
    
    // Filter dates to only show points at the correct interval
    const relevantDates = filteredDates.filter((_, index) => {
      return (filteredDates.length - 1 - index) % interval === 0;
    });
  
    return relevantDates.map(date => {
      const dataPoint: any = { date };
      Object.entries(chainData).forEach(([chain, values]) => {
        if (!values[date]) return;
        
        let sum = values[date];
        if (timeFrame !== 'DAY') {
          const daysToSum = timeFrame === 'WEEK' ? 7 : 30;
          const startIdx = filteredDates.indexOf(date);
          
          // Only calculate sum if we have enough previous data
          if (startIdx >= daysToSum - 1) {
            sum = 0;
            for (let i = 0; i < daysToSum; i++) {
              const prevDate = filteredDates[startIdx - i];
              sum += values[prevDate] || 0;
            }
          } else {
            // Skip points where we don't have enough data
            return;
          }
        }
        dataPoint[chain] = sum;
      });
      return dataPoint;
    }).filter(point => Object.keys(point).length > 1); // Remove points with no data
  }, [filteredDates, chainData, timeFrame]);

  // Filter and sort chains by most recent fees
  const sortedChains = useMemo(() => {
    const lastDate = dates[dates.length - 1];
    return Object.entries(chainData)
      .filter(([chain]) => 
        chain.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const aValue = a[1][lastDate] || 0;
        const bValue = b[1][lastDate] || 0;
        return bValue - aValue;
      })
      .map(([chain]) => chain);
  }, [chainData, dates, searchTerm]);

  // Generate colors for chains
  const getChainColor = (index: number) => {
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe',
      '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
    ];
    return colors[index % colors.length];
  };

  // Calculate metrics for the table
  const chainMetrics = useMemo((): ChainMetrics[] => {
    return Object.entries(chainData).map(([chain, values]) => {
      const latestDate = dates[dates.length - 1];
      const oneDayAgo = dates[dates.length - 2];

      const oneDayFees = values[latestDate] || 0;

      const sevenDayFees = Array.from({length: 7})
        .map((_, i) => values[dates[dates.length - 1 - i]] || 0)
        .reduce((a, b) => a + b, 0);
      const thirtyDayFees = Array.from({length: 30})
        .map((_, i) => values[dates[dates.length - 1 - i]] || 0)
        .reduce((a, b) => a + b, 0);

      // Previous 7 days (days 8-14)
      const previousSevenDayFees = Array.from({length: 7})
        .map((_, i) => values[dates[dates.length - 8 - i]] || 0)
        .reduce((a, b) => a + b, 0);

      // Previous 30 days (days 31-60)
      const previousThirtyDayFees = Array.from({length: 30})
        .map((_, i) => values[dates[dates.length - 31 - i]] || 0)
        .reduce((a, b) => a + b, 0);

      const oneDayChange = ((values[latestDate] - values[oneDayAgo]) / values[oneDayAgo]) * 100;
      const sevenDayChange = ((sevenDayFees / previousSevenDayFees) - 1) * 100;
      const thirtyDayChange = ((thirtyDayFees / previousThirtyDayFees) - 1) * 100;

      return {
        chain,
        oneDayFees,
        sevenDayFees,
        thirtyDayFees,
        oneDayChange,
        sevenDayChange,
        thirtyDayChange
      };
    }).sort((a, b) => {
      let aValue, bValue;
      switch (sortColumn) {
        case '1D': [aValue, bValue] = [a.oneDayFees, b.oneDayFees]; break;
        case '7D': [aValue, bValue] = [a.sevenDayFees, b.sevenDayFees]; break;
        case '30D': [aValue, bValue] = [a.thirtyDayFees, b.thirtyDayFees]; break;
        case '1D%': [aValue, bValue] = [a.oneDayChange, b.oneDayChange]; break;
        case '7D%': [aValue, bValue] = [a.sevenDayChange, b.sevenDayChange]; break;
        case '30D%': [aValue, bValue] = [a.thirtyDayChange, b.thirtyDayChange]; break;
      }
      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }, [chainData, dates, sortColumn, sortDirection]);

  return (
    <div className="w-full space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-black">Chain Ecosystem Fees</h2>
          
          {/* Date range controls */}
          <div className="flex gap-4">
            {/* Time frame buttons */}
            <div className="flex gap-2">
              {(['DAY', 'WEEK', 'MONTH'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFrame(tf)}
                  className={`px-3 py-1 rounded ${
                    timeFrame === tf ? 'bg-blue-500 text-white' : 'bg-gray-200 text-blue-500'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {(['1M', '3M', '1Y', 'MAX'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range);
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className={`px-3 py-1 rounded ${
                    dateRange === range ? 'bg-blue-500 text-white' : 'bg-gray-200 text-blue-500'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            
            {/* Custom date range picker */}
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setDateRange('MAX');
                }}
                max={customEndDate || dates[dates.length - 1]}
                className="border rounded px-2 py-1 text-blue-500"
              />
              <span className="text-blue-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setDateRange('MAX');
                }}
                min={customStartDate}
                max={dates[dates.length - 1]}
                className="border rounded px-2 py-1 text-blue-500"
              />
            </div>
          </div>
          
          <div className="space-x-2">
            <button
              onClick={() => setShowTable(false)}
              className={`px-4 py-2 rounded ${!showTable ? 'bg-blue-500 text-white' : 'bg-gray-200 text-blue-500'}`}
            >
              Chart
            </button>
            <button
              onClick={() => setShowTable(true)}
              className={`px-4 py-2 rounded ${showTable ? 'bg-blue-500 text-white' : 'bg-gray-200 text-blue-500'}`}
            >
              Table
            </button>
          </div>
        </div>

        {!showTable ? (
          <>
          <div className="h-[700px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
              data={consolidatedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  width={100}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #cccccc',
                    borderRadius: '4px',
                    whiteSpace: "normal",
                    width: "auto",
                    minWidth: "200px"
                  }}
                  wrapperStyle={{ width: 220 }}
                  labelStyle={{ 
                    color: '#000000',  // Black date color
                    marginBottom: '5px',
                    fontWeight: 'bold'
                  }}
                  formatter={(value, name) => {
                    // Format value as dollar amount
                    const formattedValue = `$${value.toLocaleString()}`;
                    // Return array of [formattedValue, chainName]
                    return [formattedValue, name];
                  }}
                />
                <Legend
                  verticalAlign="bottom"  // This moves it to bottom
                  height={100}            // Gives it some space
                  layout="horizontal"    // Horizontal layout for the names
                  align="center"        // Centers it horizontally
                  wrapperStyle={{
                    paddingTop: "30px"
                  }}
                />
                {sortedChains.slice(0, 10).map((chain, index) => (
                  <Line
                    key={chain}
                    type="monotone"
                    dataKey={chain}
                    stroke={getChainColor(index)}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4 text-black">Chain Ecosystem Fees</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2 text-gray-700">Chain</th>
                    {[
                      ['1D', '1 Day Fees'],
                      ['7D', '7 Day Fees'],
                      ['30D', '30 Day Fees'],
                      ['1D%', '1D % Change'],
                      ['7D%', '7D % Change'],
                      ['30D%', '30D % Change']
                    ].map(([key, label]) => (
                      <th
                        key={key}
                        className="p-2 cursor-pointer hover:bg-gray-50 text-gray-700"
                        onClick={() => {
                          if (sortColumn === key) {
                            setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
                          } else {
                            setSortColumn(key as SortColumn);
                            setSortDirection('desc');
                          }
                        }}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {label}
                          {sortColumn === key && (
                            <span>{sortDirection === 'desc' ? '↓' : '↑'}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chainMetrics.map((metrics) => (
                    <tr key={metrics.chain} className="border-t">
                      <td className="p-2 text-gray-700">{metrics.chain}</td>
                      <td className="p-2 text-right text-gray-700">${metrics.oneDayFees.toLocaleString()}</td>
                      <td className="p-2 text-right text-gray-700">${metrics.sevenDayFees.toLocaleString()}</td>
                      <td className="p-2 text-right text-gray-700">${metrics.thirtyDayFees.toLocaleString()}</td>
                      <td className="p-2 text-right text-gray-700">
                      <span className={metrics.oneDayChange === null || isNaN(metrics.oneDayChange) ? 'text-gray-400' : 
                        metrics.oneDayChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {metrics.oneDayChange === null || isNaN(metrics.oneDayChange) ? '-' : `${metrics.oneDayChange.toFixed(2)}%`}
                      </span>
                      </td>
                      <td className="p-2 text-right">
                        <span className={metrics.sevenDayChange === null || isNaN(metrics.sevenDayChange) ? 'text-gray-400' :
                          metrics.sevenDayChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {metrics.sevenDayChange === null || isNaN(metrics.sevenDayChange) ? '-' : `${metrics.sevenDayChange.toFixed(2)}%`}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <span className={metrics.thirtyDayChange === null || isNaN(metrics.thirtyDayChange) ? 'text-gray-400' :
                          metrics.thirtyDayChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {metrics.thirtyDayChange === null || isNaN(metrics.thirtyDayChange) ? '-' : `${metrics.thirtyDayChange.toFixed(2)}%`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
        ) : (
          <div>
            <input
              type="text"
              placeholder="Search chains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 mb-4 border rounded text-gray-700"
            />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 border bg-gray-50 text-left text-gray-700 min-w-[150px]">Chain</th>
                    {dates.slice(-30).map(date => (
                      <th key={date} className="p-2 border bg-gray-50 text-right text-gray-700 min-w-[150px]">
                        {date}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedChains.map(chain => (
                    <tr key={chain}>
                      <td className="p-2 border font-medium text-gray-700">{chain}</td>
                      {dates.slice(-30).map(date => {
                        const value = chainData[chain][date];
                        const intensity = value ? Math.min(Math.log10(value) * 20, 100) : 0;
                        return (
                          <td
                            key={date}
                            className="p-2 border text-right"
                            style={{
                              backgroundColor: `rgba(136, 132, 216, ${intensity / 100})`,
                            }}
                          >
                            {value ? `$${value.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            })}` : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <div className="text-sm text-gray-500 mt-4 italic">
        Data sourced from DefiLlama
      </div>
    </div>
  );
};

export default ChainFeesVisualization;