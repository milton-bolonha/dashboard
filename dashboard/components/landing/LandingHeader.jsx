"use client";

import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export function LandingHeader({ isSignedIn }) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ backgroundColor: "#fcfcf9" }}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo WebApp */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/logo-mark.svg"
              alt="WebApp"
              width={24}
              height={24}
            />
            <span className="text-xl font-semibold text-black">WebApp</span>
          </Link>

          {/* Botões Log in, Sign up e Help */}
          <div className="flex items-center space-x-3">
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-full text-sm font-semibold transition-colors"
                >
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="bg-black hover:bg-gray-800 text-white px-5 py-1.5 rounded-full text-sm font-semibold transition-colors">
                    Log in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-white border border-gray-300 text-black px-5 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors">
                    Sign up
                  </button>
                </SignUpButton>
                {/* Botão de Ajuda circular */}
                <button className="w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors">
                  <span className="text-sm font-semibold">?</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
