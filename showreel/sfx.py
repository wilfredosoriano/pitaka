"""Synthesized sound effects for the Pitaka showreel.

Builds a small palette (whoosh, swish, pop, tick, plink, thud, riser, shimmer, chime, buzz, hum)
and places every cue on the second its motion happens. Scene starts come from timeline.json;
the local times inside each scene match remotion/src/Scenes.jsx and Logo.jsx.

Writes sfx/sfx.wav (48 kHz stereo, light room reverb, peak -3 dBFS).
"""
import json
import os

import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
START = {s['id']: s['start'] for s in TL['scenes']}
DUR = TL['duration']
rng = np.random.default_rng(7)


def tt(d):
    return np.arange(int(d * SR)) / SR


def env(n, peak=0.6, a_pow=2.0, r_pow=2.0):
    """Rise to 1 at `peak` (fraction of length), then fall back to 0."""
    x = np.linspace(0, 1, n)
    up = (x / peak) ** a_pow
    down = ((1 - x) / (1 - peak)) ** r_pow
    return np.where(x < peak, up, down)


def bandsweep(noise, f0, f1, q=2.5, blocks=64):
    """Band-pass noise whose centre glides from f0 to f1 (block-wise, with crossfades)."""
    n = len(noise)
    out = np.zeros(n)
    edges = np.linspace(0, n, blocks + 1).astype(int)
    pad = 512
    for i in range(blocks):
        a, b = edges[i], edges[i + 1]
        fc = f0 * (f1 / f0) ** ((a + b) / 2 / n)
        bw = fc / q
        lo, hi = max(20, fc - bw / 2), min(SR / 2 - 100, fc + bw / 2)
        sos = signal.butter(2, [lo, hi], 'bandpass', fs=SR, output='sos')
        s, e = max(0, a - pad), min(n, b + pad)
        seg = signal.sosfilt(sos, noise[s:e])
        out[a:b] = seg[a - s:a - s + (b - a)]
    return out


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'lowpass', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'highpass', fs=SR, output='sos'), x)


def norm(x, g=1.0):
    m = np.max(np.abs(x)) or 1
    return x / m * g


def sweep_sine(f0, f1, d, curve='exp'):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d) if curve == 'exp' else np.linspace(f0, f1, len(t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


# ---------------------------------------------------------------- palette
def whoosh(d=0.6, up=True, f0=300, f1=3000):
    a, b = (f0, f1) if up else (f1, f0)
    x = bandsweep(rng.standard_normal(int(d * SR)), a, b)
    return norm(x * env(len(x), 0.6, 1.6, 1.4), 0.8)


def swish(d=0.35):
    x = bandsweep(rng.standard_normal(int(d * SR)), 1500, 6500, q=2)
    return norm(x * env(len(x), 0.55, 1.5, 1.8), 0.45)


def pop():
    d = 0.14
    t = tt(d)
    s = sweep_sine(900, 320, 0.12)
    s = np.concatenate([s, np.zeros(len(t) - len(s))]) * np.exp(-t * 32)
    n = hp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 120) * 0.15
    x = s + n
    x[:48] *= np.linspace(0, 1, 48)
    return norm(x, 0.55)


def tick(f=2500, g=0.3):
    d = 0.035
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 140)
    n = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 400) * 0.5
    x = s + n
    x[:24] *= np.linspace(0, 1, 24)
    return norm(x, g)


def plink(f=2300, g=0.5):
    d = 1.1
    t = tt(d)
    x = np.zeros(len(t))
    for r, dec, amp in [(1, 5, 1), (1.505, 7, .55), (2.21, 10, .4), (2.97, 14, .28), (4.12, 20, .18)]:
        x += amp * np.sin(2 * np.pi * f * r * t) * np.exp(-t * dec)
    x[:48] *= np.linspace(0, 1, 48)
    return norm(x, g)


def thud(g=0.9, long=False):
    d = 2.0 if long else 0.6
    t = tt(d)
    a = sweep_sine(110, 45, min(d, 0.5))
    a = np.concatenate([a, np.zeros(len(t) - len(a))]) * np.exp(-t * 9)
    x = a
    if long:
        sub = sweep_sine(62, 34, d) * np.exp(-t * 1.8)
        n = lp(rng.standard_normal(len(t)), 180) * np.exp(-t * 3) * 2.5
        x = a + 0.8 * sub + n
    x[:96] *= np.linspace(0, 1, 96)
    return norm(x, g)


