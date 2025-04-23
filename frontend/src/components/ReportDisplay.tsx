// src/components/ReportDisplay.tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";
import type { ReportData } from "@/app/reports/page";

interface ReportDisplayProps {
  report: ReportData;
}

export default function ReportDisplay({ report }: ReportDisplayProps) {
  if (!report?.summary_text) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <p className="text-gray-500 italic">Report content is empty.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <div className="mb-6 flex items-center border-b pb-4">
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          <svg
            className="h-6 w-6 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-medium text-gray-800">Weekly Report</h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Generated on:{" "}
            {report.generated_at
              ? format(new Date(report.generated_at), "PPPp")
              : "Unknown date"}
          </p>
        </div>
      </div>

      <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:text-gray-800 prose-a:text-blue-600">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {report.summary_text}
        </ReactMarkdown>
      </div>
    </div>
  );
}
