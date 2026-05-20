import type { ToolDef } from "../types.js";

/**
 * Color conversion utilities. Covers HEX, RGB, HSL, and OKLCH (the modern
 * perceptually-uniform color space that ships in every browser since 2023).
 */

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): Rgb {
  const h = hex.replace(/^#/, "");
  const normalized =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const c = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rN:
        h = ((gN - bN) / d + (gN < bN ? 6 : 0)) * 60;
        break;
      case gN:
        h = ((bN - rN) / d + 2) * 60;
        break;
      case bN:
        h = ((rN - gN) / d + 4) * 60;
        break;
    }
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// sRGB → linear sRGB
function srgbToLinear(c: number): number {
  const c1 = c / 255;
  return c1 <= 0.04045 ? c1 / 12.92 : Math.pow((c1 + 0.055) / 1.055, 2.4);
}

// Linear sRGB → OKLab → OKLCH
function rgbToOklch({
  r,
  g,
  b,
}: Rgb): { l: number; c: number; h: number } {
  const lR = srgbToLinear(r);
  const lG = srgbToLinear(g);
  const lB = srgbToLinear(b);

  const l = 0.4122214708 * lR + 0.5363325363 * lG + 0.0514459929 * lB;
  const m = 0.2119034982 * lR + 0.6806995451 * lG + 0.1073969566 * lB;
  const s = 0.0883024619 * lR + 0.2817188376 * lG + 0.6299787005 * lB;

  const lCbrt = Math.cbrt(l);
  const mCbrt = Math.cbrt(m);
  const sCbrt = Math.cbrt(s);

  const L = 0.2104542553 * lCbrt + 0.793617785 * mCbrt - 0.0040720468 * sCbrt;
  const a = 1.9779984951 * lCbrt - 2.428592205 * mCbrt + 0.4505937099 * sCbrt;
  const bVal =
    0.0259040371 * lCbrt + 0.7827717662 * mCbrt - 0.808675766 * sCbrt;

  const chroma = Math.sqrt(a * a + bVal * bVal);
  let hue = (Math.atan2(bVal, a) * 180) / Math.PI;
  if (hue < 0) hue += 360;

  return {
    l: Math.round(L * 10000) / 100,
    c: Math.round(chroma * 1000) / 1000,
    h: Math.round(hue * 100) / 100,
  };
}

export const colorConvertTool: ToolDef = {
  name: "convert_color",
  description:
    "Convert a color between HEX, RGB, HSL, and OKLCH formats. Input as HEX (e.g. '#3B82F6'). Returns all formats in a single JSON object.",
  inputSchema: {
    type: "object",
    properties: {
      hex: {
        type: "string",
        description: "HEX color (3 or 6 digits, with or without leading #)",
      },
    },
    required: ["hex"],
    additionalProperties: false,
  },
  handler: (input) => {
    const hex = String(input.hex ?? "");
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb);
    const oklch = rgbToOklch(rgb);
    return JSON.stringify(
      {
        hex: rgbToHex(rgb),
        rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
        oklch: `oklch(${oklch.l}% ${oklch.c} ${oklch.h})`,
      },
      null,
      2,
    );
  },
};

export const colorTools: ToolDef[] = [colorConvertTool];
