// Leonida Legend — the hand-in program for the gta6-trophy-guide-01 entry (Node 22, standard
// library only). The guide itself is the static app/ folder next to this file: app/index.html opens
// in a desktop browser with the network off, its modules and styles are plain files under app/, and
// its trophy data — all 55 official trophies with a cited guide each — is app/data/trophies.json.
// This program hands the guide in: it copies app/ and screenshots/ from beside this file into the
// output directory and writes dossier.json there, the summary the judge reads (the screenshots, the
// first load's files and bytes, and the source), built with the vendored make.fun library.
//
// vendor/makefun-frontend.ts is the kit's copy, unchanged: the scorer rebuilds the dossier with its
// own copy of the same library and requires the two to match byte for byte.
//
// Run it the way the grader does, outside the grader's container, with MAKEFUN_OUTPUT_DIR standing
// in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide locally for a look with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The gate's own caps, so a bad entry fails here instead of in front of the scorer: at most 4
// screenshots and none over 256 KiB; app/ at most 993 files and directories and 48 MiB in all, so
// app/ plus screenshots/ plus dossier.json stay under the platform's own 1,000-entry, 64 MiB cap
// on /output. Only text_max_bytes changes the dossier's bytes; the other limits only refuse.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
