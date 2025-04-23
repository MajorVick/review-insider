// src/app/page.tsx

import { supabase } from '@/lib/supabaseClient'; // Import Supabase client
import SentimentChart from '@/components/SentimentChart'; // We will create this next


type SentimentDataPoint = {
  review_date: string; // Keep as string initially
  score: number | null;
};

export default async function Home() {
  // Fetch data directly in the Server Component
  const { data: sentimentData, error } = await supabase
    .from('sentiments')
    .select(`
      score,
      reviews ( review_date )
    `)
    // Optional: Order by date if needed for the chart
    // .order('review_date', { foreignTable: 'reviews', ascending: true })
    // Optional: Limit the data fetched if it gets large
    // .limit(100);

  if (error) {
    console.error("Error fetching sentiment data:", error);
    // Handle error display appropriately
  }

  // Process data for the chart (ensure reviews relation is not null)
  const chartData = sentimentData
    ?.map(item => ({
        // Access nested review_date correctly
        review_date: item.reviews?.[0]?.review_date as string,
        score: item.score
    }))
    // Filter out entries where review_date might be missing
    .filter(item => item.review_date)
    // Sort by date client-side if not done in query
    .sort((a, b) => new Date(a.review_date).getTime() - new Date(b.review_date).getTime())
    ?? []; // Provide empty array if data is null/undefined

  return (
    <div> {/* Wrap content in a div if needed */}
      <h1 className="text-2xl font-semibold mb-6">Overview</h1>
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-medium mb-3">Sentiment Trend</h2>
        {error && <p className="text-red-500">Error loading sentiment data.</p>}
        {!error && chartData.length > 0 && (
          <SentimentChart data={chartData} />
        )}
        {!error && chartData.length === 0 && (
          <p>No sentiment data available yet.</p>
        )}
      </div>
      {/* Add more overview components here later */}
    </div>
  );
}
