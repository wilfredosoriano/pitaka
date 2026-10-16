import React from 'react';

// iPhone-style frame. The screen is 375 x 812 points: a 47pt status bar (9:41, Dynamic Island)
// over the app, which was captured at 375 x 765. Drawn at natural size, scaled with `scale`.
export const PHONE_W = 375 + 2 * 13;
export const PHONE_H = 812 + 2 * 13;

const Bars = ({c}) => (
  <svg width="74" height="13" viewBox="0 0 74 13" fill={c}>
    <rect x="0" y="8" width="3.4" height="4.5" rx="1" /><rect x="5" y="6" width="3.4" height="6.5" rx="1" />
    <rect x="10" y="3.5" width="3.4" height="9" rx="1" /><rect x="15" y="1" width="3.4" height="11.5" rx="1" />
    <path d="M32 3.6a9.6 9.6 0 0 1 12.2 0l1.4-1.5a11.6 11.6 0 0 0-15 0zM34.4 6.2a6 6 0 0 1 7.4 0l1.4-1.5a8 8 0 0 0-10.2 0zM36.8 8.8a2.4 2.4 0 0 1 2.6 0L38.1 11z" />
    <rect x="49.5" y="1" width="22" height="11.5" rx="3.6" fill="none" stroke={c} strokeOpacity=".4" strokeWidth="1" />
    <rect x="51.3" y="2.8" width="16.5" height="7.9" rx="2.2" /><rect x="72.6" y="4.5" width="1.4" height="4.4" rx=".7" fillOpacity=".4" />
  </svg>
);

export const Phone = ({dark = false, scale = 1, style, children}) => {
  const fg = dark ? '#fff' : '#000';
  return (
    <div style={{position: 'absolute', width: PHONE_W, height: PHONE_H, transformOrigin: '0 0', transform: `scale(${scale})`, ...style}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 64, background: '#0d0d0f', boxShadow: '0 50px 90px -30px rgba(0,0,0,.55), inset 0 0 0 1.5px #3a3a3e'}} />
      <div style={{position: 'absolute', left: 13, top: 13, width: 375, height: 812, borderRadius: 52, overflow: 'hidden', background: dark ? '#0f0f0f' : '#fff'}}>
        <div style={{position: 'absolute', left: 0, top: 47, width: 375, height: 765}}>{children}</div>
        <div style={{position: 'absolute', left: 0, top: 0, width: 375, height: 47, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 30px 0 46px', fontFamily: 'Onest, -apple-system, sans-serif', fontWeight: 600, fontSize: 16, color: fg, background: dark ? '#0f0f0f' : '#fff'}}>
          <span>9:41</span><Bars c={fg} />
        </div>
        <div style={{position: 'absolute', left: (375 - 122) / 2, top: 11, width: 122, height: 35, borderRadius: 18, background: '#000'}} />
        <div style={{position: 'absolute', left: (375 - 134) / 2, bottom: 8, width: 134, height: 5, borderRadius: 3, background: fg, opacity: .85}} />
      </div>
    </div>
  );
};

// Browser window for the desktop layout, with the app's real address in the URL bar.
export const BROWSER_W = 1440;
export const BROWSER_H = 900 + 52;
export const Browser = ({dark = false, scale = 1, style, children}) => (
  <div style={{position: 'absolute', width: BROWSER_W, height: BROWSER_H, transformOrigin: '0 0', transform: `scale(${scale})`, borderRadius: 18, overflow: 'hidden', background: dark ? '#0f0f0f' : '#fff', boxShadow: '0 60px 120px -40px rgba(0,0,0,.6), 0 0 0 1px rgba(0,0,0,.12)', ...style}}>
    <div style={{height: 52, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', background: dark ? '#202022' : '#ececec', borderBottom: `1px solid ${dark ? '#2e2e2e' : '#dcdcdc'}`}}>
      {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />)}
      <div style={{marginLeft: 120, flex: '0 1 560px', height: 32, borderRadius: 9, background: dark ? '#2c2c2e' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Onest, sans-serif', fontSize: 15, color: dark ? '#cfcfcf' : '#444'}}>
        <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor"><rect x="1" y="6" width="10" height="8" rx="2" /><path d="M3 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" fill="none" /></svg>
        pitaka-ko.vercel.app
      </div>
    </div>
    <div style={{position: 'absolute', left: 0, top: 52, width: 1440, height: 900}}>{children}</div>
  </div>
);
