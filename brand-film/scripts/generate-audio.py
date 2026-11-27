#!/usr/bin/env python3
"""
ArmeTec brand film — ORIGINAL sound design (no music).

Every sound is synthesized from scratch (oscillators, filtered noise, envelopes,
granular clusters, convolution reverb from decaying noise). No samples, no
third-party audio. All cues (time, type, gain, duration) come from
src/config/timeline.json -> "sfx", so picture and sound stay locked together.

Output: public/audio/sounddesign.wav (48 kHz, 16-bit stereo), the full mix.
Run:    python3 scripts/generate-audio.py      (requires numpy)
"""
import json
import os
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, 'src/config/timeline.json')))
SR = 48000
DUR = TL['durationSeconds']
rng = np.random.default_rng(20261)  # fixed seed: reproducible


# ------------------------------------------------------------------ helpers
def T(sec):
    return np.arange(max(1, int(sec * SR))) / SR


def fft_filter(x, lo=None, hi=None, order=2):
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(len(x), 1 / SR) + 1e-9
    H = np.ones_like(f)
    if hi:
        H *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    if lo:
        H *= 1 / np.sqrt(1 + (lo / f) ** (2 * order))
    return np.fft.irfft(X * (H if x.ndim == 1 else H[:, None]), n=len(x), axis=0)


def addp(*xs):
    """Sum signals of different lengths (zero-padded)."""
    n = max(len(x) for x in xs)
    out = np.zeros((n,) + xs[0].shape[1:])
    for x in xs:
        out[: len(x)] += x
    return out


def noise(n):
    return rng.standard_normal(n)


def env_exp(t, k):
    return np.exp(-t * k)


def env_ar(t, a, total):
    e = np.clip(t / max(a, 1e-4), 0, 1) * np.clip((total - t) / max(total * 0.5, 1e-4), 0, 1)
    return e


def sine(f, t, ph=0.0):
    if np.ndim(f):
        return np.sin(2 * np.pi * np.cumsum(f) / SR + ph)
    return np.sin(2 * np.pi * f * t + ph)


def stereo(x, pan=0.0, width=0.0):
    if x.ndim == 2:
        return x
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    out = np.stack([x * l, x * r], 1)
    if width > 0:
        d = int(0.006 * SR * width)
        out[:, 1] = np.concatenate([np.zeros(d), out[:-d, 1] if d else out[:, 1]])[: len(out)]
    return out


def norm(x, peak=1.0):
    m = np.abs(x).max()
    return x * (peak / m) if m > 1e-9 else x


def reverb_ir(seconds=2.4, decay=3.2, bright=7000):
    n = int(seconds * SR)
    ir = rng.standard_normal((n, 2)) * np.exp(-np.linspace(0, decay * 2.3, n))[:, None]
    ir = fft_filter(ir, hi=bright, order=1)
    ir[: int(0.008 * SR)] *= np.linspace(0, 1, int(0.008 * SR))[:, None]
    return ir / np.sqrt((ir ** 2).sum(0)).max()


def convolve(x, ir):
    n = len(x) + len(ir) - 1
    N = 1 << int(np.ceil(np.log2(n)))
    return np.fft.irfft(np.fft.rfft(x, N, axis=0) * np.fft.rfft(ir, N, axis=0), N, axis=0)[: len(x)]


def mix_into(buf, sig, at):
    i = int(at * SR)
    if i >= len(buf) or i + len(sig) <= 0:
        return
    s0 = max(0, -i)
    i = max(0, i)
    j = min(len(buf), i + len(sig) - s0)
    buf[i:j] += sig[s0 : s0 + j - i]


# --------------------------------------------------------------- primitives
def blip(freq, dur=0.06, decay=60, harm=0.0):
    t = T(dur)
    s = sine(freq, t) * env_exp(t, decay)
    if harm:
        s += sine(freq * 2.01, t) * env_exp(t, decay * 1.6) * harm
    return s * np.clip(t / 0.002, 0, 1)


def click_raw(bright=6000, dur=0.03, body=0.0, bodyf=180):
    t = T(dur)
    s = fft_filter(noise(len(t)) * env_exp(t, 900), lo=1200, hi=bright)
    if body:
        s += sine(bodyf, t) * env_exp(t, 140) * body
    return s


