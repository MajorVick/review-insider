// src/components/SentimentChart.tsx
"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";

// Register necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

type SentimentDataPoint = {
  review_date: string;
  score: number | null;
};

interface SentimentChartProps {
  data: SentimentDataPoint[];
}

export default function SentimentChart({ data }: SentimentChartProps) {
  const chartData = {
    labels: data.map((d) => new Date(d.review_date)),
    datasets: [
      {
        label: "Sentiment Score",
        data: data.map((d) => d.score),
        fill: false,
        borderColor: "rgb(59, 130, 246)", // Blue
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.2,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "rgb(59, 130, 246)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "day" as const,
          tooltipFormat: "PPP", // Format for tooltips (e.g., Apr 23, 2025)
          displayFormats: {
            day: "MMM d", // Format for axis labels (e.g., Apr 23)
          },
        },
        title: {
          display: true,
          text: "Date",
          color: "#64748b", // Slate-500
          font: {
            size: 13,
          },
        },
        grid: {
          display: true,
          color: "rgba(226, 232, 240, 0.5)", // Slate-200 with opacity
        },
        ticks: {
          color: "#64748b", // Slate-500
        },
      },
      y: {
        beginAtZero: false,
        min: 1,
        max: 5,
        title: {
          display: true,
          text: "Sentiment Score (1-5)",
          color: "#64748b", // Slate-500
          font: {
            size: 13,
          },
        },
        grid: {
          color: "rgba(226, 232, 240, 0.5)", // Slate-200 with opacity
        },
        ticks: {
          precision: 0,
          stepSize: 1,
          color: "#64748b", // Slate-500
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: "circle",
          color: "#475569", // Slate-600
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.8)", // Slate-900 with opacity
        titleColor: "#f8fafc", // Slate-50
        bodyColor: "#f1f5f9", // Slate-100
        cornerRadius: 6,
        padding: 10,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            // Format the date in the tooltip title
            const date = new Date(context[0].label);
            return date.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          },
          label: (context: any) => {
            return `Sentiment Score: ${context.raw}`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <div className="h-[300px] relative">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
}
