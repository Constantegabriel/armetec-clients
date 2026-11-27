import React from 'react';
import {COLORS, FONTS} from '../config/theme';
import {hash01} from '../utils/random';
import {Icon, Label, glass} from './ui';

/**
 * A detailed, believable spreadsheet (fictional demo data). `filled` = number of
 * cells already typed (row-major); the active cell shows a caret.
 */
const CLIENTS = [
  'Atlas Comércio',
  'Grupo Ventura',
  'Lumen Engenharia',
  'Nobre Distribuidora',
  'Prisma Saúde',
  'Rota Sul Logística',
  'Casa Aurora',
  'Vértice Obras',
  'Mar Azul Pescados',
  'Orion Têxtil',
  'Selo Verde Agro',
  'Pátio Móveis',
];
const PRODUCTS = ['Kit Instalação', 'Serviço Mensal', 'Lote 240un', 'Manutenção', 'Licença Anual', 'Consultoria', 'Peças Reposição'];
const STATUS = [
  {t: 'Pendente', c: COLORS.warning},
  {t: 'Conferir', c: COLORS.accentSoft},
  {t: 'OK', c: COLORS.success},
  {t: 'Atrasado', c: COLORS.danger},
];

export const COLS = [
  {k: 'Data', w: 0.12},
  {k: 'Cliente', w: 0.22},
  {k: 'Pedido', w: 0.1},
  {k: 'Produto', w: 0.18},
  {k: 'Qtd', w: 0.07},
  {k: 'Valor', w: 0.14},
  {k: 'Status', w: 0.17},
];

const cell = (r: number, c: number, seed: number): {text: string; pill?: string} => {
  const h = (k: number) => hash01(r * 31 + c * 7 + k, seed);
  switch (c) {
    case 0:
      return {text: `${String(1 + Math.floor(h(1) * 28)).padStart(2, '0')}/${String(1 + ((r + seed) % 12)).padStart(2, '0')}`};
    case 1:
      return {text: CLIENTS[Math.floor(h(2) * CLIENTS.length)]};
    case 2:
      return {text: `#${4100 + r * 7 + seed * 3}`};
    case 3:
      return {text: PRODUCTS[Math.floor(h(3) * PRODUCTS.length)]};
    case 4:
      return {text: String(1 + Math.floor(h(4) * 40))};
    case 5:
      return {text: `R$ ${(400 + Math.floor(h(5) * 18000)).toLocaleString('pt-BR')},${String(Math.floor(h(6) * 99)).padStart(2, '0')}`};
    default: {
      const s = STATUS[Math.floor(h(7) * STATUS.length)];
      return {text: s.t, pill: s.c};
    }
  }
};

export const Spreadsheet: React.FC<{
  w: number;
  h: number;
  rows?: number;
  filled: number;
  seed?: number;
  title?: string;
  caret?: boolean;
  /** highlight a whole column (e.g. scanning) */
  scanCol?: number;
}> = ({w, h, rows = 26, filled, seed = 0, title = 'Controle_Pedidos_FINAL_v7.xlsx', caret = true, scanCol}) => {
  const headerH = 120;
  const rowH = (h - headerH - 44) / (rows + 1);
  const rowNumW = 56;
  const gridW = w - rowNumW;
  const total = rows * COLS.length;
  const active = Math.min(total - 1, Math.floor(filled));
  const partial = filled - Math.floor(filled);
  return (
    <div style={{...glass({radius: 22, tint: 0.85}), width: w, height: h}}>
      {/* title bar */}
      <div style={{height: 64, display: 'flex', alignItems: 'center', padding: '0 26px', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.07)'}}>
        <div style={{width: 30, height: 30, borderRadius: 8, background: 'rgba(127,209,168,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Icon name="grid" size={18} color={COLORS.success} />
        </div>
        <Label size={21} color={COLORS.white} weight={600}>
          {title}
        </Label>
        <div style={{flex: 1}} />
        <Label size={16}>Salvo há 1 min</Label>
      </div>
      {/* formula bar */}
      <div style={{height: 56, display: 'flex', alignItems: 'center', padding: '0 26px', gap: 18, borderBottom: '1px solid rgba(255,255,255,0.07)'}}>
        <Label size={17} color={COLORS.accentSoft} weight={600} style={{fontFamily: FONTS.mono}}>
          {String.fromCharCode(65 + (active % COLS.length))}
          {Math.floor(active / COLS.length) + 2}
        </Label>
        <div style={{width: 1, height: 22, background: 'rgba(255,255,255,0.12)'}} />
        <Label size={17} color={COLORS.gray} style={{fontFamily: FONTS.mono}}>
          fx  =SOMA(F2:F{rows + 1})
        </Label>
      </div>
      {/* column headers */}
      <div style={{display: 'flex', height: 44, marginLeft: rowNumW, borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
        {COLS.map((c, i) => (
          <div
            key={c.k}
            style={{
              width: gridW * c.w,
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              boxSizing: 'border-box',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              background: scanCol === i ? 'rgba(81,112,255,0.12)' : undefined,
            }}
          >
            <Label size={15} caps weight={600} color={COLORS.gray}>
              {String.fromCharCode(65 + i)} · {c.k}
            </Label>
          </div>
        ))}
      </div>
      {/* rows */}
      {Array.from({length: rows}, (_, r) => (
        <div key={r} style={{display: 'flex', height: rowH, borderBottom: '1px solid rgba(255,255,255,0.045)'}}>
          <div style={{width: rowNumW, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Label size={14} color={COLORS.dim}>
              {r + 2}
            </Label>
          </div>
          {COLS.map((c, ci) => {
            const idx = r * COLS.length + ci;
            const v = cell(r, ci, seed);
            const isActive = idx === active && caret && filled < total;
            const shown = idx < active ? v.text : isActive ? v.text.slice(0, Math.ceil(v.text.length * partial)) : '';
            return (
              <div
                key={ci}
                style={{
                  width: gridW * c.w,
                  boxSizing: 'border-box',
                  padding: '0 14px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRight: '1px solid rgba(255,255,255,0.045)',
                  position: 'relative',
                  justifyContent: ci === 4 || ci === 5 ? 'flex-end' : 'flex-start',
                  background: scanCol === ci ? 'rgba(81,112,255,0.06)' : undefined,
                }}
              >
                {isActive ? (
                  <div style={{position: 'absolute', inset: 1, border: `2px solid ${COLORS.accent}`, borderRadius: 3, boxShadow: `0 0 18px ${COLORS.accent}55`}} />
                ) : null}
                {v.pill && idx < active ? (
                  <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <div style={{width: 8, height: 8, borderRadius: 8, background: v.pill}} />
                    <Label size={17} color={COLORS.white} weight={500}>
                      {v.text}
                    </Label>
                  </div>
                ) : (
                  <Label size={17} color={ci === 1 ? COLORS.white : '#d4d4d8'} weight={ci === 1 ? 500 : 400}>
                    {shown}
                    {isActive ? <span style={{display: 'inline-block', width: 2, height: 20, background: COLORS.white, marginLeft: 2, verticalAlign: 'middle'}} /> : null}
                  </Label>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
