import React from 'react';
import {COLORS, FONTS} from '../config/theme';
import {EASE} from '../utils/easing';
import {clamp} from '../utils/math';
import {Icon, Label, glass, type IconName} from './ui';

/**
 * Daily operations → 20:00 automation → consolidated report.
 * All values are demonstrative (fictional), never real client results.
 */

export const REPORT = {
  title: 'RELATÓRIO DIÁRIO',
  subtitle: 'Resumo das atividades de hoje',
  lines: [
    {k: 'Faturamento', v: 4850, fmt: 'brl' as const, icon: 'wallet' as IconName},
    {k: 'Vendas realizadas', v: 23, fmt: 'int' as const, icon: 'cart' as IconName},
    {k: 'Novos clientes', v: 8, fmt: 'int' as const, icon: 'users' as IconName},
    {k: 'Serviços concluídos', v: 17, fmt: 'int' as const, icon: 'tasks' as IconName},
    {k: 'Ticket médio', v: 210.87, fmt: 'brl' as const, icon: 'chart' as IconName},
    {k: 'Despesas registradas', v: 620, fmt: 'brl' as const, icon: 'report' as IconName},
  ],
  footer: 'Relatório gerado automaticamente às 20h.',
  sign: 'ArmeTec | Gestão Inteligente',
};

export const fmt = (v: number, kind: 'brl' | 'int') =>
  kind === 'brl' ? `R$ ${v.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : Math.round(v).toLocaleString('pt-BR');

/** Activity registered through the day (feed). */
export const DAY_EVENTS: Array<{h: string; t: string; d: string; icon: IconName; tint: string}> = [
  {h: '09:12', t: 'Venda realizada', d: 'Atlas Comércio · R$ 320,00', icon: 'cart', tint: COLORS.accentSoft},
  {h: '10:40', t: 'Novo cliente', d: 'Casa Aurora · cadastro completo', icon: 'users', tint: COLORS.success},
  {h: '11:05', t: 'Serviço concluído', d: 'OS-1182 · Manutenção', icon: 'tasks', tint: COLORS.success},
  {h: '13:30', t: 'Pagamento recebido', d: 'Grupo Ventura · R$ 1.200,00', icon: 'wallet', tint: COLORS.accentSoft},
  {h: '15:10', t: 'Tarefa finalizada', d: 'Conferência de estoque', icon: 'check', tint: COLORS.success},
  {h: '16:45', t: 'Despesa registrada', d: 'Fornecedor · R$ 180,00', icon: 'report', tint: COLORS.warning},
  {h: '18:20', t: 'Venda realizada', d: 'Prisma Saúde · R$ 640,00', icon: 'cart', tint: COLORS.accentSoft},
];

export const DayFeed: React.FC<{w: number; h: number; shown: number}> = ({w, h, shown}) => (
  <div style={{...glass({radius: 24, tint: 0.94}), width: w, height: h, padding: '26px 28px', boxSizing: 'border-box'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18}}>
      <Icon name="clock" size={22} color={COLORS.accentSoft} />
      <Label size={21} color={COLORS.white} weight={600}>
        Hoje na sua empresa
      </Label>
      <div style={{flex: 1}} />
      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
        <div style={{width: 8, height: 8, borderRadius: 8, background: COLORS.success, boxShadow: `0 0 10px ${COLORS.success}`}} />
        <Label size={14}>registrando automaticamente</Label>
      </div>
    </div>
    {DAY_EVENTS.map((e, i) => {
      const a = EASE.out(clamp(shown - i));
      if (a <= 0) return null;
      return (
        <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, padding: '13px 4px', borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: a, transform: `translateY(${(1 - a) * -18}px)`}}>
          <Label size={15} color={COLORS.gray} style={{width: 52, fontVariantNumeric: 'tabular-nums'}}>
            {e.h}
          </Label>
          <div style={{width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon name={e.icon} size={20} color={e.tint} />
          </div>
          <div style={{flex: 1}}>
            <Label size={18} color={COLORS.white} weight={600}>
              {e.t}
            </Label>
            <Label size={14}>{e.d}</Label>
          </div>
          <Icon name="check" size={18} color={COLORS.success} />
        </div>
      );
    })}
  </div>
);

/** Indicator card that counts up as data is stored. */
export const KpiCard: React.FC<{w: number; h: number; label: string; value: number; kind: 'brl' | 'int'; icon: IconName; glow?: number}> = ({w, h, label, value, kind, icon, glow = 0}) => (
  <div
    style={{
      ...glass({radius: 20, tint: 0.92}),
      width: w,
      height: h,
      padding: '20px 22px',
      boxSizing: 'border-box',
      boxShadow: `inset 0 0 0 ${1 + glow}px rgba(81,112,255,${0.1 + glow * 0.6}), 0 30px 70px rgba(0,0,0,0.55), 0 0 ${glow * 60}px rgba(81,112,255,${glow * 0.35})`,
    }}
  >
    <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
      <Icon name={icon} size={18} color={COLORS.accentSoft} />
      <Label size={15}>{label}</Label>
    </div>
    <div style={{fontFamily: FONTS.display, fontWeight: 600, fontSize: 38, color: COLORS.white, marginTop: 10, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums'}}>{fmt(value, kind)}</div>
  </div>
);

/** One rolling digit (odometer). */
const Digit: React.FC<{from: string; to: string; t: number; size: number}> = ({from, to, t, size}) => {
  const e = EASE.inOut(clamp(t));
  return (
    <div style={{height: size * 1.05, overflow: 'hidden', position: 'relative', width: size * 0.62}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${-e * size * 1.05}px)`}}>
        <div style={{height: size * 1.05, textAlign: 'center', filter: e > 0 && e < 1 ? `blur(${Math.sin(e * Math.PI) * 3}px)` : undefined}}>{from}</div>
        <div style={{height: size * 1.05, textAlign: 'center'}}>{to}</div>
      </div>
    </div>
  );
};

