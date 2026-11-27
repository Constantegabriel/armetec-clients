#!/usr/bin/env python3
"""
ArmeTec brand film — ORIGINAL procedural score + sound design.

Everything here is synthesized from scratch (oscillators, filtered noise,
envelopes, a convolution reverb built from decaying noise). No samples, no
third-party audio. Timing is read from src/config/timeline.json so music hits
land on the same beats as the picture.

Outputs (48 kHz, 16-bit WAV):
  public/audio/score.wav         full-length music bed
  public/audio/sfx/<type>.wav    one-shot effects placed by the Remotion timeline

Run:  python3 scripts/generate-audio.py      (requires numpy)
"""
import json
import os
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, 'src/config/timeline.json')))
SR = 48000
DUR = TL['durationSeconds']
B = TL['beats']
rng = np.random.default_rng(20260)  # fixed seed: reproducible output


# ----------------------------------------------------------------- utilities
def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def write(path, x):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    x = np.clip(x, -1, 1)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())


def lp_fft(x, cutoff, order=2):
    """Static zero-phase low-pass via FFT (fast)."""
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    H = 1 / np.sqrt(1 + (f / cutoff) ** (2 * order))
    return np.fft.irfft(X * (H if x.ndim == 1 else H[:, None]), n=len(x), axis=0)


def hp_fft(x, cutoff, order=2):
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(len(x), 1 / SR) + 1e-9
    H = 1 / np.sqrt(1 + (cutoff / f) ** (2 * order))
    return np.fft.irfft(X * (H if x.ndim == 1 else H[:, None]), n=len(x), axis=0)


def bp_fft(x, lo, hi):
    return hp_fft(lp_fft(x, hi), lo)


def adsr(n, a=0.01, d=0.1, s=0.7, r=0.2, total=None):
    total = n if total is None else total
    env = np.zeros(total)
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    S = max(0, n - A - D)
    seg = np.concatenate([np.linspace(0, 1, max(A, 1)), np.linspace(1, s, max(D, 1)), np.full(S, s), np.linspace(s, 0, max(R, 1))])
    env[: min(total, len(seg))] = seg[:total]
    return env


def saw(freq, t, voices=3, detune=0.12):
    out = np.zeros_like(t)
    for v in range(voices):
        d = (v - (voices - 1) / 2) * detune
        f = freq * 2 ** (d / 12)
        ph = (t * f + rng.random()) % 1.0
        out += 2 * ph - 1
    return out / voices


def sine(freq, t, phase=0.0):
    return np.sin(2 * np.pi * freq * t + phase)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def reverb_ir(seconds=3.2, decay=3.0, bright=6000):
    n = int(seconds * SR)
    ir = rng.standard_normal((n, 2)) * np.exp(-np.linspace(0, decay * 2.3, n))[:, None]
    ir = lp_fft(ir, bright, 1)
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))[:, None]
    return ir / np.sqrt((ir ** 2).sum(0)).max()


def convolve(x, ir):
    n = len(x) + len(ir) - 1
    N = 1 << int(np.ceil(np.log2(n)))
    X = np.fft.rfft(x, N, axis=0)
    H = np.fft.rfft(ir, N, axis=0)
    return np.fft.irfft(X * H, N, axis=0)[: len(x)]


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    sig = sig if sig.ndim == 2 else np.stack([sig, sig], 1)
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def pan(sig, p):
    """p in [-1, 1]"""
    l = np.cos((p + 1) * np.pi / 4)
    r = np.sin((p + 1) * np.pi / 4)
    return np.stack([sig * l, sig * r], 1)


def norm(x, peak=0.9):
    m = np.abs(x).max()
    return x * (peak / m) if m > 0 else x


# ------------------------------------------------------------------ one-shots
def sfx_tick():
    t = t_axis(0.12)
    click = rng.standard_normal(len(t)) * np.exp(-t * 900)
    body = sine(3100, t) * np.exp(-t * 220) * 0.5 + sine(1550, t) * np.exp(-t * 160) * 0.35
    s = bp_fft(click, 1500, 9000) * 0.8 + body
    return norm(s, 0.8)


def sfx_mechanical():
    t = t_axis(1.4)
    s = np.zeros(len(t))
    for k in range(10):  # escapement ratchet speeding up
        at = 0.9 * (1 - (1 - k / 10) ** 1.6)
        i = int(at * SR)
        tt = t[: len(t) - i]
        s[i:] += (rng.standard_normal(len(tt)) * np.exp(-tt * 500) + sine(2200 + k * 90, tt) * np.exp(-tt * 260) * 0.4) * (0.5 + k * 0.05)
    return norm(bp_fft(s, 400, 8000), 0.7)


