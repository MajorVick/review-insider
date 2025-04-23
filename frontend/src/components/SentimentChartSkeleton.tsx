// src/components/SentimentChartSkeleton.tsx
import Skeleton from "react-loading-skeleton";

export default function SentimentChartSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <Skeleton width={150} height={24} />
        <Skeleton width={100} height={20} />
      </div>
      <div className="h-[300px] w-full">
        <Skeleton height="100%" />
      </div>
    </div>
  );
}
