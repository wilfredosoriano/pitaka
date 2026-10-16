"""Mix the voice-over and the sound effects into remotion/public/audio/mix.wav.

The ffmpeg bundled with Remotion lacks most audio filters, so the chain from the brief is done
here with numpy/scipy, and only loudnorm runs in ffmpeg:
  voice: highpass 90 Hz, +1 dB at 3 kHz, compressor -22 dB 2.5:1
  sfx:   60% volume, sidechain-ducked from the voice (thr 0.02, 5:1, 15/350 ms)
  sum -> limiter 0.89 -> loudnorm I=-14 TP=-1.5 LRA=9 (two pass)
Also draws sfx/check.png: both waveforms against the scene boundaries.
"""
import json
import os
import subprocess

import numpy as np
from PIL import Image, ImageDraw
from scipy import signal
from scipy.io import wavfile

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
REMO = os.path.join(HERE, 'remotion')
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
DUR = TL['duration']
N = int(DUR * SR)


def read(path):
    sr, x = wavfile.read(path)
    x = x.astype(np.float64)
    if x.dtype.kind == 'i' or np.max(np.abs(x)) > 2:
        x /= 32768.0
    if x.ndim > 1:
        x = x.mean(1)
    if sr != SR:
        x = signal.resample_poly(x, SR, sr)
    return x


def follower(x, attack, release):
    """Peak envelope with separate attack/release (seconds)."""
    a, r = np.exp(-1 / (attack * SR)), np.exp(-1 / (release * SR))
    y = np.empty_like(x)
    e = 0.0
    for i, v in enumerate(np.abs(x)):
        c = a if v > e else r
        e = c * e + (1 - c) * v
        y[i] = e
    return y


def gain_for(envl, thr, ratio):
    g = np.ones_like(envl)
    m = envl > thr
    g[m] = (envl[m] / thr) ** (1 / ratio - 1)
    return g


def peaking(f0, gain_db, q=0.9):
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / SR
    al = np.sin(w) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w), 1 - al * A]
    a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return np.array(b) / a[0], np.array(a) / a[0]


# ---------------------------------------------------------------- voice
voice = np.zeros(N)
rows = [l.split('\t') for l in open(os.path.join(HERE, 'vo', 'script.tsv')).read().strip().split('\n')[1:]]
for i, (start, text, latest) in enumerate(rows):
    x = read(os.path.join(HERE, 'vo', f'line{i:02d}.wav'))
    x = x / np.max(np.abs(x)) * 0.8
    s = int(float(start) * SR)
    end = s + len(x)
    print(f'line{i:02d} {float(start):5.2f}-{end / SR:5.2f}s (latest {latest})  {text}')
    assert end / SR <= float(latest) + 0.01, f'line{i:02d} runs past its scene'
    voice[s:s + len(x)] += x[:N - s]

voice = signal.sosfilt(signal.butter(2, 90, 'highpass', fs=SR, output='sos'), voice)
voice = signal.lfilter(*peaking(3000, 1.0), voice)
voice *= gain_for(follower(voice, 0.02, 0.25), 10 ** (-22 / 20), 2.5)
voice /= np.max(np.abs(voice))
voice *= 0.8

# ---------------------------------------------------------------- effects, ducked under the voice
sr, fx = wavfile.read(os.path.join(HERE, 'sfx', 'sfx.wav'))
fx = fx.astype(np.float64)[:N] * 0.6
fx = np.pad(fx, ((0, N - len(fx)), (0, 0)))
duck = gain_for(follower(voice, 0.015, 0.35), 0.02, 5)
fx *= duck[:, None]

# ---------------------------------------------------------------- sum and limit
mixd = fx + voice[:, None]
look = int(0.005 * SR)
pk = np.max(np.abs(mixd), 1)
pk = np.maximum.reduce([np.roll(pk, -k) for k in range(0, look, 16)])
g = np.minimum(1, 0.89 / np.maximum(pk, 1e-9))
g = -follower(-g + 1, 0.001, 0.08) + 1   # fast down, smooth recovery
g = np.minimum(g, np.minimum(1, 0.89 / np.maximum(np.max(np.abs(mixd), 1), 1e-9)))
mixd *= g[:, None]

os.makedirs(os.path.join(REMO, 'public', 'audio'), exist_ok=True)
pre = os.path.join(HERE, 'sfx', 'premix.wav')
wavfile.write(pre, SR, mixd.astype(np.float32))

# ---------------------------------------------------------------- loudnorm, two pass
ff = ['npx', 'remotion', 'ffmpeg', '-hide_banner', '-nostats']
LN = 'loudnorm=I=-14:TP=-1.5:LRA=9'
r = subprocess.run(ff + ['-i', pre, '-af', LN + ':print_format=json', '-f', 'null', '-'], cwd=REMO, capture_output=True, text=True)
txt = r.stderr
m = json.loads(txt[txt.rindex('{'):txt.rindex('}') + 1])
print('measured', {k: m[k] for k in ('input_i', 'input_tp', 'input_lra')})
af = (f"{LN}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
out = os.path.join(REMO, 'public', 'audio', 'mix.wav')
subprocess.run(ff + ['-y', '-i', pre, '-af', af, '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_s16le', out], cwd=REMO, check=True, capture_output=True)
r = subprocess.run(ff + ['-i', out, '-af', LN + ':print_format=json', '-f', 'null', '-'], cwd=REMO, capture_output=True, text=True)
txt = r.stderr
m = json.loads(txt[txt.rindex('{'):txt.rindex('}') + 1])
print('final    ', {k: m[k] for k in ('input_i', 'input_tp', 'input_lra')})
print('wrote', out)

# ---------------------------------------------------------------- timing check image
W, H = 2400, 520
img = Image.new('RGB', (W, H), 'white')
d = ImageDraw.Draw(img)
px = lambda sec: int(sec / DUR * (W - 40)) + 20


def wave(x, y0, h, col):
    step = len(x) // (W - 40)
    for i in range(W - 40):
        seg = np.abs(x[i * step:(i + 1) * step])
        v = float(seg.max()) if len(seg) else 0
        d.line([(20 + i, y0 - v * h), (20 + i, y0 + v * h)], fill=col)


wave(voice, 150, 110, (30, 30, 30))
wave(fx.mean(1) / 0.6, 380, 110, (150, 150, 150))
for sc in TL['scenes']:
    x = px(sc['start'])
    d.line([(x, 20), (x, H - 30)], fill=(220, 60, 60), width=2)
    d.text((x + 4, 22), sc['id'], fill=(220, 60, 60))
for sec in range(int(DUR) + 1):
    d.text((px(sec) - 4, H - 22), str(sec), fill=(120, 120, 120))
d.text((24, 260), 'voice (top) / effects after ducking (bottom)', fill=(0, 0, 0))
img.save(os.path.join(HERE, 'sfx', 'check.png'))
print('wrote', os.path.join(HERE, 'sfx', 'check.png'))
