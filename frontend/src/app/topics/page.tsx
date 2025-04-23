// src/app/topics/page.tsx
import { supabase } from "@/lib/supabaseClient";
import TopicWordCloud from "@/components/TopicWordCloud";
import LoadingError from "@/components/LoadingError";
import { Suspense } from "react";

export type TopicData = {
  topic_id: string;
  label: string | null;
  count?: number; // Added for size weighting
};

// Word cloud type
export type WordCloudItem = {
  text: string;
  value: number;
  id?: string;
};

// Loading skeleton for word cloud
function WordCloudSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow h-[400px] flex items-center justify-center p-6 animate-pulse">
      <div className="text-center">
        <div className="h-8 bg-gray-200 rounded w-56 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-36 mx-auto"></div>
      </div>
    </div>
  );
}

// Component to fetch and prepare topic data
async function TopicsContent() {
  // Fetch distinct topics with count
  const { data, error } = await supabase
    .from("topics")
    .select("topic_id, label");

  if (error) {
    console.error("Error fetching topics:", error);
    return <LoadingError error={error} errorMessage="Failed to load topic data." />;
  }

  // Get a count for each topic (normally this would come from a join or count query)
  // This is a mock implementation - in a real app, we might have a count from the database
  const topicCounts = new Map<string, number>();
  data?.forEach(topic => {
    const label = topic.label ?? "Unknown";
    // Simulate having different frequencies
    topicCounts.set(label, (topicCounts.get(label) || 0) + Math.floor(Math.random() * 20) + 5);
  });

  // Prepare data for word cloud
  const wordCloudData: WordCloudItem[] = Array.from(topicCounts.entries())
    .map(([text, value]) => ({ text, value }))
    .filter(item => item.text !== "Unknown");

  if (wordCloudData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No topics found</h3>
        <p className="mt-1 text-sm text-gray-500">
          No topics have been extracted from reviews yet.
        </p>
      </div>
    );
  }

  return <TopicWordCloud words={wordCloudData} />;
}

export default function TopicsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Key Topics From Reviews</h1>
      <Suspense fallback={<WordCloudSkeleton />}>
        <TopicsContent />
      </Suspense>
    </div>
  );
}
