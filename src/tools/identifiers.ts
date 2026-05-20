import { randomBytes, randomUUID } from "node:crypto";
import type { ToolDef } from "../types.js";

/**
 * UUID v7 generation per RFC 9562.
 * First 48 bits: Unix ms timestamp. Next 4 bits: version (7).
 * Next 12 bits: random. Next 2 bits: variant (10). Remaining 62 bits: random.
 */
function uuidv7(): string {
  const now = BigInt(Date.now());
  const rand = randomBytes(10);

  // Time-high (32) + time-low (16) = 48 bits of timestamp
  const tsBytes = new Uint8Array(6);
  tsBytes[0] = Number((now >> 40n) & 0xffn);
  tsBytes[1] = Number((now >> 32n) & 0xffn);
  tsBytes[2] = Number((now >> 24n) & 0xffn);
  tsBytes[3] = Number((now >> 16n) & 0xffn);
  tsBytes[4] = Number((now >> 8n) & 0xffn);
  tsBytes[5] = Number(now & 0xffn);

  const out = new Uint8Array(16);
  out.set(tsBytes, 0);
  out.set(rand, 6);

  // Version (4 high bits of byte 6) = 0111
  out[6] = ((out[6] ?? 0) & 0x0f) | 0x70;
  // Variant (2 high bits of byte 8) = 10
  out[8] = ((out[8] ?? 0) & 0x3f) | 0x80;

  const hex = Array.from(out, (b) => b.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

export const uuidTool: ToolDef = {
  name: "generate_uuid",
  description:
    "Generate one or many UUIDs. version='v4' for random (default), 'v7' for time-ordered (RFC 9562, the modern choice for database primary keys).",
  inputSchema: {
    type: "object",
    properties: {
      version: {
        type: "string",
        enum: ["v4", "v7"],
        default: "v4",
        description: "UUID version",
      },
      count: {
        type: "integer",
        minimum: 1,
        maximum: 1000,
        default: 1,
        description: "Number of UUIDs to generate (1-1000)",
      },
    },
    additionalProperties: false,
  },
  handler: (input) => {
    const version = input.version === "v7" ? "v7" : "v4";
    const countIn = Number(input.count ?? 1);
    const count = Math.min(Math.max(Math.floor(countIn), 1), 1000);

    const gen = version === "v7" ? uuidv7 : randomUUID;
    const ids: string[] = [];
    for (let i = 0; i < count; i++) ids.push(gen());

    return ids.join("\n");
  },
};

export const identifierTools: ToolDef[] = [uuidTool];
