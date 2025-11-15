type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeHex(input: string): string | null {
  const hex = input.trim().replace("#", "");
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return hex
      .split("")
      .map((digit) => digit + digit)
      .join("")
      .toLowerCase();
  }
  return null;
}

export function hexToRgb(hexColor: string): RGB | null {
  const hex = normalizeHex(hexColor);
  if (!hex) return null;
  const bigint = Number.parseInt(hex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function componentToHex(component: number): string {
  const clamped = clamp(Math.round(component), 0, 255);
  const hex = clamped.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}

export function rgbToHex({ r, g, b }: RGB): string {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

/**
 * Converts hex color to RGB string format (rgb(r, g, b))
 * If input is already RGB/RGBA format, returns as-is
 * Falls back to black if conversion fails
 */
export function hexToRgbString(color: string): string {
  // If already RGB/RGBA format, return as-is
  if (color.startsWith("rgb") || color.startsWith("rgba")) {
    return color;
  }
  
  const rgb = hexToRgb(color);
  if (!rgb) {
    return "rgb(0, 0, 0)"; // Fallback to black
  }
  
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const normalizedR = r / 255;
  const normalizedG = g / 255;
  const normalizedB = b / 255;

  const max = Math.max(normalizedR, normalizedG, normalizedB);
  const min = Math.min(normalizedR, normalizedG, normalizedB);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    switch (max) {
      case normalizedR:
        h =
          ((normalizedG - normalizedB) / delta +
            (normalizedG < normalizedB ? 6 : 0)) *
          60;
        break;
      case normalizedG:
        h = ((normalizedB - normalizedR) / delta + 2) * 60;
        break;
      case normalizedB:
        h = ((normalizedR - normalizedG) / delta + 4) * 60;
        break;
    }
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h,
    s,
    l,
  };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const hue = clamp(h, 0, 360);
  const saturation = clamp(s, 0, 1);
  const lightness = clamp(l, 0, 1);

  if (saturation === 0) {
    const gray = Math.round(lightness * 255);
    return { r: gray, g: gray, b: gray };
  }

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  const hk = hue / 360;
  const tr = hk + 1 / 3;
  const tg = hk;
  const tb = hk - 1 / 3;

  const convert = (tc: number) => {
    let temp = tc;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };

  return {
    r: Math.round(convert(tr) * 255),
    g: Math.round(convert(tg) * 255),
    b: Math.round(convert(tb) * 255),
  };
}

export function adjustLightness(hexColor: string, amount: number): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  const hsl = rgbToHsl(rgb);
  hsl.l = clamp(hsl.l + amount, 0, 1);
  return rgbToHex(hslToRgb(hsl));
}

export function mixColors(hexA: string, hexB: string, weight: number): string {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return hexA;
  const w = clamp(weight, 0, 1);
  return rgbToHex({
    r: rgbA.r * (1 - w) + rgbB.r * w,
    g: rgbA.g * (1 - w) + rgbB.g * w,
    b: rgbA.b * (1 - w) + rgbB.b * w,
  });
}

export function toRgba(hexColor: string, alpha: number): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return `rgba(0,0,0,${clamp(alpha, 0, 1)})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
}

export function getLuminance(hexColor: string): number {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 0;
  const normalize = (value: number) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  };
  const r = normalize(rgb.r);
  const g = normalize(rgb.g);
  const b = normalize(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastingTextColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor);
  // Use dark text (#000000) on light backgrounds (luminance > 0.5)
  // Use light text (#ffffff) on dark backgrounds (luminance <= 0.5)
  return luminance > 0.5 ? "#000000" : "#ffffff";
}
