import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {FPS, p, mix, easeIn, easeInOut, backOut, peso} from './lib';
import {AppScreen, q, qa, set} from './AppScreen';
import {Phone, Browser, PHONE_W, PHONE_H} from './Devices';
import {Caption, Words} from './Caption';
import {LogoBuild, NameReveal} from './Logo';
import home from './captures/home.json';
import homeDark from './captures/home_dark.json';
import entry from './captures/entry.json';
import entryOver from './captures/entry_over.json';
import receipt from './captures/receipt.json';
import insights from './captures/insights.json';
import wallets from './captures/wallets.json';
import walletsPl from './captures/wallets_pl.json';
import desktopDark from './captures/desktop_dark.json';

const useT = () => useCurrentFrame() / FPS;
const useV = () => {const {width, height} = useVideoConfig(); return height > width;};

// Scene background that wipes in over the previous scene during its first 0.6 s
const Stage = ({bg, wipe = 'up', children}) => {
  const t = useT(), k = p(t * FPS, 0, 0.6, easeInOut);
  const clip = wipe === 'circle' ? `circle(${k * 75}% at 50% 50%)` : wipe === 'left' ? `inset(0 0 0 ${(1 - k) * 100}%)` : wipe === 'right' ? `inset(0 ${(1 - k) * 100}% 0 0)` : `inset(${(1 - k) * 100}% 0 0 0)`;
  return <AbsoluteFill style={{background: bg, clipPath: k < 1 ? clip : 'none', overflow: 'hidden'}}>{children}</AbsoluteFill>;
};

// Standard layout: caption on top (vertical) or left (horizontal), phone large below / right.
const useLayout = () => {
  const V = useV();
  return V
    ? {V, cap: {left: 90, top: 236, width: 900}, capSize: 0.86, ph: {scale: 1.12, x: (1080 - PHONE_W * 1.12) / 2, y: 1540 - PHONE_H * 1.12}}
    : {V, cap: {left: 150, top: 300, width: 760}, capSize: 1, ph: {scale: 1.13, x: 1340 - (PHONE_W * 1.13) / 2, y: (1080 - PHONE_H * 1.13) / 2}};
};

// Device entrance (rise + settle) and exit (drop + fade) shared by the feature scenes
const deviceMotion = (t, inAt = 0.6, outAt = 6.35) => {
  const k = p(t * FPS, inAt, inAt + 1.0), o = p(t * FPS, outAt, outAt + 0.5, easeIn);
  return {transform: `translateY(${mix(320, 0, k) + o * 120}px) rotate(${mix(-5, 0, k)}deg)`, opacity: Math.min(1, k * 2) * (1 - o)};
};

const F = (t, a, b, e) => p(t * FPS, a, b, e); // progress in seconds for apply functions

// ---------------------------------------------------------------- brand open (0–6 s)
export const Brand = () => {
  const t = useT(), V = useV();
  const up = F(t, 2.55, 3.25);
  const logoSize = V ? 400 : 300;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,.07), rgba(255,255,255,0) 55%)', opacity: F(t, 0, 1.4)}} />
      <div style={{position: 'absolute', left: '50%', top: V ? 900 : 470, transform: `translate(-50%,-50%) translateY(${-up * (V ? 210 : 150)}px) scale(${mix(1, 0.78, up)})`}}>
        <LogoBuild t0={1.2} size={logoSize} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: V ? 1000 : 600}}>
        <NameReveal t0={2.9} size={V ? 170 : 150} tagColor="#bdbdbd" />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- title card (about 5 s)
export const Title = () => {
  const t = useT(), V = useV();
  const out = F(t, 4.35, 4.8, easeIn);
  const lines = ['Every peso.', 'Every wallet.', 'One place.'];
  return (
    <Stage bg="#fff" wipe="up">
      <div style={{position: 'absolute', left: V ? 90 : 150, top: V ? 640 : 250, fontFamily: 'Onest, sans-serif', opacity: 1 - out, transform: `translateY(${-out * 40}px)`}}>
        {lines.map((l, i) => (
          <div key={i} style={{fontSize: V ? 132 : 140, fontWeight: 700, letterSpacing: '-.045em', lineHeight: 1.02, color: i === 2 ? '#000' : '#111'}}>
            <Words text={l} at={0.7 + i * 0.32} gap={0.1} dur={0.75} />
          </div>
        ))}
        <div style={{fontSize: V ? 40 : 40, color: '#6B6B6B', marginTop: 44, maxWidth: V ? 860 : 1100, lineHeight: 1.35}}>
          <Words text="Spending, cards, bills and savings, in one simple tracker that works offline." at={1.9} gap={0.05} />
        </div>
      </div>
    </Stage>
  );
};

