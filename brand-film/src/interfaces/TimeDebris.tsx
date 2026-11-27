import React from 'react';
import {Plane} from '../components/CssWorld';
import {CAL} from '../config/staging';
import {COLORS, FONTS} from '../config/theme';
import {EASE} from '../utils/easing';
import {clamp} from '../utils/math';
import {hash01} from '../utils/random';
import {useLayout} from '../utils/layout';
import {Dot, Icon, Label, glass} from './ui';

/**
 * Scene 02 — the multiplication of time: hours, calendars, timelines and small
 * interface fragments spawn in an accelerating rhythm. Early items sit on
 * ordered orbits; later ones break that order (growing complexity).
 */

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const CHIPS = [
  {t: 'Reunião de alinhamento', s: '09:30', i: 'calendar'},
  {t: 'Conferência manual', s: 'em andamento', i: 'tasks'},
  {t: 'Planilha_vendas_v7.xlsx', s: 'editado há 2 min', i: 'file'},
  {t: 'Aguardando aprovação', s: '3 pendências', i: 'clock'},
  {t: 'Retrabalho no cadastro', s: 'reaberto', i: 'repeat'},
  {t: 'Relatório semanal', s: 'prazo: sexta', i: 'report'},
  {t: 'Conciliação financeira', s: 'manual', i: 'wallet'},
  {t: 'Atualizar estoque', s: 'planilha', i: 'box'},
] as const;