/**
 * Sophisticated digital clock 19:59:57 → 20:00:00 (odometer digits).
 * `tick` = continuous seconds (57 → 60+). Digits roll at the end of each second.
 */
export const DigitalClock: React.FC<{tick: number; size: number; armed: number}> = ({tick, size, armed}) => {
  const final = tick >= 60;
  const sec = Math.min(59, Math.floor(tick));
  const r = final ? 0 : EASE.inOut(clamp((tick - sec - 0.72) / 0.28));
  const two = (n: number) => String(n % 60).padStart(2, '0');
  const curHM = final ? '2000' : '1959';
  const nextHM = sec === 59 ? '2000' : curHM;
  const curS = final ? '00' : two(sec);
  const nextS = final ? '00' : two(sec + 1);
  const hm = (i: number) => <Digit key={`hm${i}`} from={curHM[i]} to={nextHM[i]} t={curHM[i] !== nextHM[i] ? r : 0} size={size} />;
  return (
    <div style={{display: 'flex', alignItems: 'center', fontFamily: FONTS.display, fontWeight: 300, fontSize: size, color: COLORS.white, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums'}}>
      {hm(0)}
      {hm(1)}
      <div style={{width: size * 0.3, textAlign: 'center', marginTop: -size * 0.08, opacity: 0.85}}>:</div>
      {hm(2)}
      {hm(3)}
      <div style={{width: size * 0.16}} />
      <div style={{display: 'flex', fontSize: size * 0.42, color: armed > 0 ? COLORS.accentSoft : COLORS.gray, fontWeight: 400, alignSelf: 'flex-end', marginBottom: size * 0.1}}>
        {[0, 1].map((i) => (
          <Digit key={`s${i}`} from={curS[i]} to={nextS[i]} t={curS[i] !== nextS[i] ? r : 0} size={size * 0.42} />
        ))}
      </div>
    </div>
  );
};

/** The report, built line by line in front of the viewer. */
export const ReportDoc: React.FC<{w: number; h: number; build: number}> = ({w, h, build}) => (
  <div style={{...glass({radius: 26, tint: 0.96}), width: w, height: h, padding: '34px 36px', boxSizing: 'border-box', boxShadow: `inset 0 0 0 1.5px rgba(81,112,255,0.45), 0 50px 120px rgba(0,0,0,0.7), 0 0 90px rgba(81,112,255,${0.18 * clamp(build)})`}}>
    <div style={{opacity: EASE.out(clamp(build * 4))}}>
      <Label size={15} color={COLORS.accentSoft} weight={700} caps>
        {REPORT.title}
      </Label>
      <Label size={24} color={COLORS.white} weight={600} style={{marginTop: 6}}>
        {REPORT.subtitle}
      </Label>
    </div>
    <div style={{marginTop: 20}}>
      {REPORT.lines.map((l, i) => {
        const a = EASE.out(clamp(build * (REPORT.lines.length + 2) - 1 - i));
        return (
          <div key={l.k} style={{display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', opacity: a, transform: `translateX(${(1 - a) * 30}px)`}}>
            <Icon name={l.icon} size={20} color={COLORS.accentSoft} />
            <Label size={19} color="#d4d4d8" style={{flex: 1}}>
              {l.k}
            </Label>
            <Label size={21} color={COLORS.white} weight={600} style={{fontVariantNumeric: 'tabular-nums'}}>
              {fmt(l.v * a, l.fmt)}
            </Label>
          </div>
        );
      })}
    </div>
    <Label size={14} style={{marginTop: 16, opacity: clamp(build * 8 - 7)}}>
      {REPORT.footer}
    </Label>
  </div>
);