def sfx_sub_hit():
    t = t_axis(2.6)
    f = 42 + 60 * np.exp(-t * 18)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    s += lp_fft(rng.standard_normal(len(t)) * np.exp(-t * 30), 300) * 0.4
    return norm(np.tanh(s * 1.6), 0.95)


def sfx_impact():
    t = t_axis(3.2)
    f = 55 + 90 * np.exp(-t * 25)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.9)
    crack = bp_fft(rng.standard_normal(len(t)) * np.exp(-t * 14), 200, 5000) * 0.6
    metal = sum(sine(fr, t) * np.exp(-t * (3 + i)) for i, fr in enumerate([311, 467, 733, 1190])) * 0.08
    s = np.tanh((sub + crack + metal) * 1.4)
    st = np.stack([s, s], 1)
    st = st + convolve(st, reverb_ir(2.5, 3.5, 5000)) * 0.35
    return norm(st, 0.95)


def sfx_whoosh(reverse=False):
    t = t_axis(1.2)
    env = np.sin(np.pi * np.clip(t / 1.2, 0, 1)) ** 2
    env = env * np.exp(-((t - 0.55) ** 2) / 0.08)
    noise = rng.standard_normal((len(t), 2))
    # moving band: sweep via blending of two bands
    lo = bp_fft(noise, 200, 1200)
    hi = bp_fft(noise, 1500, 7000)
    k = np.clip(t / 1.2, 0, 1)[:, None]
    s = (lo * (1 - k) + hi * k) * env[:, None]
    s[:, 0] *= np.linspace(1.2, 0.6, len(t))
    s[:, 1] *= np.linspace(0.6, 1.2, len(t))
    if reverse:
        s = s[::-1]
        s = s * np.linspace(0.2, 1, len(t))[:, None]
    return norm(s, 0.8)


def sfx_click():
    t = t_axis(0.08)
    s = bp_fft(rng.standard_normal(len(t)) * np.exp(-t * 1400), 2000, 10000) + sine(1800, t) * np.exp(-t * 300) * 0.4
    return norm(s, 0.7)


def sfx_ui():
    t = t_axis(0.9)
    s = (sine(midi(84), t) * np.exp(-t * 7) + sine(midi(91), t - 0.06) * np.exp(-np.clip(t - 0.06, 0, None) * 7) * (t > 0.06)) * 0.5
    s += sine(midi(96), t) * np.exp(-t * 18) * 0.15
    st = np.stack([s, s], 1)
    st += convolve(st, reverb_ir(1.5, 4, 7000)) * 0.25
    return norm(st, 0.6)


def sfx_riser(sec=2.3):
    t = t_axis(sec)
    k = t / sec
    noise = rng.standard_normal((len(t), 2))
    s = bp_fft(noise, 600, 9000) * (k ** 2.2)[:, None]
    tone = saw(110 * 2 ** (k * 2), t, voices=4, detune=0.2) * (k ** 3) * 0.35
    s += np.stack([tone, tone], 1)
    s *= np.where(k > 0.97, (1 - k) / 0.03, 1)[:, None]
    return norm(s, 0.75)


def sfx_logo():
    t = t_axis(5.5)
    f = 36 + 50 * np.exp(-t * 14)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.2)
    # glassy brand chord (A major add9, high register) — memorable, short, elegant
    bell = sum(sine(midi(n), t) * np.exp(-t * (0.9 + i * 0.15)) * (0.9 - i * 0.12) for i, n in enumerate([69, 76, 81, 83, 88]))
    bell *= np.minimum(1, t / 0.01)
    s = sub * 0.9 + bell * 0.18
    st = pan(s, 0)
    st += convolve(st, reverb_ir(4.5, 2.5, 7000)) * 0.45
    return norm(st, 0.95)


SFX = {
    'tick': sfx_tick,
    'mechanical': sfx_mechanical,
    'sub-hit': sfx_sub_hit,
    'impact': sfx_impact,
    'whoosh': lambda: sfx_whoosh(False),
    'reverse-whoosh': lambda: sfx_whoosh(True),
    'click': sfx_click,
    'ui': sfx_ui,
    'riser': sfx_riser,
    'logo': sfx_logo,
}