def swoosh(dur, lo=300, hi=4000, peak=0.55, sweep_up=True):
    t = T(dur)
    k = t / dur
    e = np.sin(np.pi * np.clip(k, 0, 1)) ** 2 * np.exp(-((k - peak) ** 2) / 0.09)
    n = noise((len(t), 2))
    a = fft_filter(n, lo=lo, hi=hi * 0.4)
    b = fft_filter(n, lo=hi * 0.3, hi=hi)
    m = (k if sweep_up else 1 - k)[:, None]
    s = (a * (1 - m) + b * m) * e[:, None]
    s[:, 0] *= np.linspace(1.15, 0.7, len(t))
    s[:, 1] *= np.linspace(0.7, 1.15, len(t))
    return s


# -------------------------------------------------------------- sound types
def s_air(dur):
    t = T(dur)
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.09 * t + 1.3)
    low = fft_filter(noise((len(t), 2)), lo=40, hi=320)
    hiss = fft_filter(noise((len(t), 2)), lo=5000, hi=12000) * 0.08
    e = np.clip(t / 1.5, 0, 1) * np.clip((dur - t) / 1.5, 0, 1)
    return norm((low + hiss) * (lfo * e)[:, None], 0.25)


def s_room(dur):
    t = T(dur)
    hum = (sine(60, t) * 0.4 + sine(120, t) * 0.2) * 0.25
    tone = fft_filter(noise(len(t)), lo=80, hi=900) * 0.6
    e = np.clip(t / 1.0, 0, 1) * np.clip((dur - t) / 1.2, 0, 1)
    return stereo(norm((hum + tone) * e, 0.22), 0, 1)


def s_light():
    t = T(1.6)
    glint = sum(sine(f, t) * env_exp(t, 2.2 + i) for i, f in enumerate([3520, 5280, 7040])) * 0.12
    air = fft_filter(noise(len(t)), lo=3000, hi=11000) * env_ar(t, 0.25, 1.6) * 0.5
    return stereo(norm((glint + air) * np.clip(t / 0.06, 0, 1), 0.6), 0, 1)


def s_tick(soft=False):
    t = T(0.14)
    c = fft_filter(noise(len(t)) * env_exp(t, 1100), lo=1800, hi=9500)
    body = sine(3100, t) * env_exp(t, 240) * 0.45 + sine(1550, t) * env_exp(t, 170) * 0.3
    s = c * 0.8 + body
    return norm(s, 0.45 if soft else 0.8)


def s_clock_whirr(dur):
    t = T(dur)
    out = np.zeros(len(t))
    # accelerating escapement
    pos = 0.0
    while pos < dur - 0.05:
        k = pos / dur
        tk = s_tick(True) * (0.45 + 0.35 * k)
        i = int(pos * SR)
        j = min(len(out), i + len(tk))
        out[i:j] += tk[: j - i]
        pos += max(0.018, 0.25 * (1 - k) ** 2.2)
    # gear whirr tone rising
    f = 90 + 900 * (t / dur) ** 2
    whirr = fft_filter(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.1, lo=200, hi=3000) * (t / dur) ** 1.5
    return stereo(norm(out + whirr, 0.7), 0, 1)


def s_time_rush(dur):
    t = T(dur)
    out = np.zeros((len(t), 2))
    n = int(dur * 70)
    for i in range(n):
        k = (i / n) ** 0.6
        at = k * (dur - 0.05)
        b = blip(1800 + rng.random() * 2600, 0.03, 140) * (0.15 + 0.5 * k)
        mix_into(out, stereo(b, rng.uniform(-0.8, 0.8)), at)
    swell = fft_filter(noise((len(t), 2)), lo=500, hi=5000) * ((t / dur) ** 2)[:, None] * 0.25
    return norm(out + swell, 0.55)


def s_type_reveal():
    t = T(1.1)
    air = swoosh(1.1, 400, 7000, 0.35)
    ping = sine(1318.5, t) * env_exp(t, 4.5) * 0.12 + sine(2637, t) * env_exp(t, 7) * 0.05
    return norm(addp(air * 0.8, stereo(ping * np.clip(t / 0.01, 0, 1), 0, 1)), 0.55)


def s_sub_hit():
    t = T(2.4)
    f = 40 + 55 * np.exp(-t * 18)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.8)
    s += fft_filter(noise(len(t)) * env_exp(t, 35), hi=260) * 0.35
    return stereo(norm(np.tanh(s * 1.5), 0.9))


