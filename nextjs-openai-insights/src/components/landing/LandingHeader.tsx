"use client";

import Link from "next/link";
import Image from "next/image";

interface LandingHeaderProps {
  onHelpClick?: () => void;
  onLogin?: () => void;
  onSignUp?: () => void;
}

export function LandingHeader({
  onHelpClick,
  onLogin,
  onSignUp,
}: LandingHeaderProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ backgroundColor: "#fcfcf9" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-2 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/images/logo-mark.svg"
            alt="WebApp"
            width={24}
            height={24}
            priority
          />
          <span className="text-xl font-semibold text-black">WebApp</span>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={onLogin}
            className="rounded-full bg-black px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Log in
          </button>
          <button
            onClick={onSignUp}
            className="rounded-full border border-gray-300 bg-white px-5 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-gray-50"
          >
            Sign up
          </button>
          <button
            onClick={onHelpClick}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-50"
            aria-label="Ajuda"
          >
            <span className="text-sm font-semibold">?</span>
          </button>
        </div>
      </div>
    </header>
  );
}
