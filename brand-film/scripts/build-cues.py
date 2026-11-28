#!/usr/bin/env python3
"""
Builds the sound-design cue list (timeline.json -> "sfx") from the animation
beats, so every sound is tied to a visible action: typing while text is typed,
clicks on presses, alerts on notifications, ticks on the clock, etc.
No noise beds, no whoosh hiss — only specific, clean, connected sounds.

Run after changing beats:  python3 scripts/build-cues.py && npm run audio
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'src/config/timeline.json')
tl = json.load(open(P))
B = tl['beats']
FPS = tl['fps']
F = 1 / FPS
cues = []


def cue(t, typ, gain, dur=None):
    c = {'t': round(t, 3), 'type': typ, 'gain': gain}
    if dur:
        c['dur'] = round(dur, 3)
    cues.append(c)


# --- 01/02 · time -------------------------------------------------------------
cue(0.32, 'glint', 0.45)
for t in [B['s01_wQuantoVale'], B['s01_wUmaHora'], B['s01_wDoSeu']]:
    cue(t, 'tick', 0.6)
cue(B['s01_wTempo'], 'sweep', 0.55)          # the hand of light draws TEMPO
cue(B['s01_wTempo'], 'sub-hit', 0.5)
cue(B['s01_wTempo'] + 54 * F, 'tick', 0.65)   # the "?" lands on the tick
cue(B['s01_flyThrough'], 'dive', 0.5)
cue(B['s02_accelerate'], 'clock-whirr', 0.45, 5.6)
for k in ['s02_wQuantasHoras', 's02_wEmpresa', 's02_wTodosOsMeses']:
    cue(B[k], 'ping', 0.3)
cue(B['s02_wPerde'], 'impact', 0.7)

# --- 03a · spreadsheets --------------------------------------------------------
A = B['s03a']
cue(A + 0.05, 'typing', 0.5, B['s03a_copy'] - A - 0.15)
cue(B['s03a_copy'], 'click', 0.45)
cue(B['s03a_copy'] + 0.1, 'copy', 0.45)
cue(B['s03a_copy'] + 33 * F, 'paste', 0.5)
cue(B['s03a_copy'] + 51 * F, 'typing', 0.45, B['s03b'] - (B['s03a_copy'] + 51 * F))
for d in [0, 36, 62]:
    cue(B['s03a_more'] + d * F, 'window-open', 0.35)

# --- 03b · searching -----------------------------------------------------------
S = B['s03b_search']
cue(S, 'typing', 0.5, len('orçamento Grupo Ventura') * 2.1 * F)
cue(B['s03b_noResult'] - 3 * F, 'click', 0.45)
cue(B['s03b_noResult'], 'denied', 0.35)
for i in range(4):
    cue(B['s03b_chat'] + i * 11 * F, 'pop', 0.35)
cue(B['s03b_folder'], 'window-open', 0.35)
cue(B['s03b_folder'] + 27 * F, 'click', 0.4)
cue(B['s03b_folder'] + 42 * F, 'click', 0.45)
cue(B['s03b_pdf'], 'window-open', 0.35)
cue(B['s03b_pdf'] + 20 * F, 'stamp', 0.6)
cue(B['s03b_note'], 'place', 0.4)
for d in [0, 9, 18, 26]:
    cue(B['s03b_pile'] + d * F, 'window-open', 0.25)

# --- 03c · repeating the same form ---------------------------------------------
cyc = [B['s03c'], B['s03c_cycle2'], B['s03c_cycle3'], B['s03c_cycle4'], B['s03d'] + 2 * F]
for k in range(4):
    c0, c1 = cyc[k], cyc[k + 1]
    D = c1 - c0
    if k == 0:
        cue(c0, 'window-open', 0.35)
    cue(c0 + 0.08 * D, 'typing', 0.5, 0.52 * D)
    cue(c0 + 0.66 * D, 'click', 0.45)
    cue(c0 + 0.69 * D, 'pop', 0.25)
    cue(c0 + 0.79 * D, 'click', 0.45)
    cue(c0 + 0.82 * D, 'save', 0.4)

# --- 03d/04 · accumulation, freeze, turn ---------------------------------------
for i, d in enumerate([0.15, 0.55, 0.9, 1.25, 1.55]):
    cue(B['s03d'] + d, 'notification', 0.18 + 0.03 * i)
cue(B['s03_wAutomaticos'], 'freeze', 0.85)
cue(B['s04_wProblemas'], 'ping', 0.35)
cue(B['s04_wProblemas'], 'sub-hit', 0.45)
cue(B['s04_reorganize'], 'align', 0.45, 2.0)
cue(B['s04_dissolve'], 'scatter', 0.5)
cue(B['s04_wCrescimento'], 'resolve', 0.65)

# --- 05 · platform ---------------------------------------------------------------
cue(B['s05_platform'], 'dock', 0.4)
for k in ['s05_simplificam', 's05_centralizam', 's05_automatizam']:
    cue(B[k] - 0.4, 'shift', 0.35)          # clean tonal glide between modules
    cue(B[k], 'ping', 0.3)
cue(B['s05_simplificam'] + 30 * F, 'align', 0.4, 1.6)
cue(B['s05_centralizam'] + 0.4, 'data', 0.35, 1.8)
cue(B['s05_centralizam'] + 2.2, 'resolve', 0.3)
AU = B['s05_automatizam']
cue(AU + 14 * F, 'automation', 0.45)
for i in range(5):
    cue(AU + (24 + i * 22) * F, 'success', 0.35)

# --- 06 · automatic daily report on WhatsApp -------------------------------------
S6, CL, E8 = B['s06'], B['s06_clock'], B['s06_eight']
step = ((CL - S6) * FPS - 30) / 7
for i in range(7):
    cue(S6 + (10 + i * step) * F, 'pop', 0.28)  # each event registered
for k in range(3):
    cue(CL + (k + 0.86) * (E8 - CL) / 3, 'digital-tick', 0.5)
cue(E8, 'automation', 0.65)
cue(E8 + 12 * F, 'converge', 0.4, 1.0)
cue(B['s06_report'], 'data', 0.35, B['s06_send'] - B['s06_report'] - 0.2)
cue(B['s06_send'], 'send', 0.5)
cue(B['s06_notify'], 'phone-notify', 0.8)
cue(B['s06_open'], 'tap', 0.45)
for i in range(6):
    cue(B['s06_open'] + (18 + i * 20) * F, 'tick-soft', 0.25)

# --- 07 · mobility -----------------------------------------------------------------
cue(B['s07_home'], 'shift', 0.3)
cue(B['s07_tap'], 'tap', 0.55)
cue(B['s07_open'], 'app-open', 0.55)
cue(B['s07_devices'], 'dock', 0.35)
cue(B['s07_devices'] + 24 * F, 'dock', 0.3)
cue(B['s07_sale'] - 2 * F, 'click', 0.5)
cue(B['s07_sale'] + 6 * F, 'save', 0.45)
cue(B['s07_stock'], 'data', 0.35, 0.5)
cue(B['s07_notify'], 'phone-notify', 0.7)
cue(B['s07_tablet'], 'data', 0.4, 0.8)
cue(B['s07_tablet'] + 0.85, 'success', 0.4)
cue(B['s07_final'] + 0.4, 'resolve', 0.4)

# --- 08 · results ---------------------------------------------------------------------
cue(B['s08_menos'], 'impact', 0.6)
cue(B['s08_menos'] + 0.1, 'collapse', 0.45, 1.1)
CT = B['s08_controle']
cue(CT, 'impact', 0.55)
cue(CT, 'ratchet', 0.5, 66 * F)              # the wheel spins up to 100 %
cue(CT + 66 * F, 'lock', 0.6)
for i in range(4):
    cue(CT + (30 + i * 11) * F, 'success', 0.3)
PR = B['s08_produtividade']
cue(PR - 24 * F, 'dive', 0.45)               # into the wheel
cue(PR, 'impact', 0.55)
for i in range(7):
    cue(PR + (34 + i * 5) * F, 'success', 0.28)
TM = B['s08_tempo']
for k in range(3):
    cue(TM + 0.2 + k, 'tick', 0.5)
cue(B['s08_crescer'], 'resolve', 0.7)
cue(B['s08_crescer'], 'sub-hit', 0.5)
cue(B['s09_fade'] - 34 * F, 'dive', 0.45)    # into the dial centre

# --- 09 · signature -------------------------------------------------------------------
S9 = B['s09_fade']
cue(S9, 'glint', 0.4)
for i in range(3):
    cue(S9 + (8 + i * 6) * F, 'ping', 0.22)
    cue(S9 + (24 + i * 10) * F, 'trace', 0.45, 46 * F)
    cue(S9 + (24 + i * 10 + 40) * F, 'lock', 0.4)
cue(S9 + (24 + 20 + 40 + 18) * F, 'logo', 0.9)
cue(B['s09_logo'] + 6 * F, 'ping', 0.25)
cue(B['s09_slogan'], 'glint', 0.25)

cues.sort(key=lambda c: c['t'])
tl['sfx'] = cues
json.dump(tl, open(P, 'w'), ensure_ascii=False, indent=1)
print(len(cues), 'cues')
