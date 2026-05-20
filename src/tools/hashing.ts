import { createHash } from "node:crypto";
import { md5 as md5lib } from "js-md5";
import type { ToolDef } from "../types.js";

type Algorithm = "md5" | "sha1" | "sha256" | "sha384" | "sha512";

const ALGORITHMS: Algorithm[] = ["md5", "sha1", "sha256", "sha384", "sha512"];

function hash(text: string, algo: Algorithm): string {
  if (algo === "md5") return md5lib(text);
  return createHash(algo).update(text, "utf8").digest("hex");
}

export const hashTool: ToolDef = {
  name: "hash_text",
  description:
    "Compute the MD5, SHA-1, SHA-256, SHA-384, or SHA-512 hash of a UTF-8 string. Note: none of these are appropriate for password storage — use Argon2/scrypt/bcrypt for that.",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "Text to hash" },
      algorithm: {
        type: "string",
        enum: ALGORITHMS,
        default: "sha256",
        description: "Hash algorithm",
      },
    },
    required: ["text"],
    additionalProperties: false,
  },
  handler: (input) => {
    const text = String(input.text ?? "");
    const algoIn = String(input.algorithm ?? "sha256").toLowerCase();
    if (!ALGORITHMS.includes(algoIn as Algorithm)) {
      throw new Error(
        `Unknown algorithm: ${algoIn}. Choose one of: ${ALGORITHMS.join(", ")}.`,
      );
    }
    return hash(text, algoIn as Algorithm);
  },
};

export const hashAllTool: ToolDef = {
  name: "hash_text_all",
  description:
    "Hash a UTF-8 string with MD5, SHA-1, SHA-256, SHA-384, and SHA-512 in one call. Returns a JSON object mapping each algorithm to its hex digest.",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "Text to hash" },
    },
    required: ["text"],
    additionalProperties: false,
  },
  handler: (input) => {
    const text = String(input.text ?? "");
    const result = Object.fromEntries(
      ALGORITHMS.map((a) => [a, hash(text, a)]),
    );
    return JSON.stringify(result, null, 2);
  },
};

export const hashingTools: ToolDef[] = [hashTool, hashAllTool];
