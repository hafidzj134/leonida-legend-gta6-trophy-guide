// Leonida Legend — hand-in program for the gta6-trophy-guide-01 entry.
//
// The guide is a folder of plain static files in app/ next to this file:
// open app/index.html in a desktop browser and it runs with the network
// off, reading its 55 trophies and their guides from
// app/data/trophies.json. This program's only job is to hand that guide
// in the way the grader expects: copy app/ and screenshots/ into the
// output folder and write a dossier.json there, built by the vendored
// make.fun library in vendor/makefun-frontend.ts (left byte-for-byte as
// the kit shipped it, because the scorer rebuilds the dossier with its
// own copy and demands an exact match).
//
// Run it like the grader does, from the repository root:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// MAKEFUN_OUTPUT_DIR stands in for /output outside the grader.
// Preview the guide itself with: node serve.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the two payloads. screenshots/ is copied only when present so a
// local run without shots still produces a dossier for inspection; the
// gate itself will refuse an entry with fewer than 3 screenshots.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Build the dossier under the scorer's caps: 160 KiB of text, at most 4
// screenshots of at most 256 KiB each, app/ at most 993 entries and
// 48 MiB — keeping the whole output under the platform's own limits.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log('Leonida Legend handed in: app/ and screenshots/ copied to ' + outputDir + ', dossier.json written (' + dossier.length + ' bytes).');
