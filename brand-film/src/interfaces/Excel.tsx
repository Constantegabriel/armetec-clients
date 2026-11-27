import React from 'react';
import {FONTS} from '../config/theme';

/**
 * A recognisable spreadsheet application (dark mode): title bar, ribbon tabs and
 * tools, name box + formula bar, lettered columns, numbered rows, gridlines,
 * selected cell with fill handle, marching-ants copy range, sheet tabs and
 * status bar. Not a copy of any product's branding — the *structure* reads as
 * "planilha" instantly. All data is fictional.
 */

export const XL = {
  green: '#33A36B',
  greenSoft: 'rgba(51,163,107,0.16)',
  bg: '#1F1F1F',
  chrome: '#2B2B2B',
  chrome2: '#252526',
  grid: '#3A3A3A',
  header: '#323232',
  text: '#E6E6E6',
  dim: '#9A9A9A',
};

export type XlCol = {key: string; w: number; align?: 'left' | 'right'};
export const SALES_COLS: XlCol[] = [
  {key: 'Data', w: 120},
  {key: 'Cliente', w: 250},
  {key: 'Nº Pedido', w: 120},
  {key: 'Produto', w: 220},
  {key: 'Qtd', w: 70, align: 'right'},
  {key: 'Valor Unit.', w: 150, align: 'right'},
  {key: 'Total', w: 160, align: 'right'},
  {key: 'Vendedor', w: 150},
];

const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

const CLIENTS = ['Atlas Comércio', 'Grupo Ventura', 'Lumen Engenharia', 'Nobre Distribuidora', 'Prisma Saúde', 'Rota Sul Logística', 'Casa Aurora', 'Vértice Obras', 'Orion Têxtil', 'Selo Verde Agro', 'Pátio Móveis', 'Mar Azul Pescados'];
const PRODUCTS: Array<[string, number]> = [
  ['Kit Instalação', 189.9],
  ['Manutenção Mensal', 450],
  ['Peças Reposição', 72.5],
  ['Licença Anual', 1290],
  ['Consultoria (h)', 220],
  ['Lote 240 un', 980],
];
const SELLERS = ['Carla M.', 'Rafael S.', 'Juliana A.', 'Diego P.'];

/** Deterministic fictional sales row. */
export const salesRow = (r: number, seed = 0): string[] => {
  const k = (r * 7 + seed * 13) % 97;
  const [prod, unit] = PRODUCTS[(k + r) % PRODUCTS.length];
  const qty = 1 + ((k * 3) % 12);
  return [
    `${String(2 + ((r * 3 + seed) % 27)).padStart(2, '0')}/03/2026`,
    CLIENTS[(k + seed) % CLIENTS.length],
    `PV-${4180 + r * 3 + seed * 41}`,
    prod,
    String(qty),
    brl(unit),
    brl(unit * qty),
    SELLERS[(r + seed) % SELLERS.length],
  ];
};

export type XlState = {
  /** fully-filled data rows (row index 0-based within data) */
  filledRows: number;
  /** cell being typed in the next row: column index + characters typed */
  typingCol?: number;
  typingChars?: number;
  /** selected cell (data row, col) — defaults to the typing cell */
  active?: [number, number];
  /** copy range [r0,c0,r1,c1] with marching ants */
  copy?: [number, number, number, number] | null;
  /** highlighted (pasted) range flash 0..1 */
  paste?: {range: [number, number, number, number]; flash: number} | null;
  frame: number;
};

const Tool: React.FC<{w?: number; label?: string; strong?: boolean}> = ({w = 34, label, strong}) => (
  <div
    style={{
      width: w,
      height: 30,
      borderRadius: 6,
      background: 'rgba(255,255,255,0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONTS.sans,
      fontSize: 14,
      fontWeight: strong ? 700 : 500,
      color: XL.text,
    }}
  >
    {label}
  </div>
);

