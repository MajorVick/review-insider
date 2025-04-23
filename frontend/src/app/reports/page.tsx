// src/app/reports/page.tsx
import { supabase } from "@/lib/supabaseClient";
import ReportDisplay from "@/components/ReportDisplay";
import LoadingError from "@/components/LoadingError";
import { Suspense } from "react";
import Skeleton from "react-loading-skeleton";

// Export type if needed by ReportDisplay or others
export type ReportData = {
  id: string;
  summary_text: string | null;
  generated_at: string | null;
};

// Loading skeleton for report
function ReportSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Skeleton width={180} height={20} className="mb-4" />
      <Skeleton count={10} className="my-1" />
    </div>
  );
}

// Component to fetch and display report
async function ReportContent() {
  // Fetch the single most recent summary
  const { data: report, error } = await supabase
    .from("weekly_summaries")
    .select("id, summary_text, generated_at")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching report:", error);
    return <LoadingError error={error} errorMessage="Failed to load weekly report." />;
  }

  if (!report) {
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No report available</h3>
        <p className="mt-1 text-sm text-gray-500">
          No weekly report has been generated yet. Reports are automatically generated
          once sufficient data is collected.
        </p>
      </div>
    );
  }

  return <ReportDisplay report={report} />;
}

export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Weekly Analysis Report</h1>
      <Suspense fallback={<ReportSkeleton />}>
        <ReportContent />
      </Suspense>
    </div>
  );
}
