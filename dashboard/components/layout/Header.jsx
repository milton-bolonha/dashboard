import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export default function Header({ breadcrumb, workspaceName }) {
  const { isSignedIn } = useUser();

  return (
    <header className="bg-main-bg flex-shrink-0" style={{ height: "72px" }}>
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-4">
          {/* Breadcrumb */}
          <div className="font-semibold text-breadcrumb-text text-[16px]">
            {breadcrumb}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Auth Buttons */}
          {!isSignedIn && (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-semibold bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="text-sm font-semibold border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
