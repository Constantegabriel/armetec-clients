import React from 'react';
import {Img, staticFile} from 'remotion';
import {BRAND} from '../config/brand';
import {FONTS} from '../config/theme';
import {EASE} from '../utils/easing';
import {clamp} from '../utils/math';
import {REPORT, fmt} from './DailyReport';

/**
 * iOS-style phone screens (screen space = PHONE minus bezel = 386 x 864).
 * Lock screen with notification, WhatsApp conversation, home screen.
 * All content is fictional/demonstrative.
 */
export const SCREEN = {w: 386, h: 864};
export const WA = {green: '#25D366', tint: '#21C063', bg: '#0B141A', bar: '#1C1C1E', bubble: '#1F2C34', meta: '#8696A0', text: '#E9EDEF'};

const ios = FONTS.sans;

/* -------------------------------- status bar -------------------------------- */
export const StatusBar: React.FC<{time?: string; dark?: boolean}> = ({time = '20:00', dark}) => {
  const c = dark ? '#000' : '#fff';
  return (
    <div style={{height: 54, display: 'flex', alignItems: 'center', padding: '4px 34px 0 40px', fontFamily: ios, fontSize: 16, fontWeight: 600, color: c, position: 'relative', zIndex: 5}}>
      <span style={{fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em'}}>{time}</span>
      <div style={{flex: 1}} />
      <div style={{display: 'flex', gap: 2.5, alignItems: 'flex-end', marginRight: 7}}>
        {[5, 7.5, 10, 12.5].map((h) => (
          <div key={h} style={{width: 3.2, height: h, borderRadius: 1, background: c}} />
        ))}
      </div>
      <svg width={17} height={12} viewBox="0 0 17 12" style={{marginRight: 7}}>
        <path d="M8.5 11.2l2.3-2.4a3.3 3.3 0 0 0-4.6 0z M8.5 4.6a6.8 6.8 0 0 1 4.8 2l1.5-1.6a9 9 0 0 0-12.6 0l1.5 1.6a6.8 6.8 0 0 1 4.8-2z M8.5 0.6c3.1 0 5.9 1.2 8 3.2l-1.4 1.5a9.4 9.4 0 0 0-13.2 0L0.5 3.8c2.1-2 4.9-3.2 8-3.2z" fill={c} />
      </svg>
      <div style={{width: 25, height: 12, borderRadius: 3.5, border: `1.2px solid ${c}`, opacity: 0.95, padding: 1.5, boxSizing: 'border-box', position: 'relative'}}>
        <div style={{width: '82%', height: '100%', borderRadius: 1.5, background: c}} />
      </div>
    </div>
  );
};

/* ------------------------------- app glyphs -------------------------------- */

/** WhatsApp app icon (green squircle, white bubble ring with handset). */
export const WhatsAppIcon: React.FC<{size: number}> = ({size}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.225, background: 'linear-gradient(180deg,#5FFC7B,#28D146)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.1)'}}>
    <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 32 32">
      <path d="M16 3.6C9.2 3.6 3.7 9 3.7 15.8c0 2.3.6 4.4 1.7 6.3L3.6 28.4l6.5-1.7a12.3 12.3 0 0 0 5.9 1.5c6.8 0 12.3-5.5 12.3-12.3S22.8 3.6 16 3.6z" fill="none" stroke="#fff" strokeWidth={2.3} strokeLinejoin="round" />
      <path d="M11.6 9.9c.3-.6.6-.6.9-.6h.8c.2 0 .6 0 .8.6l1.1 2.6c.1.2.1.5-.1.8l-.7.9c-.2.2-.2.5 0 .8.8 1.4 2 2.6 3.4 3.4.3.2.6.1.8 0l.9-1c.3-.3.5-.3.8-.2l2.6 1.2c.3.1.4.3.4.6 0 1.4-1 2.5-2.5 2.7-4 .4-9.6-5.1-9.3-9.2.1-.6.3-1.5.8-2.6z" fill="#fff" />
    </svg>
  </div>
);

export const BrandAppIcon: React.FC<{size: number}> = ({size}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.225, background: 'linear-gradient(150deg,#1b2350,#0c0f1f)', boxShadow: 'inset 0 0 0 1px rgba(142,160,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <Img src={staticFile(BRAND.symbol)} style={{width: size * 0.66, height: size * 0.66}} />
  </div>
);

const Glyph: React.FC<{size: number; bg: string; children: React.ReactNode}> = ({size, bg, children}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.225, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative'}}>
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  </div>
);

