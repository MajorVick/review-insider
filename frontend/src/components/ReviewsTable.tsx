// src/components/ReviewsTable.tsx
"use client";

import { format } from "date-fns";
import { useState, useMemo } from "react";
import type { ReviewDisplayData } from "@/app/reviews/page";

interface ReviewsTableProps {
  initialReviews: ReviewDisplayData[];
  reviews: ReviewDisplayData[];
}

export default function ReviewsTable({ initialReviews }: ReviewsTableProps) {
  // State for filtering and sorting
  const [classification, setClassification] = useState<string>("all");
  const [sentimentRange, setSentimentRange] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("review_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique classifications for filter dropdown
  const classifications = useMemo(() => {
    const uniqueValues = new Set<string>();
    initialReviews.forEach((review) => {
      if (review.classification_label) {
        uniqueValues.add(review.classification_label);
      }
    });
    return Array.from(uniqueValues).sort();
  }, [initialReviews]);

  // Handle sorting
  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle direction if same field clicked
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, set default to descending for dates, ascending for others
      setSortField(field);
      setSortDirection(field === "review_date" ? "desc" : "asc");
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  // Create sort icon component
  const SortIcon = ({ field }: { field: string }) => {
    if (field !== sortField) return <span className="text-gray-300">↕</span>;
    return sortDirection === "asc" ? (
      <span className="text-blue-500">↑</span>
    ) : (
      <span className="text-blue-500">↓</span>
    );
  };

  // Apply filters and sorting to reviews
  const filteredAndSortedReviews = useMemo(() => {
    // Start with all reviews
    let result = [...initialReviews];

    // Apply classification filter
    if (classification !== "all") {
      result = result.filter(
        (r) => r.classification_label === classification
      );
    }

    // Apply sentiment range filter
    if (sentimentRange !== "all") {
      switch (sentimentRange) {
        case "low":
          result = result.filter(
            (r) => r.sentiment_score !== null && r.sentiment_score <= 2
          );
          break;
        case "medium":
          result = result.filter(
            (r) =>
              r.sentiment_score !== null &&
              r.sentiment_score > 2 &&
              r.sentiment_score < 4
          );
          break;
        case "high":
          result = result.filter(
            (r) => r.sentiment_score !== null && r.sentiment_score >= 4
          );
          break;
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      if (sortField === "review_date") {
        const dateA = a.review_date ? new Date(a.review_date).getTime() : 0;
        const dateB = b.review_date ? new Date(b.review_date).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortField === "sentiment_score") {
        const scoreA = a.sentiment_score ?? 0;
        const scoreB = b.sentiment_score ?? 0;
        comparison = scoreA - scoreB;
      } else if (sortField === "classification_label") {
        const labelA = a.classification_label ?? "";
        const labelB = b.classification_label ?? "";
        comparison = labelA.localeCompare(labelB);
      } else if (sortField === "rating") {
        const ratingA = a.metadata?.rating ?? 0;
        const ratingB = b.metadata?.rating ?? 0;
        comparison = ratingA - ratingB;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [
    initialReviews,
    classification,
    sentimentRange,
    sortField,
    sortDirection,
  ]);

  // Paginate the results
  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedReviews.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedReviews, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredAndSortedReviews.length / itemsPerPage);

  // Handle page changes
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (!initialReviews || initialReviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews</h3>
        <p className="mt-1 text-sm text-gray-500">
          No reviews found. Reviews will appear here once they are collected.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Filter controls */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4">
        <div className="w-full sm:w-auto">
          <label htmlFor="classification" className="block text-sm font-medium text-gray-700 mb-1">
            Classification
          </label>
          <select
            id="classification"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={classification}
            onChange={(e) => {
              setClassification(e.target.value);
              setCurrentPage(1); // Reset to first page
            }}
          >
            <option value="all">All Classifications</option>
            {classifications.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-auto">
          <label htmlFor="sentiment" className="block text-sm font-medium text-gray-700 mb-1">
            Sentiment
          </label>
          <select
            id="sentiment"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={sentimentRange}
            onChange={(e) => {
              setSentimentRange(e.target.value);
              setCurrentPage(1); // Reset to first page
            }}
          >
            <option value="all">All Sentiments</option>
            <option value="low">Low (1-2)</option>
            <option value="medium">Medium (2-4)</option>
            <option value="high">High (4-5)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("review_date")}
              >
                <div className="flex items-center">
                  Date <SortIcon field="review_date" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Review Text
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("sentiment_score")}
              >
                <div className="flex items-center">
                  Sentiment <SortIcon field="sentiment_score" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("classification_label")}
              >
                <div className="flex items-center">
                  Classification <SortIcon field="classification_label" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("rating")}
              >
                <div className="flex items-center">
                  Rating <SortIcon field="rating" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedReviews.map((review) => (
              <tr key={review.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {review.review_date
                    ? format(new Date(review.review_date), "PP")
                    : "N/A"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-md break-words">{review.text}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <SentimentBadge score={review.sentiment_score} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {review.classification_label ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {review.classification_label}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <RatingStars rating={review.metadata?.rating} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredAndSortedReviews.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {filteredAndSortedReviews.length}
                </span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                    currentPage === 1 ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  ←
                </button>
                
                {/* Page buttons logic */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Create a simple pagination with max 5 buttons
                  let pageNum;
                  
                  if (totalPages <= 5) {
                    // Show all pages if 5 or fewer
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    // Near the start
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    // Near the end
                    pageNum = totalPages - 4 + i;
                  } else {
                    // In the middle
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                    currentPage === totalPages ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  <span className="sr-only">Next</span>
                  →
                </button>
              </nav>
            </div>
          </div>
          
          {/* Mobile pagination */}
          <div className="flex w-full sm:hidden justify-between">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                currentPage === 1 ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              Previous
            </button>
            <p className="text-sm text-gray-700 py-2">
              Page {currentPage} of {totalPages}
            </p>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                currentPage === totalPages ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for sentiment score display
function SentimentBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-500">N/A</span>;

  let bgColor = "bg-gray-100 text-gray-800";
  if (score >= 4) bgColor = "bg-green-100 text-green-800";
  else if (score >= 3) bgColor = "bg-blue-100 text-blue-800";
  else if (score >= 2) bgColor = "bg-yellow-100 text-yellow-800";
  else bgColor = "bg-red-100 text-red-800";

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor}`}
    >
      {score.toFixed(1)}
    </span>
  );
}

// Helper component for star rating display
function RatingStars({ rating }: { rating?: number }) {
  if (!rating) return <span className="text-gray-500">N/A</span>;

  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "text-yellow-400" : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
