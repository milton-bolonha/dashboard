import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Header({
  breadcrumb,
  workspaceName,
  onRefresh,
  onSave,
}) {
  const { isSignedIn } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave?.();
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  return (
    <header
      className="flex-shrink-0"
      style={{ height: "72px", background: "#fcfcf9" }}
    >
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-4">
          {/* Breadcrumb */}
          <div className="font-semibold text-breadcrumb-text text-[16px]">
            {breadcrumb}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Dashboard Actions */}
          <div className="flex items-center space-x-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh Dashboard"
            >
              <Image
                src="/images/reset.svg"
                width={20}
                height={20}
                alt="Refresh"
                className={isRefreshing ? "animate-spin" : ""}
              />
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Save Changes"
            >
              <Image
                src="/images/save-icon.svg"
                width={20}
                height={20}
                alt="Save"
                className={isSaving ? "animate-pulse" : ""}
              />
            </button>

            {/* Dashboard Templates Dropdown */}
            <div className="relative">
              <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <span>Templates</span>
                <Image
                  src="/images/down-arrow.svg"
                  width={12}
                  height={12}
                  alt="Dropdown"
                />
              </button>
            </div>
          </div>

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