def s_impact(soft=False):
    t = T(2.8)
    f = 52 + 90 * np.exp(-t * 26)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.1)
    crack = fft_filter(noise(len(t)) * env_exp(t, 16), lo=200, hi=6000) * 0.55
    metal = sum(sine(fr, t) * env_exp(t, 4 + i) for i, fr in enumerate([311, 467, 733, 1190])) * 0.06
    s = stereo(np.tanh((sub + crack + metal) * 1.3))
    s = s + convolve(s, reverb_ir(2.2, 3.6, 5000)) * 0.32
    return norm(s, 0.7 if soft else 0.95)


def s_whoosh(kind):
    if kind == 'whoosh':
        return norm(swoosh(0.9, 250, 5000, 0.55), 0.7)
    if kind == 'whoosh-soft':
        return norm(swoosh(0.8, 200, 2500, 0.5), 0.5)
    if kind == 'whoosh-long':
        return norm(swoosh(1.6, 150, 6000, 0.62), 0.75)
    if kind == 'reverse-whoosh':
        s = swoosh(1.0, 300, 6000, 0.5)[::-1] * np.linspace(0.1, 1, int(1.0 * SR))[:, None]
        return norm(s, 0.65)
    # swish: short object movement
    return norm(swoosh(0.32, 900, 8000, 0.45), 0.5)


def s_click():
    return stereo(norm(click_raw(8000, 0.05, 0.35, 900), 0.6), rng.uniform(-0.15, 0.15))


def s_key(heavy=False):
    t = T(0.07)
    c = fft_filter(noise(len(t)) * env_exp(t, 700 + rng.random() * 300), lo=1500, hi=7000)
    thock = sine(150 + rng.random() * 60, t) * env_exp(t, 110) * (0.9 if heavy else 0.45)
    return (c * (0.7 + 0.3 * rng.random()) + thock) * (1.0 if heavy else 0.8)


