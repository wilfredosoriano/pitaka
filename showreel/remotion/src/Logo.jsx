import React from 'react';
import {spring, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {p, mix, backOut} from './lib';

// Pitaka's logo built from its own three shapes: the wallet body squashes in, the clasp slides
// into its notch, then the coin drops in from above and bounces into place.
// `t0` = when the build starts (s). `size` = rendered width in px. `color` = glyph color.
export const LogoBuild = ({t0 = 0, size = 360, color = '#fff'}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = f - t0 * fps;
  const body = spring({frame: local, fps, config: {damping: 11, stiffness: 120, mass: 0.9}});
  const clasp = spring({frame: local - 0.45 * fps, fps, config: {damping: 14, stiffness: 140}});
  const coinFall = spring({frame: local - 0.95 * fps, fps, config: {damping: 7.5, stiffness: 150, mass: 0.8}});
  // squash and stretch: tall and thin while growing, a little wide when it lands
  const sy = interpolate(body, [0, 0.6, 1, 1.15], [0.2, 1.12, 1, 0.94], {extrapolateRight: 'clamp'});
  const sx = interpolate(body, [0, 0.6, 1, 1.15], [0.6, 0.92, 1, 1.05], {extrapolateRight: 'clamp'});
  const coinY = mix(-46, 0, coinFall), coinOn = local > 0.95 * fps ? 1 : 0;
  return (
    <svg width={size} height={size} viewBox="4 3 56 56" fill={color} style={{overflow: 'visible'}}>
      <g style={{transformOrigin: '30px 58px', transform: `scale(${sx * Math.min(1, body * 1.6)}, ${sy})`}} opacity={Math.min(1, body * 3)}>
        <path d="M13 18H43a9 9 0 0 1 9 9v2H46a9 9 0 0 0 0 18h6v2a9 9 0 0 1-9 9H13a9 9 0 0 1-9-9V27a9 9 0 0 1 9-9z" />
      </g>
      <g style={{transform: `translateX(${mix(26, 0, clasp)}px)`}} opacity={Math.min(1, clasp * 2)}>
        <path fillRule="evenodd" d="M46 32h8a6 6 0 0 1 0 12h-8a6 6 0 0 1 0-12zM50 35.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z" />
      </g>
      <circle cx="22" cy={9 + coinY} r="6" opacity={coinOn} />
    </svg>
  );
};

// The same logo, assembled (for small static uses).
export const LogoGlyph = ({size = 40, color = '#fff'}) => (
  <svg width={size} height={size} viewBox="4 3 56 56" fill={color}>
    <circle cx="22" cy="9" r="6" />
    <path d="M13 18H43a9 9 0 0 1 9 9v2H46a9 9 0 0 0 0 18h6v2a9 9 0 0 1-9 9H13a9 9 0 0 1-9-9V27a9 9 0 0 1 9-9z" />
    <path fillRule="evenodd" d="M46 32h8a6 6 0 0 1 0 12h-8a6 6 0 0 1 0-12zM50 35.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z" />
  </svg>
);

// App name revealed letter by letter, then the tagline.
export const NameReveal = ({t0, size = 150, color = '#fff', tag = 'Know where your money goes', tagColor}) => {
  const f = useCurrentFrame();
  const letters = 'Pitaka'.split('');
  const tagK = p(f, t0 + 0.75, t0 + 1.5);
  return (
    <div style={{fontFamily: 'Onest, sans-serif', textAlign: 'center', color}}>
      <div style={{fontSize: size, fontWeight: 700, letterSpacing: '-.045em', lineHeight: 1}}>
        {letters.map((l, i) => {
          const k = p(f, t0 + i * 0.07, t0 + i * 0.07 + 0.55, backOut);
          return <span key={i} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '.1em'}}><span style={{display: 'inline-block', transform: `translateY(${(1 - k) * 110}%)`}}>{l}</span></span>;
        })}
      </div>
      <div style={{fontSize: size * 0.26, fontWeight: 400, marginTop: size * 0.18, color: tagColor || color, opacity: tagK * 0.85, transform: `translateY(${(1 - tagK) * 24}px)`, letterSpacing: '-.01em'}}>{tag}</div>
    </div>
  );
};
