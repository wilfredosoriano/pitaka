import React, {useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {appCss} from './lib';

// Mounts one captured Pitaka screen inside a shadow root (styles stay isolated from the reel),
// waits for its images, then calls apply(root, t) on every frame so motion is deterministic.
const ICONS = staticFile('app/icons/');
const fix = (html) => html.replace(/(src="|url\(&quot;|url\(")icons\//g, `$1${ICONS}`);

export const AppScreen = ({cap, mode = 'phone', t = 0, apply, style}) => {
  const host = useRef(null);
  const root = useRef(null);
  const [handle] = useState(() => delayRender('Loading app screen'));

  useLayoutEffect(() => {
    const el = host.current;
    const sr = el.shadowRoot || el.attachShadow({mode: 'open'});
    sr.innerHTML = `<style>${appCss(cap.css, mode)}</style>${fix(cap.html)}`;
    root.current = sr;
    if (apply) apply(sr, t);
    const imgs = [...sr.querySelectorAll('img')].map((i) => i.complete ? 0 : new Promise((r) => {i.onload = i.onerror = r;}));
    const bgs = [...sr.querySelectorAll('[style*="background-image"]')].map((e) => {
      const m = /url\("?([^")]+)"?\)/.exec(e.getAttribute('style'));
      return m ? new Promise((r) => {const i = new Image(); i.onload = i.onerror = r; i.src = m[1];}) : 0;
    });
    Promise.all([...imgs, ...bgs, document.fonts.ready]).then(() => continueRender(handle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {if (root.current && apply) apply(root.current, t);});

  return (
    <div
      ref={host}
      data-theme={cap.theme}
      className={cap.bodyClass}
      // the transform makes this box the containing block for the app's fixed nav and sheets
      style={{position: 'absolute', inset: 0, width: cap.w, height: cap.h, transform: 'translateZ(0)', ...style}}
    />
  );
};

// Helpers used by the scenes' apply functions
export const q = (root, sel) => root.querySelector(sel);
export const qa = (root, sel) => [...root.querySelectorAll(sel)];
export const set = (el, styles) => {if (el) Object.assign(el.style, styles);};
