import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {camSmooth, type SmoothKey} from '../animations/camera';
import {CssWorld, Plane} from '../components/CssWorld';
import {COLORS, FONTS} from '../config/theme';
import {Cursor} from '../interfaces/SearchStory';
import {Icon, Label, glass} from '../interfaces/ui';
import {Title, eyebrow, keyline} from '../typography/Title';
import {EASE} from '../utils/easing';
import {useLayout} from '../utils/layout';
import {clamp, lerp} from '../utils/math';
import {beat} from '../utils/time';

/**
 * SCENE 03c — REPETINDO TAREFAS, shown as a real manual task.
 * Open the order form → type client, CNPJ, product, value → Confirmar →
 * Salvar → "Registro salvo" → the form resets. The exact same routine again
 * with other data, each time faster; match cuts change the angle between
 * repetitions. A quiet counter ("Registro 3 de 60") says the rest.
 */
const C = beat('s03c');
const CYCLES = [C, beat('s03c_cycle2'), beat('s03c_cycle3'), beat('s03c_cycle4'), beat('s03d') + 2];
const DATA = [
  ['Atlas Comércio Ltda', '12.345.678/0001-90', 'Kit Instalação', 'R$ 1.139,40'],
  ['Grupo Ventura S.A.', '98.765.432/0001-10', 'Manutenção Mensal', 'R$ 450,00'],
  ['Prisma Saúde', '45.120.330/0001-55', 'Licença Anual', 'R$ 1.290,00'],
  ['Nobre Distribuidora', '27.004.118/0001-02', 'Peças Reposição', 'R$ 652,50'],
];
const FIELDS = ['Cliente', 'CNPJ', 'Produto', 'Valor'];

const FW = 860;
const FH = 900;

type Phase = {fill: number[]; confirmPress: number; dialog: number; savePress: number; toast: number; clear: number; open: number; cursor: [number, number]};

/** Where we are inside one repetition (u = 0..1 of the cycle). */
const phase = (u: number, data: string[]): Phase => {
  const seg = (a: number, b: number) => clamp((u - a) / (b - a));
  const fillSpan = [0.08, 0.6];
  const fill = FIELDS.map((_, i) => {
    const a = lerp(fillSpan[0], fillSpan[1], i / FIELDS.length);
    const b = lerp(fillSpan[0], fillSpan[1], (i + 1) / FIELDS.length) - 0.015;
    return Math.floor(seg(a, b) * data[i].length);
  });
  const fieldY = (i: number) => 150 + i * 120 + 64;
  const active = Math.min(FIELDS.length - 1, Math.floor(seg(fillSpan[0], fillSpan[1]) * FIELDS.length));
  let cursor: [number, number] = [FW - 140, fieldY(active)];
  if (u > 0.6) cursor = [lerp(FW - 140, FW - 160, seg(0.6, 0.66)), lerp(fieldY(3), FH - 80, EASE.inOut(seg(0.6, 0.66)))];
  if (u > 0.7) cursor = [lerp(FW - 160, FW / 2 + 80, EASE.inOut(seg(0.7, 0.78))), lerp(FH - 80, FH / 2 + 70, EASE.inOut(seg(0.7, 0.78)))];
  return {
    fill,
    open: EASE.out(seg(0, 0.08)),
    confirmPress: u > 0.66 && u < 0.71 ? seg(0.66, 0.71) : 0,
    dialog: EASE.out(seg(0.69, 0.74)) * (1 - seg(0.8, 0.84)),
    savePress: u > 0.79 && u < 0.83 ? seg(0.79, 0.83) : 0,
    toast: EASE.out(seg(0.82, 0.86)) * (1 - seg(0.95, 0.99)),
    clear: EASE.inOut(seg(0.92, 1)),
    cursor,
  };
};

