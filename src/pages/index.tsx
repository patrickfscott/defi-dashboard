import { useEffect, useState } from 'react';
import ChainFeesVisualization from '../components/ChainFeesVisualization';
import { ChainFeesData } from '../types/chain';

export default function Home() {
  const [data, setData] = useState<ChainFeesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Log the URL pulling from
        console.log('Fetching from:', process.env.NEXT_PUBLIC_API_URL);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chain-fees`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Error: {error}</div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center min-h-screen">No data available</div>;
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">DeFi Chain Fees Dashboard</h1>
      <ChainFeesVisualization dates={data.dates} chainData={data.chainData} />
    </main>
  );
}