const APPS: Array<{n: string; el: (s: number) => React.ReactNode}> = [
  {
    n: 'Calendário',
    el: (s) => (
      <div style={{width: s, height: s, borderRadius: s * 0.225, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: ios}}>
        <div style={{fontSize: s * 0.17, color: '#FF3B30', fontWeight: 600}}>SEG</div>
        <div style={{fontSize: s * 0.5, color: '#111', fontWeight: 300, lineHeight: 1}}>2</div>
      </div>
    ),
  },
  {n: 'Fotos', el: (s) => <Glyph size={s} bg="#fff">{[0, 60, 120, 180, 240, 300].map((a, i) => <ellipse key={a} cx={12 + 4.2 * Math.cos((a * Math.PI) / 180)} cy={12 + 4.2 * Math.sin((a * Math.PI) / 180)} rx={3.6} ry={3.6} fill={['#FFCC00', '#FF9500', '#FF2D55', '#AF52DE', '#007AFF', '#34C759'][i]} opacity={0.85} />)}</Glyph>},
  {n: 'Câmera', el: (s) => <Glyph size={s} bg="linear-gradient(180deg,#e5e5ea,#a1a1a6)"><rect x="3" y="7" width="18" height="12" rx="3" fill="#2c2c2e" /><circle cx="12" cy="13" r="3.6" fill="#8e8e93" stroke="#1c1c1e" strokeWidth="1.5" /></Glyph>},
  {n: 'Clima', el: (s) => <Glyph size={s} bg="linear-gradient(180deg,#4fa3ff,#1c5fd6)"><circle cx="10" cy="10" r="4" fill="#FFD60A" /><path d="M8 17h9a3 3 0 0 0 0-6 4.5 4.5 0 0 0-8.6 1.5A2.3 2.3 0 0 0 8 17z" fill="#fff" /></Glyph>},
  {n: 'Mapas', el: (s) => <Glyph size={s} bg="linear-gradient(135deg,#d8f1d2,#bfe0f7)"><path d="M3 18L21 6" stroke="#5ac8fa" strokeWidth="3" /><path d="M8 3v18" stroke="#fff" strokeWidth="2.2" /><circle cx="15" cy="10" r="2.6" fill="#ff3b30" /></Glyph>},
  {n: 'Notas', el: (s) => <Glyph size={s} bg="linear-gradient(180deg,#ffd60a 0 26%,#fff 26%)"><path d="M6 13h12M6 17h9" stroke="#c7c7cc" strokeWidth="1.6" /></Glyph>},
  {n: 'Banco', el: (s) => <Glyph size={s} bg="linear-gradient(150deg,#2c2c2e,#000)"><rect x="3" y="6" width="18" height="12" rx="2.5" stroke="#fff" strokeWidth="1.6" /><path d="M3 10h18" stroke="#fff" strokeWidth="1.6" /></Glyph>},
  {n: 'Ajustes', el: (s) => <Glyph size={s} bg="linear-gradient(180deg,#8e8e93,#636366)"><circle cx="12" cy="12" r="6.5" stroke="#1c1c1e" strokeWidth="2.2" /><circle cx="12" cy="12" r="2.4" fill="#1c1c1e" /></Glyph>},
];

const DOCK: Array<(s: number) => React.ReactNode> = [
  (s) => <Glyph size={s} bg="linear-gradient(180deg,#5af57a,#28c840)"><path d="M7.5 4.5l2.3 3.6-1.6 1.7a10 10 0 0 0 5.9 5.9l1.7-1.6 3.6 2.3-1.1 2.8C13 20 4 11 5 5.6z" fill="#fff" /></Glyph>,
  (s) => <Glyph size={s} bg="linear-gradient(180deg,#59c8ff,#1677ff)"><circle cx="12" cy="12" r="8" stroke="#fff" strokeWidth="1.4" /><path d="M14.8 9.2l-2 5.6-3.6-3.6z" fill="#ff3b30" /><path d="M9.2 14.8l1.9-5.5 3.7 3.7z" fill="#fff" /></Glyph>,
  (s) => <Glyph size={s} bg="linear-gradient(180deg,#5af57a,#28c840)"><path d="M12 5c4.4 0 8 2.8 8 6.3s-3.6 6.3-8 6.3c-.9 0-1.8-.1-2.6-.3L5.5 19l1.1-3.1C5 14.7 4 13.1 4 11.3 4 7.8 7.6 5 12 5z" fill="#fff" /></Glyph>,
  (s) => <Glyph size={s} bg="linear-gradient(180deg,#ff5e6c,#fa233b)"><path d="M10 16.5V6.5l8-2v10" stroke="#fff" strokeWidth="1.8" /><circle cx="8" cy="16.5" r="2" fill="#fff" /><circle cx="16" cy="14.5" r="2" fill="#fff" /></Glyph>,
];