const Form: React.FC<{p: Phase; data: string[]; n: number}> = ({p, data, n}) => (
  <div style={{...glass({radius: 22, tint: 0.95}), width: FW, height: FH, fontFamily: FONTS.sans}}>
    <div style={{height: 76, display: 'flex', alignItems: 'center', gap: 14, padding: '0 30px', borderBottom: '1px solid rgba(255,255,255,0.07)'}}>
      <Icon name="quote" size={24} color={COLORS.accentSoft} />
      <Label size={22} color={COLORS.white} weight={600}>
        Novo registro de pedido
      </Label>
      <div style={{flex: 1}} />
      <Label size={16} style={{fontVariantNumeric: 'tabular-nums'}}>
        Registro {n} de 60
      </Label>
    </div>
    <div style={{padding: '30px 30px 0', opacity: 1 - p.clear * 0.0}}>
      {FIELDS.map((fl, i) => {
        const text = data[i].slice(0, p.fill[i]);
        const typing = p.fill[i] > 0 && p.fill[i] < data[i].length;
        return (
          <div key={fl} style={{marginBottom: 26}}>
            <Label size={16} weight={600} color={COLORS.gray}>
              {fl}
            </Label>
            <div
              style={{
                marginTop: 10,
                height: 66,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                boxShadow: typing ? `inset 0 0 0 2px ${COLORS.accent}` : 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                fontSize: 24,
                color: COLORS.white,
                fontVariantNumeric: 'tabular-nums',
                clipPath: `inset(0 ${p.clear * 100}% 0 0)`,
              }}
            >
              {text}
              {typing ? <span style={{width: 2, height: 28, background: COLORS.accent, marginLeft: 2}} /> : null}
            </div>
          </div>
        );
      })}
    </div>
    <div style={{position: 'absolute', left: 30, right: 30, bottom: 40, display: 'flex', gap: 16, justifyContent: 'flex-end'}}>
      <div style={{height: 64, padding: '0 30px', borderRadius: 14, display: 'flex', alignItems: 'center', color: COLORS.gray, fontSize: 20, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)'}}>Cancelar</div>
      <div
        style={{
          height: 64,
          padding: '0 36px',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          background: COLORS.accent,
          color: '#fff',
          fontSize: 20,
          fontWeight: 600,
          transform: `scale(${1 - Math.sin(p.confirmPress * Math.PI) * 0.06})`,
          boxShadow: `0 10px 30px ${COLORS.accent}55`,
        }}
      >
        Confirmar
      </div>
    </div>
    {/* confirm dialog */}
    {p.dialog > 0.01 ? (
      <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.5 * p.dialog})`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 22}}>
        <div style={{...glass({radius: 20, tint: 0.98}), width: 520, padding: 34, transform: `scale(${0.92 + 0.08 * p.dialog})`, opacity: p.dialog}}>
          <Label size={24} color={COLORS.white} weight={600}>
            Confirmar registro?
          </Label>
          <Label size={18} style={{marginTop: 8, whiteSpace: 'normal'}}>
            {data[0]} · {data[3]}
          </Label>
          <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 28}}>
            <div style={{height: 58, padding: '0 34px', borderRadius: 14, display: 'flex', alignItems: 'center', background: COLORS.accent, color: '#fff', fontSize: 20, fontWeight: 600, transform: `scale(${1 - Math.sin(p.savePress * Math.PI) * 0.06})`}}>
              Salvar
            </div>
          </div>
        </div>
      </div>
    ) : null}
    {/* toast */}
    {p.toast > 0.01 ? (
      <div style={{position: 'absolute', left: '50%', top: 22, transform: `translate(-50%, ${(1 - p.toast) * -20}px)`, opacity: p.toast, ...glass({radius: 999, tint: 0.98}), padding: '14px 26px', display: 'flex', alignItems: 'center', gap: 12}}>
        <div style={{width: 28, height: 28, borderRadius: 28, background: COLORS.success, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Icon name="check" size={18} color="#0b0b0c" />
        </div>
        <Label size={19} color={COLORS.white} weight={600}>
          Registro salvo
        </Label>
      </div>
    ) : null}
    <Cursor x={p.cursor[0]} y={p.cursor[1]} press={Math.max(p.confirmPress, p.savePress)} />
  </div>
);

export const S03cRepeat: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame() + from;
  const L = useLayout();
  const v = L.vertical;
  let k = 0;
  while (k < CYCLES.length - 2 && f >= CYCLES[k + 1]) k++;
  const c0 = CYCLES[k];
  const c1 = CYCLES[k + 1];
  const u = clamp((f - c0) / (c1 - c0));
  const p = phase(f < C ? 0 : u, DATA[k]);
  const d = v ? 1800 : 1350;
  // a different set-up per repetition — cut on the identical form (match cut)
  const setups: SmoothKey[][] = [
    [
      {f: c0 - 30, pos: [-520, 260, d + 500], target: [0, 40, 0], lens: 40, aperture: 1.1},
      {f: c1, pos: [-260, 120, d], target: [0, 20, 0], lens: 40, aperture: 1.1},
    ],
    [
      {f: c0, pos: [460, -300, d + 60], target: [0, 0, 0], lens: 42, roll: 2, aperture: 1.2},
      {f: c1, pos: [300, -160, d - 40], target: [0, 0, 0], lens: 42, roll: 1, aperture: 1.2},
    ],
    [
      {f: c0, pos: [0, 0, d - 120], target: [0, 0, 0], lens: 45, aperture: 1.3},
      {f: c1, pos: [-80, 60, d - 200], target: [0, 20, 0], lens: 45, aperture: 1.3},
    ],
    [
      {f: c0, pos: [360, 240, d - 200], target: [0, 0, 0], lens: 40, roll: -3, aperture: 1.2},
      {f: c1 + 20, pos: [120, 80, d + 1400], target: [0, 0, -400], lens: 35, roll: -4, aperture: 0.9},
    ],
  ];
  const cam = camSmooth(f, setups[k], 1.5);
  // each repetition starts with the form flying in from depth (the routine restarts)
  const pop = k === 0 ? p.open : 1;
  const exitBlur = k === 3 ? clamp(u * 2) * 6 : 0;
  return (
    <AbsoluteFill style={{background: COLORS.black}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(81,112,255,0.07), transparent 70%)'}} />
      <CssWorld cam={cam}>
        {/* ghosts of the previous repetitions stacked behind — the pile of identical work */}
        {Array.from({length: k}, (_, i) => (
          <Plane key={i} x={(i + 1) * 60} y={(i + 1) * -40} z={-(i + 1) * 320} w={FW} h={FH} opacity={0.35 - i * 0.08}>
            <Form p={{...phase(0.9, DATA[i]), toast: 0, cursor: [-999, -999]}} data={DATA[i]} n={i + 1} />
          </Plane>
        ))}
        <Plane x={0} y={0} z={-(1 - pop) * 600} w={FW} h={FH} opacity={pop} blur={exitBlur} sharp>
          <Form p={p} data={DATA[k]} n={k + 1} />
        </Plane>
      </CssWorld>
      <Title f={f} at={C + 18} out={beat('s03c_cycle2') - 12} anchor="top" lines={[keyline('REPETINDO', v ? 120 : 110), eyebrow('TAREFAS', v ? 40 : 36)]} />
    </AbsoluteFill>
  );
};
