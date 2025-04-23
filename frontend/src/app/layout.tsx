// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import "react-loading-skeleton/dist/skeleton.css"; // Import skeleton CSS

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReviewInsight Pro",
  description: "AI-Powered Review Analysis Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full bg-gray-50`}>
        <Navbar />
        <main className="container mx-auto p-4 md:p-6 lg:p-8 pb-16">
          {children}
        </main>
      </body>
    </html>
  );
}