const wallpaper = 'radial-gradient(ellipse 120% 70% at 20% 0%, #3b4bd8 0%, transparent 55%), radial-gradient(ellipse 110% 70% at 100% 100%, #7a2fb8 0%, transparent 60%), linear-gradient(180deg,#141a44,#0b0b1a)';

/* -------------------------------- lock screen ------------------------------- */
export const LockScreen: React.FC<{notify: number; time?: string}> = ({notify, time = '20:00'}) => {
  const n = EASE.out(clamp(notify * 1.4));
  return (
    <div style={{width: SCREEN.w, height: SCREEN.h, background: wallpaper, position: 'relative', fontFamily: ios, color: '#fff', overflow: 'hidden'}}>
      <StatusBar time="" />
      <div style={{textAlign: 'center', marginTop: 18}}>
        <div style={{fontSize: 19, fontWeight: 600, opacity: 0.9}}>segunda-feira, 2 de março</div>
        <div style={{fontSize: 108, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1, marginTop: 2, fontVariantNumeric: 'tabular-nums', fontFamily: FONTS.display}}>{time}</div>
      </div>
      {notify > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            top: 470,
            padding: '13px 14px',
            borderRadius: 24,
            background: 'rgba(58,58,72,0.62)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.25), inset 0 0 0 0.5px rgba(255,255,255,0.12)',
            transform: `translateY(${(1 - n) * 70}px) scale(${0.92 + 0.08 * n})`,
            opacity: clamp(notify * 3),
            display: 'flex',
            gap: 11,
          }}
        >
          <WhatsAppIcon size={40} />
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
              <span style={{fontSize: 15.5, fontWeight: 600}}>ArmeTec | Gestão Inteligente</span>
              <span style={{fontSize: 13, opacity: 0.6}}>agora</span>
            </div>
            <div style={{fontSize: 15, lineHeight: 1.32, marginTop: 1, opacity: 0.95}}>
              RELATÓRIO DIÁRIO · Faturamento: {fmt(4850, 'brl')} · Vendas realizadas: 23 · Novos clientes: 8…
            </div>
          </div>
        </div>
      ) : null}
      {/* flashlight + camera */}
      {[46, SCREEN.w - 46].map((x, i) => (
        <div key={x} style={{position: 'absolute', left: x - 25, bottom: 46, width: 50, height: 50, borderRadius: 50, background: 'rgba(40,40,52,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.6}>
            {i === 0 ? <path d="M8 3h8l-1 6H9zM9 9h6v12H9z" /> : <><rect x="3" y="7" width="18" height="13" rx="3" /><circle cx="12" cy="13.5" r="3.5" /><path d="M9 7l1.5-2.5h3L15 7" /></>}
          </svg>
        </div>
      ))}
      <div style={{position: 'absolute', bottom: 9, left: '50%', marginLeft: -68, width: 136, height: 5, borderRadius: 5, background: '#fff'}} />
    </div>
  );
};

/* ----------------------------- whatsapp chat -------------------------------- */

const Doodles: React.FC = () => (
  <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.06}}>
    <defs>
      <pattern id="wa-doodle" width="86" height="86" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round">
          <circle cx="16" cy="16" r="7" />
          <path d="M40 10l8 8-8 8" />
          <path d="M62 14c4-6 12-6 14 0s-6 10-14 14" />
          <rect x="10" y="48" width="16" height="12" rx="3" />
          <path d="M44 52h18M44 58h12" />
          <path d="M70 56l6 6m0-6l-6 6" />
          <path d="M20 76q8-8 16 0" />
          <circle cx="60" cy="76" r="3" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#wa-doodle)" />
  </svg>
);

