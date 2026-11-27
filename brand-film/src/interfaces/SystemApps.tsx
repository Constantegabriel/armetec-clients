import React from 'react';
import {Img, staticFile} from 'remotion';
import {BRAND} from '../config/brand';
import {COLORS, FONTS} from '../config/theme';
import {EASE} from '../utils/easing';
import {clamp} from '../utils/math';
import {fmt} from './DailyReport';
import {AreaChart, Sidebar} from './Platform';
import {SCREEN, StatusBar} from './PhoneScreens';
import {Icon, Label, Pill, glass, type IconName} from './ui';

/**
 * One custom system, three layouts (phone / tablet / laptop) driven by the same
 * `SyncState`, so a sale registered on the laptop visibly updates stock,
 * notifies the phone and moves the tablet's financial indicators.
 * Installed like an app: full screen, no browser chrome. Data is fictional.
 */
export type SyncState = {
  /** 0 → 1: the "Registrar venda" press and row insertion on the laptop */
  sale: number;
  /** 0 → 1: stock decrement */
  stock: number;
  /** 0 → 1: phone banner */
  notify: number;
  /** 0 → 1: tablet indicators update */
  finance: number;
  frame: number;
};

const SALE = {client: 'Casa Aurora', product: 'Kit Instalação', qty: 6, total: 1280, id: 'PV-4318'};
const REVENUE0 = 4850;
const STOCK0 = 42;

const Brand: React.FC<{size?: number}> = ({size = 26}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
    <Img src={staticFile(BRAND.symbol)} style={{width: size, height: size}} />
    <Label size={size * 0.66} color={COLORS.white} weight={700}>
      Gestão
    </Label>
  </div>
);