export const ExcelWindow: React.FC<{
  w: number;
  h: number;
  file: string;
  cols?: XlCol[];
  seed?: number;
  rows?: number;
  state: XlState;
  tabs?: string[];
  activeTab?: number;
}> = ({w, h, file, cols = SALES_COLS, seed = 0, rows = 22, state, tabs = ['Vendas', 'Clientes', 'Estoque', 'Financeiro'], activeTab = 0}) => {
  const rowH = 34;
  const rowHeadW = 52;
  const colX: number[] = [];
  cols.reduce((x, c) => {
    colX.push(x);
    return x + c.w;
  }, 0);
  const typingRow = state.filledRows;
  const active = state.active ?? [typingRow, state.typingCol ?? 0];
  const activeLetter = String.fromCharCode(65 + active[1]);
  const activeValue = active[0] < 0 ? cols[active[1]]?.key ?? '' : salesRow(active[0], seed)[active[1]] ?? '';
  const typedValue =
    state.typingCol !== undefined && active[0] === typingRow && active[1] === state.typingCol
      ? activeValue.slice(0, Math.max(0, Math.floor(state.typingChars ?? 0)))
      : activeValue;
  const caretOn = Math.floor(state.frame / 16) % 2 === 0;
  const inRange = (r: number, c: number, rg?: [number, number, number, number] | null) => !!rg && r >= rg[0] && r <= rg[2] && c >= rg[1] && c <= rg[3];
  const rect = (rg: [number, number, number, number]) => ({
    left: rowHeadW + colX[rg[1]],
    top: 30 + rowH * (rg[0] + 1),
    width: colX[rg[3]] + cols[rg[3]].w - colX[rg[1]],
    height: rowH * (rg[2] - rg[0] + 1),
  });
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 14,
        overflow: 'hidden',
        background: XL.bg,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.09), 0 50px 120px rgba(0,0,0,0.65), 0 12px 30px rgba(0,0,0,0.4)',
        fontFamily: FONTS.sans,
        color: XL.text,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* title bar */}
      <div style={{height: 46, background: XL.green, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 14}}>
        <div style={{width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.92)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: 4, boxSizing: 'border-box'}}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{background: XL.green, borderRadius: 1}} />
          ))}
        </div>
        <div style={{fontSize: 16, fontWeight: 600, color: '#fff'}}>{file}</div>
        <div style={{fontSize: 14, color: 'rgba(255,255,255,0.75)'}}>— Salvo</div>
        <div style={{flex: 1}} />
        {['—', '▢', '✕'].map((x) => (
          <div key={x} style={{width: 34, textAlign: 'center', color: '#fff', fontSize: 15}}>
            {x}
          </div>
        ))}
      </div>
      {/* ribbon tabs */}
      <div style={{height: 38, background: XL.chrome, display: 'flex', alignItems: 'flex-end', gap: 26, padding: '0 22px', fontSize: 15, color: XL.dim}}>
        {['Arquivo', 'Página Inicial', 'Inserir', 'Layout da Página', 'Fórmulas', 'Dados', 'Revisão', 'Exibir'].map((t, i) => (
          <div key={t} style={{paddingBottom: 8, color: i === 1 ? '#fff' : XL.dim, borderBottom: i === 1 ? `3px solid ${XL.green}` : '3px solid transparent', fontWeight: i === 1 ? 600 : 400}}>
            {t}
          </div>
        ))}
      </div>
      {/* ribbon tools */}
      <div style={{height: 64, background: XL.chrome, borderBottom: `1px solid ${XL.grid}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px'}}>
        <Tool w={62} label="Colar" strong />
        <Tool label="✂" />
        <Tool label="⧉" />
        <div style={{width: 1, height: 36, background: XL.grid, margin: '0 6px'}} />
        <Tool w={120} label="Calibri" />
        <Tool w={44} label="11" />
        <Tool label="N" strong />
        <Tool label="I" />
        <Tool label="S" />
        <div style={{width: 1, height: 36, background: XL.grid, margin: '0 6px'}} />
        <Tool label="≡" />
        <Tool label="⇥" />
        <div style={{width: 1, height: 36, background: XL.grid, margin: '0 6px'}} />
        <Tool w={92} label="Moeda" />
        <Tool w={40} label="R$" strong />
        <Tool w={34} label="%" />
        <Tool w={44} label=",00" />
        <div style={{width: 1, height: 36, background: XL.grid, margin: '0 6px'}} />
        <Tool w={70} label="Σ Soma" />
        <Tool w={84} label="Classificar" />
      </div>
      {/* name box + formula bar */}
      <div style={{height: 40, background: XL.chrome2, borderBottom: `1px solid ${XL.grid}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px', fontSize: 16}}>
        <div style={{width: 84, height: 28, border: `1px solid ${XL.grid}`, borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 10, fontWeight: 600}}>
          {activeLetter}
          {active[0] + 2}
        </div>
        <div style={{color: XL.dim, letterSpacing: '0.2em'}}>✕ ✓</div>
        <div style={{fontStyle: 'italic', color: XL.dim, fontFamily: 'Georgia, serif'}}>fx</div>
        <div style={{flex: 1, height: 28, borderLeft: `1px solid ${XL.grid}`, paddingLeft: 12, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap'}}>
          {typedValue}
          {state.typingCol !== undefined && caretOn ? <span style={{width: 2, height: 18, background: '#fff', marginLeft: 2}} /> : null}
        </div>
      </div>
      {/* grid */}
      <div style={{flex: 1, position: 'relative', overflow: 'hidden', background: XL.bg}}>
        {/* column headers */}
        <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: 30, background: XL.header, display: 'flex', borderBottom: `1px solid ${XL.grid}`}}>
          <div style={{width: rowHeadW, borderRight: `1px solid ${XL.grid}`}} />
          {cols.map((c, i) => (
            <div
              key={i}
              style={{
                width: c.w,
                textAlign: 'center',
                lineHeight: '30px',
                fontSize: 14,
                color: i === active[1] ? '#fff' : XL.dim,
                background: i === active[1] ? 'rgba(51,163,107,0.25)' : undefined,
                borderRight: `1px solid ${XL.grid}`,
                borderBottom: i === active[1] ? `2px solid ${XL.green}` : undefined,
                boxSizing: 'border-box',
              }}
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        {/* rows: header row (1) + data rows */}
        {Array.from({length: rows}, (_, r) => {
          const dataRow = r - 1;
          const isHeader = r === 0;
          const values = isHeader ? cols.map((c) => c.key) : salesRow(dataRow, seed);
          return (
            <div key={r} style={{position: 'absolute', left: 0, top: 30 + rowH * r, height: rowH, display: 'flex', borderBottom: `1px solid ${XL.grid}`}}>
              <div
                style={{
                  width: rowHeadW,
                  textAlign: 'center',
                  lineHeight: `${rowH}px`,
                  fontSize: 14,
                  background: dataRow === active[0] ? 'rgba(51,163,107,0.25)' : XL.header,
                  color: dataRow === active[0] ? '#fff' : XL.dim,
                  borderRight: dataRow === active[0] ? `2px solid ${XL.green}` : `1px solid ${XL.grid}`,
                  boxSizing: 'border-box',
                }}
              >
                {r + 1}
              </div>
              {cols.map((c, ci) => {
                let text = '';
                if (isHeader || dataRow < state.filledRows || inRange(dataRow, ci, state.paste?.range)) text = values[ci];
                else if (dataRow === typingRow && state.typingCol !== undefined && ci < state.typingCol) text = values[ci];
                else if (dataRow === typingRow && ci === state.typingCol) text = values[ci].slice(0, Math.max(0, Math.floor(state.typingChars ?? 0)));
                const flash = inRange(dataRow, ci, state.paste?.range) ? state.paste!.flash : 0;
                return (
                  <div
                    key={ci}
                    style={{
                      width: c.w,
                      padding: '0 10px',
                      boxSizing: 'border-box',
                      lineHeight: `${rowH}px`,
                      fontSize: 15,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textAlign: c.align ?? 'left',
                      borderRight: `1px solid ${XL.grid}`,
                      fontWeight: isHeader ? 700 : ci === 6 ? 600 : 400,
                      color: isHeader ? '#fff' : XL.text,
                      background: isHeader ? '#2F3B34' : flash > 0 ? `rgba(51,163,107,${0.28 * flash})` : undefined,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {text}
                  </div>
                );
              })}
            </div>
          );
        })}
        {/* copy range — marching ants */}
        {state.copy ? (
          <svg style={{position: 'absolute', ...rect(state.copy), overflow: 'visible'}} width={rect(state.copy).width} height={rect(state.copy).height}>
            <rect x={1} y={1} width={rect(state.copy).width - 2} height={rect(state.copy).height - 2} fill="rgba(51,163,107,0.10)" stroke={XL.green} strokeWidth={2.5} strokeDasharray="8 6" strokeDashoffset={-state.frame * 0.8} />
          </svg>
        ) : null}
        {/* selected cell + fill handle */}
        <div
          style={{
            position: 'absolute',
            left: rowHeadW + colX[active[1]] - 1,
            top: 30 + rowH * (active[0] + 1) - 1,
            width: cols[active[1]].w + 2,
            height: rowH + 2,
            border: `2.5px solid ${XL.green}`,
            boxSizing: 'border-box',
          }}
        >
          <div style={{position: 'absolute', right: -5, bottom: -5, width: 8, height: 8, background: XL.green, border: '1.5px solid #1F1F1F'}} />
        </div>
      </div>
      {/* sheet tabs + status bar */}
      <div style={{height: 34, background: XL.chrome2, borderTop: `1px solid ${XL.grid}`, display: 'flex', alignItems: 'stretch', fontSize: 14, color: XL.dim}}>
        <div style={{width: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12}}>◀ ▶</div>
        {tabs.map((t, i) => (
          <div key={t} style={{padding: '0 22px', display: 'flex', alignItems: 'center', color: i === activeTab ? XL.green : XL.dim, fontWeight: i === activeTab ? 700 : 400, background: i === activeTab ? XL.bg : undefined, borderBottom: i === activeTab ? `3px solid ${XL.green}` : undefined}}>
            {t}
          </div>
        ))}
        <div style={{padding: '0 16px', display: 'flex', alignItems: 'center', fontSize: 20}}>⊕</div>
      </div>
      <div style={{height: 28, background: XL.green, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 26, fontSize: 13, color: '#fff'}}>
        <span>Pronto</span>
        <div style={{flex: 1}} />
        <span>Contagem: {Math.max(1, state.filledRows) * cols.length}</span>
        <span>Soma: {brl(4820.4 + state.filledRows * 1310.55)}</span>
        <span>100%</span>
      </div>
    </div>
  );
};

/** Typing script: how many cells of row `filledRows` are done at local frame t. */
export const typingProgress = (t: number, cols: XlCol[], seed: number, startRow: number, framesPerChar = 1.3, tabFrames = 5) => {
  let row = startRow;
  let rem = Math.max(0, t);
  for (let guard = 0; guard < 40; guard++) {
    const vals = salesRow(row, seed);
    for (let c = 0; c < cols.length; c++) {
      const d = vals[c].length * framesPerChar + tabFrames;
      if (rem < d) return {filledRows: row, typingCol: c, typingChars: Math.min(vals[c].length, rem / framesPerChar)};
      rem -= d;
    }
    row++;
  }
  return {filledRows: row, typingCol: 0, typingChars: 0};
};
