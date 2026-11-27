import React from 'react';
import {Img, staticFile} from 'remotion';
import {BRAND} from '../config/brand';
import {COLORS, FONTS} from '../config/theme';
import {EASE} from '../utils/easing';
import {clamp, lerp} from '../utils/math';
import {hash01} from '../utils/random';
import {MODULES} from './OrderedTile';
import {Avatar, Dot, Icon, Label, Pill, glass, type IconName} from './ui';

/**
 * Demonstration interfaces of a custom ArmeTec system. They are illustrative
 * (labelled as such) — not a product being sold off the shelf.
 * All animation is driven by `t` (frames since the element started).
 */

const DEMO_TAG = 'Demonstração ilustrativa';

export const Sidebar: React.FC<{active: number; h: number; reveal?: number}> = ({active, h, reveal = 1}) => (
  <div style={{width: 230, height: h, borderRight: '1px solid rgba(255,255,255,0.07)', padding: '26px 16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 4}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px 26px'}}>
      <Img src={staticFile(BRAND.symbol)} style={{width: 30, height: 30}} />
      <Label size={18} color={COLORS.white} weight={600}>
        Sistema
      </Label>
    </div>
    {MODULES.map((m, i) => (
      <div
        key={m.name}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '11px 12px',
          borderRadius: 12,
          background: i === active ? 'rgba(81,112,255,0.14)' : 'transparent',
          boxShadow: i === active ? 'inset 0 0 0 1px rgba(81,112,255,0.35)' : undefined,
          opacity: clamp(reveal * 9 - i),
        }}
      >
        <Icon name={m.icon} size={19} color={i === active ? COLORS.accentSoft : COLORS.gray} />
        <Label size={16} color={i === active ? COLORS.white : '#c4c4cc'} weight={i === active ? 600 : 500}>
          {m.name}
        </Label>
      </div>
    ))}
    <div style={{flex: 1}} />
    <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px'}}>
      <Avatar initials="AT" size={32} />
      <div>
        <Label size={14} color={COLORS.white} weight={600}>
          Operação
        </Label>
        <Label size={12}>Gestor</Label>
      </div>
    </div>
  </div>
);

const Kpi: React.FC<{label: string; value: string; delta: string; t: number; i: number; icon: IconName}> = ({label, value, delta, t, i, icon}) => {
  const a = EASE.out(clamp((t - 10 - i * 5) / 24));
  return (
    <div style={{...glass({radius: 16, tint: 0.5}), flex: 1, padding: '18px 20px', opacity: a, transform: `translateY(${(1 - a) * 20}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
        <Icon name={icon} size={16} color={COLORS.gray} />
        <Label size={14}>{label}</Label>
      </div>
      <Label size={30} color={COLORS.white} weight={600} style={{marginTop: 10, letterSpacing: '-0.02em'}}>
        {value}
      </Label>
      <Label size={13} color={COLORS.success} weight={600} style={{marginTop: 4}}>
        {delta}
      </Label>
    </div>
  );
};

/** Smooth area chart that draws itself. */
export const AreaChart: React.FC<{w: number; h: number; t: number; seed?: number; draw?: number}> = ({w, h, t, seed = 1, draw}) => {
  const n = 24;
  const pts = Array.from({length: n}, (_, i) => {
    const v = 0.35 + 0.35 * (i / n) + 0.18 * Math.sin(i * 0.7 + seed) + 0.08 * hash01(i, seed);
    return [(i / (n - 1)) * w, h - v * h * 0.85] as const;
  });
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const k = draw ?? EASE.inOut(clamp((t - 20) / 60));
  return (
    <svg width={w} height={h} style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id={`ag${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.accent} stopOpacity={0.35} />
          <stop offset="1" stopColor={COLORS.accent} stopOpacity={0} />
        </linearGradient>
        <clipPath id={`ac${seed}`}>
          <rect x={0} y={-20} width={w * k} height={h + 40} />
        </clipPath>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={0} x2={w} y1={h * g} y2={h * g} stroke="rgba(255,255,255,0.06)" />
      ))}
      <g clipPath={`url(#ac${seed})`}>
        <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#ag${seed})`} />
        <path d={d} fill="none" stroke={COLORS.accent} strokeWidth={3} strokeLinejoin="round" />
      </g>
      <circle cx={pts[Math.min(n - 1, Math.floor(k * (n - 1)))][0]} cy={pts[Math.min(n - 1, Math.floor(k * (n - 1)))][1]} r={6} fill="#fff" stroke={COLORS.accent} strokeWidth={3} />
    </svg>
  );
};

