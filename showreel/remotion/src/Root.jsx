import React from 'react';
import {AbsoluteFill, Composition, Sequence, Audio, staticFile, getStaticFiles} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Onest';
import {FPS, TL} from './lib';
import {AppStoreShot, SHOTS, APPSTORE} from './AppStore';
import {Brand, Title, S1, S2, S3, S4, S5, S6, Outro} from './Scenes';

loadFont('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin', 'latin-ext']});

const SCENES = {brand: Brand, title: Title, s1: S1, s2: S2, s3: S3, s4: S4, s5: S5, s6: S6, outro: Outro};
const hasMix = getStaticFiles().some((f) => f.name === 'audio/mix.wav');

// Scenes overlap by the wipe length; later scenes sit on top and wipe in over the previous one.
const Reel = () => (
  <AbsoluteFill style={{background: '#000'}}>
    {TL.scenes.map((s) => {
      const C = SCENES[s.id];
      return (
        <Sequence key={s.id} from={Math.round(s.start * FPS)} durationInFrames={Math.round((s.end - s.start) * FPS)} name={s.id}>
          <C />
        </Sequence>
      );
    })}
    {hasMix ? <Audio src={staticFile('audio/mix.wav')} /> : null}
  </AbsoluteFill>
);

export const Root = () => (
  <>
    <Composition id="ReelVertical" component={Reel} durationInFrames={TL.duration * FPS} fps={FPS} width={1080} height={1920} />
    <Composition id="ReelHorizontal" component={Reel} durationInFrames={TL.duration * FPS} fps={FPS} width={1920} height={1080} />
    <Composition id="AppStore" component={AppStoreShot} durationInFrames={SHOTS.length} fps={1} {...APPSTORE} />
  </>
);
