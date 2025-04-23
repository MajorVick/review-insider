// src/app/alerts/page.tsx
import { supabase } from '@/lib/supabaseClient';
import AlertsList from '@/components/AlertsList'; // Create this next

type AlertData = {
  review_id: string;
  text: string | null;
  review_date: string | null;
  score: number | null;
};

export default async function AlertsPage() {
  const NEGATIVE_THRESHOLD = 2; // Define your threshold

  // Fetch reviews with sentiment score <= threshold
  const { data, error } = await supabase
    .from('sentiments')
    .select(`
      score,
      reviews ( id, text, review_date )
    `)
    .lte('score', NEGATIVE_THRESHOLD) // Filter by score less than or equal to threshold
    .order('created_at', { ascending: false }) // Show newest alerts first
    .limit(50);

  if (error) {
    console.error("Error fetching alerts:", error);
  }

  // Process data
  const alerts: AlertData[] = data?.map(item => ({
    review_id: item.reviews?.[0]?.id as string, // Access first review in the array
    text: item.reviews?.[0]?.text ?? null,
    review_date: item.reviews?.[0]?.review_date ?? null,
    score: item.score
  }))
  .filter(item => item.review_id) // Filter out any potential nulls if relation failed
  ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Negative Experience Alerts (Score &lt;= {NEGATIVE_THRESHOLD})</h1>
      {error && <p className="text-red-500">Error loading alerts.</p>}
      {!error && <AlertsList alerts={alerts} />}
      {/* TODO: Implement real-time updates via Supabase subscriptions */}
    </div>
  );
}