const ORDERS = [
  {c: 'Atlas Comércio', v: 'R$ 4.820,00', s: 'Aprovado', col: COLORS.success},
  {c: 'Lumen Engenharia', v: 'R$ 12.140,00', s: 'Em separação', col: COLORS.accentSoft},
  {c: 'Prisma Saúde', v: 'R$ 2.390,00', s: 'Faturado', col: COLORS.success},
  {c: 'Rota Sul Logística', v: 'R$ 7.655,00', s: 'Aguardando', col: COLORS.warning},
  {c: 'Casa Aurora', v: 'R$ 1.980,00', s: 'Aprovado', col: COLORS.success},
];

export const OrdersTable: React.FC<{t: number; rows?: number; highlight?: number}> = ({t, rows = 5, highlight = -1}) => (
  <div>
    <div style={{display: 'flex', padding: '0 4px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)'}}>
      {['Cliente', 'Valor', 'Status'].map((h, i) => (
        <Label key={h} size={13} caps style={{flex: i === 0 ? 2 : 1}}>
          {h}
        </Label>
      ))}
    </div>
    {ORDERS.slice(0, rows).map((o, i) => {
      const a = EASE.out(clamp((t - 30 - i * 4) / 20));
      return (
        <div
          key={o.c}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '13px 4px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            opacity: a,
            background: i === highlight ? 'rgba(81,112,255,0.1)' : undefined,
            borderRadius: 8,
          }}
        >
          <div style={{flex: 2, display: 'flex', alignItems: 'center', gap: 10}}>
            <Avatar initials={o.c.slice(0, 2).toUpperCase()} size={26} hue={i * 30} />
            <Label size={15} color={COLORS.white} weight={500}>
              {o.c}
            </Label>
          </div>
          <Label size={15} color="#d4d4d8" style={{flex: 1}}>
            {o.v}
          </Label>
          <div style={{flex: 1}}>
            <Pill color={o.col} size={12}>
              <Dot color={o.col} size={6} />
              {o.s}
            </Pill>
          </div>
        </div>
      );
    })}
  </div>
);

