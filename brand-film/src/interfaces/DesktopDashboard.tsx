import React from 'react';
import {COLORS, FONTS} from '../config/theme';
import {EASE} from '../utils/easing';
import {clamp} from '../utils/math';
import {hash01} from '../utils/random';
import {fmt} from './DailyReport';
import {Sidebar} from './Platform';
import type {SyncState} from './SystemApps';
import {Icon, Label, glass, type IconName} from './ui';

/**
 * Full management dashboard for the desktop display — dense, alive, readable:
 * KPI row with sparklines, hourly revenue (live point), channel donut,
 * category bars, sales funnel, monthly goal gauge, top products, activity heat
 * grid and a real-time feed. Builds in on `t` (frames) and reacts to the sale
 * propagated through `s` (finance). All numbers are fictional.
 */

const SALE = 1280;
const panel: React.CSSProperties = {...glass({radius: 16, tint: 0.5}), padding: '16px 18px', boxSizing: 'border-box', position: 'relative'};
const ink = COLORS.white;

const k = (t: number, at: number, dur = 30) => EASE.out(clamp((t - at) / dur));

const Spark: React.FC<{w: number; h: number; seed: number; draw: number; up?: boolean}> = ({w, h, seed, draw, up = true}) => {
  const n = 18;
  const pts = Array.from({length: n}, (_, i) => [(i / (n - 1)) * w, h - (0.2 + (up ? i / n : 1 - i / n) * 0.5 + hash01(i, seed) * 0.3) * h]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} style={{overflow: 'visible'}}>
      <path d={d} fill="none" stroke={up ? COLORS.success : COLORS.warning} strokeWidth={2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
    </svg>
  );
};

