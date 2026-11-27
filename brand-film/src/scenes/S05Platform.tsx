import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {camPath, type CamKey} from '../animations/camera';
import {combine, dissolveOut, focusIn, riseIn} from '../animations/kinetic';
import {CssWorld, Plane} from '../components/CssWorld';
import {VolumetricBeams} from '../components/Light';
import {COLORS} from '../config/theme';
import {OrderedTile, TILE, gridSlots} from '../interfaces/OrderedTile';
import {AppShell, AutomationFlow, Centralize, ModuleWindow, ProcessFlow} from '../interfaces/Platform';
import {SplitText} from '../typography/SplitText';
import {EASE} from '../utils/easing';
import {useLayout} from '../utils/layout';
import {clamp, lerp} from '../utils/math';
import {beat, prog, sec} from '../utils/time';

/**
 * SCENE 05 — the ArmeTec platform. The ordered tiles of the turn dock into a
 * custom system; then three transformations: simplify, centralise, automate.
 * The camera presents floating interfaces like a physical product.
 */
const S5 = beat('s05_platform');
const SIMP = beat('s05_simplificam');
const CENT = beat('s05_centralizam');
const AUTO = beat('s05_automatizam');
const END = sec(47);

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
  const keys: CamKey[] = [
    {f: S5 - 30, pos: [0, 0, 2900], target: [0, 0, -500], lens: 35, aperture: 0.6},
    {f: S5 + 60, pos: [-520, ty + 160, d + 350], target: [0, ty, 0], lens: 35, aperture: 0.9, ease: EASE.out},
    {f: SIMP - 40, pos: [380, ty - 140, d + 80], target: [60, ty, 0], lens: 35, aperture: 0.9, ease: EASE.inOut},
    {f: SIMP + 10, pos: [GAP, ty, d], target: [GAP, ty, 0], lens: 35, aperture: 0.8, ease: EASE.dolly},
    {f: CENT - 40, pos: [GAP + 160, ty + 60, d - 120], target: [GAP, ty, 0], lens: 35, aperture: 0.8, ease: EASE.inOut},
    {f: CENT + 10, pos: [GAP * 2, ty, d], target: [GAP * 2, ty, 0], lens: 35, aperture: 0.8, ease: EASE.dolly},
    {f: AUTO - 40, pos: [GAP * 2 - 180, ty - 60, d - 100], target: [GAP * 2, ty, 0], lens: 35, aperture: 0.8, ease: EASE.inOut},
    {f: AUTO + 10, pos: [GAP * 3 + 200, ty + 50, d + 150], target: [GAP * 3, ty, 0], lens: 35, aperture: 0.8, ease: EASE.dolly},
    {f: END - 40, pos: [GAP * 3 + 40, ty, d + 20], target: [GAP * 3, ty, 0], lens: 35, aperture: 0.8, ease: EASE.inOut},
    {f: END + 20, pos: [GAP * 3, ty, d], target: [GAP * 3, ty, 0], lens: 35, aperture: 0.8, ease: EASE.inOut},
  ];
  return camPath(f, keys, 2);
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

const Headline: React.FC<{f: number; at: number; out: number; num?: string; a: string; b: string; strongFirst?: boolean}> = ({f, at, out, num, a, b, strongFirst = true}) => {
  const L = useLayout();
  const s = L.u;
  if (f < at - 5 || f > out + 30) return null;
  const top = L.vertical ? -L.height / 2 + L.safe.top + 70 * s : -L.height / 2 + 110 * s;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{position: 'absolute', transform: `translateY(${top}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        {num ? (
          <div style={{fontFamily: 'inherit', opacity: prog(f, at, at + 14) * (1 - prog(f, out, out + 12))}}>
            <SplitText text={num} size={22 * s} weight={500} tracking={0.4} color={COLORS.accentSoft} state={() => ({})} />
          </div>
        ) : null}
        <SplitText
          text={a}
          size={(L.vertical ? 96 : 84) * s}
          weight={strongFirst ? 700 : 300}
          tracking={strongFirst ? -0.01 : 0.18}
          state={combine(riseIn(f, at, {stagger: 1.6}), dissolveOut(f, out, {stagger: 0.6}))}
          prevState={combine(riseIn(f - 1, at, {stagger: 1.6}), dissolveOut(f - 1, out, {stagger: 0.6}))}
        />
        <SplitText
          text={b}
          size={(L.vertical ? 46 : 42) * s}
          weight={strongFirst ? 300 : 700}
          tracking={0.24}
          color={COLORS.gray}
          state={combine(focusIn(f, at + 12, {spread: 0.3}), dissolveOut(f, out + 2, {stagger: 0.5}))}
        />
      </div>
    </AbsoluteFill>
  );
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
