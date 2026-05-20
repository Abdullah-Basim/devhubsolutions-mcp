import { marked } from "marked";
import type { ToolDef } from "../types.js";

function splitWords(input: string): string[] {
  // Split on any combination of whitespace, underscore, hyphen, or
  // lowercase→uppercase transition. Mirrors common case-converter
  // behaviour so XMLHttpRequest → [XML, Http, Request].
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s_\-]+/)
    .filter(Boolean);
}

export const caseConvertTool: ToolDef = {
  name: "convert_case",
  description:
    "Convert text between common case styles. Returns all variants in a single JSON object: camelCase, PascalCase, snake_case, kebab-case, SCREAMING_SNAKE_CASE, Title Case, lower, UPPER.",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "Text to convert" },
    },
    required: ["text"],
    additionalProperties: false,
  },
  handler: (input) => {
    const text = String(input.text ?? "");
    const words = splitWords(text);
    const lower = words.map((w) => w.toLowerCase());
    const title = words.map(
      (w) => (w[0]?.toUpperCase() ?? "") + w.slice(1).toLowerCase(),
    );

    return JSON.stringify(
      {
        camelCase:
          (lower[0] ?? "") +
          title
            .slice(1)
            .map((w) => w)
            .join(""),
        PascalCase: title.join(""),
        snake_case: lower.join("_"),
        SCREAMING_SNAKE_CASE: lower.map((w) => w.toUpperCase()).join("_"),
        "kebab-case": lower.join("-"),
        "Title Case": title.join(" "),
        lower: lower.join(" "),
        UPPER: lower.map((w) => w.toUpperCase()).join(" "),
      },
      null,
      2,
    );
  },
};

export const wordCountTool: ToolDef = {
  name: "count_words",
  description:
    "Count characters, words, sentences, paragraphs, and estimated reading time for a piece of text. Returns a JSON object with the stats.",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "Text to analyse" },
      wordsPerMinute: {
        type: "integer",
        minimum: 100,
        maximum: 600,
        default: 250,
        description: "Reading speed for the time estimate (default 250 wpm)",
      },
    },
    required: ["text"],
    additionalProperties: false,
  },
  handler: (input) => {
    const text = String(input.text ?? "");
    const wpm = Math.min(
      Math.max(Math.floor(Number(input.wordsPerMinute ?? 250)), 100),
      600,
    );

    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
    const sentences =
      text.trim().length === 0
        ? 0
        : (text.match(/[.!?]+(?=\s|$)/g) ?? []).length;
    const paragraphs =
      text.trim().length === 0
        ? 0
        : text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
    const readingMinutes = words === 0 ? 0 : Math.max(1, Math.round(words / wpm));

    return JSON.stringify(
      {
        characters,
        charactersNoSpaces,
        words,
        sentences,
        paragraphs,
        readingTimeMinutes: readingMinutes,
      },
      null,
      2,
    );
  },
};

const LOREM_SOURCE =
  "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum"
    .split(" ");

function loremWords(n: number): string {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(LOREM_SOURCE[i % LOREM_SOURCE.length] ?? "lorem");
  }
  return out.join(" ");
}

function loremSentence(): string {
  const len = 8 + Math.floor(Math.random() * 12);
  const s = loremWords(len);
  return (s[0]?.toUpperCase() ?? "") + s.slice(1) + ".";
}

function loremParagraph(): string {
  const n = 3 + Math.floor(Math.random() * 5);
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(loremSentence());
  return out.join(" ");
}

export const loremIpsumTool: ToolDef = {
  name: "generate_lorem",
  description:
    "Generate Lorem Ipsum placeholder text. unit='paragraphs' (default), 'sentences', or 'words'. count is the number of units to produce.",
  inputSchema: {
    type: "object",
    properties: {
      unit: {
        type: "string",
        enum: ["paragraphs", "sentences", "words"],
        default: "paragraphs",
      },
      count: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        default: 3,
      },
    },
    additionalProperties: false,
  },
  handler: (input) => {
    const unit = (input.unit as string) ?? "paragraphs";
    const count = Math.min(
      Math.max(Math.floor(Number(input.count ?? 3)), 1),
      100,
    );

    if (unit === "words") return loremWords(count);
    if (unit === "sentences") {
      const out: string[] = [];
      for (let i = 0; i < count; i++) out.push(loremSentence());
      return out.join(" ");
    }
    const paragraphs: string[] = [];
    for (let i = 0; i < count; i++) paragraphs.push(loremParagraph());
    return paragraphs.join("\n\n");
  },
};

export const markdownToHtmlTool: ToolDef = {
  name: "markdown_to_html",
  description:
    "Convert GitHub-Flavored Markdown to HTML. Supports headings, lists, tables, code blocks with language hints, strikethrough, task lists, and standard inline formatting.",
  inputSchema: {
    type: "object",
    properties: {
      markdown: { type: "string", description: "Markdown source" },
    },
    required: ["markdown"],
    additionalProperties: false,
  },
  handler: (input) => {
    const md = String(input.markdown ?? "");
    return marked.parse(md, { async: false }) as string;
  },
};

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  text: string;
}

/**
 * Simple line-level diff using the LCS algorithm. Good enough for prose,
 * config files, and small JSON. For programmer-grade diffs (with hunks,
 * context, and inline change highlighting), use a dedicated library.
 */
function diffLines(a: string[], b: string[]): DiffLine[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const aLine = a[i - 1] ?? "";
      const bLine = b[j - 1] ?? "";
      const row = dp[i] ?? [];
      const prevRow = dp[i - 1] ?? [];
      if (aLine === bLine) {
        row[j] = (prevRow[j - 1] ?? 0) + 1;
      } else {
        row[j] = Math.max(prevRow[j] ?? 0, (row[j - 1] ?? 0));
      }
    }
  }
  const out: DiffLine[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    const aLine = a[i - 1] ?? "";
    const bLine = b[j - 1] ?? "";
    if (aLine === bLine) {
      out.unshift({ type: "unchanged", text: aLine });
      i--;
      j--;
    } else if ((dp[i - 1]?.[j] ?? 0) >= (dp[i]?.[j - 1] ?? 0)) {
      out.unshift({ type: "removed", text: aLine });
      i--;
    } else {
      out.unshift({ type: "added", text: bLine });
      j--;
    }
  }
  while (i > 0) {
    out.unshift({ type: "removed", text: a[i - 1] ?? "" });
    i--;
  }
  while (j > 0) {
    out.unshift({ type: "added", text: b[j - 1] ?? "" });
    j--;
  }
  return out;
}

export const diffTextTool: ToolDef = {
  name: "diff_text",
  description:
    "Line-level diff between two pieces of text. Returns a unified-style diff with `+` for added lines, `-` for removed, ` ` for unchanged.",
  inputSchema: {
    type: "object",
    properties: {
      original: { type: "string", description: "Original text" },
      modified: { type: "string", description: "Modified text" },
    },
    required: ["original", "modified"],
    additionalProperties: false,
  },
  handler: (input) => {
    const original = String(input.original ?? "").split("\n");
    const modified = String(input.modified ?? "").split("\n");
    const diff = diffLines(original, modified);
    return diff
      .map((d) => {
        const prefix = d.type === "added" ? "+" : d.type === "removed" ? "-" : " ";
        return `${prefix} ${d.text}`;
      })
      .join("\n");
  },
};

export const textTools: ToolDef[] = [
  caseConvertTool,
  wordCountTool,
  loremIpsumTool,
  markdownToHtmlTool,
  diffTextTool,
];
