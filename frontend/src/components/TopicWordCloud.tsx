"use client";

import { useCallback, useEffect, useState } from "react";
import ReactWordcloud, { Scale, Spiral } from "react-wordcloud";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/scale.css";
import { WordCloudItem } from "@/app/topics/page";

interface TopicWordCloudProps {
  words: WordCloudItem[];
}

export default function TopicWordCloud({ words = [] }: TopicWordCloudProps) {
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch by rendering word cloud only on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Callback for topic click
  const getCallback = useCallback((callback: any) => {
    return (word: any, event: any) => {
      console.log(`"${word.text}" was clicked:`, word);
      // Could add functionality to filter reviews by topic
    };
  }, []);

  // Word cloud options
  const options = {
    colors: ["#3b82f6", "#0ea5e9", "#14b8a6", "#6366f1", "#8b5cf6", "#ec4899"],
    enableTooltip: true,
    deterministic: false,
    fontFamily: "Inter, sans-serif",
    fontSizes: [16, 60] as [number, number], // min/max font size
    fontStyle: "normal",
    fontWeight: "bold",
    padding: 1,
    rotations: 3,
    rotationAngles: [0, 0] as [number, number], // Disable rotation for better readability
    scale: "log" as Scale, // log or linear
    spiral: "archimedean" as Spiral, // Spiral is a type, not an enum
    transitionDuration: 500,
  };

  // Callbacks for interactivity
  const callbacks = {
    onWordClick: getCallback("onWordClick"),
    getWordTooltip: (word: WordCloudItem) => `${word.text}: ${word.value} mentions`,
  };

  // Check if we're on client and have valid data
  if (!isClient) {
    return (
      <div className="bg-white rounded-lg shadow h-[400px] flex items-center justify-center">
        <p className="text-gray-500">Loading word cloud...</p>
      </div>
    );
  }

  // Additional check for empty words array
  if (!words || words.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow h-[400px] flex items-center justify-center">
        <p className="text-gray-500">No topic data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="h-[400px]">
        <ReactWordcloud words={words} options={options} callbacks={callbacks} />
      </div>
    </div>
  );
}