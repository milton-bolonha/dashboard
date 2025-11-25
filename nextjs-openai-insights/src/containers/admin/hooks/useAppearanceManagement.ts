"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { Dashboard } from "@/lib/types/dashboard";
import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { computeAdeAppearanceTokens } from "@/lib/ade-theme";
import { hexToRgb, rgbToHex } from "@/lib/color";

const DEFAULT_BASE_COLOR = process.env.NEXT_PUBLIC_ADE_BASE_COLOR ?? "#f5f5f0";
const BASE_COLOR_STORAGE_KEY = "ade-base-color";
const APPEARANCE_STORAGE_KEY = "ade-appearance-tokens";

/**
 * Normalize color value to valid hex
 */
function normalizeColorValue(value: string): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return DEFAULT_BASE_COLOR;
  }
  const candidate = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const rgb = hexToRgb(candidate);
  if (!rgb) {
    return DEFAULT_BASE_COLOR;
  }
  const hex = rgbToHex(rgb);
  return hex && /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : DEFAULT_BASE_COLOR;
}

/**
 * Appearance management hook
 * Handles baseColor, appearance tokens, and persistence
 */
export function useAppearanceManagement(currentDashboard: Dashboard | null) {
  // Base color state with localStorage initialization
  const [baseColor, setBaseColorState] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_BASE_COLOR;
    }
    
    const stored = window.localStorage.getItem(BASE_COLOR_STORAGE_KEY);
    if (stored && stored.trim() && /^#[0-9A-Fa-f]{6}$/.test(stored.trim())) {
      const normalized = normalizeColorValue(stored);
      if (normalized && normalized !== "") {
        // Apply to body immediately
        if (document.body) {
          document.body.style.backgroundColor = normalized;
        }
        return normalized;
      }
    }
    
    // Apply default to body
    if (document.body) {
      document.body.style.backgroundColor = DEFAULT_BASE_COLOR;
    }
    
    // Save default to localStorage
    try {
      window.localStorage.setItem(BASE_COLOR_STORAGE_KEY, DEFAULT_BASE_COLOR);
    } catch {
      // Ignore storage errors
    }
    
    return DEFAULT_BASE_COLOR;
  });

  // Sync with localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(BASE_COLOR_STORAGE_KEY);
      if (stored && /^#[0-9A-Fa-f]{6}$/.test(stored)) {
        const normalized = normalizeColorValue(stored);
        if (normalized !== baseColor) {
          setBaseColorState(normalized);
          if (document.body) {
            document.body.style.backgroundColor = normalized;
          }
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute appearance tokens
  const appearanceTokens = useMemo<AdeAppearanceTokens>(() => {
    const safeBaseColor = baseColor && baseColor.trim() ? baseColor : DEFAULT_BASE_COLOR;

    // Try to load from localStorage first (for immediate access after F5)
    if (typeof window !== "undefined") {
      try {
        const storedAppearance = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
        if (storedAppearance) {
          const parsed = JSON.parse(storedAppearance) as Partial<AdeAppearanceTokens>;
          const parsedBaseColorNormalized = parsed.baseColor
            ? normalizeColorValue(parsed.baseColor)
            : null;
          const safeBaseColorNormalized =
            safeBaseColor && safeBaseColor !== DEFAULT_BASE_COLOR
              ? normalizeColorValue(safeBaseColor)
              : null;

          const baseColorMatches =
            safeBaseColorNormalized && parsedBaseColorNormalized
              ? parsedBaseColorNormalized === safeBaseColorNormalized
              : false;
          const baseColorIsEmpty =
            !safeBaseColorNormalized || safeBaseColor === DEFAULT_BASE_COLOR;
          const hasRequiredColors = parsed.sidebarColor && parsed.textColor;

          if (
            (baseColorMatches || (baseColorIsEmpty && parsedBaseColorNormalized)) &&
            hasRequiredColors
          ) {
            const fallbackTokens = computeAdeAppearanceTokens(
              parsedBaseColorNormalized || safeBaseColor
            );
            return {
              baseColor: parsedBaseColorNormalized || safeBaseColor,
              surfaceColor: parsed.surfaceColor || fallbackTokens.surfaceColor,
              sidebarColor: parsed.sidebarColor || fallbackTokens.sidebarColor,
              sidebarBorderColor: parsed.sidebarBorderColor || fallbackTokens.sidebarBorderColor,
              cardBorderColor: parsed.cardBorderColor || fallbackTokens.cardBorderColor,
              headingColor: parsed.headingColor || parsed.textColor || fallbackTokens.headingColor,
              textColor: parsed.textColor || fallbackTokens.textColor,
              mutedTextColor: parsed.mutedTextColor || fallbackTokens.mutedTextColor,
              actionColor: parsed.actionColor || fallbackTokens.actionColor,
              overlayColor: parsed.overlayColor || fallbackTokens.overlayColor,
            };
          }
        }
      } catch (e) {
        console.warn("[useAppearanceManagement] Failed to parse stored appearance:", e);
      }
    }

    // Use saved appearance from dashboard if available
    if (currentDashboard?.appearance && currentDashboard.appearance.baseColor) {
      const saved = currentDashboard.appearance;
      const fallbackTokens = computeAdeAppearanceTokens(safeBaseColor);
      return {
        baseColor: saved.baseColor || safeBaseColor,
        surfaceColor: saved.surfaceColor || fallbackTokens.surfaceColor,
        sidebarColor: saved.sidebarColor || fallbackTokens.sidebarColor,
        sidebarBorderColor: fallbackTokens.sidebarBorderColor,
        cardBorderColor: fallbackTokens.cardBorderColor,
        headingColor: saved.headingColor || saved.textColor || fallbackTokens.headingColor,
        textColor: saved.textColor || fallbackTokens.textColor,
        mutedTextColor: saved.mutedTextColor || fallbackTokens.mutedTextColor,
        actionColor: fallbackTokens.actionColor,
        overlayColor: fallbackTokens.overlayColor,
      };
    }

    // Calculate tokens if not saved
    const tokens = computeAdeAppearanceTokens(safeBaseColor);

    // Save to localStorage
    if (typeof window !== "undefined" && tokens.sidebarColor && tokens.textColor) {
      try {
        window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(tokens));
      } catch (e) {
        console.warn("[useAppearanceManagement] Failed to save appearance:", e);
      }
    }

    return tokens;
  }, [baseColor, currentDashboard?.appearance, currentDashboard?.id]);

  // Set base color with persistence
  const setBaseColor = useCallback((color: string) => {
    const normalized = normalizeColorValue(color);
    setBaseColorState(normalized);
    
    // Apply to body
    if (typeof window !== "undefined" && document.body) {
      document.body.style.backgroundColor = normalized;
    }
    
    // Save to localStorage
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(BASE_COLOR_STORAGE_KEY, normalized);
      } catch (e) {
        console.warn("[useAppearanceManagement] Failed to save base color:", e);
      }
    }
  }, []);

  // Reset to default
  const resetToDefault = useCallback(() => {
    setBaseColor(DEFAULT_BASE_COLOR);
  }, [setBaseColor]);

  return {
    baseColor,
    appearanceTokens,
    setBaseColor,
    resetToDefault,
  };
}
