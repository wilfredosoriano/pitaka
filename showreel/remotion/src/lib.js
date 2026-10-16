import {Easing, interpolate} from 'remotion';
import timeline from '../../timeline.json';

export const FPS = timeline.fps;
export const TL = timeline;
export const scene = (id) => timeline.scenes.find((s) => s.id === id);

export const expoOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.55, 0, 1, 0.45);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const backOut = Easing.bezier(0.34, 1.56, 0.64, 1);

// Progress 0..1 between two times (seconds) for the current local frame.
export const p = (frame, a, b, easing = expoOut) =>
  interpolate(frame, [a * FPS, b * FPS], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});
export const mix = (a, b, t) => a + (b - a) * t;

export const peso = (c) => '₱' + (Math.abs(c) / 100).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2});

export const C = {
  bg: '#FFFFFF', card: '#F4F4F3', ink: '#000000', muted: '#6B6B6B', faint: '#8F8F8F', line: '#E4E4E2',
  dbg: '#0F0F0F', dcard: '#1C1C1C', dink: '#FFFFFF', dmuted: '#A8A8A8',
};

// ---------- the app's CSS, adapted to live inside a shadow root ----------
// Media queries are resolved for the device being shown (phone or desktop), not the video canvas.
function resolveMedia(css, mode) {
  let out = '', i = 0;
  while (i < css.length) {
    const at = css.indexOf('@media', i);
    if (at < 0) {out += css.slice(i); break;}
    out += css.slice(i, at);
    const open = css.indexOf('{', at), cond = css.slice(at + 6, open).trim();
    let depth = 1, j = open + 1;
    while (depth && j < css.length) {if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++;}
    const body = css.slice(open + 1, j - 1);
    const desktopRule = /^\(min-width:(768|1024)px\)$/.test(cond.replace(/\s/g, ''));
    if (mode === 'desktop' && desktopRule) out += resolveMedia(body, mode);
    i = j; // every other media block (dark auto, hover, reduced motion, narrow phones) is dropped
  }
  return out;
}

export function appCss(css, mode) {
  let s = resolveMedia(css, mode)
    .replace(/:root\[data-theme="dark"\]/g, ':host([data-theme="dark"])')
    .replace(/:root/g, ':host')
    .replace(/html,body,/g, ':host,')
    .replace(/html,body\{/g, ':host{')
    .replace(/(^|[}\s,])html\{/g, '$1:host{')
    .replace(/(^|[}\s,])body\.nav-on/g, '$1:host(.nav-on)')
    .replace(/(^|[}\s,])body\{/g, '$1:host{');
  // all motion comes from Remotion, so the app's own transitions and animations are off
  return s + '\n*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent}\n:host{display:block;overflow:hidden}';
}
