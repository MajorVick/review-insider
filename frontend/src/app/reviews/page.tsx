// src/app/reviews/page.tsx
import { supabase } from "@/lib/supabaseClient";
import ReviewsTable from "@/components/ReviewsTable";
import LoadingError from "@/components/LoadingError";
import { Suspense } from "react";

// Define types for nested relations and the final flattened structure
type Sentiment = { score: number | null } | null;
type Classification = { label: string | null } | null;
type ReviewRow = {
  id: string;
  text: string | null;
  review_date: string | null;
  metadata: any;
  sentiments?: Sentiment[] | Sentiment | null;
  classifications?: Classification[] | Classification | null;
};
export type ReviewDisplayData = {
  id: string;
  text: string | null;
  review_date: string | null;
  metadata: any;
  sentiment_score: number | null;
  classification_label: string | null;
};

// This component shows a skeleton while loading
function ReviewsTableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 w-64 bg-gray-200 rounded mb-4"></div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="h-12 bg-gray-100 border-b flex">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-1 h-full px-4 py-3">
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex border-b">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="flex-1 px-4 py-3">
                <div className="h-5 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// This component fetches and displays reviews
async function ReviewsContent() {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id,
      text,
      review_date,
      metadata,
      sentiments ( score ),
      classifications ( label )
    `
    )
    .order("review_date", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching reviews:", error);
    return <LoadingError error={error} errorMessage="Failed to load review data." />;
  }

  // Process data to flatten nested results
  const reviews: ReviewDisplayData[] =
    (data as ReviewRow[] | undefined)?.map((r) => ({
      id: r.id,
      text: r.text,
      review_date: r.review_date,
      metadata: r.metadata,
      sentiment_score: Array.isArray(r.sentiments)
        ? r.sentiments[0]?.score ?? null
        : (r.sentiments as Sentiment)?.score ?? null,
      classification_label: Array.isArray(r.classifications)
        ? r.classifications[0]?.label ?? null
        : (r.classifications as Classification)?.label ?? null,
    })) ?? [];

  return <ReviewsTable reviews={reviews} initialReviews={[]} />;
}

export default function ReviewsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Customer Reviews</h1>
      <Suspense fallback={<ReviewsTableSkeleton />}>
        <ReviewsContent />
      </Suspense>
    </div>
  );
}
