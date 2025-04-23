// src/components/AlertsList.tsx
import { format } from "date-fns";
import type { AlertData } from "@/app/alerts/page";

interface AlertsListProps {
  alerts: AlertData[];
}

export default function AlertsList({ alerts }: AlertsListProps) {
  if (!alerts || alerts.length === 0) {
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No negative reviews
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          No negative reviews have been detected yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div
          key={alert.review_id}
          className="bg-white border-l-4 border-red-500 p-4 rounded-md shadow-sm hover:shadow transition-shadow"
        >
          <div className="flex justify-between items-center mb-2 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Score: {alert.score !== null ? alert.score.toFixed(1) : "N/A"}
            </span>
            <span className="text-xs text-gray-500">
              {alert.review_date
                ? format(new Date(alert.review_date), "PPp")
                : "N/A"}
            </span>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">
            {alert.text ?? "No text available."}
          </p>
        </div>
      ))}
    </div>
  );
}
