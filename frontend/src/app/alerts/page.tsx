// src/app/alerts/page.tsx
"use client";

import { supabase } from "@/lib/supabaseClient";
import AlertsList from "@/components/AlertsList";
import LoadingError from "@/components/LoadingError";
import { useState, useEffect } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import Skeleton from "react-loading-skeleton";

// Keep the type definition
export type AlertData = {
  review_id: string;
  text: string | null;
  review_date: string | null;
  score: number | null;
};

export default function AlertsPage() {
  const NEGATIVE_THRESHOLD = 2;
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connecting" | "connected" | "error" | null
  >("connecting");

  // Function to fetch alerts
  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    console.log("Fetching initial alerts...");
    // Define types for the response structure
    type ReviewEmbed = { id: string; text: string | null; review_date: string | null };
    type SentimentWithReview = { score: number | null; reviews: ReviewEmbed[] };

    const { data, error: fetchError } = await supabase
      .from("sentiments")
      .select(
        `
        score,
        reviews!inner ( id, text, review_date )
      `
      )
      .lte("score", NEGATIVE_THRESHOLD)
      .order("created_at", { ascending: false })
      .limit(50);

    if (fetchError) {
      console.error("Error fetching alerts:", fetchError);
      setError("Failed to load alerts. Please try again later.");
      setAlerts([]);
    } else {
      const processedAlerts: AlertData[] =
        (data as SentimentWithReview[] | null)
          ?.filter((item) => item.reviews && item.reviews.length > 0) // Ensure reviews array exists and has items
          .map((item) => ({
            review_id: item.reviews[0].id as string,
            text: item.reviews[0].text ?? null,
            review_date: item.reviews[0].review_date ?? null,
            score: item.score,
          })) ?? [];
      console.log("Fetched alerts:", processedAlerts);
      setAlerts(processedAlerts);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Fetch initial data on component mount
    fetchAlerts();

    // Set up Realtime Subscription
    console.log("Setting up Supabase Realtime subscription...");
    const channel: RealtimeChannel = supabase
      .channel("sentiments-alerts-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sentiments",
        },
        async (payload) => {
          console.log("Realtime INSERT received:", payload);
          const newSentiment = payload.new as { score: number; review_id: string };

          // Check if the new sentiment meets the threshold
          if (newSentiment.score <= NEGATIVE_THRESHOLD) {
            console.log(
              `New negative sentiment detected (score: ${newSentiment.score}), fetching details...`
            );
            // Fetch the associated review details for the new alert
            const { data: reviewData, error: reviewError } = await supabase
              .from("reviews")
              .select("id, text, review_date")
              .eq("id", newSentiment.review_id)
              .single();

            if (reviewError) {
              console.error(
                "Error fetching review details for new alert:",
                reviewError
              );
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
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to sentiments channel!");
          setRealtimeStatus("connected");
        }
        if (status === "CHANNEL_ERROR") {
          console.error("Realtime channel error:", err);
          setRealtimeStatus("error");
        }
        if (status === "TIMED_OUT") {
          console.warn("Realtime connection timed out.");
          setRealtimeStatus("error");
        }
      });

    // Cleanup function to remove the subscription when the component unmounts
    return () => {
      console.log("Unsubscribing from Supabase Realtime channel...");
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        Negative Experience Alerts
      </h1>
      <p className="text-gray-600 mb-6">
        Displaying reviews with sentiment score below or equal to {NEGATIVE_THRESHOLD}.
      </p>
      
      {/* Realtime connection status */}
      {realtimeStatus && (
        <div 
          className={`mb-4 px-4 py-2 rounded-md text-sm flex items-center ${
            realtimeStatus === "connected" 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : realtimeStatus === "connecting" 
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <div className={`h-2 w-2 rounded-full mr-2 ${
            realtimeStatus === "connected" 
              ? "bg-green-500" 
              : realtimeStatus === "connecting" 
                ? "bg-blue-500"
                : "bg-red-500"
          }`}></div>
          {realtimeStatus === "connected" && "Realtime updates active"}
          {realtimeStatus === "connecting" && "Connecting to realtime updates..."}
          {realtimeStatus === "error" && "Realtime connection failed. Alerts may be delayed."}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-2">
                <Skeleton width={80} height={20} />
                <Skeleton width={120} height={16} />
              </div>
              <Skeleton count={2} height={16} />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      <LoadingError error={error} />

      {/* Content */}
      {!loading && !error && <AlertsList alerts={alerts} />}
    </div>
  );
}
