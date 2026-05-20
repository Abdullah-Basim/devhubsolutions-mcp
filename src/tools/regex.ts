import type { ToolDef } from "../types.js";

export const regexTestTool: ToolDef = {
  name: "test_regex",
  description:
    "Test a JavaScript regular expression against input text. Returns all matches with capture groups and their indices.",
  inputSchema: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Regex pattern (without slashes)" },
      flags: {
        type: "string",
        default: "g",
        description: "Regex flags: g, i, m, s, u, y",
      },
      text: { type: "string", description: "Text to test against" },
    },
    required: ["pattern", "text"],
    additionalProperties: false,
  },
  handler: (input) => {
    const pattern = String(input.pattern ?? "");
    const flags = String(input.flags ?? "g");
    const text = String(input.text ?? "");

    let re: RegExp;
    try {
      // Always include "g" so matchAll works; preserve any other flags.
      const flagSet = new Set(flags.split(""));
      flagSet.add("g");
      re = new RegExp(pattern, [...flagSet].join(""));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Invalid regex: ${msg}`);
    }

    const matches = Array.from(text.matchAll(re)).map((m) => ({
      match: m[0],
      index: m.index ?? null,
      groups: m.slice(1),
      namedGroups: m.groups ?? null,
    }));

    return JSON.stringify(
      {
        pattern,
        flags,
        matchCount: matches.length,
        matches,
      },
      null,
      2,
    );
  },
};

export const regexTools: ToolDef[] = [regexTestTool];
