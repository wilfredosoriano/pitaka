// Renders the App Store screenshots (1320 x 2868) to ../out/appstore/, one PNG per shot.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve('../out/appstore');
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.jsx')});
const composition = await selectComposition({serveUrl, id: 'AppStore'});
// shot ids, read from src/AppStore.jsx (node can't import the JSX directly)
const ids = [...fs.readFileSync('src/AppStore.jsx', 'utf8').matchAll(/\{id: '([^']+)'/g)].map((m) => m[1]);
const files = [];
for (const [i, id] of ids.entries()) {
  const f = `${out}/${String(i + 1).padStart(2, '0')}-${id}.png`;
  await renderStill({composition, serveUrl, output: f, frame: i});
  files.push(f);
  console.log('shot', f);
}
// Apple rejects screenshots with an alpha channel: flatten to RGB
execFileSync('python3', ['-c', 'import sys\nfrom PIL import Image\nfor f in sys.argv[1:]: Image.open(f).convert("RGB").save(f)', ...files]);