const Kpi: React.FC<{t: number; i: number; icon: IconName; label: string; value: string; delta: string; seed: number; hot?: number; up?: boolean}> = ({t, i, icon, label, value, delta, seed, hot = 0, up = true}) => {
  const a = k(t, 6 + i * 5);
  return (
    <div style={{...panel, flex: 1, height: 132, opacity: a, transform: `translateY(${(1 - a) * 18}px)`, boxShadow: `${panel.boxShadow}, 0 0 ${hot * 50}px rgba(81,112,255,${hot * 0.45}), inset 0 0 0 ${hot * 1.5}px rgba(81,112,255,${hot})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
        <Icon name={icon} size={16} color={COLORS.accentSoft} />
        <Label size={14}>{label}</Label>
      </div>
      <div style={{fontFamily: FONTS.display, fontSize: 30, fontWeight: 650, color: ink, marginTop: 8, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums'}}>{value}</div>
      <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4}}>
        <Label size={13} color={up ? COLORS.success : COLORS.warning} weight={600}>
          {delta}
        </Label>
        <Spark w={110} h={30} seed={seed} draw={k(t, 14 + i * 5, 50)} up={up} />
      </div>
    </div>
  );
};

/** Hourly revenue area chart with a live endpoint and the incoming sale. */
const RevenueChart: React.FC<{w: number; h: number; t: number; fin: number}> = ({w, h, t, fin}) => {
  const hours = 13; // 08h → 20h
  const vals = Array.from({length: hours}, (_, i) => 0.18 + 0.55 * Math.sin((i / (hours - 1)) * Math.PI * 0.9) + hash01(i, 31) * 0.18);
  vals[hours - 1] = vals[hours - 1] + 0.28 * EASE.out(fin);
  const x = (i: number) => 50 + (i / (hours - 1)) * (w - 70);
  const y = (v: number) => h - 34 - v * (h - 70);
  const draw = k(t, 18, 70);
  const pts = vals.map((v, i) => [x(i), y(v)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const last = pts[hours - 1];
  const pulse = (Math.sin(t / 7) + 1) / 2;
  return (
    <svg width={w} height={h} style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id="rev-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.accent} stopOpacity={0.45} />
          <stop offset="1" stopColor={COLORS.accent} stopOpacity={0} />
        </linearGradient>
        <clipPath id="rev-c">
          <rect x={0} y={-30} width={w * draw} height={h + 60} />
        </clipPath>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <g key={g}>
          <line x1={50} x2={w - 20} y1={y(g)} y2={y(g)} stroke="rgba(255,255,255,0.06)" />
          <text x={6} y={y(g) + 4} fill={COLORS.dim} style={{fontFamily: FONTS.sans, fontSize: 12}}>
            {`${Math.round(g * 1.6 * 10) / 10}k`}
          </text>
        </g>
      ))}
      {vals.map((_, i) =>
        i % 2 === 0 ? (
          <text key={i} x={x(i)} y={h - 8} textAnchor="middle" fill={COLORS.dim} style={{fontFamily: FONTS.sans, fontSize: 12}}>
            {String(8 + i).padStart(2, '0')}h
          </text>
        ) : null,
      )}
      <g clipPath="url(#rev-c)">
        <path d={`${d} L${last[0]},${h - 34} L${pts[0][0]},${h - 34} Z`} fill="url(#rev-g)" />
        <path d={d} fill="none" stroke={COLORS.accent} strokeWidth={3} strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={3} fill="#fff" opacity={0.6} />
        ))}
      </g>
      {draw > 0.98 ? (
        <g>
          <circle cx={last[0]} cy={last[1]} r={8 + pulse * 10} fill={COLORS.accent} opacity={0.25 * (1 - pulse)} />
          <circle cx={last[0]} cy={last[1]} r={6} fill="#fff" stroke={COLORS.accent} strokeWidth={3} />
        </g>
      ) : null}
      {fin > 0.05 ? (
        <g transform={`translate(${last[0] - 170}, ${last[1] - 64})`} opacity={EASE.out(clamp(fin * 2))}>
          <rect width={156} height={46} rx={10} fill="rgba(20,22,32,0.95)" stroke={COLORS.accent} strokeOpacity={0.6} />
          <text x={14} y={20} fill={COLORS.gray} style={{fontFamily: FONTS.sans, fontSize: 12}}>
            Nova venda · 20h02
          </text>
          <text x={14} y={38} fill={COLORS.success} style={{fontFamily: FONTS.sans, fontSize: 15, fontWeight: 700}}>
            + {fmt(SALE * EASE.out(fin), 'brl')}
          </text>
        </g>
      ) : null}
    </svg>
  );
};

const Donut: React.FC<{size: number; t: number; fin: number}> = ({size, t, fin}) => {
  const parts = [
    {n: 'Loja física', v: 0.46, c: COLORS.accent},
    {n: 'Site', v: 0.31, c: COLORS.accentSoft},
    {n: 'WhatsApp', v: 0.23 + 0.03 * fin, c: '#25D366'},
  ];
  const tot = parts.reduce((a, p) => a + p.v, 0);
  const r = size / 2 - 14;
  const C = 2 * Math.PI * r;
  const grow = k(t, 24, 60);
  let acc = 0;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
      <svg width={size} height={size} style={{transform: `rotate(${-90 + (1 - grow) * -60}deg)`}}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={22} fill="none" />
        {parts.map((p) => {
          const len = (p.v / tot) * C * grow;
          const off = acc;
          acc += (p.v / tot) * C * grow;
          return <circle key={p.n} cx={size / 2} cy={size / 2} r={r} stroke={p.c} strokeWidth={22} fill="none" strokeDasharray={`${Math.max(0, len - 4)} ${C}`} strokeDashoffset={-off} />;
        })}
      </svg>
      <div>
        {parts.map((p) => (
          <div key={p.n} style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
            <div style={{width: 10, height: 10, borderRadius: 3, background: p.c}} />
            <Label size={14} color="#d4d4d8" style={{width: 92}}>
              {p.n}
            </Label>
            <Label size={14} color={ink} weight={600}>
              {Math.round((p.v / tot) * 100)}%
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

const Bars: React.FC<{w: number; h: number; t: number}> = ({w, h, t}) => {
  const cats = ['Kits', 'Serviços', 'Peças', 'Licenças', 'Consult.', 'Lotes'];
  return (
    <div style={{display: 'flex', alignItems: 'flex-end', gap: 12, height: h, width: w}}>
      {cats.map((c, i) => {
        const v = 0.3 + hash01(i, 44) * 0.65;
        const g = k(t, 30 + i * 4, 40);
        return (
          <div key={c} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end'}}>
            <Label size={12} color={ink} weight={600}>
              {Math.round(v * 120 * g)}
            </Label>
            <div style={{width: '100%', height: `${v * 75 * g}%`, borderRadius: 6, background: i === 0 ? `linear-gradient(180deg, ${COLORS.accentSoft}, ${COLORS.accent})` : 'rgba(255,255,255,0.16)'}} />
            <Label size={11}>{c}</Label>
          </div>
        );
      })}
    </div>
  );
};

const Funnel: React.FC<{t: number}> = ({t}) => {
  const steps = [
    ['Leads', 320],
    ['Propostas', 128],
    ['Negociação', 64],
    ['Fechados', 31],
  ] as const;
  return (
    <div>
      {steps.map(([n, v], i) => {
        const g = k(t, 34 + i * 6, 40);
        return (
          <div key={n} style={{marginBottom: 12}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 5}}>
              <Label size={13} color="#d4d4d8">
                {n}
              </Label>
              <Label size={13} color={ink} weight={600}>
                {Math.round(v * g)}
              </Label>
            </div>
            <div style={{height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center'}}>
              <div style={{height: '100%', width: `${(v / 320) * 100 * g}%`, borderRadius: 7, background: `rgba(81,112,255,${0.9 - i * 0.15})`}} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Gauge: React.FC<{t: number; fin: number}> = ({t, fin}) => {
  const v = (0.74 + 0.04 * fin) * k(t, 28, 70);
  const r = 64;
  const C = Math.PI * r;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <svg width={160} height={92}>
        <path d={`M16,84 A${r},${r} 0 0 1 144,84`} stroke="rgba(255,255,255,0.08)" strokeWidth={14} fill="none" strokeLinecap="round" />
        <path d={`M16,84 A${r},${r} 0 0 1 144,84`} stroke={COLORS.success} strokeWidth={14} fill="none" strokeLinecap="round" strokeDasharray={`${C * v} ${C}`} />
      </svg>
      <div style={{fontFamily: FONTS.display, fontSize: 30, fontWeight: 650, color: ink, marginTop: -30, fontVariantNumeric: 'tabular-nums'}}>{Math.round(v * 100)}%</div>
      <Label size={12}>da meta mensal</Label>
    </div>
  );
};

const Heat: React.FC<{t: number}> = ({t}) => (
  <div style={{display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 4}}>
    {Array.from({length: 14 * 5}, (_, i) => {
      const v = hash01(i, 77);
      const on = k(t, 20 + (i % 14) * 1.5, 20);
      return <div key={i} style={{height: 14, borderRadius: 3, background: `rgba(81,112,255,${(0.08 + v * 0.8) * on})`}} />;
    })}
  </div>
);

const FEED = [
  {t: 'Pagamento recebido', d: 'Grupo Ventura · R$ 1.200,00', i: 'wallet' as IconName},
  {t: 'Serviço concluído', d: 'OS-1188 · Instalação', i: 'tasks' as IconName},
  {t: 'Novo cliente', d: 'Casa Aurora', i: 'users' as IconName},
  {t: 'Estoque atualizado', d: 'Peças Reposição · +40 un', i: 'box' as IconName},
];

const Feed: React.FC<{t: number; s: SyncState}> = ({t, s}) => {
  const base = FEED.map((x) => ({...x, isNew: false}));
  const items = s.finance > 0.05 ? [{t: 'Venda registrada', d: `Casa Aurora · ${fmt(SALE, 'brl')}`, i: 'cart' as IconName, isNew: true}, ...base] : base;
  return (
    <div>
      {items.slice(0, 4).map((it, i) => {
        const a = it.isNew ? EASE.out(clamp(s.finance * 2)) : k(t, 36 + i * 6, 24);
        return (
          <div key={it.t + i} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', borderRadius: 10, opacity: a, height: 46 * (it.isNew ? a : 1), overflow: 'hidden', background: it.isNew ? 'rgba(81,112,255,0.14)' : undefined}}>
            <div style={{width: 30, height: 30, borderRadius: 9, background: 'rgba(81,112,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Icon name={it.i} size={15} color={COLORS.accentSoft} />
            </div>
            <div style={{minWidth: 0}}>
              <Label size={13} color={ink} weight={600}>
                {it.t}
              </Label>
              <Label size={11}>{it.d}</Label>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Title: React.FC<{children: React.ReactNode; right?: React.ReactNode}> = ({children, right}) => (
  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
    <Label size={15} color={ink} weight={600}>
      {children}
    </Label>
    {right}
  </div>
);

export const DesktopDashboard: React.FC<{s: SyncState; w: number; h: number; t: number}> = ({s, w, h, t}) => {
  const fin = s.finance;
  const revenue = 4850 + SALE * EASE.out(fin);
  const pulse = (Math.sin(t / 6) + 1) / 2;
  const cw = w - 230 - 48;
  return (
    <div style={{width: w, height: h, display: 'flex', background: 'radial-gradient(ellipse 80% 60% at 70% 0%, rgba(81,112,255,0.10), transparent 60%), linear-gradient(180deg,#0d0e13,#08080a)', fontFamily: FONTS.sans, color: ink, overflow: 'hidden'}}>
      <Sidebar active={6} h={h} />
      <div style={{flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0}}>
        {/* top bar */}
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <div>
            <Label size={13}>Segunda, 2 de março · 20:02</Label>
            <Label size={26} color={ink} weight={650} style={{letterSpacing: '-0.02em'}}>
              Painel de gestão
            </Label>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'rgba(127,209,168,0.12)', marginLeft: 12}}>
            <div style={{width: 8, height: 8, borderRadius: 8, background: COLORS.success, boxShadow: `0 0 ${6 + pulse * 10}px ${COLORS.success}`}} />
            <Label size={12} color={COLORS.success} weight={700} caps>
              Ao vivo
            </Label>
          </div>
          <div style={{flex: 1}} />
          <div style={{width: 300, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px'}}>
            <Icon name="search" size={16} color={COLORS.gray} />
            <Label size={14}>Buscar clientes, pedidos…</Label>
          </div>
          <Icon name="bell" size={22} color={ink} />
        </div>
        {/* KPIs */}
        <div style={{display: 'flex', gap: 14}}>
          <Kpi t={t} i={0} icon="wallet" label="Faturamento hoje" value={fmt(revenue, 'brl')} delta={fin > 0.05 ? `▲ + ${fmt(SALE * EASE.out(fin), 'brl')}` : '▲ 12,4% vs ontem'} seed={1} hot={fin > 0 && fin < 1 ? 1 : 0} />
          <Kpi t={t} i={1} icon="cart" label="Vendas" value={String(23 + (fin > 0.3 ? 1 : 0))} delta="▲ 8 vs ontem" seed={2} />
          <Kpi t={t} i={2} icon="chart" label="Ticket médio" value={fmt((revenue / (23 + (fin > 0.3 ? 1 : 0))), 'brl')} delta="▲ 3,1%" seed={3} />
          <Kpi t={t} i={3} icon="users" label="Novos clientes" value="8" delta="▲ 2 hoje" seed={4} />
          <Kpi t={t} i={4} icon="report" label="Despesas" value={fmt(620, 'brl')} delta="▼ 4,0%" seed={5} up={false} />
        </div>
        {/* revenue + donut */}
        <div style={{display: 'flex', gap: 14, height: 330}}>
          <div style={{...panel, flex: 2.1}}>
            <Title right={<Label size={12}>08h – 20h</Label>}>Faturamento por hora</Title>
            <RevenueChart w={cw * 0.66 - 40} h={262} t={t} fin={fin} />
          </div>
          <div style={{...panel, flex: 1}}>
            <Title>Vendas por canal</Title>
            <Donut size={170} t={t} fin={fin} />
            <div style={{marginTop: 14}}>
              <Title right={<Label size={11}>últimas 10 semanas</Label>}>Atividade</Title>
              <Heat t={t} />
            </div>
          </div>
        </div>
        {/* bottom row */}
        <div style={{display: 'flex', gap: 14, flex: 1, minHeight: 0}}>
          <div style={{...panel, flex: 1.2}}>
            <Title>Vendas por categoria</Title>
            <Bars w={cw * 0.27} h={190} t={t} />
          </div>
          <div style={{...panel, flex: 1}}>
            <Title>Funil comercial</Title>
            <Funnel t={t} />
          </div>
          <div style={{...panel, flex: 0.8, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <Title>Meta do mês</Title>
            <Gauge t={t} fin={fin} />
          </div>
          <div style={{...panel, flex: 1.2}}>
            <Title right={<Label size={11} color={COLORS.success}>tempo real</Label>}>Atividade recente</Title>
            <Feed t={t} s={s} />
          </div>
        </div>
      </div>
    </div>
  );
};