// ---------------------------------------------------------------- feature scene shell
const Feature = ({n, title, body, bg, dark, wipe, children}) => {
  const L = useLayout();
  return (
    <Stage bg={bg} wipe={wipe}>
      <Caption n={n} title={title} body={body} dark={dark} at={0.75} exitAt={6.3} size={L.capSize} style={{position: 'absolute', ...L.cap}} />
      {children(L)}
    </Stage>
  );
};

// Card stack positions, the same math the app uses (front card at pos 0, others peek on the right)
function deckPos(deck, pos) {
  const cards = qa(deck, '.wc'), W = deck.clientWidth;
  cards.forEach((c, i) => {
    const o = i - pos; let tx, sc, op, r = 0;
    if (o < 0) {tx = o * W * 1.05; sc = 1 + o * 0.04; op = Math.max(0, 1 + o * 0.9); r = o * 6;}
    else {const k = Math.min(o, 2); tx = k * 28; sc = 1 - k * 0.09; op = o > 2 ? Math.max(0, 1 - (o - 2) * 2) * 0.4 : 1 - k * 0.3;}
    set(c, {transform: `translateX(${tx}px) scale(${sc}) rotate(${r}deg)`, opacity: String(op), zIndex: String(o < 0 ? 200 : 100 - Math.round(o * 10))});
  });
  qa(deck.parentNode, '.wdots button').forEach((d, i) => d.classList.toggle('on', i === Math.round(pos)));
}

// ---------------------------------------------------------------- 01 wallet cards
const applyCards = (root, t) => {
  set(q(root, '.app'), {transform: `translateY(${-262 * F(t, 1.6, 2.4)}px)`});
  const deck = q(root, '#deck');
  if (deck) {
    deckPos(deck, F(t, 2.6, 3.25) + F(t, 3.5, 4.15));
    qa(deck, '.wc').forEach((c, i) => {c.classList.remove('turned'); set(c.querySelector('.wc-in'), {transform: `rotateY(${i === 2 ? 180 * F(t, 4.6, 5.4, easeInOut) : 0}deg)`});});
  }
};
export const S1 = () => {
  const t = useT();
  return (
    <Feature n="01" title="Every wallet, one stack" body="Swipe through cash, banks and e-wallets. Flip a card for its details and QR." bg="#F4F4F3" wipe="up">
      {(L) => <div style={{position: 'absolute', left: L.ph.x, top: L.ph.y, ...deviceMotion(t)}}><Phone scale={L.ph.scale}><AppScreen cap={home} t={t} apply={applyCards} /></Phone></div>}
    </Feature>
  );
};

// ---------------------------------------------------------------- 02 quick logging + overspend warning
const sheetIn = (root, t, at) => {
  const k = F(t, at, at + 0.6);
  set(q(root, '#scrim'), {background: `rgba(0,0,0,${0.45 * k})`});
  set(q(root, '#scrim .sheet'), {transform: `translateY(${(1 - k) * 105}%)`});
};
const applyEntry = (root, t) => {
  sheetIn(root, t, 1.3);
  const name = 'Jollibee', nk = Math.round(F(t, 2.05, 2.85, (x) => x) * name.length), amt = '250', ak = Math.round(F(t, 2.95, 3.3, (x) => x) * amt.length);
  const n = q(root, '#e-name'), a = q(root, '#e-amt');
  if (n) {n.value = name.slice(0, nk); n.setAttribute('value', n.value);}
  if (a) {a.value = amt.slice(0, ak); a.setAttribute('value', a.value);}
  const chip = q(root, '.sheet [data-a="cat"][data-v="food"]'), on = t >= 3.45;
  if (chip) {chip.classList.toggle('on', on); set(chip, {transform: `scale(${on ? mix(1.18, 1, F(t, 3.45, 3.8, backOut)) : 1})`});}
  set(q(root, '#e-cb'), {opacity: String(F(t, 3.55, 3.9))});
};
const applyOver = (root, t) => {
  sheetIn(root, t, 0);
  const h = q(root, '#e-over'), k = F(t, 4.45, 4.75, backOut);
  set(h, {opacity: String(F(t, 4.35, 4.6)), transform: `scale(${mix(0.9, 1, k)})`, transformOrigin: 'left center', fontWeight: '600'});
};
export const S2 = () => {
  const t = useT();
  const swap = F(t, 4.0, 4.3, easeInOut);
  return (
    <Feature n="02" title="Log it in seconds" body="Pick a category and a wallet. Pitaka warns you before you overspend." bg="#0F0F0F" dark wipe="left">
      {(L) => (
        <div style={{position: 'absolute', left: L.ph.x, top: L.ph.y, ...deviceMotion(t)}}>
          <Phone scale={L.ph.scale}>
            <AppScreen cap={entry} t={t} apply={applyEntry} />
            <AppScreen cap={entryOver} t={t} apply={applyOver} style={{opacity: swap}} />
          </Phone>
        </div>
      )}
    </Feature>
  );
};

