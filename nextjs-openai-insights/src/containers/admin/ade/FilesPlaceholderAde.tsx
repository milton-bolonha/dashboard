import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { hexToRgbString } from "@/lib/color";

interface FilesPlaceholderAdeProps {
  appearance: AdeAppearanceTokens;
}

export function FilesPlaceholderAde({ appearance }: FilesPlaceholderAdeProps) {
  // Use saved values from appearance directly (like AI Insight Tiles does)
  // Fallback to defaults if not available (backward compatibility)
  // Convert to RGB format for consistency (React converts some hex to RGB automatically)
  const headingColorHex = appearance?.headingColor || "#1f1f1f";
  const headingColor = hexToRgbString(headingColorHex);
  const textColor = appearance?.textColor || "#2c2c2c";
  const cardBorder = appearance?.cardBorderColor || "#d9d9d9";
  const surfaceColor = appearance?.surfaceColor || "#ffffff";

  return (
    <section className="space-y-4" suppressHydrationWarning>
      <header>
        <h3
          className="text-lg font-semibold"
          style={{ color: headingColor }}
          suppressHydrationWarning
        >
          Files & Assets
        </h3>
      </header>

      <div
        className="flex w-fit space-x-1 rounded-full p-1 text-sm font-medium"
        style={{ backgroundColor: "rgba(0,0,0,0.05)", color: textColor }}
        suppressHydrationWarning
      >
        <button className="flex items-center space-x-2 rounded-full bg-white px-3 py-2 text-black shadow-sm">
          <span>Documents</span>
        </button>
        <button className="flex items-center space-x-2 rounded-full px-3 py-2 transition hover:text-black">
          <span>Images</span>
        </button>
        <button className="flex items-center space-x-2 rounded-full px-3 py-2 transition hover:text-black">
          <span>Archives</span>
        </button>
      </div>

      <div
        className="rounded-xl border-2 border-dashed px-6 py-10 text-center text-sm"
        suppressHydrationWarning
        style={{
          borderColor: cardBorder,
          color: textColor,
          backgroundColor: surfaceColor,
        }}
      >
        Drag & drop to upload (10 MB max). Cloudinary integration coming soon.
      </div>
    </section>
  );
}