/** Main platform window (overview). Responsive: w x h. */
export const AppShell: React.FC<{w: number; h: number; t: number; sidebarReveal?: number}> = ({w, h, t, sidebarReveal = 1}) => {
  const compact = w < 1200;
  const contentW = w - 230 - 64;
  return (
    <div style={{...glass({radius: 26, tint: 0.9}), width: w, height: h, display: 'flex'}}>
      <Sidebar active={6} h={h} reveal={sidebarReveal} />
      <div style={{flex: 1, padding: 32, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <div>
            <Label size={14}>Relatórios</Label>
            <Label size={28} color={COLORS.white} weight={600} style={{letterSpacing: '-0.02em'}}>
              Visão geral da operação
            </Label>
          </div>
          <div style={{flex: 1}} />
          <Pill size={12} color={COLORS.gray}>
            {DEMO_TAG}
          </Pill>
        </div>
        <div style={{display: 'flex', gap: 14, flexWrap: compact ? 'wrap' : 'nowrap'}}>
          <Kpi t={t} i={0} icon="cart" label="Pedidos hoje" value="48" delta="▲ atualizado agora" />
          <Kpi t={t} i={1} icon="wallet" label="A receber (mês)" value="R$ 86,4 mil" delta="▲ conciliado" />
          {!compact ? <Kpi t={t} i={2} icon="tasks" label="Tarefas concluídas" value="312" delta="▲ automáticas" /> : null}
          {!compact ? <Kpi t={t} i={3} icon="box" label="Itens em estoque" value="9.730" delta="▲ sincronizado" /> : null}
        </div>
        <div style={{display: 'flex', gap: 18, flex: 1, flexDirection: compact ? 'column' : 'row', minHeight: 0}}>
          <div style={{...glass({radius: 18, tint: 0.45}), flex: 1.3, padding: 22}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 14}}>
              <Label size={16} color={COLORS.white} weight={600}>
                Faturamento consolidado
              </Label>
              <Label size={13}>últimos 24 dias</Label>
            </div>
            <AreaChart w={compact ? contentW - 44 : contentW * 0.55 - 44} h={compact ? 230 : 250} t={t} />
          </div>
          <div style={{...glass({radius: 18, tint: 0.45}), flex: 1, padding: 22}}>
            <Label size={16} color={COLORS.white} weight={600} style={{marginBottom: 14}}>
              Pedidos recentes
            </Label>
            <OrdersTable t={t} rows={compact ? 4 : 5} />
          </div>
        </div>
      </div>
    </div>
  );
};

/** Compact module window (CRM, financeiro, estoque…). */
export const ModuleWindow: React.FC<{w: number; h: number; t: number; kind: 'crm' | 'fin' | 'stock' | 'quote'}> = ({w, h, t, kind}) => {
  const titles = {crm: ['Clientes', 'users'], fin: ['Financeiro', 'wallet'], stock: ['Estoque', 'box'], quote: ['Orçamentos', 'quote']} as const;
  const [title, icon] = titles[kind];
  return (
    <div style={{...glass({radius: 22, tint: 0.88}), width: w, height: h, padding: 26, boxSizing: 'border-box'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20}}>
        <div style={{width: 38, height: 38, borderRadius: 11, background: 'rgba(81,112,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Icon name={icon} size={20} color={COLORS.accentSoft} />
        </div>
        <Label size={20} color={COLORS.white} weight={600}>
          {title}
        </Label>
      </div>
      {kind === 'crm'
        ? ['Atlas Comércio', 'Grupo Ventura', 'Lumen Engenharia', 'Nobre Distribuidora', 'Prisma Saúde'].map((c, i) => (
            <div key={c} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: clamp((t - i * 4) / 15)}}>
              <Avatar initials={c.slice(0, 2).toUpperCase()} size={30} hue={i * 25} />
              <div style={{flex: 1}}>
                <Label size={15} color={COLORS.white} weight={500}>
                  {c}
                </Label>
                <Label size={12}>Última compra · {3 + i * 4} dias</Label>
              </div>
              <Dot color={i % 3 === 0 ? COLORS.success : COLORS.accentSoft} size={8} />
            </div>
          ))
        : null}
      {kind === 'fin' ? (
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 10, height: h - 130}}>
          {Array.from({length: 9}, (_, i) => {
            const a = EASE.out(clamp((t - i * 3) / 30));
            const v = 0.3 + hash01(i, 4) * 0.6;
            return (
              <div key={i} style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'flex-end', height: '100%'}}>
                <div style={{height: `${v * a * 70}%`, borderRadius: 6, background: i === 8 ? COLORS.accent : 'rgba(255,255,255,0.18)'}} />
                <div style={{height: `${v * a * 25}%`, borderRadius: 6, background: 'rgba(255,255,255,0.07)'}} />
              </div>
            );
          })}
        </div>
      ) : null}
      {kind === 'stock'
        ? ['Kit Instalação', 'Peças Reposição', 'Lote 240un', 'Licença Anual'].map((p, i) => {
            const lv = 0.25 + hash01(i, 9) * 0.7;
            return (
              <div key={p} style={{marginBottom: 18}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 7}}>
                  <Label size={15} color={COLORS.white}>
                    {p}
                  </Label>
                  <Label size={13}>{Math.round(lv * 400)} un</Label>
                </div>
                <div style={{height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.07)'}}>
                  <div style={{height: '100%', width: `${lv * 100 * EASE.out(clamp((t - i * 4) / 30))}%`, borderRadius: 4, background: lv < 0.35 ? COLORS.warning : COLORS.accent}} />
                </div>
              </div>
            );
          })
        : null}
      {kind === 'quote'
        ? ['#ORC-218', '#ORC-219', '#ORC-220'].map((q, i) => (
            <div key={q} style={{...glass({radius: 12, tint: 0.4}), padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12}}>
              <Label size={15} color={COLORS.white} weight={600} style={{fontFamily: FONTS.mono}}>
                {q}
              </Label>
              <div style={{flex: 1}} />
              <Pill size={11} color={i === 0 ? COLORS.success : COLORS.gray}>
                {i === 0 ? 'Aprovado' : 'Enviado'}
              </Pill>
            </div>
          ))
        : null}
    </div>
  );
};

