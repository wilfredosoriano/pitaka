import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {AppScreen} from './AppScreen';
import {Phone, PHONE_W, PHONE_H} from './Devices';
import home from './captures/home.json';
import homeDark from './captures/home_dark.json';
import entryOver from './captures/entry_over.json';
import receipt from './captures/receipt.json';
import insights from './captures/insights.json';
import wallets from './captures/wallets.json';
import walletsPl from './captures/wallets_pl.json';

// App Store screenshots, 1320 x 2868 (6.9" iPhone). One shot per frame.
export const SHOTS = [
  {id: 'home', cap: home, dark: true, title: 'Know where your\nmoney goes', sub: 'Cash, banks and e-wallets in one place.'},
  {id: 'log', cap: entryOver, title: 'Log spending\nin seconds', sub: 'It warns you before you overspend.'},
  {id: 'receipt', cap: receipt, title: 'Every entry,\na clean receipt', sub: 'Tap any entry to see, edit or log it again.'},
  {id: 'insights', cap: insights, title: 'See where\nit went', sub: 'Budgets and limits for each category.'},
  {id: 'wallets', cap: wallets, title: 'All your wallets\nat a glance', sub: 'And watch your savings goals grow.'},
  {id: 'paylater', cap: walletsPl, title: 'Pay later,\nunder control', sub: 'Always know the credit you have left.'},
  {id: 'night', cap: homeDark, dark: true, appDark: true, title: 'Easy on the eyes\nat night', sub: 'Dark mode, and it works offline.'},
];

const W = 1320, H = 2868;
const SCALE = 2.6, PH_TOP = 2868 - PHONE_H * 2.6 - 96;

export const AppStoreShot = () => {
  const s = SHOTS[Math.min(useCurrentFrame(), SHOTS.length - 1)];
  const ink = s.dark ? '#fff' : '#000', muted = s.dark ? '#A8A8A8' : '#6B6B6B';
  return (
    <AbsoluteFill style={{background: s.dark ? 'linear-gradient(180deg,#161618,#050505)' : '#F4F4F3', fontFamily: 'Onest, sans-serif'}}>
      <div style={{position: 'absolute', top: 190, left: 80, right: 80, textAlign: 'center', color: ink}}>
        <div style={{fontSize: 118, fontWeight: 700, letterSpacing: '-.04em', lineHeight: 1.02, whiteSpace: 'pre-line'}}>{s.title}</div>
        <div style={{fontSize: 46, fontWeight: 400, color: muted, marginTop: 40, letterSpacing: '-.01em'}}>{s.sub}</div>
      </div>
      <Phone scale={SCALE} dark={!!s.appDark} style={{left: (W - PHONE_W * SCALE) / 2, top: PH_TOP}}>
        <AppScreen cap={s.cap} />
      </Phone>
    </AbsoluteFill>
  );
};

export const APPSTORE = {width: W, height: H};
