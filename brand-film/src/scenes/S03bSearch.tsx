import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {camSmooth, type SmoothKey} from '../animations/camera';
import {CssWorld, Plane} from '../components/CssWorld';
import {COLORS, FONTS} from '../config/theme';
import {Cursor, ExplorerSearch, MiniWindow, OutdatedPdf, StickyNote, TeamChat, VersionsFolder} from '../interfaces/SearchStory';
import {Title, eyebrow, keyline} from '../typography/Title';
import {EASE} from '../utils/easing';
import {useLayout} from '../utils/layout';
import {clamp, lerp} from '../utils/math';
import {beat, prog} from '../utils/time';

/**
 * SCENE 03b — PROCURANDO INFORMAÇÕES, told as a small story.
 * Searching for one client quote across scattered places: a file search that
 * finds nothing useful → a team chat where everyone points elsewhere → a
 * folder with five "final" versions → the opened PDF is outdated → a sticky
 * note → windows keep piling up while a counter shows the time being lost.
 * The camera follows the attention from window to window.
 */
const B = beat('s03b');
const SEARCH = beat('s03b_search');
const CHAT = beat('s03b_chat');
const FOLDER = beat('s03b_folder');
const PDF = beat('s03b_pdf');
const NOTE = beat('s03b_note');
const PILE = beat('s03b_pile');
const END = beat('s03c') + 8;

const QUERY = 'orçamento Grupo Ventura';