export const CalendarCard: React.FC<{month: string; marks?: number; seed?: number; big?: boolean}> = ({month, marks = 9, seed = 0, big}) => {
  const s = big ? 3 : 1;
  const days = Array.from({length: 35}, (_, i) => i - 2);
  return (
    <div style={{...glass({radius: 16 * s}), width: '100%', height: '100%', padding: 18 * s, boxSizing: 'border-box'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 * s}}>
        <Label size={17 * s} color={COLORS.white} weight={600}>
          {month}
        </Label>
        <Icon name="calendar" size={16 * s} color={COLORS.gray} />
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 * s}}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <Label key={i} size={10 * s} style={{textAlign: 'center'}} color={COLORS.dim}>
            {d}
          </Label>
        ))}
        {days.map((d, i) => {
          const busy = d > 0 && d < 31 && hash01(i, seed) < marks / 35;
          return (
            <div
              key={i}
              style={{
                height: 22 * s,
                borderRadius: 6 * s,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONTS.sans,
                fontSize: 11 * s,
                color: d > 0 && d < 31 ? (busy ? COLORS.white : COLORS.gray) : 'transparent',
                background: busy ? 'rgba(81,112,255,0.18)' : 'rgba(255,255,255,0.025)',
                boxShadow: busy ? 'inset 0 0 0 1px rgba(81,112,255,0.4)' : undefined,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {d > 0 && d < 31 ? d : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HourTag: React.FC<{h: number}> = ({h}) => (
  <div style={{...glass({radius: 999, tint: 0.55}), width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10}}>
    <Icon name="clock" size={18} color={COLORS.gray} />
    <Label size={24} color={COLORS.white} weight={500}>
      {String(h % 24).padStart(2, '0')}:00
    </Label>
  </div>
);

const Chip: React.FC<{k: number}> = ({k}) => {
  const c = CHIPS[k % CHIPS.length];
  return (
    <div style={{...glass({radius: 14}), width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', boxSizing: 'border-box'}}>
      <div style={{width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Icon name={c.i} size={18} color={COLORS.gray} />
      </div>
      <div>
        <Label size={16} color={COLORS.white} weight={600}>
          {c.t}
        </Label>
        <Label size={13}>{c.s}</Label>
      </div>
    </div>
  );
};

const Timeline: React.FC<{seed: number}> = ({seed}) => (
  <div style={{...glass({radius: 12, tint: 0.5}), width: '100%', height: '100%', padding: '12px 14px', boxSizing: 'border-box'}}>
    {[0, 1, 2].map((r) => {
      const a = hash01(r, seed) * 0.4;
      const b = a + 0.25 + hash01(r + 9, seed) * 0.35;
      return (
        <div key={r} style={{position: 'relative', height: 10, marginBottom: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 5}}>
          <div style={{position: 'absolute', left: `${a * 100}%`, width: `${(b - a) * 100}%`, height: '100%', borderRadius: 5, background: r === 1 ? 'rgba(81,112,255,0.55)' : 'rgba(255,255,255,0.22)'}} />
        </div>
      );
    })}
  </div>
);

type Item = {kind: number; x: number; y: number; z: number; rz: number; ry: number; spawn: number; w: number; h: number};

const useItems = (start: number, end: number): Item[] => {
  const {vertical} = useLayout();
  const N = 64;
  const items: Item[] = [];
  for (let i = 0; i < N; i++) {
    const r = (k: number) => hash01(i, k);
    const kind = Math.floor(r(1) * 4);
    const spawn = start + (end - start - 70) * Math.pow(i / N, 0.62);
    let x: number;
    let y: number;
    let z: number;
    if (i < 18) {
      // ordered: on orbits around the dial
      const a = (i / 18) * Math.PI * 2;
      const rad = 820 + (i % 3) * 260;
      x = Math.cos(a) * rad;
      y = Math.sin(a) * rad * (vertical ? 1.35 : 0.9);
      z = -120 + (i % 3) * 140;
    } else {
      const a = r(2) * Math.PI * 2;
      const rad = 900 + r(3) * 2400;
      x = Math.cos(a) * rad * (vertical ? 0.8 : 1.5);
      y = Math.sin(a) * rad * (vertical ? 1.5 : 0.85);
      z = -2600 + r(4) * 4400;
    }
    const sizes = [
      [230, 250],
      [190, 64],
      [380, 76],
      [320, 92],
    ];
    items.push({kind, x, y, z, rz: (r(5) - 0.5) * (i < 18 ? 0 : 30), ry: (r(6) - 0.5) * 50, spawn, w: sizes[kind][0], h: sizes[kind][1]});
  }
  return items;
};

export const TimeDebris: React.FC<{f: number; start: number; end: number}> = ({f, start, end}) => {
  const items = useItems(start, end);
  if (f < start) return null;
  return (
    <>
      {items.map((it, i) => {
        const a = clamp((f - it.spawn) / 26);
        if (a <= 0) return null;
        const e = EASE.out(a);
        const drift = (f - it.spawn) * (0.25 + hash01(i, 8) * 0.5);
        return (
          <Plane
            key={i}
            x={it.x + Math.cos(i) * drift}
            y={it.y + Math.sin(i * 1.7) * drift}
            z={it.z}
            rz={it.rz + drift * 0.05 * (i % 2 ? 1 : -1)}
            ry={it.ry}
            w={it.w}
            h={it.h}
            scale={0.7 + 0.3 * e}
            opacity={e}
          >
            {it.kind === 0 ? (
              <CalendarCard month={MONTHS[i % 12]} seed={i} />
            ) : it.kind === 1 ? (
              <HourTag h={7 + i} />
            ) : it.kind === 2 ? (
              <Chip k={i} />
            ) : (
              <Timeline seed={i} />
            )}
          </Plane>
        );
      })}
      {/* the calendar that the camera dives into (match cut to the spreadsheet) */}
      <BigCalendar f={f} end={end} />
    </>
  );
};

const BigCalendar: React.FC<{f: number; end: number}> = ({f, end}) => {
  const a = clamp((f - (end - 64)) / 26);
  if (a <= 0) return null;
  return (
    <Plane x={CAL.x} y={CAL.y} z={CAL.z} w={CAL.w} h={CAL.h} opacity={EASE.out(a)} sharp>
      <CalendarCard month="Todos os meses" marks={22} seed={77} big />
      <div style={{position: 'absolute', right: 26, top: 26}}>
        <Dot color={COLORS.accent} size={10} glow />
      </div>
    </Plane>
  );
};
