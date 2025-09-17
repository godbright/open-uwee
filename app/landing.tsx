"use client";

import Base44Header from "@/components/Base44Header";
import Base44Hero from "@/components/Base44Hero";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Base44Header />

      {/* Hero Section */}
      <Base44Hero />
    </div>
  );
}
