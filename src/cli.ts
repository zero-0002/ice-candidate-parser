#!/usr/bin/env node
/**
 * CLI entry point: `getstats-report path/to/getstats.json`.
 * Reads from a file or stdin and prints a Markdown report.
 */

import { readFileSync } from "node:fs";
import { collect, renderMarkdown } from "./report.js";

function readInput(path: string | undefined): string {
  if (!path || path === "-") return readFileSync(0, "utf8");
  return readFileSync(path, "utf8");
}

function main(argv: string[]): number {
  const path = argv[2];
  let raw: unknown;
  try {
    raw = JSON.parse(readInput(path));
  } catch (err) {
    process.stderr.write(`getstats-report: ${(err as Error).message}\n`);
    return 2;
  }
  process.stdout.write(renderMarkdown(collect(raw)) + "\n");
  return 0;
}

process.exit(main(process.argv));