def riser(d=1.2, g=0.55):
    x = bandsweep(rng.standard_normal(int(d * SR)), 400, 5000, q=3)
    tone = sweep_sine(220, 880, d) * 0.25
    e = np.linspace(0, 1, len(x)) ** 2.2
    e[-int(0.04 * SR):] *= np.linspace(1, 0, int(0.04 * SR))
    return norm((norm(x) + tone) * e, g)


def shimmer(d=0.8, g=0.22, count=14):
    x = np.zeros(int(d * SR))
    for _ in range(count):
        f = rng.uniform(3000, 9000)
        at = int(rng.uniform(0, d - 0.15) * SR)
        t = tt(0.15)
        x[at:at + len(t)] += np.sin(2 * np.pi * f * t) * np.exp(-t * 30) * rng.uniform(.4, 1)
    return norm(x, g)


def chime(g=0.4):
    out = np.zeros(int(1.4 * SR))
    for k, (f, at) in enumerate([(1318.5, 0), (1975.5, 0.11)]):
        t = tt(1.2)
        b = (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t * 4)
        b[:48] *= np.linspace(0, 1, 48)
        i = int(at * SR)
        out[i:i + len(b)] += b
    return norm(out, g)


def buzz(g=0.35):
    t = tt(0.09)
    p = np.tanh(3 * np.sin(2 * np.pi * 185 * t)) * env(len(t), 0.1, 1, 1)
    gap = np.zeros(int(0.05 * SR))
    return norm(np.concatenate([p, gap, p]), g)


def hum(d=1.0, g=0.18):
    t = tt(d)
    x = np.sin(2 * np.pi * 330 * t) * (0.7 + 0.3 * np.sin(2 * np.pi * 9 * t))
    return norm(x * env(len(t), 0.5, 1, 1), g)


# ---------------------------------------------------------------- placing cues
L = np.zeros(int(DUR * SR) + SR)
R = np.zeros_like(L)


def put(sound, at, gain=1.0, pan=0.0):
    i = int(round(at * SR))
    if i < 0:
        sound, i = sound[-i:], 0
    n = min(len(sound), len(L) - i)
    lg, rg = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:i + n] += sound[:n] * gain * lg * 1.414
    R[i:i + n] += sound[:n] * gain * rg * 1.414


def count_ticks(s0, a, b, n=12, gain=0.5):
    """Ticks for a count-up that eases out: dense at first, slowing as the number settles."""
    for k in range(1, n + 1):
        y = k / n
        x = 1 - (1 - y) ** (1 / 5)
        put(tick(2600 + rng.uniform(-200, 200), 0.22), s0 + a + (b - a) * x, gain, rng.uniform(-.2, .2))


def logo(s0, t0, name_t0, tag_t0, riser_from=None):
    if riser_from is not None:
        put(riser(t0 - riser_from + 0.1), s0 + riser_from)
        put(shimmer(0.7, 0.18), s0 + t0 - 0.4)
    put(thud(0.9, long=True), s0 + t0 + 0.22)          # wallet body lands
    put(pop(), s0 + t0 + 0.45, 0.8, 0.2)                 # clasp slides into its notch
    put(plink(2300, 0.55), s0 + t0 + 1.12)               # coin lands
    put(thud(0.25), s0 + t0 + 1.12, 0.6)
    for i in range(6):                                   # letters of "Pitaka"
        put(tick(2200 + i * 90, 0.2), s0 + name_t0 + i * 0.07 + 0.12, 0.8, -0.3 + i * 0.12)
    put(swish(), s0 + tag_t0, 0.8)


def feature(s0, wipe='whoosh'):
    put(whoosh(0.6, up=True), s0, 0.75)                  # scene wipe
    put(whoosh(0.8, up=True, f0=250, f1=2200), s0 + 0.6, 0.55, 0.3)   # device flies in
    put(swish(), s0 + 0.75, 0.7, -0.3)                   # caption title
    put(swish(0.3), s0 + 1.3, 0.4, -0.3)                 # caption body


# brand: build-up, logo, name
s = START['brand']
logo(s, 1.2, 2.9, 3.65, riser_from=0.0)
put(whoosh(0.7, up=True, f0=200, f1=1200), s + 2.55, 0.35)   # logo moves up

# title card: three lines, subline, exit
s = START['title']
put(whoosh(0.6), s, 0.75)
for i in range(3):
    put(swish(), s + 0.7 + i * 0.32, 0.75, -0.2 + i * 0.2)
put(swish(0.3), s + 1.9, 0.45)
put(swish(), s + 4.35, 0.5)