# ---------------------------------------------------------------------- score
def score():
    N = int(DUR * SR)
    dry = np.zeros((N, 2))
    wet_send = np.zeros((N, 2))
    t = np.arange(N) / SR

    def seg_env(a, b, fade_in=0.5, fade_out=0.5):
        e = np.clip((t - a) / max(fade_in, 1e-3), 0, 1) * np.clip((b - t) / max(fade_out, 1e-3), 0, 1)
        return e

    freeze = B['s03_wAutomaticos']

    # 1) DRONE — opening mystery (0–12), low A with slow beating fifths
    dr = (sine(55, t) * 0.5 + sine(82.5 * 1.003, t) * 0.25 + sine(110.2, t) * 0.12) * seg_env(0.3, 12.4, 2.5, 0.8)
    dr += lp_fft(rng.standard_normal(N), 180) * 0.6 * seg_env(0.3, 12, 3, 1)
    dry += np.stack([dr, dr], 1) * 0.5
    wet_send += np.stack([dr, dr], 1) * 0.3

    # 2) PULSE — problem section, tempo 96 → tension builds (6 – freeze)
    bpm = 96
    beat = 60 / bpm
    def kick(at, g=1.0):
        tt = t_axis(0.5)
        f = 48 + 120 * np.exp(-tt * 40)
        k = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 8)
        place(dry, np.tanh(k * 1.5) * g, at)

    def hat(at, g=0.2, p=0.3):
        tt = t_axis(0.09)
        h = hp_fft(rng.standard_normal(len(tt)), 7000) * np.exp(-tt * 70)
        place(dry, pan(h * g, p), at)

    def pluck(at, note, g=0.25, cutoff=2400, length=0.32, p=0.0):
        tt = t_axis(length + 0.4)
        s = saw(midi(note), tt, voices=2, detune=0.08) * adsr(int(length * SR), 0.003, 0.12, 0.25, 0.3, len(tt))
        s = lp_fft(s, cutoff)
        place(dry, pan(s * g, p), at)
        place(wet_send, pan(s * g * 0.6, p), at)

    # sub pulse 8ths (A minor), starts at scene 2
    x = 6.0
    i = 0
    arp = [57, 60, 64, 67, 64, 60, 69, 64]
    while x < freeze - 0.05:
        prog = (x - 6) / (freeze - 6)
        # bass 8ths
        tt = t_axis(beat / 2)
        bs = saw(midi(33 if (i // 16) % 4 != 3 else 31), tt, voices=2) * np.exp(-tt * 6)
        place(dry, np.stack([lp_fft(bs, 260 + 900 * prog)] * 2, 1) * 0.28, x)
        if x >= 12.0:
            if i % 4 == 0:
                kick(x, 0.55 + 0.35 * prog)
            hat(x + beat / 4, 0.06 + 0.12 * prog, (-1) ** i * 0.4)
            pluck(x, arp[i % 8] + 12 * (prog > 0.55 and i % 2 == 0), 0.12 + 0.12 * prog, 1200 + 5000 * prog, p=0.5 * np.sin(i))
        x += beat / 2
        i += 1

    # risers: into chaos and into the freeze
    place(dry, sfx_riser(4.0) * 0.18, freeze - 4.0)

    # 3) SUSPENSION — freeze: everything cut, a sub tail only
    tt = t_axis(1.4)
    place(dry, pan(sine(41, tt) * np.exp(-tt * 2) * 0.4, 0), freeze)

    # 4) TRANSFORMATION PAD (25–33): Am → F → C → G (dark → open)
    pad_chords = [(25.0, [57, 60, 64, 69]), (27.0, [53, 57, 60, 65]), (29.0, [48, 55, 60, 64, 67]), (31.0, [55, 59, 62, 67, 71])]
    for start, notes in pad_chords:
        tt = t_axis(2.6)
        s = sum(saw(midi(n), tt, voices=3, detune=0.15) for n in notes) / len(notes)
        s = lp_fft(s, 900 + (start - 25) * 260) * adsr(int(2.2 * SR), 0.6, 0.3, 0.85, 0.8, len(tt))
        place(dry, pan(s, -0.1) * 0.22, start)
        place(wet_send, pan(s, 0.1) * 0.4, start)

    # 5) SOLUTION — confident groove (33–55), C major / A minor, 100 bpm feel
    sb = 60 / 100
    x = 33.0
    i = 0
    prog_notes = [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]]  # C Am F G
    arp2 = [72, 76, 79, 84, 79, 76, 74, 79]
    while x < 55.0:
        bar = int((x - 33) / (sb * 4)) % 4
        ch = prog_notes[bar]
        if i % 4 == 0:
            kick(x, 0.6)
        if i % 8 == 4:
            tt = t_axis(0.25)
            sn = bp_fft(rng.standard_normal(len(tt)), 900, 6000) * np.exp(-tt * 25)
            place(dry, pan(sn * 0.18, 0.1), x)
            place(wet_send, pan(sn * 0.2, 0.1), x)
        hat(x + sb / 4, 0.09, (-1) ** i * 0.5)
        tt = t_axis(sb / 2)
        bs = saw(midi(ch[0] - 12), tt, voices=2) * np.exp(-tt * 4)
        place(dry, np.stack([lp_fft(bs, 500)] * 2, 1) * 0.26, x)
        pluck(x, arp2[i % 8] - (0 if bar < 2 else 2), 0.09, 4200, 0.22, p=0.6 * np.sin(i * 1.3))
        if i % 8 == 0:
            tt = t_axis(sb * 4.2)
            s = sum(saw(midi(n + 12), tt, voices=3, detune=0.18) for n in ch) / 3
            s = lp_fft(s, 1600) * adsr(int(sb * 3.8 * SR), 0.3, 0.4, 0.7, 0.5, len(tt))
            place(dry, pan(s, 0) * 0.12, x)
            place(wet_send, pan(s, 0) * 0.25, x)
        x += sb / 2
        i += 1
    place(dry, sfx_riser(1.0) * 0.12, B['s05_simplificam'] - 1.0)
    place(dry, sfx_riser(1.0) * 0.12, B['s05_centralizam'] - 1.0)
    place(dry, sfx_riser(1.0) * 0.12, B['s05_automatizam'] - 1.0)
    place(dry, sfx_riser(2.3) * 0.22, 55.0 - 2.3)

    # 6) CLIMAX — three huge chord hits + calm resolution on "crescer"
    for at, ch in [(B['s07_menos'], [45, 57, 60, 64, 69]), (B['s07_controle'], [41, 53, 57, 60, 65]), (B['s07_produtividade'], [43, 55, 59, 62, 67, 74])]:
        tt = t_axis(2.0)
        s = sum(saw(midi(n), tt, voices=4, detune=0.2) for n in ch) / len(ch)
        s = lp_fft(s, 3500) * np.exp(-tt * 1.6)
        place(dry, pan(s, 0) * 0.32, at)
        place(wet_send, pan(s, 0) * 0.45, at)
        kick(at, 0.9)
        # driving 16ths between hits
        for k in range(16):
            hat(at + k * sb / 4 + 0.3, 0.05 + 0.004 * k, (-1) ** k * 0.6)
    # resolution: C major add9 bloom, sustained to the logo
    tt = t_axis(64.2 - B['s07_tempo'] + 1)
    s = sum(saw(midi(n), tt, voices=3, detune=0.12) for n in [48, 55, 62, 64, 67, 72]) / 6
    s = lp_fft(s, 1400) * adsr(int((64.0 - B['s07_tempo']) * SR), 0.8, 0.5, 0.8, 1.2, len(tt))
    place(dry, pan(s, 0) * 0.2, B['s07_tempo'])
    place(wet_send, pan(s, 0) * 0.45, B['s07_tempo'])
    for k in range(4):  # calm clock ticks return
        place(dry, pan(sfx_tick() * 0.12, 0.3), B['s07_tempo'] + 0.3 + k)

    # 7) OUTRO — breathing pad under the signature, fades to silence
    tt = t_axis(70 - 64.0)
    s = sum(sine(midi(n), tt) for n in [45, 52, 57, 64]) / 4
    s += lp_fft(saw(midi(57), tt, 3, 0.1), 700) * 0.4
    s *= adsr(len(tt) - int(2.0 * SR), 1.2, 0.5, 0.8, 2.0, len(tt))
    place(dry, pan(s, 0) * 0.22, 64.0)
    place(wet_send, pan(s, 0) * 0.5, 64.0)

    mix = dry + convolve(wet_send, reverb_ir(3.4, 2.8, 6500)) * 0.7
    mix = hp_fft(mix, 28)
    # gentle bus glue
    mix = np.tanh(mix * 1.2) / np.tanh(1.2)
    # absolute silence at the very start and the end fade
    mix *= np.clip(t / 0.25, 0, 1)[:, None] * np.clip((DUR - t) / 1.5, 0, 1)[:, None]
    return norm(mix, 0.85)


if __name__ == '__main__':
    out = os.path.join(ROOT, 'public/audio')
    for name, fn in SFX.items():
        write(os.path.join(out, 'sfx', f'{name}.wav'), fn())
        print('sfx', name)
    write(os.path.join(out, 'score.wav'), score())
    print('score.wav', DUR, 's')