export const S03bSearch: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame() + from;
  const L = useLayout();
  const v = L.vertical;
  const W = v ? 900 : 1000;
  const H = v ? 760 : 680;
  // window layout: a path of attention drifting right and back in depth
  const P = {
    w1: [0, 0, 0],
    w2: [v ? 1250 : 1450, v ? -260 : -140, -260],
    w3: [v ? 2450 : 2850, v ? 160 : 90, -120],
    w4: [v ? 3650 : 4200, v ? -120 : -60, -360],
    w5: [v ? 3900 : 4950, v ? 520 : 320, 160],
  } as const;
  const d = v ? 1600 : 1250;
  const keys: SmoothKey[] = [
    {f: from, pos: [-260, -120, d + 900], target: [-120, -40, -200], lens: 38, aperture: 0.8},
    {f: SEARCH + 10, pos: [-60, -30, d], target: [0, 0, 0], lens: 40, aperture: 1},
    {f: CHAT + 12, pos: [P.w2[0] - 120, P.w2[1], d - 60], target: [P.w2[0], P.w2[1], P.w2[2]], lens: 40, roll: -1.5},
    {f: FOLDER + 14, pos: [P.w3[0] + 60, P.w3[1] - 40, d - 40], target: [P.w3[0], P.w3[1], P.w3[2]], lens: 40, roll: 1},
    {f: PDF + 14, pos: [P.w4[0] - 80, P.w4[1], d - 140], target: [P.w4[0], P.w4[1], P.w4[2]], lens: 42},
    {f: NOTE + 10, pos: [lerp(P.w4[0], P.w5[0], 0.55), lerp(P.w4[1], P.w5[1], 0.4), d], target: [lerp(P.w4[0], P.w5[0], 0.6), lerp(P.w4[1], P.w5[1], 0.5), 0], lens: 40},
    {f: END, pos: [P.w4[0] - 600, 0, d + (v ? 2600 : 1800)], target: [P.w4[0] - 900, 60, -300], lens: 35, roll: -2, aperture: 0.8},
  ];
  const cam = camSmooth(f, keys, 2);

  const open = (at: number) => EASE.out(prog(f, at - 14, at + 16, EASE.linear));
  // folder: cursor hesitates between FINAL and FINAL_v2, then double-clicks
  const hover = f < FOLDER + 20 ? 1 : f < FOLDER + 34 ? 3 : f < FOLDER + 46 ? 4 : 3;
  const pick = f >= FOLDER + 42 ? 1 : 0;
  const rowY = (i: number) => 52 + 12 + 46 + i * 58 + 29;
  const cursorFolder = {x: lerp(W * 0.3, W * 0.42, clamp((f - FOLDER) / 30)), y: lerp(rowY(1), rowY(hover), EASE.inOut(clamp((f - FOLDER - 10) / 14)))};
  const clickPress = (at: number) => (f >= at && f < at + 14 ? (f - at) / 14 : 0);

  // time-wasted counter (accelerating)
  const lost = Math.floor(Math.pow(clamp((f - SEARCH) / (END - SEARCH)), 1.6) * 47 * 60 + clamp((f - SEARCH) / 60) * 12);
  const mm = String(Math.floor(lost / 60)).padStart(2, '0');
  const ss = String(lost % 60).padStart(2, '0');
  const counterIn = prog(f, CHAT, CHAT + 20, EASE.out) * (1 - prog(f, END - 16, END, EASE.linear));

  const pile = [
    {x: P.w4[0] - 700, y: -520, z: -500, t: 'Caixa de entrada (38)', i: 'mail' as const, at: PILE},
    {x: P.w4[0] + 520, y: -620, z: -900, t: 'Relatório_mensal.docx', i: 'file' as const, at: PILE + 9},
    {x: P.w4[0] - 1100, y: 560, z: -700, t: 'Backup antigo', i: 'folder' as const, at: PILE + 18},
    {x: P.w4[0] + 300, y: 700, z: -1200, t: 'Pedidos_março.xlsx', i: 'grid' as const, at: PILE + 26},
  ];

  return (
    <AbsoluteFill style={{background: COLORS.black}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 70% at 50% 60%, rgba(40,44,60,0.35), transparent 70%)'}} />
      <CssWorld cam={cam}>
        {pile.map((p, i) => {
          const a = open(p.at);
          return a > 0 ? (
            <Plane key={i} x={p.x} y={p.y} z={p.z - (1 - a) * 400} rz={(i % 2 ? 1 : -1) * 4} w={W * 0.8} h={H * 0.7} opacity={a}>
              <MiniWindow w={W * 0.8} h={H * 0.7} title={p.t} icon={p.i} />
            </Plane>
          ) : null;
        })}
        <Plane x={P.w1[0]} y={P.w1[1]} z={P.w1[2]} w={W} h={H} opacity={open(B + 12)}>
          <ExplorerSearch w={W} h={H} t={f - SEARCH} query={QUERY} />
          {f > SEARCH + 40 && f < CHAT ? <Cursor x={W * 0.58} y={130} press={clickPress(beat('s03b_noResult') - 3)} /> : null}
        </Plane>
        <Plane x={P.w2[0]} y={P.w2[1]} z={P.w2[2] - (1 - open(CHAT)) * 300} w={W} h={H} opacity={open(CHAT)}>
          <TeamChat w={W} h={H} t={f - CHAT} />
        </Plane>
        <Plane x={P.w3[0]} y={P.w3[1]} z={P.w3[2] - (1 - open(FOLDER)) * 300} w={W} h={H} opacity={open(FOLDER)}>
          <VersionsFolder w={W} h={H} t={f - FOLDER} hover={hover} pick={pick} />
          {f > FOLDER && f < PDF + 10 ? <Cursor x={cursorFolder.x} y={cursorFolder.y} press={Math.max(clickPress(FOLDER + 27), clickPress(FOLDER + 42))} /> : null}
        </Plane>
        <Plane x={P.w4[0]} y={P.w4[1]} z={P.w4[2] - (1 - open(PDF)) * 300} rz={-1.5} w={W} h={H * 1.12} opacity={open(PDF)}>
          <OutdatedPdf w={W} h={H * 1.12} t={f - PDF} />
        </Plane>
        <Plane x={P.w5[0]} y={P.w5[1]} z={P.w5[2]} w={360} h={300} scale={0.8 + 0.2 * open(NOTE)} opacity={open(NOTE)}>
          <StickyNote w={360} h={300} />
        </Plane>
      </CssWorld>

      {/* time being lost — small, factual, inside the safe area */}
      {counterIn > 0 ? (
        <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', pointerEvents: 'none'}}>
          <div
            style={{
              marginTop: L.height - L.safe.bottom - (v ? 120 : 90) * L.u,
              opacity: counterIn,
              display: 'flex',
              alignItems: 'center',
              gap: 14 * L.u,
              padding: `${10 * L.u}px ${20 * L.u}px`,
              borderRadius: 999,
              background: 'rgba(10,10,12,0.72)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
              fontFamily: FONTS.sans,
              color: COLORS.white,
              fontSize: 26 * L.u,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span style={{width: 10 * L.u, height: 10 * L.u, borderRadius: 10, background: COLORS.danger}} />
            <span style={{color: COLORS.gray}}>Procurando há</span>
            <span style={{fontWeight: 600}}>
              {mm}:{ss}
            </span>
          </div>
        </AbsoluteFill>
      ) : null}

      <Title f={f} at={SEARCH} out={PILE + 10} anchor="top" lines={[eyebrow('PROCURANDO', v ? 40 : 36), keyline('INFORMAÇÕES', v ? 118 : 110)]} />
    </AbsoluteFill>
  );
};
