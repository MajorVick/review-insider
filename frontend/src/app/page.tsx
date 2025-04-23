// src/app/page.tsx
import { supabase } from "@/lib/supabaseClient";
import SentimentChart from "@/components/SentimentChart";
import LoadingError from "@/components/LoadingError";
import SentimentChartSkeleton from "@/components/SentimentChartSkeleton";
import { Suspense } from "react";

type SentimentDataPoint = {
  review_date: string;
  score: number | null;
};

// This component fetches and displays the sentiment data
async function SentimentData() {
  // Fetch data directly in the Server Component
  const { data: sentimentData, error } = await supabase
    .from("sentiments")
    .select(`
      score,
      reviews ( review_date )
    `)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("Error fetching sentiment data:", error);
    return <LoadingError error={error} errorMessage="Failed to load sentiment trend data." />;
  }

  // Process data for the chart
  const chartData = sentimentData
    ?.map((item) => ({
      review_date: Array.isArray(item.reviews) && item.reviews.length > 0
        ? item.reviews[0].review_date
        : null,
      score: item.score,
    }))
    .filter((item) => item.review_date)
    .sort(
      (a, b) =>
        new Date(a.review_date).getTime() - new Date(b.review_date).getTime()
    ) ?? [];

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <p className="text-gray-600">No sentiment data available yet.</p>
        <p className="text-sm text-gray-500 mt-2">
          Sentiment data will appear here once reviews are processed.
        </p>
      </div>
    );
  }

  return <SentimentChart data={chartData} />;
}

export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard Overview</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-medium mb-4">Sentiment Trend</h2>
        <Suspense fallback={<SentimentChartSkeleton />}>
          <SentimentData />
        </Suspense>
      </div>

      {/* Stats summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Total Reviews</h3>
          <p className="text-3xl font-bold mt-2">-</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Avg. Sentiment</h3>
          <p className="text-3xl font-bold mt-2">-</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Top Topic</h3>
          <p className="text-3xl font-bold mt-2">-</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Negative Alerts</h3>
          <p className="text-3xl font-bold mt-2">-</p>
        </div>
      </div>
    </div>
  );
}
