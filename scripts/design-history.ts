// Keeps src/lib/design-history.ts up to date: every list of screens each design has had,
// so a card saved before a design changed still counts as that design (see cardTier in
// lib/catalog.ts). Run it from the project folder after changing a design's screens;
// scripts/check-designs.ts says when it's needed.
//
//   npx tsx scripts/design-history.ts            adds each design's screens as they are now
//   npx tsx scripts/design-history.ts <commit>   also adds the screens they had at that commit
//
// Lists already in the file are always kept, never removed.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TEMPLATES } from "../src/lib/catalog";
import { DESIGN_SCREENS } from "../src/lib/design-history";

const FILE = join(process.cwd(), "src/lib/design-history.ts");
const signature = (t: { screens: (to: string, from: string) => { type: string }[] }) => t.screens("", "").map((s) => s.type).join(",");

// The designs' screens at an earlier commit, worked out from that commit's own code.
function screensAt(commit: string): Record<string, string> {
  const dir = mkdtempSync(join(tmpdir(), "design-history-"));
  try {
    execFileSync("sh", ["-c", `git archive ${JSON.stringify(commit)} src tsconfig.json | tar -x -C ${JSON.stringify(dir)}`], { stdio: ["ignore", "ignore", "inherit"] });
    symlinkSync(join(process.cwd(), "node_modules"), join(dir, "node_modules"));
    writeFileSync(
      join(dir, "dump.mts"),
      `import { TEMPLATES } from "./src/lib/catalog";\nconsole.log(JSON.stringify(Object.fromEntries(TEMPLATES.map((t) => [t.slug, t.screens("", "").map((s) => s.type).join(",")]))));\n`,
    );
    return JSON.parse(execFileSync("npx", ["tsx", "dump.mts"], { cwd: dir, encoding: "utf8" }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const lists = new Map(Object.entries(DESIGN_SCREENS).map(([slug, all]) => [slug, [...all]]));
const add = (slug: string, list: string) => {
  const all = lists.get(slug) ?? [];
  if (!all.includes(list)) all.push(list);
  lists.set(slug, all);
};

const commit = process.argv[2];
if (commit) {
  const earlier = screensAt(commit);
  // Only designs still on sale: a card from a design that's gone counts as custom anyway.
  for (const t of TEMPLATES) if (earlier[t.slug]) add(t.slug, earlier[t.slug]);
}
for (const t of TEMPLATES) add(t.slug, signature(t));

const order = [...new Set([...TEMPLATES.map((t) => t.slug), ...lists.keys()])];
const changed = order.filter((slug) => (lists.get(slug)?.length ?? 0) > 1).length;
writeFileSync(
  FILE,
  `// Every list of screens each design has been sold with, oldest first, so a card saved
// before a design changed still counts as that design (see cardTier in catalog.ts).
// Written by scripts/design-history.ts, so don't edit it by hand; scripts/check-designs.ts
// fails if a design's screens as they are now aren't here.

export const DESIGN_SCREENS: Record<string, string[]> = {
${order.map((slug) => `  ${JSON.stringify(slug)}: [${lists.get(slug)!.map((l) => JSON.stringify(l)).join(", ")}],`).join("\n")}
};
`,
);
console.log(`${order.length} designs written to src/lib/design-history.ts; ${changed} have had more than one list of screens.`);
