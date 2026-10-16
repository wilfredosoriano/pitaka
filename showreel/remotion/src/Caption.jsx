import React from 'react';
import {useCurrentFrame} from 'remotion';
import {p, easeIn, mix} from './lib';

// Word-by-word masked reveal. `at` = start (s); words stagger by `gap`.
export const Words = ({text, at, gap = 0.07, dur = 0.7, style, exitAt, exitDur = 0.45}) => {
  const f = useCurrentFrame();
  const words = text.split(' ');
  const out = exitAt != null ? p(f, exitAt, exitAt + exitDur, easeIn) : 0;
  return (
    <span style={{display: 'inline', ...style}}>
      {words.map((w, i) => {
        const k = p(f, at + i * gap, at + i * gap + dur);
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em', marginBottom: '-0.08em'}}>
            <span style={{display: 'inline-block', transform: `translateY(${mix(105, 0, k) - out * 105}%)`}}>{w}{i < words.length - 1 ? ' ' : ''}</span>
          </span>
        );
      })}
    </span>
  );
};

// Feature caption: small number, bold title, one-sentence body.
export const Caption = ({n, title, body, at = 0.7, exitAt, dark, size = 1, align = 'left', style}) => {
  const f = useCurrentFrame();
  const numK = p(f, at, at + 0.6), out = exitAt != null ? p(f, exitAt, exitAt + 0.5, easeIn) : 0;
  const ink = dark ? '#fff' : '#000', muted = dark ? '#A8A8A8' : '#6B6B6B';
  return (
    <div style={{fontFamily: 'Onest, sans-serif', color: ink, textAlign: align, ...style}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14 * size, justifyContent: align === 'center' ? 'center' : 'flex-start', opacity: numK * (1 - out), transform: `translateY(${(1 - numK) * 20 - out * 20}px)`, marginBottom: 22 * size}}>
        <span style={{fontSize: 26 * size, fontWeight: 600, letterSpacing: '.04em', fontVariantNumeric: 'tabular-nums'}}>{n}</span>
        <span style={{height: 2, width: 64 * size * numK, background: ink, opacity: .35}} />
      </div>
      <div style={{fontSize: 76 * size, fontWeight: 700, letterSpacing: '-.035em', lineHeight: 1.04}}>
        <Words text={title} at={at + 0.15} exitAt={exitAt} />
      </div>
      <div style={{fontSize: 34 * size, fontWeight: 400, lineHeight: 1.35, color: muted, marginTop: 22 * size, maxWidth: 820 * size, marginLeft: align === 'center' ? 'auto' : 0, marginRight: align === 'center' ? 'auto' : 0}}>
        <Words text={body} at={at + 0.55} gap={0.045} exitAt={exitAt != null ? exitAt + 0.05 : null} />
      </div>
    </div>
  );
};