# 01 cards: scroll, two swipes, flip
s = START['s1']
feature(s)
put(whoosh(0.8, up=False, f0=300, f1=1800), s + 1.6, 0.3)
for at in (2.6, 3.5):
    put(swish(0.4), s + at, 0.7, -0.4)
    put(tick(2000, 0.25), s + at + 0.55, 0.7)
put(whoosh(0.8, up=True, f0=500, f1=4000), s + 4.6, 0.5)
put(pop(), s + 5.35, 0.6)

# 02 log spending: sheet, typing, chip, swap, over-budget warning
s = START['s2']
feature(s)
put(whoosh(0.5, up=True, f0=300, f1=2000), s + 1.3, 0.5)
for k in range(8):
    put(tick(2400 + rng.uniform(-300, 300), 0.24), s + 2.05 + (k + 0.5) * 0.8 / 8, 0.75, rng.uniform(-.3, .3))
for k in range(3):
    put(tick(2700, 0.24), s + 2.95 + (k + 0.5) * 0.35 / 3, 0.75)
put(pop(), s + 3.45, 0.8)
put(swish(0.3), s + 4.0, 0.5)
put(buzz(), s + 4.38, 0.75)

# 03 receipt: sheet, print, count-up, rows, buttons
s = START['s3']
feature(s)
put(whoosh(0.5, up=True, f0=300, f1=2000), s + 1.15, 0.5)
put(hum(1.0), s + 1.8, 0.8)
count_ticks(s, 2.0, 2.8, 10)
put(plink(2300, 0.5), s + 2.8)
for i in range(4):
    put(tick(2100, 0.18), s + 2.8 + i * 0.12, 0.6)
put(pop(), s + 3.32, 0.6, -0.15)
put(pop(), s + 3.44, 0.6, 0.15)
put(chime(0.32), s + 3.6, 0.8)

# 04 insights: count-up, budget bar, scroll, category bars
s = START['s4']
feature(s)
count_ticks(s, 1.35, 2.4, 14)
put(plink(2500, 0.35), s + 2.4)
put(shimmer(0.6, 0.15), s + 1.9)
put(whoosh(0.9, up=False, f0=300, f1=1800), s + 2.9, 0.3)
for i in range(7):
    put(pop(), s + 3.75 + i * 0.11, 0.45, -0.3 + i * 0.1)

# 05 pay later and savings: cards, goal bar, tab swap, credit count-up
s = START['s5']
feature(s)
for i in range(6):
    put(pop(), s + 1.35 + i * 0.08, 0.5, -0.3 + i * 0.12)
put(riser(0.8, 0.3), s + 2.15)
put(plink(2300, 0.45), s + 2.95)
put(shimmer(0.6, 0.15), s + 2.95)
put(swish(0.3), s + 3.55, 0.6)
put(tick(2000, 0.25), s + 3.6, 0.7)
count_ticks(s, 3.8, 4.6, 12)
put(pop(), s + 4.15, 0.6)

# 06 night mode and desktop
s = START['s6']
feature(s)
put(whoosh(0.8, up=False, f0=400, f1=3000), s + 1.6, 0.6)
put(thud(0.85, long=True), s + 2.2, 0.8)
put(whoosh(1.0, up=True, f0=200, f1=2500), s + 3.0, 0.7, 0.4)
put(thud(0.3), s + 3.9, 0.5)

# outro: wipe, logo again, name, then silence for the fade
s = START['outro']
put(whoosh(0.6), s, 0.7)
logo(s, 0.75, 2.45, 3.2, riser_from=0.1)

# exits of each feature scene (device leaves, caption leaves)
for sid in ('s1', 's2', 's3', 's4', 's5'):
    put(swish(0.3), START[sid] + 6.3, 0.35)

# ---------------------------------------------------------------- room reverb, normalize, write
ir_t = tt(0.9)
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 7.5)
ir = lp(ir, 6000)
ir /= np.sqrt(np.sum(ir ** 2))
out = []
for ch in (L, R):
    wet = signal.fftconvolve(ch, ir)[:len(ch)]
    wet = norm(wet, np.max(np.abs(ch)))
    out.append(ch * 0.78 + wet * 0.22)
st = np.stack(out, 1)[:int(DUR * SR)]
st = st / np.max(np.abs(st)) * 10 ** (-3 / 20)

os.makedirs(os.path.join(HERE, 'sfx'), exist_ok=True)
path = os.path.join(HERE, 'sfx', 'sfx.wav')
wavfile.write(path, SR, st.astype(np.float32))
print('wrote', path, f'{len(st) / SR:.2f}s')