/** WhatsApp conversation (iOS dark), report bubble revealed progressively. */
export const WhatsAppChat: React.FC<{reveal: number}> = ({reveal}) => {
  const bubbleIn = EASE.out(clamp(reveal * 6));
  const lines = REPORT.lines;
  const lineA = (i: number) => EASE.out(clamp(reveal * (lines.length + 3) - 1.2 - i));
  return (
    <div style={{width: SCREEN.w, height: SCREEN.h, background: WA.bg, position: 'relative', fontFamily: ios, color: WA.text, overflow: 'hidden'}}>
      <Doodles />
      {/* nav bar */}
      <div style={{background: 'rgba(28,28,30,0.94)', position: 'relative', borderBottom: '0.5px solid rgba(255,255,255,0.08)'}}>
        <StatusBar time="20:00" />
        <div style={{height: 52, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px 4px'}}>
          <svg width={14} height={22} viewBox="0 0 12 20">
            <path d="M10 2L2 10l8 8" stroke={WA.tint} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{fontSize: 17, color: WA.tint, marginRight: 4}}>12</div>
          <div style={{width: 36, height: 36, borderRadius: 36, background: '#0c0f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(142,160,255,0.35)'}}>
            <Img src={staticFile(BRAND.symbol)} style={{width: 24, height: 24}} />
          </div>
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 5, fontSize: 16, fontWeight: 600}}>
              ArmeTec | Gestão
              <svg width={15} height={15} viewBox="0 0 24 24">
                <path d="M12 1.5l2.6 2 3.2-.3 1 3.1 2.8 1.6-.9 3.1.9 3.1-2.8 1.6-1 3.1-3.2-.3-2.6 2-2.6-2-3.2.3-1-3.1-2.8-1.6.9-3.1-.9-3.1 2.8-1.6 1-3.1 3.2.3z" fill={WA.green} />
                <path d="M8 12.2l2.7 2.7L16.3 9" stroke="#0B141A" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{fontSize: 12.5, color: WA.meta}}>Conta comercial</div>
          </div>
          <svg width={26} height={18} viewBox="0 0 26 18" style={{marginRight: 16}}>
            <rect x="1" y="2" width="16" height="14" rx="3.5" stroke={WA.tint} strokeWidth={2} fill="none" />
            <path d="M18 7l6-3.5v11L18 11z" stroke={WA.tint} strokeWidth={2} fill="none" strokeLinejoin="round" />
          </svg>
          <svg width={20} height={20} viewBox="0 0 24 24">
            <path d="M6.5 3l2.6 4.1-1.8 1.9a11.5 11.5 0 0 0 6.8 6.8l1.9-1.8 4.1 2.6-1.3 3.2C12 21 3 12 3.3 4.3z" stroke={WA.tint} strokeWidth={2} fill="none" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <div style={{display: 'flex', justifyContent: 'center', marginTop: 12, position: 'relative'}}>
        <div style={{fontSize: 12.5, background: '#1D282F', color: WA.meta, padding: '5px 11px', borderRadius: 8}}>Hoje</div>
      </div>
      {/* incoming business message */}
      <div style={{position: 'relative', margin: '10px 52px 0 14px', opacity: bubbleIn, transform: `translateY(${(1 - bubbleIn) * 16}px) scale(${0.97 + 0.03 * bubbleIn})`, transformOrigin: '0 0'}}>
        <svg width={12} height={14} viewBox="0 0 12 14" style={{position: 'absolute', left: -7, top: 0}}>
          <path d="M12 0H2C.4 0-.4 1.9.8 3L12 14z" fill={WA.bubble} />
        </svg>
        <div style={{background: WA.bubble, borderRadius: '0 12px 12px 12px', padding: '8px 10px 6px 11px', fontSize: 16, lineHeight: 1.36, boxShadow: '0 1px 0.5px rgba(0,0,0,0.25)'}}>
          <div style={{fontWeight: 700}}>{REPORT.title}</div>
          <div>{REPORT.subtitle}</div>
          <div style={{height: 8}} />
          {lines.map((l, i) => (
            <div key={l.k} style={{opacity: 0.2 + 0.8 * lineA(i)}}>
              {l.k}: <b style={{fontVariantNumeric: 'tabular-nums'}}>{fmt(l.v * lineA(i), l.fmt)}</b>
            </div>
          ))}
          <div style={{height: 8}} />
          <div style={{fontStyle: 'italic', color: '#C9D1D6', opacity: clamp(reveal * 9 - 7.4)}}>{REPORT.footer}</div>
          <div style={{fontWeight: 700, opacity: clamp(reveal * 9 - 7.7)}}>{REPORT.sign}</div>
          <div style={{textAlign: 'right', fontSize: 11.5, color: WA.meta, marginTop: 2}}>20:00</div>
        </div>
      </div>
      {/* input bar */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 88, background: 'rgba(28,28,30,0.96)', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px 0', boxSizing: 'border-box'}}>
        <svg width={24} height={34} viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        </svg>
        <div style={{flex: 1, height: 34, borderRadius: 18, background: '#2C2C2E', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10}}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth={1.8}>
            <rect x="4" y="4" width="16" height="16" rx="5" />
            <path d="M9 14c1.5 1.6 4.5 1.6 6 0" />
          </svg>
        </div>
        <svg width={26} height={34} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
          <rect x="3" y="7" width="18" height="13" rx="3" />
          <circle cx="12" cy="13.5" r="3.5" />
        </svg>
        <svg width={22} height={34} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
        <div style={{position: 'absolute', bottom: 9, left: '50%', marginLeft: -68, width: 136, height: 5, borderRadius: 5, background: '#fff'}} />
      </div>
    </div>
  );
};

