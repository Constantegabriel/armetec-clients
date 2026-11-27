import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {camSmooth, type SmoothKey} from '../animations/camera';
import {CssWorld, Plane} from '../components/CssWorld';
import {VolumetricBeams} from '../components/Light';
import {COLORS, FONTS} from '../config/theme';
import {OrderedTile, TILE, gridSlots} from '../interfaces/OrderedTile';
import {AppShell, AutomationFlow, Centralize, ModuleWindow, ProcessFlow} from '../interfaces/Platform';
import {Title, eyebrow, keyline, type TitleLine} from '../typography/Title';
import {EASE} from '../utils/easing';
import {useLayout} from '../utils/layout';
import {clamp, lerp} from '../utils/math';
import {beat, prog} from '../utils/time';

/**
 * SCENE 05 — the ArmeTec platform. The ordered tiles of the turn dock into a
 * custom system; then three transformations: simplify, centralise, automate.
 * The camera presents floating interfaces like a physical product.
 */
const S5 = beat('s05_platform');
const SIMP = beat('s05_simplificam');
const CENT = beat('s05_centralizam');
const AUTO = beat('s05_automatizam');
const END = beat('s06');

const GAP = 3200;

export const stationSize = (vertical: boolean) => ({
  shell: vertical ? {w: 980, h: 1240} : {w: 1560, h: 880},
  panel: vertical ? {w: 960, h: 1220} : {w: 1560, h: 860},
});

/** The automation panel's on-screen framing — scene 06 opens on the same rect. */
export const S5_FINAL_DISTANCE = (vertical: boolean) => (vertical ? 1500 : 1650);
export const S5_TARGET_Y = (vertical: boolean) => (vertical ? -150 : -150);

const useCam = (f: number, vertical: boolean) => {
  const d = S5_FINAL_DISTANCE(vertical);
  const ty = S5_TARGET_Y(vertical);
  // Frontal, centred presentation of each module: the rig settles (stop) on
  // every station, pushes in slowly while it plays, then glides to the next.
  const keys: SmoothKey[] = [
    {f: S5 - 30, pos: [0, 0, 2900], target: [0, 0, -500], lens: 35, aperture: 0.6},
    {f: S5 + 50, pos: [0, ty, d + 140], target: [0, ty, 0], lens: 35, aperture: 0.8, stop: true},
    {f: SIMP - 34, pos: [0, ty, d + 30], target: [0, ty, 0], lens: 35, aperture: 0.8, stop: true},
    {f: SIMP + 6, pos: [GAP, ty, d + 100], target: [GAP, ty, 0], lens: 35, aperture: 0.8, stop: true},
    {f: CENT - 34, pos: [GAP, ty, d], target: [GAP, ty, 0], lens: 35, aperture: 0.8, stop: true},
    {f: CENT + 6, pos: [GAP * 2, ty, d + 100], target: [GAP * 2, ty, 0], lens: 35, aperture: 0.8, stop: true},
    {f: AUTO - 34, pos: [GAP * 2, ty, d], target: [GAP * 2, ty, 0], lens: 35, aperture: 0.8, stop: true},
    {f: AUTO + 6, pos: [GAP * 3, ty, d + 100], target: [GAP * 3, ty, 0], lens: 35, aperture: 0.8, stop: true},
    {f: END + 20, pos: [GAP * 3, ty, d], target: [GAP * 3, ty, 0], lens: 35, aperture: 0.8},
  ];
  return camSmooth(f, keys, 1);
};

/** Tiles from scene 04 dock into the platform sidebar. */
const DockingTiles: React.FC<{f: number; vertical: boolean; shell: {w: number; h: number}}> = ({f, vertical, shell}) => {
  const slots = gridSlots(vertical).slice(0, 8);
  const k = EASE.dolly(prog(f, S5 - 10, S5 + 60, EASE.linear));
  if (k >= 1) return null;
  return (
    <>
      {slots.map((s, i) => {
        const tx = -shell.w / 2 + 115;
        const ty = -shell.h / 2 + 100 + i * 44;
        const kk = clamp(k * 1.3 - i * 0.04);
        return (
          <Plane key={i} x={lerp(s.x * 0.8, tx, kk)} y={lerp(s.y * 0.8, ty, kk)} z={lerp(500, 4, kk)} w={TILE.w} h={TILE.h} scale={lerp(1, 0.6, kk)} opacity={1 - clamp((kk - 0.7) / 0.3)}>
            <OrderedTile slot={i} f={f} />
          </Plane>
        );
      })}
    </>
  );
};

