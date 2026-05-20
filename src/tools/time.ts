import type { ToolDef } from "../types.js";

export const timezoneConvertTool: ToolDef = {
  name: "convert_timezone",
  description:
    "Convert a date+time from one IANA timezone to another. Returns the converted ISO datetime plus a human-readable formatted string in the target zone.",
  inputSchema: {
    type: "object",
    properties: {
      datetime: {
        type: "string",
        description:
          "ISO 8601 datetime (e.g. '2026-05-15T14:30:00') or a parseable string",
      },
      fromZone: {
        type: "string",
        description:
          "IANA timezone of the input (e.g. 'America/New_York', 'UTC')",
        default: "UTC",
      },
      toZone: {
        type: "string",
        description:
          "Target IANA timezone (e.g. 'Europe/London', 'Asia/Karachi')",
      },
    },
    required: ["datetime", "toZone"],
    additionalProperties: false,
  },
  handler: (input) => {
    const datetime = String(input.datetime ?? "");
    const fromZone = String(input.fromZone ?? "UTC");
    const toZone = String(input.toZone ?? "");
    if (!toZone) throw new Error("toZone is required");

    // Parse input as if in fromZone. JavaScript's Date parses ISO strings
    // as UTC unless a timezone offset is present. We construct a Date that
    // represents the wall-clock time in fromZone by computing the offset.
    const baseDate = new Date(datetime);
    if (Number.isNaN(baseDate.getTime())) {
      throw new Error(`Could not parse datetime: ${datetime}`);
    }

    // Compute fromZone's UTC offset at this instant, then back-solve so
    // baseDate represents the actual instant the wall-clock time refers to.
    const fromFmt = new Intl.DateTimeFormat("en-US", {
      timeZone: fromZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    let trueInstant: Date;
    try {
      // Walk forward/back by the apparent offset until the formatted time
      // in fromZone matches our parsed wall-clock. One iteration is enough
      // except across DST boundaries, where two iterations converge.
      let candidate = baseDate;
      for (let i = 0; i < 2; i++) {
        const parts = fromFmt.formatToParts(candidate);
        const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
        const yr = Number(get("year"));
        const mo = Number(get("month"));
        const dy = Number(get("day"));
        const hr = Number(get("hour"));
        const mn = Number(get("minute"));
        const sc = Number(get("second"));
        const reconstructed = Date.UTC(yr, mo - 1, dy, hr, mn, sc);
        const delta = baseDate.getTime() - reconstructed;
        candidate = new Date(baseDate.getTime() + delta);
      }
      trueInstant = candidate;
    } catch (err) {
      throw new Error(`Invalid fromZone "${fromZone}": ${(err as Error).message}`);
    }

    const toFmt = new Intl.DateTimeFormat("en-US", {
      timeZone: toZone,
      dateStyle: "full",
      timeStyle: "long",
    });
    let formatted: string;
    try {
      formatted = toFmt.format(trueInstant);
    } catch (err) {
      throw new Error(`Invalid toZone "${toZone}": ${(err as Error).message}`);
    }

    return JSON.stringify(
      {
        input: { datetime, fromZone },
        toZone,
        instantUTC: trueInstant.toISOString(),
        formatted,
      },
      null,
      2,
    );
  },
};

export const timeTools: ToolDef[] = [timezoneConvertTool];
