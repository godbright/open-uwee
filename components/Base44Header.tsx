"use client";

import Link from "next/link";
import { cn } from "@/utils/cn";
import AuthButton from "@/components/auth/AuthButton";

export default function Base44Header() {

  return (
    <>
      <header className="fixed top-16 left-1/2 transform -translate-x-1/2 w-[90%] rounded-full z-[101] bg-white border-b border-gray-200 px-10 py-24">
        <div className="w-full mx-auto ">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="flex items-center space-x-2">
                {/* Base44 Orange Icon */}
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <span className="text-xl font-semibold text-gray-900">
                  Base 44
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/product"
                className="text-gray-800 px-16 hover:text-gray-900 transition-colors duration-200"
              >
                Product
              </Link>
              <Link
                href="/resources"
                className="text-gray-800 px-16 hover:text-gray-900 transition-colors duration-200"
              >
                Resources
              </Link>
              <Link
                href="/pricing"
                className="text-gray-800 px-16 hover:text-gray-900 transition-colors duration-200"
              >
                Pricing
              </Link>
              <Link
                href="/enterprise"
                className="text-gray-800 px-16 hover:text-gray-900 transition-colors duration-200"
              >
                Enterprise
              </Link>
            </nav>

            {/* Right side - Authentication */}
            <div className="flex items-center space-x-4">
              <AuthButton />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
