// Renders review stills (vertical + horizontal) at chosen seconds: node stills.mjs 12 15.5 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const out = process.env.STILLS || '/tmp/stills';
const secs = process.argv.slice(2).map(Number);
const ids = (process.env.COMPS || 'ReelVertical,ReelHorizontal').split(',');
const serveUrl = await bundle({entryPoint: path.resolve('src/index.jsx')});
for (const id of ids) {
  const composition = await selectComposition({serveUrl, id});
  for (const s of secs) {
    const f = `${out}/${id === 'ReelVertical' ? 'v' : 'h'}-${String(s).replace('.', '_')}.png`;
    await renderStill({composition, serveUrl, output: f, frame: Math.round(s * 60), scale: id === 'ReelVertical' ? 0.5 : 0.5});
    console.log('still', f);
  }
}