// ---------------------------------------------------------------- 03 receipts
const applyReceipt = (root, t) => {
  sheetIn(root, t, 1.15);
  const pr = F(t, 1.8, 2.8, easeInOut);
  set(q(root, '.rc'), {clipPath: `inset(0 0 ${(1 - pr) * 100}% 0)`, transform: `translateY(${(1 - pr) * -12}px)`});
  set(q(root, '.rc-edge'), {opacity: String(pr > 0.98 ? 1 : 0)});
  const amt = q(root, '.rc-amt'); if (amt) amt.textContent = '−' + peso(Math.round(25000 * F(t, 2.0, 2.8)));
  qa(root, '.rc-row').forEach((r, i) => {const k = F(t, 2.75 + i * 0.12, 3.25 + i * 0.12); set(r, {opacity: String(k), transform: `translateY(${(1 - k) * 10}px)`});});
  qa(root, '.sheet > .cta, .sheet > .g2').forEach((b, i) => {const k = F(t, 3.25 + i * 0.12, 3.75 + i * 0.12, backOut); set(b, {opacity: String(Math.min(1, k * 2)), transform: `scale(${mix(0.86, 1, k)})`});});
};
export const S3 = () => {
  const t = useT();
  return (
    <Feature n="03" title="Every entry, a receipt" body="Tap any entry to see it clearly, edit it, or log it again in one tap." bg="#fff" wipe="up">
      {(L) => <div style={{position: 'absolute', left: L.ph.x, top: L.ph.y, ...deviceMotion(t)}}><Phone scale={L.ph.scale}><AppScreen cap={receipt} t={t} apply={applyReceipt} /></Phone></div>}
    </Feature>
  );
};

// ---------------------------------------------------------------- 04 insights
const offsetIn = (el, stop) => {let y = 0; while (el && el !== stop) {y += el.offsetTop; el = el.offsetParent;} return y;};
const applyInsights = (root, t) => {
  const app = q(root, '.app'), cats = q(root, '[data-tour="cats"]');
  const target = cats ? Math.max(0, offsetIn(cats, app) - 150) : 600;
  set(app, {transform: `translateY(${-target * F(t, 2.9, 3.8, easeInOut)}px)`});
  const amt = q(root, '.blk .amt'); if (amt) amt.textContent = peso(Math.round(965400 * F(t, 1.35, 2.4)));
  const bars = qa(root, '.bar > i');
  bars.forEach((b, i) => {const k = i === 0 ? F(t, 1.9, 2.6) : F(t, 3.65 + (i - 1) * 0.11, 4.35 + (i - 1) * 0.11); set(b, {transform: `scaleX(${k})`, transformOrigin: 'left center'});});
};
export const S4 = () => {
  const t = useT();
  return (
    <Feature n="04" title="See where it went" body="Spending by category, with limits that warn you before it is too late." bg="#F4F4F3" wipe="right">
      {(L) => <div style={{position: 'absolute', left: L.ph.x, top: L.ph.y, ...deviceMotion(t)}}><Phone scale={L.ph.scale}><AppScreen cap={insights} t={t} apply={applyInsights} /></Phone></div>}
    </Feature>
  );
};

