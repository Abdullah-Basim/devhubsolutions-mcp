import type { ToolDef } from "../types.js";

/**
 * Token-counting estimates for major LLMs. Uses a ~4-char-per-token heuristic
 * that matches BPE tokenizer output within ~5-10% for typical English text.
 * For exact counts, use each provider's official tokenizer library.
 */

interface ModelInfo {
  id: string;
  name: string;
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  contextWindow: number;
}

const MODELS: ModelInfo[] = [
  {
    id: "claude-opus-4-7",
    name: "Claude Opus 4.7",
    inputCostPerMillion: 15,
    outputCostPerMillion: 75,
    contextWindow: 200_000,
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    inputCostPerMillion: 3,
    outputCostPerMillion: 15,
    contextWindow: 200_000,
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    inputCostPerMillion: 1,
    outputCostPerMillion: 5,
    contextWindow: 200_000,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    inputCostPerMillion: 2.5,
    outputCostPerMillion: 10,
    contextWindow: 128_000,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.6,
    contextWindow: 128_000,
  },
  {
    id: "gemini-2-5-pro",
    name: "Gemini 2.5 Pro",
    inputCostPerMillion: 1.25,
    outputCostPerMillion: 5,
    contextWindow: 1_000_000,
  },
  {
    id: "gemini-2-5-flash",
    name: "Gemini 2.5 Flash",
    inputCostPerMillion: 0.075,
    outputCostPerMillion: 0.3,
    contextWindow: 1_000_000,
  },
];

function estimateTokens(text: string): number {
  // 4-char-per-token heuristic. Within ~5-10% of real tokenizer output for
  // English prose; less accurate for code, JSON, or non-Latin text.
  return Math.max(1, Math.ceil(text.length / 4));
}

export const tokenCountTool: ToolDef = {
  name: "count_tokens",
  description:
    "Estimate token counts and per-call cost for a prompt across major LLMs (Claude 4.x, GPT-4o family, Gemini 2.5). Uses a 4-char-per-token approximation. For exact counts, use each provider's official tokenizer.",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "The prompt to count" },
      expectedOutputTokens: {
        type: "integer",
        minimum: 0,
        maximum: 100_000,
        default: 500,
        description: "Expected output length for cost projection",
      },
    },
    required: ["text"],
    additionalProperties: false,
  },
  handler: (input) => {
    const text = String(input.text ?? "");
    const expectedOutput = Math.max(
      0,
      Math.floor(Number(input.expectedOutputTokens ?? 500)),
    );

    const inputTokens = estimateTokens(text);

    const perModel = MODELS.map((m) => {
      const inputCost = (inputTokens / 1_000_000) * m.inputCostPerMillion;
      const outputCost = (expectedOutput / 1_000_000) * m.outputCostPerMillion;
      const fitsContext = inputTokens + expectedOutput <= m.contextWindow;
      return {
        model: m.name,
        id: m.id,
        inputTokens,
        outputTokens: expectedOutput,
        inputCostUsd: Number(inputCost.toFixed(6)),
        outputCostUsd: Number(outputCost.toFixed(6)),
        totalCostUsd: Number((inputCost + outputCost).toFixed(6)),
        contextWindow: m.contextWindow,
        fitsContext,
      };
    });

    return JSON.stringify(
      {
        characters: text.length,
        words: text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length,
        estimatedInputTokens: inputTokens,
        expectedOutputTokens: expectedOutput,
        models: perModel,
        note:
          "Token counts are approximations (~4 chars/token). For exact counts, use the provider's official tokenizer.",
      },
      null,
      2,
    );
  },
};

export const promptRefineTool: ToolDef = {
  name: "refine_prompt",
  description:
    "Restructure a rough prompt into the five-element pattern that modern LLMs reward: role, context, task, constraints, output format. Returns the refined prompt as plain text.",
  inputSchema: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "Rough draft prompt to restructure",
      },
      role: {
        type: "string",
        description: "Optional role override (default inferred from prompt)",
      },
      outputFormat: {
        type: "string",
        description:
          "Optional output format hint (e.g. 'JSON', 'markdown', 'plain text')",
        default: "plain text",
      },
    },
    required: ["prompt"],
    additionalProperties: false,
  },
  handler: (input) => {
    const prompt = String(input.prompt ?? "").trim();
    const role = String(input.role ?? "expert assistant");
    const outputFormat = String(input.outputFormat ?? "plain text");

    const sections = [
      `<role>You are a ${role}.</role>`,
      `<context>${prompt}</context>`,
      `<task>Address the request in <context> directly and concretely.</task>`,
      `<constraints>
- Only state what you can defend from the input.
- No filler, no hedging, no apologies.
- If information is missing, ask for it explicitly rather than guessing.
</constraints>`,
      `<output_format>${outputFormat}</output_format>`,
    ];

    return sections.join("\n\n");
  },
};

export const llmTools: ToolDef[] = [tokenCountTool, promptRefineTool];
