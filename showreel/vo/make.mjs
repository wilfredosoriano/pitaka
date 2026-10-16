// Generates one WAV per line of script.tsv with Kokoro af_heart and reports whether each fits its slot.
import { KokoroTTS } from 'kokoro-js';
import { readFileSync, writeFileSync } from 'node:fs';
const rows = readFileSync('script.tsv', 'utf8').trim().split('\n').slice(1).map((l) => l.split('\t'));
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'fp32', device: 'cpu' });
const report = [];
for (const [i, [start, text, end]] of rows.entries()) {
  const a = await tts.generate(text, { voice: 'af_heart', speed: 1 });
  const f = `line${String(i).padStart(2, '0')}.wav`; await a.save(f);
  const dur = a.audio.length / a.sampling_rate, fin = +start + dur;
  report.push({ f, start: +start, dur: +dur.toFixed(2), ends: +fin.toFixed(2), latest: +end, fits: fin <= +end });
}
writeFileSync('lines.json', JSON.stringify(report, null, 1));
console.table(report);