// ---------------------------------------------------------------- 05 pay later + savings
const applyWallets = (root, t) => {
  qa(root, '.mcard').forEach((c, i) => {const k = F(t, 1.25 + i * 0.08, 1.75 + i * 0.08, backOut); set(c, {opacity: String(Math.min(1, k * 2)), transform: `translateY(${(1 - k) * 30}px) scale(${mix(0.85, 1, k)})`});});
  qa(root, '.mc-goal i').forEach((b) => set(b, {transform: `scaleX(${F(t, 2.15, 2.95)})`, transformOrigin: 'left center'}));
};
const applyPl = (root, t) => {
  const amt = q(root, '.blk .amt'); if (amt) amt.textContent = peso(Math.round(701100 * F(t, 3.8, 4.6)));
  const pill = q(root, '.wtabs button.on'); set(pill, {transform: `scale(${mix(0.9, 1, F(t, 3.6, 3.95, backOut))})`});
  qa(root, '.mcard').forEach((c, i) => {const k = F(t, 4.05 + i * 0.08, 4.55 + i * 0.08, backOut); set(c, {opacity: String(Math.min(1, k * 2)), transform: `scale(${mix(0.85, 1, k)})`});});
};
export const S5 = () => {
  const t = useT();
  const swap = F(t, 3.55, 3.85, easeInOut);
  return (
    <Feature n="05" title="Pay later and savings" body="See the credit you have left, and watch your savings goals grow." bg="#0F0F0F" dark wipe="left">
      {(L) => (
        <div style={{position: 'absolute', left: L.ph.x, top: L.ph.y, ...deviceMotion(t)}}>
          <Phone scale={L.ph.scale}>
            <AppScreen cap={wallets} t={t} apply={applyWallets} />
            <AppScreen cap={walletsPl} t={t} apply={applyPl} style={{opacity: swap}} />
          </Phone>
        </div>
      )}
    </Feature>
  );
};

// ---------------------------------------------------------------- 06 night mode + desktop
export const S6 = () => {
  const t = useT(), L = useLayout(), V = L.V;
  const night = F(t, 1.6, 2.4, easeInOut), move = F(t, 3.0, 3.9, easeInOut), bin = F(t, 3.0, 4.0);
  const out = F(t, 6.35, 6.85, easeIn);
  // phone moves from its usual spot to the front corner when the desktop arrives
  const end = V ? {x: 640, y: 1540 - PHONE_H * 0.82, s: 0.82} : {x: 560, y: 1080 - 60 - PHONE_H * 0.86, s: 0.86};
  const ph = {x: mix(L.ph.x, end.x, move), y: mix(L.ph.y, end.y, move), s: mix(L.ph.scale, end.s, move)};
  const cap6 = {n: '06', title: 'Day, night, any screen', body: 'Dark mode, a full desktop layout, and it all works offline.', at: 0.75, exitAt: 6.3, size: L.capSize};
  const br = V ? {x: 60, y: 600, s: 0.665} : {x: 760, y: 150, s: 0.74};
  return (
    <Stage bg="#F4F4F3" wipe="circle">
      <Caption {...cap6} style={{position: 'absolute', ...L.cap}} />
      {/* the night layer carries its own light caption, so the text inverts right at the wipe edge */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg,#141416,#050505)', clipPath: `circle(${night * 160}% at 85% 12%)`}}>
        <Caption {...cap6} dark style={{position: 'absolute', ...L.cap}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: br.x, top: br.y, opacity: bin * (1 - out), transform: `translateX(${(1 - bin) * (V ? -400 : 500)}px) perspective(1600px) rotateY(${(1 - bin) * (V ? 18 : -18)}deg)`}}>
        <Browser dark scale={br.s}><AppScreen cap={desktopDark} mode="desktop" t={t} /></Browser>
      </div>
      <div style={{position: 'absolute', left: ph.x, top: ph.y, ...deviceMotion(t)}}>
        <Phone scale={ph.s} dark={night > 0.55}>
          <AppScreen cap={home} t={t} />
          <AppScreen cap={homeDark} t={t} style={{clipPath: `circle(${night * 900}px at 335px 20px)`}} />
        </Phone>
      </div>
    </Stage>
  );
};

// ---------------------------------------------------------------- outro
export const Outro = () => {
  const t = useT(), V = useV();
  const up = F(t, 2.15, 2.8), fade = F(t, 6.0, 7.0, easeInOut);
  return (
    <Stage bg="#000" wipe="circle">
      <div style={{position: 'absolute', left: '50%', top: V ? 880 : 450, transform: `translate(-50%,-50%) translateY(${-up * (V ? 190 : 140)}px) scale(${mix(1, 0.8, up)})`}}>
        <LogoBuild t0={0.75} size={V ? 360 : 280} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: V ? 970 : 580}}>
        <NameReveal t0={2.45} size={V ? 160 : 140} tagColor="#bdbdbd" />
      </div>
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
    </Stage>
  );
};
