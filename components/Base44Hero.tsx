"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { ArrowUp } from "lucide-react";
import { Button } from "./ui/button";

const suggestionChips = [
  "Build a landing for my coffee shop",
  "Build a portfolio",
  "Create a blog platform",
  "Design an e-commerce store",
  "Develop a social media app",
];

export default function Base44Hero() {
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Navigate to generation page with the user input
      const encodedInput = encodeURIComponent(inputValue.trim());
      router.push(`/generation?prompt=${encodedInput}`);
    } catch (error) {
      console.error("Error navigating to generation:", error);
      setIsSubmitting(false);
    }
  };

  const handleChipClick = (chip: string) => {
    setInputValue(chip);
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-orange-100">
        {/* Additional gradient overlays for more complex effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-50/30 to-orange-200/40"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-100/20 via-transparent to-orange-300/30"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-normal text-gray-900 mb-6 leading-tight">
            Let's make your dream a{" "}
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-500 bg-clip-text text-transparent font-normal">
              reality.
            </span>
            <br />
            Right now.
          </h1>

          {/* Description */}
          <p className=" text-gray-700 mt-4 mb-4 max-w-2xl mx-auto leading-relaxed">
            Base44 lets you build fully-functional apps in minutes with just
            your words.
          </p>
          <p className=" text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed">
            No coding necessary.
          </p>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mb-8">
            <div className="relative h-[200px] bg-gradient-to-br from-blue-50 via-purple-50 backdrop-blur-md rounded-lg shadow-lg p-10">
              <textarea
                // type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="What do you want to build?"
                disabled={isSubmitting}
                className="w-full h-96 rounded-lg p-10 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-sm text-gray-900 text-[14px] !placeholder:text-[14px] placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isSubmitting}
                className="absolute right-16 top-64 bg-orange-500 rounded-lg w-[35px] h-[35px] flex items-center justify-center"
              >
                <ArrowUp size={18} />
              </button>
              <p className="text-gray-600 text-start mb-4 text-sm">
                Not sure where to start? Try one of these:
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-16 overflow-auto">
                {/* // style={{ border: "1px solid #111827ee" }} */}
                {suggestionChips.map((chip, index) => (
                  <button
                    key={index}
                    onClick={() => handleChipClick(chip)}
                    disabled={isSubmitting}
                    className="px-4 py-2 mx-4 text-sm rounded-full border-2 border-gray-600 text-gray-800 bg-white hover:bg-gray-50 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Suggestion Text */}

          {/* Suggestion Chips */}

          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            {/* User Avatars */}
            {/* <div className="flex -space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full border-2 border-white"></div>
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white"></div>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full border-2 border-white"></div>
            </div> */}
            {/* <span className="text-sm font-medium">Trusted by 400K+ users</span> */}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      {/* <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-300/20 rounded-full blur-xl"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-purple-300/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-40 left-20 w-24 h-24 bg-orange-300/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-blue-300/20 rounded-full blur-xl"></div> */}
    </section>
  );
}