/* -------------------------------- home screen ------------------------------- */

const ICON = 62;
const COL = 86;
const GRID_LEFT = (SCREEN.w - COL * 4) / 2;
const GRID_TOP = 54 + 172 + 24;
const ROW = 102;

/** centre of the "Gestão" icon (row 2, column 2) — the tap point */
export const HOME_ICON = {x: GRID_LEFT + COL * 1 + COL / 2, y: GRID_TOP + ROW * 2 + ICON / 2};

export const HomeScreen: React.FC<{tapPress: number; highlight: number}> = ({tapPress, highlight}) => {
  const cell = (key: string, name: string, el: React.ReactNode, glow = 0) => (
    <div key={key} style={{width: COL, height: ROW, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
      <div style={{filter: glow ? `drop-shadow(0 0 ${16 * glow}px rgba(120,140,255,${0.9 * glow}))` : undefined}}>{el}</div>
      <div style={{fontSize: 12, color: '#fff', fontFamily: ios, fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,0.4)'}}>{name}</div>
    </div>
  );
  const apps: React.ReactNode[] = APPS.map((a) => cell(a.n, a.n, a.el(ICON)));
  apps.push(cell('wa', 'WhatsApp', <WhatsAppIcon size={ICON} />));
  apps.push(
    cell(
      'gestao',
      'Gestão',
      <div style={{transform: `scale(${1 - Math.sin(tapPress * Math.PI) * 0.14})`}}>
        <BrandAppIcon size={ICON} />
      </div>,
      highlight,
    ),
  );
  return (
    <div style={{width: SCREEN.w, height: SCREEN.h, background: wallpaper, position: 'relative', fontFamily: ios, overflow: 'hidden'}}>
      <StatusBar time="20:01" />
      {/* widget: the system itself on the home screen */}
      <div style={{margin: '0 20px', height: 172, borderRadius: 24, background: 'rgba(20,22,40,0.55)', boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.15)', padding: 18, boxSizing: 'border-box', color: '#fff'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <Img src={staticFile(BRAND.symbol)} style={{width: 22, height: 22}} />
          <span style={{fontSize: 14, fontWeight: 600, opacity: 0.85}}>Gestão · hoje</span>
        </div>
        <div style={{fontFamily: FONTS.display, fontSize: 38, fontWeight: 650, letterSpacing: '-0.03em', marginTop: 12, fontVariantNumeric: 'tabular-nums'}}>{fmt(4850, 'brl')}</div>
        <div style={{fontSize: 14, opacity: 0.75, marginTop: 2}}>23 vendas · 8 novos clientes · 17 serviços</div>
      </div>
      <div style={{position: 'absolute', left: GRID_LEFT, top: GRID_TOP, width: COL * 4, display: 'flex', flexWrap: 'wrap'}}>
        {apps.slice(0, 4)}
        {apps.slice(4, 8)}
        {apps.slice(8)}
      </div>
      {/* search pill + dock */}
      <div style={{position: 'absolute', left: '50%', bottom: 132, transform: 'translateX(-50%)', padding: '7px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: 13.5, display: 'flex', gap: 6, alignItems: 'center'}}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        Buscar
      </div>
      <div style={{position: 'absolute', left: 12, right: 12, bottom: 22, height: 92, borderRadius: 34, background: 'rgba(255,255,255,0.16)', display: 'flex', justifyContent: 'space-around', alignItems: 'center'}}>
        {DOCK.map((d, i) => (
          <div key={i}>{d(ICON)}</div>
        ))}
      </div>
      <div style={{position: 'absolute', bottom: 9, left: '50%', marginLeft: -68, width: 136, height: 5, borderRadius: 5, background: '#fff'}} />
      {tapPress > 0 ? <div style={{position: 'absolute', left: HOME_ICON.x - 30, top: HOME_ICON.y - 30, width: 60, height: 60, borderRadius: 60, background: 'rgba(255,255,255,0.3)', opacity: 1 - tapPress, transform: `scale(${0.6 + tapPress})`}} /> : null}
    </div>
  );
};

/** Back-compat alias used by the report capsule. */
export const ChatAppIcon = WhatsAppIcon;