/** Section heading: number + key word + complement, with a local light falloff for contrast. */
const Headline: React.FC<{f: number; at: number; out: number; num?: string; a: string; b: string}> = ({f, at, out, num, a, b}) => {
  const L = useLayout();
  const v = L.vertical;
  const lines: TitleLine[] = [];
  if (num) lines.push({text: num, size: 22, weight: 500, tracking: 0.4, color: COLORS.accentSoft, mode: 'focus', family: FONTS.sans});
  lines.push(keyline(a, v ? 100 : 88));
  lines.push({...eyebrow(b, v ? 38 : 34), delay: 14});
  return <Title f={f} at={at} out={out} anchor="top" offset={v ? -40 : -30} lines={lines} />;
};

export const S05Platform: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame() + from;
  const L = useLayout();
  const v = L.vertical;
  const cam = useCam(f, v);
  const {shell, panel} = stationSize(v);
  const t0 = f - S5;
  const sideW = v ? 520 : 600;
  const sideH = v ? 560 : 520;
  return (
    <AbsoluteFill style={{background: COLORS.black}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 100% 70% at 50% 110%, rgba(81,112,255,0.22), rgba(16,20,36,0.35) 45%, transparent 75%), radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,255,255,0.05), transparent 70%)`,
        }}
      />
      <VolumetricBeams opacity={0.45} offset={-((f - S5) * 0.02)} />
      <CssWorld cam={cam}>
        {/* station 0 — platform */}
        <Plane x={-shell.w * 0.62} y={-shell.h * 0.1} z={-700} ry={28} w={sideW} h={sideH} opacity={EASE.out(clamp((t0 - 20) / 30))}>
          <ModuleWindow w={sideW} h={sideH} t={t0 - 20} kind="crm" />
        </Plane>
        <Plane x={shell.w * 0.62} y={shell.h * 0.18} z={-700} ry={-28} w={sideW} h={sideH} opacity={EASE.out(clamp((t0 - 30) / 30))}>
          <ModuleWindow w={sideW} h={sideH} t={t0 - 30} kind="fin" />
        </Plane>
        <Plane x={shell.w * 0.35} y={-shell.h * 0.62} z={-1300} rx={-12} w={sideW} h={sideH * 0.8} opacity={EASE.out(clamp((t0 - 40) / 30))}>
          <ModuleWindow w={sideW} h={sideH * 0.8} t={t0 - 40} kind="stock" />
        </Plane>
        <Plane x={-shell.w * 0.4} y={shell.h * 0.62} z={-1100} rx={12} w={sideW} h={sideH * 0.6} opacity={EASE.out(clamp((t0 - 50) / 30))}>
          <ModuleWindow w={sideW} h={sideH * 0.6} t={t0 - 50} kind="quote" />
        </Plane>
        <Plane x={0} y={0} z={0} w={shell.w} h={shell.h} opacity={EASE.out(clamp((t0 + 20) / 30))}>
          <AppShell w={shell.w} h={shell.h} t={t0} sidebarReveal={prog(f, S5 + 10, S5 + 70)} />
        </Plane>
        <DockingTiles f={f} vertical={v} shell={shell} />

        {/* station 1 — simplify */}
        <Plane x={GAP} y={0} z={0} w={panel.w} h={panel.h} opacity={EASE.out(prog(f, SIMP - 50, SIMP - 10))}>
          <ProcessFlow w={panel.w} h={panel.h} k={prog(f, SIMP + 30, SIMP + 150, EASE.linear)} vertical={v} />
        </Plane>

        {/* station 2 — centralise */}
        <Plane x={GAP * 2} y={0} z={0} w={panel.w} h={panel.h} opacity={EASE.out(prog(f, CENT - 50, CENT - 10))}>
          <Centralize w={panel.w} h={panel.h} k={prog(f, CENT - 10, CENT + 150, EASE.linear)} t={f - CENT} vertical={v} />
        </Plane>

        {/* station 3 — automate */}
        <Plane x={GAP * 3} y={0} z={0} w={panel.w} h={panel.h} opacity={EASE.out(prog(f, AUTO - 50, AUTO - 10))}>
          <AutomationFlow w={panel.w} h={panel.h} t={f - AUTO} vertical={v} />
        </Plane>
      </CssWorld>

      <Headline f={f} at={S5 + 30} out={SIMP - 30} a="SISTEMAS" b="PERSONALIZADOS" />
      <Headline f={f} at={SIMP} out={CENT - 24} num="01" a="SIMPLIFICAR" b="PROCESSOS" />
      <Headline f={f} at={CENT} out={AUTO - 24} num="02" a="CENTRALIZAR" b="INFORMAÇÕES" />
      <Headline f={f} at={AUTO} out={END - 34} num="03" a="AUTOMATIZAR" b="ROTINAS" />
    </AbsoluteFill>
  );
};
