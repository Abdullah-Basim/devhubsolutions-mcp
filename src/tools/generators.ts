import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import type { ToolDef } from "../types.js";

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{}<>?";

export const passwordGenerateTool: ToolDef = {
  name: "generate_password",
  description:
    "Generate cryptographically secure random passwords using Node's crypto.randomBytes. Configurable length, character classes, and bulk count.",
  inputSchema: {
    type: "object",
    properties: {
      length: {
        type: "integer",
        minimum: 4,
        maximum: 128,
        default: 20,
        description: "Password length (4-128, recommended 16+)",
      },
      includeUppercase: { type: "boolean", default: true },
      includeNumbers: { type: "boolean", default: true },
      includeSymbols: { type: "boolean", default: true },
      count: {
        type: "integer",
        minimum: 1,
        maximum: 30,
        default: 1,
        description: "Number of passwords to generate",
      },
    },
    additionalProperties: false,
  },
  handler: (input) => {
    const length = Math.min(
      Math.max(Math.floor(Number(input.length ?? 20)), 4),
      128,
    );
    const includeUppercase = input.includeUppercase !== false;
    const includeNumbers = input.includeNumbers !== false;
    const includeSymbols = input.includeSymbols !== false;
    const count = Math.min(
      Math.max(Math.floor(Number(input.count ?? 1)), 1),
      30,
    );

    let charset = LOWER;
    if (includeUppercase) charset += UPPER;
    if (includeNumbers) charset += DIGITS;
    if (includeSymbols) charset += SYMBOLS;

    const passwords: string[] = [];
    for (let n = 0; n < count; n++) {
      const bytes = randomBytes(length);
      let pwd = "";
      for (let i = 0; i < length; i++) {
        const byte = bytes[i] ?? 0;
        pwd += charset[byte % charset.length];
      }
      passwords.push(pwd);
    }
    return passwords.join("\n");
  },
};

export const qrCodeTool: ToolDef = {
  name: "generate_qr",
  description:
    "Generate a QR code for any text or URL. Returns either an SVG string (default) or a Base64-encoded PNG data URI.",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "Text or URL to encode (max ~3KB practical)",
      },
      format: {
        type: "string",
        enum: ["svg", "png"],
        default: "svg",
      },
      errorCorrectionLevel: {
        type: "string",
        enum: ["L", "M", "Q", "H"],
        default: "M",
        description:
          "Error correction level: L=7%, M=15%, Q=25%, H=30% recoverable",
      },
      darkColor: {
        type: "string",
        default: "#000000",
        description: "Foreground color (hex)",
      },
      lightColor: {
        type: "string",
        default: "#ffffff",
        description: "Background color (hex)",
      },
    },
    required: ["text"],
    additionalProperties: false,
  },
  handler: async (input) => {
    const text = String(input.text ?? "");
    if (!text) throw new Error("text is required and cannot be empty");
    const format = input.format === "png" ? "png" : "svg";
    const ecl = (input.errorCorrectionLevel as "L" | "M" | "Q" | "H") ?? "M";
    const dark = String(input.darkColor ?? "#000000");
    const light = String(input.lightColor ?? "#ffffff");

    const options = {
      errorCorrectionLevel: ecl,
      color: { dark, light },
    };

    if (format === "png") {
      return await QRCode.toDataURL(text, options);
    }
    return await QRCode.toString(text, { ...options, type: "svg" });
  },
};

export const generatorTools: ToolDef[] = [passwordGenerateTool, qrCodeTool];
