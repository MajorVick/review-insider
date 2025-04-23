// src/app/alerts/page.tsx
"use client"; // <-- Add this line

import { supabase } from '@/lib/supabaseClient';
import AlertsList from '@/components/AlertsList';
import { useState, useEffect } from 'react'; // <-- Import hooks
import { RealtimeChannel } from '@supabase/supabase-js'; // Import type for channel

// Keep the type definition
type AlertData = {
  review_id: string;
  text: string | null;
  review_date: string | null;
  score: number | null;
};

export default function AlertsPage() {
  const NEGATIVE_THRESHOLD = 2;
  const [alerts, setAlerts] = useState<AlertData[]>([]); // State for alerts
  const [loading, setLoading] = useState(true); // State for loading
  const [error, setError] = useState<string | null>(null); // State for errors

  // Function to fetch alerts
  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    console.log("Fetching initial alerts...");
    const { data, error: fetchError } = await supabase
      .from('sentiments')
      .select(`
        score,
        reviews!inner ( id, text, review_date )
      `) // Use !inner join to ensure review exists
      .lte('score', NEGATIVE_THRESHOLD)
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchError) {
      console.error("Error fetching alerts:", fetchError);
      setError("Failed to load alerts.");
      setAlerts([]);
    } else {
      const processedAlerts: AlertData[] = data?.map(item => ({
        // Access nested data directly due to !inner join
        review_id: item.reviews[0]?.id as string,
        text: item.reviews[0]?.text ?? null,
        review_date: item.reviews[0]?.review_date ?? null,
        score: item.score
      })) ?? [];
      console.log("Fetched alerts:", processedAlerts);
      setAlerts(processedAlerts);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Fetch initial data on component mount
    fetchAlerts();

    // --- Set up Realtime Subscription ---
    console.log("Setting up Supabase Realtime subscription...");
    const channel: RealtimeChannel = supabase
      .channel('sentiments-alerts-channel') // Unique channel name
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Listen for new rows
          schema: 'public',
          table: 'sentiments',
          // Filter server-side for efficiency (optional but good practice)
          // This requires RLS to be set up correctly for the anon key to read,
          // or relies on the insert happening with data visible to anon key.
          // Alternatively, filter client-side after receiving the payload.
          // filter: `score=lte.${NEGATIVE_THRESHOLD}` // Example server-side filter
        },
        async (payload) => {
          console.log('Realtime INSERT received:', payload);
          const newSentiment = payload.new as { score: number; review_id: string };

          // Check if the new sentiment meets the threshold
          if (newSentiment.score <= NEGATIVE_THRESHOLD) {
            console.log(`New negative sentiment detected (score: ${newSentiment.score}), fetching details...`);
            // Fetch the associated review details for the new alert
            const { data: reviewData, error: reviewError } = await supabase
              .from('reviews')
              .select('id, text, review_date')
              .eq('id', newSentiment.review_id)
              .single(); // Fetch the single review

            if (reviewError) {
              console.error("Error fetching review details for new alert:", reviewError);
            } else if (reviewData) {
              const newAlert: AlertData = {
                review_id: reviewData.id,
                text: reviewData.text,
                review_date: reviewData.review_date,
                score: newSentiment.score,
              };
              console.log("Adding new alert to state:", newAlert);
              // Add the new alert to the beginning of the list (prepend)
              setAlerts((currentAlerts) => [newAlert, ...currentAlerts]);
            }
          }
        }
      )
      .subscribe((status, err) => {
         if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to sentiments channel!');
         }
         if (status === 'CHANNEL_ERROR') {
            console.error('Realtime channel error:', err);
            setError('Realtime connection failed.');
         }
         if (status === 'TIMED_OUT') {
            console.warn('Realtime connection timed out.');
            setError('Realtime connection timed out.');
         }
      });

    // Cleanup function to remove the subscription when the component unmounts
    return () => {
      console.log("Unsubscribing from Supabase Realtime channel...");
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Negative Experience Alerts (Score &lt;= {NEGATIVE_THRESHOLD})</h1>
      {loading && <p>Loading alerts...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && <AlertsList alerts={alerts} />}
    </div>
  );
}