def s_typing(dur):
    out = np.zeros((int(dur * SR) + SR // 5, 2))
    pos = 0.0
    while pos < dur:
        heavy = rng.random() < 0.12
        mix_into(out, stereo(s_key(heavy), rng.uniform(-0.25, 0.25)), pos)
        pos += 0.055 + rng.random() * 0.065
    return norm(out, 0.55)


def s_copy():
    out = np.zeros((int(0.3 * SR), 2))
    mix_into(out, stereo(click_raw(7000, 0.04, 0.2)), 0)
    mix_into(out, stereo(blip(1760, 0.12, 30) * 0.5), 0.06)
    return norm(out, 0.5)


def s_paste():
    t = T(0.5)
    thup = sine(220 * np.exp(-t * 6) + 110, t) * env_exp(t, 18)
    ding = sine(2093, t) * env_exp(t, 12) * 0.25
    return stereo(norm(thup + ding, 0.55))


def s_window_open():
    t = T(0.45)
    air = fft_filter(noise(len(t)), lo=600, hi=6000) * env_ar(t, 0.05, 0.45) * 0.5
    pop = sine(300 + 500 * np.exp(-t * 30), t) * env_exp(t, 22) * 0.6
    return stereo(norm(air + pop, 0.5), rng.uniform(-0.3, 0.3))


def s_search():
    out = np.zeros((int(0.9 * SR), 2))
    for i, f in enumerate([1568, 1976, 2349, 2794]):
        mix_into(out, stereo(blip(f, 0.25, 14) * 0.4, -0.4 + i * 0.27), i * 0.06)
    return norm(out, 0.45)


def s_scroll(dur):
    out = np.zeros((int((dur + 0.2) * SR), 2))
    pos = 0.0
    while pos < dur:
        mix_into(out, stereo(click_raw(5000, 0.02, 0.1) * 0.6), pos)
        pos += 0.045
    return norm(out, 0.35)


def s_denied():
    t = T(0.5)
    a = sine(311, t) * env_exp(t, 10) * (t < 0.18)
    b = sine(233, t - 0.14) * env_exp(np.clip(t - 0.14, 0, None), 9) * (t >= 0.14)
    return stereo(norm(fft_filter(a + b, hi=2500), 0.4))


def s_paper():
    t = T(0.55)
    slide = fft_filter(noise(len(t)), lo=1500, hi=9000) * env_ar(t, 0.12, 0.55)
    crinkle = fft_filter(noise(len(t)) * (rng.random(len(t)) > 0.995), lo=2000, hi=8000) * 3
    return stereo(norm(slide + crinkle * env_ar(t, 0.05, 0.55), 0.5), rng.uniform(-0.4, 0.4))


def s_save():
    out = np.zeros((int(0.7 * SR), 2))
    mix_into(out, stereo(blip(1318.5, 0.4, 12, 0.3)), 0)
    mix_into(out, stereo(blip(1975.5, 0.5, 10, 0.3)), 0.07)
    return norm(out, 0.42)


def s_notification():
    out = np.zeros((int(1.2 * SR), 2))
    mix_into(out, stereo(blip(1760, 0.8, 6, 0.4)), 0)
    mix_into(out, stereo(blip(2637, 0.9, 6, 0.3)), 0.11)
    out += convolve(out, reverb_ir(1.2, 4, 9000)) * 0.25
    return norm(out, 0.5)


def s_message():
    # original "arrival" signature: soft pop + three rising glass notes
    out = np.zeros((int(1.6 * SR), 2))
    t = T(0.12)
    pop = sine(500 + 900 * np.exp(-t * 40), t) * env_exp(t, 35)
    mix_into(out, stereo(pop * 0.8), 0)
    for i, f in enumerate([1396.9, 1760, 2349.3]):
        mix_into(out, stereo(blip(f, 0.9, 7, 0.35) * (0.8 - i * 0.1), -0.2 + i * 0.2), 0.05 + i * 0.075)
    out += convolve(out, reverb_ir(1.5, 3.8, 9000)) * 0.3
    return norm(out, 0.8)


def s_phone_notify():
    # iPhone-style alert (original): crisp glassy marimba, two bright notes, very short
    out = np.zeros((int(0.9 * SR), 2))
    for i, f0 in enumerate([1318.5, 1975.5]):
        t = T(0.6)
        note = (sine(f0, t) * env_exp(t, 9) + sine(f0 * 3.0, t) * env_exp(t, 30) * 0.25 + sine(f0 * 4.2, t) * env_exp(t, 45) * 0.12) * np.clip(t / 0.002, 0, 1)
        mix_into(out, stereo(note * (0.9 - i * 0.1)), i * 0.12)
    out += convolve(out, reverb_ir(0.8, 5, 10000)) * 0.15
    return norm(out, 0.8)


def s_freeze():
    out = np.zeros((int(3.0 * SR), 2))
    # suck-in (reverse air) into a hard stop
    pre = swoosh(0.5, 400, 9000, 0.9)
    pre = pre * np.linspace(0.2, 1, len(pre))[:, None]
    mix_into(out, pre, 0)
    hit = s_impact()
    mix_into(out, hit * 0.8, 0.0)
    # frozen glass tail (suspended)
    t = T(2.6)
    glass = sum(sine(f, t) * env_exp(t, 1.4 + i * 0.3) for i, f in enumerate([2093, 3136, 4186])) * 0.08
    tail = stereo(glass)
    tail += convolve(tail, reverb_ir(2.5, 2.6, 9000)) * 0.6
    mix_into(out, tail, 0.02)
    return norm(out, 0.95)


def s_align(dur):
    out = np.zeros((int((dur + 0.5) * SR), 2))
    n = max(4, int(dur * 9))
    for i in range(n):
        k = i / n
        snap = click_raw(9000, 0.04, 0.5, 600 + 300 * k) * (0.5 + 0.4 * (1 - k))
        mix_into(out, stereo(snap, rng.uniform(-0.6, 0.6)), k * dur)
    return norm(out, 0.5)


def s_shatter():
    out = np.zeros((int(1.6 * SR), 2))
    for i in range(160):
        at = (rng.random() ** 2) * 1.1
        b = blip(2500 + rng.random() * 6000, 0.05, 90) * (0.2 + 0.6 * rng.random())
        mix_into(out, stereo(b, rng.uniform(-1, 1)), at)
    out = addp(out, swoosh(1.6, 600, 9000, 0.2) * 0.4)
    return norm(out, 0.6)


def s_resolve():
    t = T(3.0)
    swell = fft_filter(noise((len(t), 2)), lo=80, hi=1200) * (env_ar(t, 0.4, 3.0))[:, None] * 0.6
    sub = stereo(sine(55, t) * env_ar(t, 0.15, 3.0) * 0.6)
    shimmer = stereo(sum(sine(f, t) * env_exp(t, 1.8 + i * 0.4) for i, f in enumerate([1046.5, 1568, 2093])) * 0.08 * np.clip(t / 0.08, 0, 1), 0, 1)
    out = swell + sub + shimmer
    out += convolve(out, reverb_ir(2.5, 3, 7000)) * 0.35
    return norm(out, 0.7)


def s_dock():
    out = np.zeros((int(1.2 * SR), 2))
    for i in range(6):
        t = T(0.18)
        th = addp(sine(160 + i * 25, t) * env_exp(t, 30), click_raw(4000, 0.02) * 0.4)
        mix_into(out, stereo(th * 0.6, -0.5 + i * 0.2), i * 0.11)
    return norm(out, 0.5)


def s_data(dur):
    out = np.zeros((int((dur + 0.3) * SR), 2))
    pos = 0.0
    scale = [2093, 2349, 2637, 3136, 3520, 4186]
    while pos < dur:
        mix_into(out, stereo(blip(scale[rng.integers(len(scale))], 0.05, 80) * (0.3 + 0.4 * rng.random()), rng.uniform(-0.7, 0.7)), pos)
        pos += 0.035 + rng.random() * 0.06
    return norm(out, 0.4)


def s_automation():
    t = T(1.4)
    sweep = sine(200 + 1800 * (t / 1.4) ** 0.5, t) * env_ar(t, 0.05, 0.6) * 0.35 * (t < 0.6)
    thump = sine(70 + 120 * np.exp(-t * 30), t) * env_exp(t, 9)
    zap = fft_filter(noise(len(t)) * env_exp(t, 25), lo=2000, hi=10000) * 0.4
    out = stereo(sweep + thump + zap)
    out += convolve(out, reverb_ir(1.6, 3.5, 8000)) * 0.3
    return norm(out, 0.75)


def s_digital_tick():
    t = T(0.08)
    sq = np.sign(np.sin(2 * np.pi * 2000 * t)) * env_exp(t, 70) * 0.3
    return stereo(norm(addp(fft_filter(sq, hi=6000), click_raw(9000, 0.02) * 0.3), 0.45))


def s_converge(dur):
    t = T(dur)
    k = t / dur
    n = noise((len(t), 2))
    s = fft_filter(n, lo=500, hi=7000) * (np.sin(np.pi * k) ** 1.5)[:, None]
    s[:, 0] *= 1 - k * 0.5
    s[:, 1] *= 0.5 + k * 0.5
    tone = stereo(sine(300 + 900 * k ** 2, t) * (k ** 2) * 0.15)
    return norm(addp(s * 0.6, tone), 0.55)


def s_send():
    t = T(0.6)
    f = 400 + 2200 * (t / 0.6) ** 0.7
    fwip = sine(f, t) * env_ar(t, 0.02, 0.6) * 0.3
    return norm(addp(swoosh(0.6, 800, 9000, 0.4), stereo(fwip)), 0.6)


def s_tap():
    t = T(0.08)
    return stereo(norm(addp(sine(240, t) * env_exp(t, 60), click_raw(5000, 0.03) * 0.5), 0.45))


def s_app_open():
    out = swoosh(0.7, 300, 5000, 0.35) * 0.6
    t = T(0.7)
    bloom = stereo(sine(880, t) * env_exp(t, 6) * 0.12 + sine(1320, t) * env_exp(t, 7) * 0.08)
    return norm(addp(out, bloom), 0.55)


def s_success():
    out = np.zeros((int(0.5 * SR), 2))
    mix_into(out, stereo(click_raw(9000, 0.03, 0.2)), 0)
    mix_into(out, stereo(blip(2349.3, 0.35, 14, 0.25) * 0.6), 0.015)
    return norm(out, 0.4)


def s_riser(dur):
    t = T(dur)
    k = t / dur
    s = fft_filter(noise((len(t), 2)), lo=600, hi=10000) * (k ** 2.4)[:, None]
    s *= np.where(k > 0.97, (1 - k) / 0.03, 1)[:, None]
    return norm(s, 0.6)


def s_collapse(dur):
    out = np.zeros((int((dur + 0.4) * SR), 2))
    n = 16
    for i in range(n):
        t = T(0.12)
        th = sine(420 - i * 14, t) * env_exp(t, 40) * (1 - i / n * 0.6)
        mix_into(out, stereo(addp(th * 0.5, click_raw(5000, 0.02) * 0.25), rng.uniform(-0.8, 0.8)), (i / n) * dur)
    return norm(out, 0.5)


def s_rise(dur):
    out = np.zeros((int((dur + 0.5) * SR), 2))
    n = 11
    for i in range(n):
        mix_into(out, stereo(blip(700 * 2 ** (i / 9), 0.2, 22, 0.3) * 0.5, -0.6 + i * 0.12), (i / n) * dur)
    t = T(dur)
    out[: len(t)] += fft_filter(noise((len(t), 2)), lo=300, hi=4000) * ((t / dur) ** 2)[:, None] * 0.15
    return norm(out, 0.5)


def s_construct(dur):
    t = T(dur)
    k = t / dur
    trace = fft_filter(noise((len(t), 2)), lo=2500, hi=10000) * (0.3 + 0.7 * np.sin(np.pi * k))[:, None] * 0.35
    out = trace.copy()
    for i in range(24):
        mix_into(out, stereo(blip(3000 + rng.random() * 4000, 0.08, 50) * 0.35, rng.uniform(-0.6, 0.6)), rng.random() * dur)
    return norm(out, 0.5)


def s_lock():
    t = T(0.25)
    s = addp(click_raw(10000, 0.04, 0.6, 1200), sine(3520, t) * env_exp(t, 30) * 0.15)
    return stereo(norm(s, 0.5))


def s_logo():
    t = T(5.0)
    f = 36 + 48 * np.exp(-t * 14)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.1)
    glass = sum(sine(fr, t) * env_exp(t, 0.9 + i * 0.2) * (0.8 - i * 0.12) for i, fr in enumerate([1760, 2637, 3520])) * np.minimum(1, t / 0.01)
    out = stereo(sub * 0.9 + glass * 0.12)
    out += convolve(out, reverb_ir(4.0, 2.6, 8000)) * 0.4
    return norm(out, 0.9)


def render_cue(c):
    k = c['type']
    d = c.get('dur', 1.0)
    table = {
        'air': lambda: s_air(d),
        'room': lambda: s_room(d),
        'light': s_light,
        'tick': lambda: stereo(s_tick()),
        'tick-soft': lambda: stereo(s_tick(True)),
        'clock-whirr': lambda: s_clock_whirr(d),
        'time-rush': lambda: s_time_rush(d),
        'type-reveal': s_type_reveal,
        'sub-hit': s_sub_hit,
        'impact': s_impact,
        'impact-soft': lambda: s_impact(True),
        'whoosh': lambda: s_whoosh('whoosh'),
        'whoosh-soft': lambda: s_whoosh('whoosh-soft'),
        'whoosh-long': lambda: s_whoosh('whoosh-long'),
        'reverse-whoosh': lambda: s_whoosh('reverse-whoosh'),
        'swish': lambda: s_whoosh('swish'),
        'click': s_click,
        'typing': lambda: s_typing(d),
        'copy': s_copy,
        'paste': s_paste,
        'window-open': s_window_open,
        'search': s_search,
        'scroll': lambda: s_scroll(d),
        'denied': s_denied,
        'paper': s_paper,
        'save': s_save,
        'notification': s_notification,
        'message': s_message,
        'phone-notify': s_phone_notify,
        'freeze': s_freeze,
        'align': lambda: s_align(d),
        'shatter': s_shatter,
        'resolve': s_resolve,
        'dock': s_dock,
        'data': lambda: s_data(d),
        'automation': s_automation,
        'digital-tick': s_digital_tick,
        'converge': lambda: s_converge(d),
        'send': s_send,
        'tap': s_tap,
        'app-open': s_app_open,
        'success': s_success,
        'riser': lambda: s_riser(d),
        'collapse': lambda: s_collapse(d),
        'rise': lambda: s_rise(d),
        'construct': lambda: s_construct(d),
        'lock': s_lock,
        'logo': s_logo,
    }
    if k not in table:
        raise SystemExit(f'Unknown sfx type in timeline.json: {k}')
    return stereo(table[k]())


def write(path, x):
    x = np.clip(x, -1, 1)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())


if __name__ == '__main__':
    N = int(DUR * SR)
    dry = np.zeros((N, 2))
    for c in TL['sfx']:
        mix_into(dry, render_cue(c) * c['gain'], c['t'])
    # shared space: a short, dark room so every sound lives in one place
    wet = convolve(dry, reverb_ir(1.8, 3.4, 6000)) * 0.14
    out = fft_filter(dry + wet, lo=28)
    out = np.tanh(out * 1.15) / np.tanh(1.15)
    t = np.arange(N) / SR
    out *= np.clip((DUR - t) / 0.4, 0, 1)[:, None]
    out = norm(out, 0.89)
    write(os.path.join(ROOT, 'public/audio/sounddesign.wav'), out)
    print(f'sounddesign.wav {DUR}s, {len(TL["sfx"])} cues')
