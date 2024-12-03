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

interface ChainData {
  [date: string]: number;
}

interface ChainFeesProps {
  dates: string[];
  chainData: {
    [chain: string]: ChainData;
  };
}

const ChainFeesVisualization: React.FC<ChainFeesProps> = ({ dates, chainData }) => {
  const [showTable, setShowTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Process data for line chart
  const lineChartData = useMemo(() => {
    return dates.map(date => {
      const dataPoint: { [key: string]: any } = { date };
      Object.entries(chainData).forEach(([chain, values]) => {
        if (values[date]) {
          dataPoint[chain] = values[date];
        }
      });
      return dataPoint;
    });
  }, [dates, chainData]);

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

  return (
    <div className="w-full space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Chain Fees Analysis</h2>
          <div className="space-x-2">
            <button
              onClick={() => setShowTable(false)}
              className={`px-4 py-2 rounded ${!showTable ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Chart
            </button>
            <button
              onClick={() => setShowTable(true)}
              className={`px-4 py-2 rounded ${showTable ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Table
            </button>
          </div>
        </div>

        {!showTable ? (
          <div className="h-[600px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip />
                <Legend />
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
        ) : (
          <div>
            <input
              type="text"
              placeholder="Search chains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 mb-4 border rounded"
            />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 border bg-gray-50 text-left">Chain</th>
                    {dates.slice(-7).map(date => (
                      <th key={date} className="p-2 border bg-gray-50 text-right">
                        {date}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedChains.map(chain => (
                    <tr key={chain}>
                      <td className="p-2 border font-medium">{chain}</td>
                      {dates.slice(-7).map(date => {
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
                            {value ? value.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            }) : '-'}
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
    </div>
  );
};

export default ChainFeesVisualization;