const Kpi: React.FC<{label: string; value: string; delta?: string; icon: IconName; hot?: number; big?: number}> = ({label, value, delta, icon, hot = 0, big = 1}) => (
  <div style={{...glass({radius: 16 * big, tint: 0.55}), padding: `${14 * big}px ${16 * big}px`, boxShadow: `inset 0 0 0 ${1 + hot}px rgba(81,112,255,${0.08 + hot * 0.6}), 0 0 ${hot * 40}px rgba(81,112,255,${hot * 0.3})`}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
      <Icon name={icon} size={15 * big} color={COLORS.accentSoft} />
      <Label size={13 * big}>{label}</Label>
    </div>
    <div style={{fontFamily: FONTS.display, fontSize: 28 * big, fontWeight: 600, color: COLORS.white, marginTop: 6 * big, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums'}}>{value}</div>
    {delta ? (
      <Label size={12 * big} color={COLORS.success} weight={600} style={{marginTop: 2}}>
        {delta}
      </Label>
    ) : null}
  </div>
);

/* ----------------------------------- phone ---------------------------------- */
export const AppPhone: React.FC<{s: SyncState; open: number}> = ({s, open}) => {
  const revenue = REVENUE0 + SALE.total * EASE.out(s.finance);
  const items = [
    {t: 'Venda registrada', d: `${SALE.client} · ${fmt(SALE.total, 'brl')}`, i: 'cart' as IconName, on: s.sale},
    {t: 'Serviço concluído', d: 'OS-1188 · Instalação', i: 'tasks' as IconName, on: 1},
    {t: 'Pagamento recebido', d: 'Grupo Ventura', i: 'wallet' as IconName, on: 1},
    {t: 'Novo cliente', d: 'Casa Aurora', i: 'users' as IconName, on: 1},
  ];
  const c = EASE.out(clamp(open));
  return (
    <div style={{width: SCREEN.w, height: SCREEN.h, background: 'linear-gradient(180deg,#0c0d12,#08080a)', fontFamily: FONTS.sans, color: COLORS.white, position: 'relative'}}>
      <StatusBar time="20:02" />
      <div style={{padding: '6px 18px', opacity: c, transform: `translateY(${(1 - c) * 24}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <Brand />
          <Icon name="bell" size={22} color={COLORS.white} />
        </div>
        <Label size={14} style={{marginTop: 16}}>
          Visão geral · hoje
        </Label>
        <div style={{fontFamily: FONTS.display, fontSize: 40, fontWeight: 650, letterSpacing: '-0.03em', marginTop: 2, fontVariantNumeric: 'tabular-nums'}}>{fmt(revenue, 'brl')}</div>
        <Label size={13} color={COLORS.success} weight={600}>
          ▲ faturamento do dia
        </Label>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16}}>
          <Kpi label="Vendas" value={String(23 + (s.sale >= 1 ? 1 : 0))} icon="cart" hot={s.sale > 0 && s.sale < 1 ? 1 : 0} />
          <Kpi label="Estoque crítico" value="3 itens" icon="box" />
        </div>
        <Label size={14} weight={600} color={COLORS.white} style={{marginTop: 18, marginBottom: 6}}>
          Atividade recente
        </Label>
        {items.map((it, i) => {
          const a = i === 0 ? EASE.out(clamp(it.on)) : 1;
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: a, height: i === 0 ? 52 * a : 52, overflow: 'hidden'}}>
              <div style={{width: 34, height: 34, borderRadius: 10, background: 'rgba(81,112,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Icon name={it.i} size={17} color={COLORS.accentSoft} />
              </div>
              <div>
                <Label size={15} color={COLORS.white} weight={600}>
                  {it.t}
                </Label>
                <Label size={12}>{it.d}</Label>
              </div>
            </div>
          );
        })}
      </div>
      {/* tab bar */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 78, background: 'rgba(20,20,24,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 12}}>
        {(['grid', 'cart', 'box', 'wallet', 'report'] as IconName[]).map((n, i) => (
          <Icon key={n} name={n} size={24} color={i === 0 ? COLORS.accent : COLORS.gray} />
        ))}
      </div>
      {/* sale notification banner */}
      {s.notify > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 10,
            right: 10,
            top: 52,
            padding: '14px 14px',
            borderRadius: 20,
            background: 'rgba(36,38,48,0.96)',
            boxShadow: '0 18px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(142,160,255,0.25)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            transform: `translateY(${(1 - EASE.out(clamp(s.notify * 1.5))) * -90}px)`,
          }}
        >
          <div style={{width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(150deg,#1b2350,#0c0f1f)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Img src={staticFile(BRAND.symbol)} style={{width: 26, height: 26}} />
          </div>
          <div style={{flex: 1}}>
            <Label size={14} color={COLORS.white} weight={700}>
              Nova venda registrada
            </Label>
            <Label size={13} color="#c4c4cc">
              {SALE.client} · {fmt(SALE.total, 'brl')}
            </Label>
          </div>
          <Label size={12}>agora</Label>
        </div>
      ) : null}
    </div>
  );
};

/* ----------------------------------- tablet --------------------------------- */
export const AppTablet: React.FC<{s: SyncState; w: number; h: number}> = ({s, w, h}) => {
  const k = EASE.out(s.finance);
  const revenue = REVENUE0 + SALE.total * k;
  return (
    <div style={{width: w, height: h, background: 'linear-gradient(180deg,#0c0d12,#08080a)', fontFamily: FONTS.sans, color: COLORS.white, padding: 30, boxSizing: 'border-box'}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <Brand size={30} />
        <Pill size={13} color={COLORS.success}>
          <span style={{width: 7, height: 7, borderRadius: 7, background: COLORS.success}} />
          sincronizado
        </Pill>
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 20}}>
        <Label size={26} color={COLORS.white} weight={600}>
          Financeiro
        </Label>
        <Label size={16}>hoje</Label>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 16}}>
        <Kpi label="Faturamento" value={fmt(revenue, 'brl')} delta={k > 0.02 ? `+ ${fmt(SALE.total * k, 'brl')}` : undefined} icon="wallet" hot={k > 0 && k < 1 ? 1 : k >= 1 ? 0.4 : 0} />
        <Kpi label="Vendas" value={String(23 + (k > 0.3 ? 1 : 0))} icon="cart" />
        <Kpi label="A receber" value={fmt(12400 + SALE.total * k, 'brl')} icon="report" />
        <Kpi label="Despesas" value={fmt(620, 'brl')} icon="chart" />
      </div>
      <div style={{...glass({radius: 18, tint: 0.45}), marginTop: 16, padding: 20}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 10}}>
          <Label size={16} color={COLORS.white} weight={600}>
            Faturamento ao longo do dia
          </Label>
          <Label size={13}>atualizado {k > 0 ? 'agora' : 'há 2 min'}</Label>
        </div>
        <AreaChart w={w - 100} h={h - 420} t={0} seed={5} draw={0.86 + 0.14 * k} />
      </div>
    </div>
  );
};

/* ----------------------------------- laptop --------------------------------- */
const ROWS = [
  {id: 'PV-4317', c: 'Prisma Saúde', v: 640, st: 'Faturado'},
  {id: 'PV-4316', c: 'Grupo Ventura', v: 1200, st: 'Pago'},
  {id: 'PV-4315', c: 'Atlas Comércio', v: 320, st: 'Faturado'},
];

export const AppLaptop: React.FC<{s: SyncState; w: number; h: number}> = ({s, w, h}) => {
  const ins = EASE.out(clamp((s.sale - 0.35) / 0.65));
  const press = s.sale > 0.1 && s.sale < 0.35 ? Math.sin(((s.sale - 0.1) / 0.25) * Math.PI) : 0;
  const stock = Math.round(STOCK0 - SALE.qty * EASE.inOut(s.stock));
  return (
    <div style={{width: w, height: h, display: 'flex', background: 'linear-gradient(180deg,#0e0f14,#09090b)', fontFamily: FONTS.sans, color: COLORS.white}}>
      <Sidebar active={2} h={h} />
      <div style={{flex: 1, padding: 30, display: 'flex', gap: 24}}>
        <div style={{...glass({radius: 20, tint: 0.55}), width: 430, padding: 26}}>
          <Label size={24} color={COLORS.white} weight={600}>
            Nova venda
          </Label>
          {[
            ['Cliente', SALE.client],
            ['Produto', SALE.product],
            ['Quantidade', String(SALE.qty)],
            ['Total', fmt(SALE.total, 'brl')],
          ].map(([k, v]) => (
            <div key={k} style={{marginTop: 18}}>
              <Label size={14}>{k}</Label>
              <div style={{marginTop: 6, height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 18}}>{v}</div>
            </div>
          ))}
          <div style={{marginTop: 24, height: 56, borderRadius: 14, background: COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, transform: `scale(${1 - press * 0.05})`, boxShadow: `0 10px 30px ${COLORS.accent}55`}}>
            {s.sale >= 0.35 ? '✓ Venda registrada' : 'Registrar venda'}
          </div>
          <div style={{marginTop: 18, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: s.stock > 0 && s.stock < 1 ? 'rgba(81,112,255,0.14)' : 'rgba(255,255,255,0.04)'}}>
            <Icon name="box" size={18} color={COLORS.accentSoft} />
            <Label size={15} color="#d4d4d8" style={{flex: 1}}>
              Estoque · {SALE.product}
            </Label>
            <Label size={17} color={COLORS.white} weight={700} style={{fontVariantNumeric: 'tabular-nums'}}>
              {stock} un
            </Label>
          </div>
        </div>
        <div style={{...glass({radius: 20, tint: 0.45}), flex: 1, padding: 26}}>
          <Label size={20} color={COLORS.white} weight={600} style={{marginBottom: 14}}>
            Vendas de hoje
          </Label>
          <div style={{display: 'flex', padding: '0 6px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)'}}>
            {['Pedido', 'Cliente', 'Valor', 'Status'].map((x, i) => (
              <Label key={x} size={12} caps style={{flex: i === 1 ? 2 : 1}}>
                {x}
              </Label>
            ))}
          </div>
          {[{id: SALE.id, c: SALE.client, v: SALE.total, st: 'Novo'}, ...ROWS].map((r, i) => {
            const isNew = i === 0;
            const a = isNew ? ins : 1;
            return (
              <div key={r.id} style={{display: 'flex', alignItems: 'center', padding: '0 6px', height: isNew ? 52 * a : 52, overflow: 'hidden', opacity: a, background: isNew ? `rgba(81,112,255,${0.16 * (1 - clamp((s.sale - 0.8) * 2)) + 0.05})` : undefined, borderRadius: 10, borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                <Label size={15} color="#d4d4d8" style={{flex: 1}}>
                  {r.id}
                </Label>
                <Label size={15} color={COLORS.white} weight={500} style={{flex: 2}}>
                  {r.c}
                </Label>
                <Label size={15} color={COLORS.white} style={{flex: 1}}>
                  {fmt(r.v, 'brl')}
                </Label>
                <div style={{flex: 1}}>
                  <Pill size={12} color={isNew ? COLORS.accentSoft : COLORS.success}>
                    {r.st}
                  </Pill>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
