import type { ToolDef } from "../types.js";

/**
 * Base64 encode/decode with full UTF-8 support — browser's `btoa` chokes on
 * non-Latin-1 input, so we round-trip through TextEncoder/TextDecoder.
 */

function encodeBase64(text: string, urlSafe: boolean): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  let out = Buffer.from(binary, "binary").toString("base64");
  if (urlSafe) {
    out = out.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return out;
}

function decodeBase64(input: string, urlSafe: boolean): string {
  let s = input.trim();
  if (urlSafe) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4 !== 0) s += "=";
  }
  const bytes = Uint8Array.from(Buffer.from(s, "base64"));
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export const base64EncodeTool: ToolDef = {
  name: "base64_encode",
  description:
    "Base64-encode a UTF-8 string. Set urlSafe=true for Base64url (JWT-style, no `+`, `/`, or `=` padding).",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "Text to encode" },
      urlSafe: {
        type: "boolean",
        description: "Use Base64url encoding (URL-safe characters, no padding)",
        default: false,
      },
    },
    required: ["text"],
    additionalProperties: false,
  },
  handler: (input) => {
    const text = String(input.text ?? "");
    const urlSafe = Boolean(input.urlSafe ?? false);
    return encodeBase64(text, urlSafe);
  },
};

export const base64DecodeTool: ToolDef = {
  name: "base64_decode",
  description:
    "Decode a Base64 string to UTF-8 text. Set urlSafe=true if the input uses Base64url encoding.",
  inputSchema: {
    type: "object",
    properties: {
      input: { type: "string", description: "Base64 or Base64url string" },
      urlSafe: {
        type: "boolean",
        description: "Input uses Base64url encoding",
        default: false,
      },
    },
    required: ["input"],
    additionalProperties: false,
  },
  handler: (input) => {
    const raw = String(input.input ?? "");
    const urlSafe = Boolean(input.urlSafe ?? false);
    return decodeBase64(raw, urlSafe);
  },
};

export const urlEncodeTool: ToolDef = {
  name: "url_encode",
  description:
    "URL-encode a string. mode='component' (default) encodes for query params; mode='uri' preserves URL structural characters (/, ?, &, #).",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "Text to encode" },
      mode: {
        type: "string",
        enum: ["component", "uri"],
        default: "component",
      },
    },
    required: ["text"],
    additionalProperties: false,
  },
  handler: (input) => {
    const text = String(input.text ?? "");
    const mode = input.mode === "uri" ? "uri" : "component";
    return mode === "uri" ? encodeURI(text) : encodeURIComponent(text);
  },
};

export const urlDecodeTool: ToolDef = {
  name: "url_decode",
  description:
    "Decode a URL-encoded string. mode='component' decodes percent-encoded sequences; mode='uri' decodes a full URI.",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "Encoded text to decode" },
      mode: {
        type: "string",
        enum: ["component", "uri"],
        default: "component",
      },
    },
    required: ["text"],
    additionalProperties: false,
  },
  handler: (input) => {
    const text = String(input.text ?? "");
    const mode = input.mode === "uri" ? "uri" : "component";
    return mode === "uri" ? decodeURI(text) : decodeURIComponent(text);
  },
};

export const encodingTools: ToolDef[] = [
  base64EncodeTool,
  base64DecodeTool,
  urlEncodeTool,
  urlDecodeTool,
];
