import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {camSmooth} from '../animations/camera';
import {CssWorld, Plane} from '../components/CssWorld';
import {COLORS} from '../config/theme';
import {ExcelWindow, SALES_COLS, typingProgress, type XlState} from '../interfaces/Excel';
import {Title, eyebrow, keyline} from '../typography/Title';
import {EASE} from '../utils/easing';
import {useLayout} from '../utils/layout';
import {clamp} from '../utils/math';
import {beat, prog} from '../utils/time';

/**
 * SCENE 03a — PREENCHENDO PLANILHAS.
 * A real routine: a sales sheet typed cell by cell (formula bar mirrors the
 * keystrokes), a block of rows copied (marching ants) and pasted, then more
 * workbooks open behind it — manual work piling up. The camera starts on the
 * active cell (continuing the calendar dive) and pulls back to reveal the pile.
 */
const A = beat('s03a');
const COPY = beat('s03a_copy');
const MORE = beat('s03a_more');
const END = beat('s03b') + 6;

const WIN = {w: 1340, h: 1000};
const ROW0 = 6; // first row typed on camera
const FPC = 1.3;

const mainState = (f: number): XlState => {
  const local = f - (A - 20);
  const pasteAt = COPY + 33;
  if (f < COPY) {
    const p = typingProgress(local, SALES_COLS, 0, ROW0, FPC);
    return {...p, frame: f};
  }
  if (f < pasteAt) {
    // select rows 3–5 and copy (marching ants)
    return {filledRows: ROW0 + 1, active: [2, 0], copy: [2, 0, 4, 7], frame: f};
  }
  const flash = 1 - prog(f, pasteAt, pasteAt + 30, EASE.out);
  if (f < pasteAt + 18) {
    return {filledRows: ROW0 + 1, active: [ROW0 + 1, 0], copy: [2, 0, 4, 7], paste: {range: [ROW0 + 1, 0, ROW0 + 3, 7], flash}, frame: f};
  }
  const p = typingProgress(f - (pasteAt + 18), SALES_COLS, 0, ROW0 + 4, FPC * 0.85);
  return {...p, paste: {range: [ROW0 + 1, 0, ROW0 + 3, 7], flash}, frame: f};
};

export const S03aSheets: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame() + from;
  const L = useLayout();
  const v = L.vertical;
  // active cell (row 6, col "Cliente") sits around world (-370, -27)
  const cam = camSmooth(
    f,
    [
      {f: from, pos: [-380, -60, 560], target: [-360, -40, 0], lens: 50, aperture: 1.8},
      {f: A + 70, pos: [-220, -40, 680], target: [-190, -30, 0], lens: 50, aperture: 1.6},
      {f: COPY, pos: [-120, -170, 1250], target: [-80, -130, 0], lens: 45, aperture: 1.2},
      {f: MORE + 10, pos: [60, -40, v ? 2100 : 1700], target: [0, 0, -300], lens: 40, aperture: 1},
      {f: END, pos: [220, 40, v ? 3300 : 2600], target: [80, 0, -500], lens: 38, roll: 2, aperture: 0.9},
    ],
    2,
  );
  const w2 = EASE.out(prog(f, MORE, MORE + 34, EASE.linear));
  const w3 = EASE.out(prog(f, MORE + 36, MORE + 70, EASE.linear));
  return (
    <AbsoluteFill style={{background: COLORS.black}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 55%, rgba(51,163,107,0.06), transparent 70%)'}} />
      <CssWorld cam={cam}>
        {w3 > 0 ? (
          <Plane x={-560} y={420} z={-1250 - (1 - w3) * 600} ry={10} w={WIN.w} h={WIN.h} opacity={w3}>
            <ExcelWindow w={WIN.w} h={WIN.h} file="Financeiro_conferencia_v4.xlsx" seed={9} state={{...typingProgress(f - MORE - 40, SALES_COLS, 9, 9, 1.1), frame: f}} activeTab={3} />
          </Plane>
        ) : null}
        {w2 > 0 ? (
          <Plane x={560} y={-380} z={-640 - (1 - w2) * 600} ry={-12} w={WIN.w} h={WIN.h} opacity={w2}>
            <ExcelWindow w={WIN.w} h={WIN.h} file="Clientes_cadastro_ATUAL.xlsx" seed={4} state={{...typingProgress(f - MORE, SALES_COLS, 4, 8, 1.1), frame: f}} activeTab={1} />
          </Plane>
        ) : null}
        <Plane x={0} y={0} z={0} w={WIN.w} h={WIN.h} sharp={f < COPY}>
          <ExcelWindow w={WIN.w} h={WIN.h} file="Vendas_2026_controle_FINAL.xlsx" state={mainState(f)} />
        </Plane>
      </CssWorld>
      {/* the sheets pile up: soft depth haze at the edges */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,${0.35 + 0.3 * clamp(w2)}) 100%)`}} />
      <Title
        f={f}
        at={A + 26}
        out={MORE + 50}
        anchor={v ? 'top' : 'bottom'}
        lines={[eyebrow('PREENCHENDO', v ? 40 : 36), keyline('PLANILHAS', v ? 132 : 120)]}
      />
    </AbsoluteFill>
  );
};
