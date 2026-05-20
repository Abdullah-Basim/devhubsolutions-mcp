import type { ToolDef } from "../types.js";

export const jsonFormatTool: ToolDef = {
  name: "json_format",
  description:
    "Format (pretty-print), validate, or minify a JSON string. mode='pretty' (default), 'minify', or 'validate'. Returns the formatted JSON or a validation result.",
  inputSchema: {
    type: "object",
    properties: {
      json: { type: "string", description: "Raw JSON text" },
      mode: {
        type: "string",
        enum: ["pretty", "minify", "validate"],
        default: "pretty",
      },
      indent: {
        type: "integer",
        minimum: 0,
        maximum: 8,
        default: 2,
        description: "Spaces of indent (pretty mode only)",
      },
    },
    required: ["json"],
    additionalProperties: false,
  },
  handler: (input) => {
    const raw = String(input.json ?? "");
    const mode = (input.mode as string) ?? "pretty";
    const indent = Math.min(
      Math.max(Math.floor(Number(input.indent ?? 2)), 0),
      8,
    );

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Invalid JSON: ${msg}`);
    }

    if (mode === "validate") {
      return "Valid JSON.";
    }
    if (mode === "minify") {
      return JSON.stringify(parsed);
    }
    return JSON.stringify(parsed, null, indent);
  },
};

function base64UrlDecode(seg: string): string {
  let s = seg.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4 !== 0) s += "=";
  return Buffer.from(s, "base64").toString("utf-8");
}

export const jwtDecodeTool: ToolDef = {
  name: "jwt_decode",
  description:
    "Decode a JWT into its header and payload. Does NOT verify the signature — use a signing library on your server for that. Returns a JSON object with header, payload, signature (raw), and expiry status.",
  inputSchema: {
    type: "object",
    properties: {
      jwt: { type: "string", description: "JWT string (header.payload.signature)" },
    },
    required: ["jwt"],
    additionalProperties: false,
  },
  handler: (input) => {
    const token = String(input.jwt ?? "").trim();
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error(
        `Invalid JWT: expected 3 dot-separated segments, got ${parts.length}.`,
      );
    }
    const [headerB64, payloadB64, signature] = parts as [string, string, string];

    let header: unknown;
    let payload: Record<string, unknown>;
    try {
      header = JSON.parse(base64UrlDecode(headerB64));
    } catch {
      throw new Error("JWT header is not valid Base64url-encoded JSON.");
    }
    try {
      payload = JSON.parse(base64UrlDecode(payloadB64)) as Record<string, unknown>;
    } catch {
      throw new Error("JWT payload is not valid Base64url-encoded JSON.");
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = typeof payload.exp === "number" ? payload.exp : null;
    const expired = exp !== null ? exp < now : null;

    return JSON.stringify(
      {
        header,
        payload,
        signature,
        expired,
        expiresAt: exp !== null ? new Date(exp * 1000).toISOString() : null,
      },
      null,
      2,
    );
  },
};

export const formatTools: ToolDef[] = [jsonFormatTool, jwtDecodeTool];