/* ------------------------------ SIMPLIFICAR ------------------------------ */

const STEPS = [
  {t: 'Receber pedido por e-mail', keep: true},
  {t: 'Copiar para planilha', keep: false},
  {t: 'Conferir estoque manualmente', keep: false},
  {t: 'Validar pedido', keep: true},
  {t: 'Pedir aprovação por mensagem', keep: false},
  {t: 'Redigitar no financeiro', keep: false},
  {t: 'Faturar', keep: true},
  {t: 'Avisar cliente por telefone', keep: false},
  {t: 'Entregar', keep: true},
];

/** A tangled 9-step process becomes a clean 4-step flow. k: 0 → 1. */
export const ProcessFlow: React.FC<{w: number; h: number; k: number; vertical: boolean}> = ({w, h, k, vertical}) => {
  const nodeW = vertical ? 380 : 330;
  const nodeH = 74;
  // messy positions (deterministic scatter)
  const messy = STEPS.map((_, i) => ({x: 60 + hash01(i, 41) * (w - nodeW - 120), y: 110 + hash01(i, 42) * (h - nodeH - 170)}));
  const kept = STEPS.map((s, i) => (s.keep ? STEPS.slice(0, i + 1).filter((x) => x.keep).length - 1 : -1));
  const clean = kept.map((j) =>
    vertical ? {x: (w - nodeW) / 2, y: 140 + j * ((h - 220) / 3.6)} : {x: 50 + j * ((w - nodeW - 100) / 3), y: h / 2 - nodeH / 2 + 20},
  );
  const e = EASE.dolly(k);
  const pos = STEPS.map((s, i) => (s.keep ? {x: lerp(messy[i].x, clean[i].x, e), y: lerp(messy[i].y, clean[i].y, e)} : messy[i]));
  const fade = (i: number) => (STEPS[i].keep ? 1 : 1 - clamp(k * 2.2 - hash01(i, 5) * 0.6));
  const center = (i: number) => ({x: pos[i].x + nodeW / 2, y: pos[i].y + nodeH / 2});
  const keptIdx = STEPS.map((s, i) => (s.keep ? i : -1)).filter((i) => i >= 0);
  return (
    <div style={{...glass({radius: 26, tint: 0.9}), width: w, height: h}}>
      <div style={{position: 'absolute', left: 30, top: 26, display: 'flex', alignItems: 'center', gap: 12}}>
        <Icon name="repeat" size={20} color={COLORS.accentSoft} />
        <Label size={18} color={COLORS.white} weight={600}>
          Fluxo de pedidos
        </Label>
        <Pill size={12} color={k > 0.6 ? COLORS.success : COLORS.warning}>
          {k > 0.6 ? '4 etapas' : '9 etapas'}
        </Pill>
      </div>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {/* tangled connectors */}
        {STEPS.slice(0, -1).map((_, i) => {
          const a = center(i);
          const b = center(i + 1);
          const o = (1 - clamp(k * 2)) * 0.5;
          return <path key={i} d={`M${a.x},${a.y} C${a.x + 200},${a.y - 120} ${b.x - 200},${b.y + 140} ${b.x},${b.y}`} stroke="rgba(255,255,255,0.5)" strokeOpacity={o} strokeDasharray="6 8" fill="none" strokeWidth={2} />;
        })}
        {/* efficient connectors */}
        {keptIdx.slice(0, -1).map((i, j) => {
          const a = center(i);
          const b = center(keptIdx[j + 1]);
          const kk = clamp((k - 0.55) / 0.35 - j * 0.15);
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={COLORS.accent} strokeWidth={3} strokeDasharray={len} strokeDashoffset={len * (1 - kk)} />;
        })}
      </svg>
      {STEPS.map((s, i) => {
        const o = fade(i);
        if (o <= 0.01) return null;
        return (
          <div
            key={i}
            style={{
              ...glass({radius: 16, tint: 0.7}),
              position: 'absolute',
              left: pos[i].x,
              top: pos[i].y,
              width: nodeW,
              height: nodeH,
              opacity: o,
              transform: `scale(${s.keep ? 1 : 0.9 + 0.1 * o}) rotate(${s.keep ? (1 - e) * (hash01(i, 3) - 0.5) * 12 : (hash01(i, 3) - 0.5) * 12}deg)`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '0 18px',
              boxSizing: 'border-box',
              boxShadow: s.keep && k > 0.6 ? `inset 0 0 0 1.5px ${COLORS.accent}99, 0 20px 50px rgba(0,0,0,0.5)` : glass().boxShadow,
            }}
          >
            <div style={{width: 32, height: 32, borderRadius: 10, background: s.keep && k > 0.6 ? COLORS.accent : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <Label size={14} color="#fff" weight={700}>
                {s.keep && k > 0.6 ? kept[i] + 1 : i + 1}
              </Label>
            </div>
            <Label size={17} color={COLORS.white} weight={500}>
              {s.t}
            </Label>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------ CENTRALIZAR ------------------------------ */

const SOURCES: Array<{n: string; i: IconName; d: string}> = [
  {n: 'Clientes', i: 'users', d: '1.284 cadastros'},
  {n: 'Vendas', i: 'cart', d: '48 pedidos hoje'},
  {n: 'Estoque', i: 'box', d: '9.730 itens'},
  {n: 'Financeiro', i: 'wallet', d: 'fluxo do mês'},
];

/** Four scattered sources converge into one integrated view. k: 0 → 1. */
export const Centralize: React.FC<{w: number; h: number; k: number; t: number; vertical: boolean}> = ({w, h, k, t, vertical}) => {
  const cw = 300;
  const ch = 96;
  const hub = {w: vertical ? 620 : 640, h: vertical ? 520 : 470};
  const hx = w / 2;
  const hy = h / 2 + (vertical ? 90 : 40);
  const start = vertical
    ? [
        {x: 40, y: 40},
        {x: w - cw - 40, y: 40},
        {x: 40, y: h - ch - 40},
        {x: w - cw - 40, y: h - ch - 40},
      ]
    : [
        {x: 30, y: 60},
        {x: 30, y: h - ch - 60},
        {x: w - cw - 30, y: 60},
        {x: w - cw - 30, y: h - ch - 60},
      ];
  const e = EASE.dolly(clamp((k - 0.15) / 0.6));
  const hubIn = EASE.out(clamp((k - 0.35) / 0.4));
  return (
    <div style={{width: w, height: h, position: 'relative'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {start.map((s, i) => {
          const a = {x: s.x + cw / 2, y: s.y + ch / 2};
          const d = `M${a.x},${a.y} Q${(a.x + hx) / 2},${a.y} ${hx},${hy}`;
          return (
            <g key={i} opacity={clamp(k * 4) * (1 - e)}>
              <path d={d} stroke={COLORS.accent} strokeOpacity={0.5} strokeWidth={2} fill="none" />
              {[0, 1, 2].map((p) => {
                const u = ((t * 0.02 + p / 3 + i * 0.1) % 1 + 1) % 1;
                const x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * ((a.x + hx) / 2) + u * u * hx;
                const y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * a.y + u * u * hy;
                return <circle key={p} cx={x} cy={y} r={5} fill="#fff" />;
              })}
            </g>
          );
        })}
      </svg>
      {/* integrated hub */}
      <div
        style={{
          ...glass({radius: 26, tint: 0.92}),
          position: 'absolute',
          left: hx - hub.w / 2,
          top: hy - hub.h / 2,
          width: hub.w,
          height: hub.h,
          opacity: hubIn,
          transform: `scale(${0.9 + 0.1 * hubIn})`,
          padding: 26,
          boxSizing: 'border-box',
          boxShadow: `inset 0 0 0 1.5px ${COLORS.accent}77, 0 40px 120px rgba(0,0,0,0.6), 0 0 80px ${COLORS.accent}22`,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18}}>
          <Img src={staticFile(BRAND.symbol)} style={{width: 26, height: 26}} />
          <Label size={20} color={COLORS.white} weight={600}>
            Painel integrado
          </Label>
          <div style={{flex: 1}} />
          <Pill size={12} color={COLORS.success}>
            <Dot color={COLORS.success} size={6} /> sincronizado
          </Pill>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
          {SOURCES.map((s, i) => {
            const a = EASE.out(clamp((k - 0.55 - i * 0.05) / 0.25));
            return (
              <div key={s.n} style={{...glass({radius: 14, tint: 0.45}), padding: '14px 16px', opacity: a, transform: `translateY(${(1 - a) * 14}px)`}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <Icon name={s.i} size={16} color={COLORS.accentSoft} />
                  <Label size={14}>{s.n}</Label>
                </div>
                <Label size={22} color={COLORS.white} weight={600} style={{marginTop: 6}}>
                  {s.d}
                </Label>
              </div>
            );
          })}
        </div>
        <div style={{marginTop: 16, opacity: clamp((k - 0.75) / 0.2)}}>
          <AreaChart w={hub.w - 52} h={vertical ? 120 : 90} t={0} seed={3} draw={clamp((k - 0.75) / 0.25)} />
        </div>
      </div>
      {/* sources converge and dock into the hub */}
      {SOURCES.map((s, i) => {
        const a = EASE.out(clamp(k * 3 - i * 0.2));
        const x = lerp(start[i].x, hx - cw / 2, e);
        const y = lerp(start[i].y, hy - ch / 2, e);
        const o = a * (1 - clamp((e - 0.75) / 0.25));
        if (o <= 0.01) return null;
        return (
          <div
            key={s.n}
            style={{
              ...glass({radius: 18, tint: 0.85}),
              position: 'absolute',
              left: x,
              top: y,
              width: cw,
              height: ch,
              opacity: o,
              transform: `scale(${1 - e * 0.4})`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '0 20px',
              boxSizing: 'border-box',
            }}
          >
            <div style={{width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Icon name={s.i} size={22} color={COLORS.white} />
            </div>
            <div>
              <Label size={18} color={COLORS.white} weight={600}>
                {s.n}
              </Label>
              <Label size={13}>{['Planilha separada', 'Sistema antigo', 'Controle manual', 'Outra planilha'][i]}</Label>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------ AUTOMATIZAR ------------------------------ */

const AUTO_STEPS: Array<{t: string; d: string; i: IconName}> = [
  {t: 'Pedido aprovado', d: 'Gatilho', i: 'bolt'},
  {t: 'Atualizar estoque', d: 'Baixa automática', i: 'box'},
  {t: 'Gerar cobrança', d: 'Financeiro', i: 'wallet'},
  {t: 'Notificar cliente', d: 'E-mail / mensagem', i: 'mail'},
  {t: 'Atualizar relatório', d: 'Indicadores', i: 'report'},
];

/** A trigger cascades through actions; records and indicators respond. `t` frames. */
export const AutomationFlow: React.FC<{w: number; h: number; t: number; vertical: boolean}> = ({w, h, t, vertical}) => {
  const step = 22; // frames between actions
  const nodeW = vertical ? w - 120 : 300;
  const nodeH = vertical ? 92 : 150;
  const flowH = vertical ? h * 0.6 : 190;
  const pos = AUTO_STEPS.map((_, i) =>
    vertical ? {x: 60, y: 90 + i * ((flowH - nodeH) / 4)} : {x: 40 + i * ((w - 80 - nodeW) / 4), y: 100},
  );
  const done = (i: number) => clamp((t - 14 - i * step) / 10);
  const completed = AUTO_STEPS.filter((_, i) => done(i) >= 1).length;
  const counter = 1240 + completed * 1 + (completed === AUTO_STEPS.length ? 0 : 0);
  return (
    <div style={{...glass({radius: 26, tint: 0.92}), width: w, height: h}}>
      <div style={{position: 'absolute', left: 30, top: 26, right: 30, display: 'flex', alignItems: 'center', gap: 12}}>
        <Icon name="bolt" size={20} color={COLORS.accentSoft} />
        <Label size={18} color={COLORS.white} weight={600}>
          Automação · Pedido → Entrega
        </Label>
        <div style={{flex: 1}} />
        <Pill size={12} color={completed === AUTO_STEPS.length ? COLORS.success : COLORS.accentSoft}>
          <Dot color={completed === AUTO_STEPS.length ? COLORS.success : COLORS.accent} size={6} glow />
          {completed === AUTO_STEPS.length ? 'concluído' : 'executando'}
        </Pill>
      </div>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {AUTO_STEPS.slice(0, -1).map((_, i) => {
          const a = vertical ? {x: 60 + 34, y: pos[i].y + nodeH} : {x: pos[i].x + nodeW, y: pos[i].y + nodeH / 2};
          const b = vertical ? {x: 60 + 34, y: pos[i + 1].y} : {x: pos[i + 1].x, y: pos[i + 1].y + nodeH / 2};
          const k = clamp((t - 14 - i * step - 6) / (step - 6));
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,255,255,0.12)" strokeWidth={3} />
              <line x1={a.x} y1={a.y} x2={lerp(a.x, b.x, k)} y2={lerp(a.y, b.y, k)} stroke={COLORS.accent} strokeWidth={3} />
              {k > 0 && k < 1 ? <circle cx={lerp(a.x, b.x, k)} cy={lerp(a.y, b.y, k)} r={7} fill="#fff" style={{filter: `drop-shadow(0 0 8px ${COLORS.accent})`}} /> : null}
            </g>
          );
        })}
      </svg>
      {AUTO_STEPS.map((s, i) => {
        const d = done(i);
        const active = d > 0 && d < 1;
        return (
          <div
            key={s.t}
            style={{
              ...glass({radius: 18, tint: 0.7}),
              position: 'absolute',
              left: pos[i].x,
              top: pos[i].y,
              width: nodeW,
              height: nodeH,
              boxSizing: 'border-box',
              padding: vertical ? '0 22px' : 20,
              display: 'flex',
              flexDirection: vertical ? 'row' : 'column',
              alignItems: vertical ? 'center' : 'flex-start',
              gap: 14,
              boxShadow: d > 0 ? `inset 0 0 0 1.5px ${COLORS.accent}${active ? 'ff' : '88'}, 0 0 ${active ? 50 : 0}px ${COLORS.accent}55, 0 20px 50px rgba(0,0,0,0.5)` : glass().boxShadow,
            }}
          >
            <div style={{width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: d >= 1 ? COLORS.accent : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Icon name={d >= 1 ? 'check' : s.i} size={24} color="#fff" />
            </div>
            <div>
              <Label size={18} color={COLORS.white} weight={600}>
                {s.t}
              </Label>
              <Label size={14}>{d >= 1 ? 'Concluído automaticamente' : s.d}</Label>
            </div>
          </div>
        );
      })}
      {/* records + indicator respond */}
      <div style={{position: 'absolute', left: 30, right: 30, bottom: 30, display: 'flex', gap: 16, flexDirection: 'row', height: vertical ? h - flowH - 130 : h - 330}}>
        <div style={{...glass({radius: 16, tint: 0.45}), flex: 1.6, padding: '16px 20px'}}>
          <Label size={14} caps style={{marginBottom: 10}}>
            Registros
          </Label>
          {['Estoque · Kit Instalação −2 un', 'Cobrança #C-5581 gerada', 'Cliente notificado', 'Relatório atualizado'].map((r, i) => {
            const a = done(i + 1);
            return (
              <div key={r} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', opacity: 0.25 + 0.75 * a}}>
                <Dot color={a >= 1 ? COLORS.success : 'rgba(255,255,255,0.3)'} size={8} />
                <Label size={15} color={COLORS.white}>
                  {r}
                </Label>
              </div>
            );
          })}
        </div>
        <div style={{...glass({radius: 16, tint: 0.45}), flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          <Label size={14}>Pedidos processados</Label>
          <Label size={44} color={COLORS.white} weight={600} style={{letterSpacing: '-0.03em'}}>
            {counter.toLocaleString('pt-BR')}
          </Label>
          <Label size={13} color={COLORS.success} weight={600}>
            ▲ sem intervenção manual
          </Label>
        </div>
      </div>
    </div>
  );
};
