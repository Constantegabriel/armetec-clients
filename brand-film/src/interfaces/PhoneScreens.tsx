import React from 'react';
import {Img, staticFile} from 'remotion';
import {BRAND} from '../config/brand';
import {FONTS} from '../config/theme';
import {EASE} from '../utils/easing';
import {clamp} from '../utils/math';
import {REPORT, fmt} from './DailyReport';
import {Icon, type IconName} from './ui';

/** Phone screens (screen space = PHONE.w - 2*inset, i.e. 382 x 852). */
export const SCREEN = {w: 382, h: 852};
export const WA = {green: '#00A884', bg: '#0B141A', header: '#1F2C34', bubble: '#202C33', meta: '#8696A0'};

const sans = FONTS.sans;

export const StatusBar: React.FC<{time?: string; dark?: boolean}> = ({time = '20:00', dark}) => (
  <div style={{height: 46, display: 'flex', alignItems: 'center', padding: '6px 30px 0', fontFamily: sans, fontSize: 16, fontWeight: 600, color: dark ? '#111' : '#fff'}}>
    <span style={{fontVariantNumeric: 'tabular-nums'}}>{time}</span>
    <div style={{flex: 1}} />
    <div style={{display: 'flex', gap: 3, alignItems: 'flex-end', marginRight: 8}}>
      {[6, 9, 12, 15].map((h) => (
        <div key={h} style={{width: 3.5, height: h * 0.8, borderRadius: 1, background: dark ? '#111' : '#fff'}} />
      ))}
    </div>
    <div style={{width: 26, height: 12, borderRadius: 4, border: `1.5px solid ${dark ? '#111' : '#fff'}`, padding: 1.5, boxSizing: 'border-box'}}>
      <div style={{width: '78%', height: '100%', borderRadius: 2, background: dark ? '#111' : '#fff'}} />
    </div>
  </div>
);

/** Generic messaging app glyph (speech bubble + handset), not a trademark copy. */
export const ChatAppIcon: React.FC<{size: number}> = ({size}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.24, background: `linear-gradient(160deg, #2BD27A, ${WA.green})`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
      <path d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.3 20.7l4.4-1.1A8.8 8.8 0 1 0 12 3.2z" fill="#fff" />
      <path d="M9.3 8.3c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c-.1.1-.1.3 0 .5.5.9 1.3 1.7 2.2 2.2.2.1.4.1.5 0l.6-.6c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.3.3.5 0 .9-.7 1.6-1.6 1.7-2.6.2-6.2-3.2-6-5.9 0-.4.2-1.3.5-1.9z" fill={WA.green} />
    </svg>
  </div>
);

export const BrandAppIcon: React.FC<{size: number}> = ({size}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.24, background: 'linear-gradient(150deg,#1b2350,#0c0f1f)', boxShadow: `inset 0 0 0 1px rgba(142,160,255,0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <Img src={staticFile(BRAND.symbol)} style={{width: size * 0.66, height: size * 0.66}} />
  </div>
);

const wallpaper = (warm = 0) =>
  `radial-gradient(ellipse 120% 60% at 30% 10%, rgba(${warm ? '190,120,80' : '81,112,255'},0.55), transparent 60%), radial-gradient(ellipse 100% 60% at 80% 100%, rgba(${warm ? '120,60,40' : '40,30,90'},0.7), transparent 60%), #07080c`;

/** Lock screen with the incoming report notification. */
export const LockScreen: React.FC<{notify: number; time?: string}> = ({notify, time = '20:00'}) => (
  <div style={{width: SCREEN.w, height: SCREEN.h, background: wallpaper(), position: 'relative', fontFamily: sans}}>
    <StatusBar time={time} />
    <div style={{textAlign: 'center', color: '#fff', marginTop: 40}}>
      <div style={{fontSize: 17, opacity: 0.85}}>segunda-feira, 2 de março</div>
      <div style={{fontFamily: FONTS.display, fontSize: 92, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums'}}>{time}</div>
    </div>
    {notify > 0 ? (
      <div
        style={{
          position: 'absolute',
          left: 14,
          right: 14,
          top: 300,
          padding: '16px 16px',
          borderRadius: 24,
          background: 'rgba(40,42,50,0.78)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)',
          transform: `translateY(${(1 - EASE.out(notify)) * -60}px) scale(${0.94 + 0.06 * EASE.out(notify)})`,
          opacity: clamp(notify * 2),
          display: 'flex',
          gap: 12,
        }}
      >
        <ChatAppIcon size={42} />
        <div style={{flex: 1, minWidth: 0, color: '#fff'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 14}}>
            <span style={{fontWeight: 700}}>{REPORT.sign}</span>
            <span style={{opacity: 0.6}}>agora</span>
          </div>
          <div style={{fontSize: 15, fontWeight: 600, marginTop: 3}}>Relatório diário da sua empresa</div>
          <div style={{fontSize: 14, opacity: 0.75, marginTop: 2, lineHeight: 1.3}}>Faturamento {fmt(4850, 'brl')} · 23 vendas · 8 novos clientes…</div>
        </div>
      </div>
    ) : null}
    <div style={{position: 'absolute', bottom: 10, left: '50%', marginLeft: -66, width: 132, height: 5, borderRadius: 5, background: 'rgba(255,255,255,0.8)'}} />
  </div>
);

/** Chat with the report message; `reveal` 0..1 builds the lines progressively. */
export const WhatsAppChat: React.FC<{reveal: number}> = ({reveal}) => {
  const lines = REPORT.lines;
  const bubbleIn = EASE.out(clamp(reveal * 6));
  return (
    <div style={{width: SCREEN.w, height: SCREEN.h, background: WA.bg, position: 'relative', fontFamily: sans, color: '#E9EDEF'}}>
      {/* subtle wallpaper pattern */}
      <div style={{position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle at 10px 10px, #fff 1.2px, transparent 1.5px)', backgroundSize: '26px 26px'}} />
      <div style={{background: WA.header, position: 'relative'}}>
        <StatusBar />
        <div style={{height: 64, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px'}}>
          <span style={{fontSize: 26, color: '#E9EDEF', marginRight: 2}}>‹</span>
          <div style={{width: 40, height: 40, borderRadius: 40, background: '#0c0f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(142,160,255,0.35)'}}>
            <Img src={staticFile(BRAND.symbol)} style={{width: 26, height: 26}} />
          </div>
          <div style={{flex: 1}}>
            <div style={{fontSize: 16, fontWeight: 600}}>{REPORT.sign}</div>
            <div style={{fontSize: 13, color: WA.meta}}>conta comercial</div>
          </div>
        </div>
      </div>
      <div style={{display: 'flex', justifyContent: 'center', marginTop: 14}}>
        <div style={{fontSize: 12, background: '#182229', color: WA.meta, padding: '5px 12px', borderRadius: 8, letterSpacing: '0.04em'}}>HOJE</div>
      </div>
      <div
        style={{
          margin: '12px 14px 0 12px',
          background: WA.bubble,
          borderRadius: '4px 14px 14px 14px',
          padding: '14px 16px 10px',
          opacity: bubbleIn,
          transform: `translateY(${(1 - bubbleIn) * 16}px)`,
          boxShadow: '0 1px 1px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: WA.green}}>{REPORT.title}</div>
        <div style={{fontSize: 15, color: '#E9EDEF', marginTop: 2, marginBottom: 8}}>{REPORT.subtitle}</div>
        {lines.map((l, i) => {
          const a = EASE.out(clamp(reveal * (lines.length + 3) - 1.2 - i));
          return (
            <div key={l.k} style={{display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 15.5, padding: '6px 0', borderTop: i ? '1px solid rgba(255,255,255,0.05)' : undefined, opacity: 0.15 + 0.85 * a}}>
              <span style={{color: '#C9D1D6'}}>{l.k}</span>
              <span style={{fontWeight: 700, fontVariantNumeric: 'tabular-nums'}}>{fmt(l.v * a, l.fmt)}</span>
            </div>
          );
        })}
        <div style={{fontSize: 13, color: WA.meta, marginTop: 8, opacity: clamp(reveal * 9 - 7.6)}}>{REPORT.footer}</div>
        <div style={{fontSize: 13, color: '#C9D1D6', fontWeight: 600, marginTop: 2, opacity: clamp(reveal * 9 - 7.8)}}>{REPORT.sign}</div>
        <div style={{textAlign: 'right', fontSize: 12, color: WA.meta, marginTop: 4}}>
          20:00 <span style={{color: '#53BDEB'}}>✓✓</span>
        </div>
      </div>
      {/* input bar */}
      <div style={{position: 'absolute', left: 8, right: 8, bottom: 18, display: 'flex', gap: 8, alignItems: 'center'}}>
        <div style={{flex: 1, height: 46, borderRadius: 23, background: '#1F2C34', color: WA.meta, display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 16}}>Mensagem</div>
        <div style={{width: 46, height: 46, borderRadius: 46, background: WA.green, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="#fff">
            <rect x="9" y="3" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" stroke="#fff" strokeWidth="2" fill="none" />
            <path d="M12 18v3" stroke="#fff" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------- home screen ------------------------------- */

const APPS: Array<{n: string; i: IconName; c: [string, string]}> = [
  {n: 'Agenda', i: 'calendar', c: ['#3a3f4b', '#23262e']},
  {n: 'Fotos', i: 'grid', c: ['#4a3f5c', '#2a2433']},
  {n: 'Mapas', i: 'globe', c: ['#2f4a45', '#1d2d2a']},
  {n: 'Clima', i: 'chart', c: ['#2c3f62', '#1a2640']},
  {n: 'E-mail', i: 'mail', c: ['#2c4870', '#1a2b45']},
  {n: 'Notas', i: 'file', c: ['#5c5230', '#3a331c']},
  {n: 'Banco', i: 'wallet', c: ['#3c3c44', '#222227']},
  {n: 'Ajustes', i: 'bolt', c: ['#44444c', '#26262b']},
];

export const HomeScreen: React.FC<{tapPress: number; highlight: number}> = ({tapPress, highlight}) => {
  const icon = 66;
  const cell = (n: string, el: React.ReactNode, key: string, glow = 0) => (
    <div key={key} style={{width: 82, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
      <div style={{filter: glow ? `drop-shadow(0 0 ${14 * glow}px rgba(81,112,255,${0.8 * glow}))` : undefined}}>{el}</div>
      <div style={{fontSize: 12, color: '#fff', fontFamily: sans, textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>{n}</div>
    </div>
  );
  const plain = (a: (typeof APPS)[number]) => (
    <div style={{width: icon, height: icon, borderRadius: icon * 0.24, background: `linear-gradient(150deg, ${a.c[0]}, ${a.c[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)'}}>
      <Icon name={a.i} size={30} color="#fff" />
    </div>
  );
  return (
    <div style={{width: SCREEN.w, height: SCREEN.h, background: wallpaper(), position: 'relative', fontFamily: sans}}>
      <StatusBar time="20:01" />
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 82px)', justifyContent: 'center', rowGap: 22, marginTop: 28}}>
        {APPS.map((a) => cell(a.n, plain(a), a.n))}
        {cell('WhatsApp', <ChatAppIcon size={icon} />, 'wa')}
        {cell(
          'Gestão',
          <div style={{transform: `scale(${1 - Math.sin(tapPress * Math.PI) * 0.12})`}}>
            <BrandAppIcon size={icon} />
          </div>,
          'gestao',
          highlight,
        )}
      </div>
      <div style={{position: 'absolute', left: 14, right: 14, bottom: 26, height: 92, borderRadius: 30, background: 'rgba(255,255,255,0.14)', display: 'flex', justifyContent: 'space-around', alignItems: 'center'}}>
        {(['phone', 'chat', 'globe', 'calendar'] as IconName[]).map((n) => (
          <div key={n} style={{width: icon, height: icon, borderRadius: icon * 0.24, background: 'linear-gradient(150deg,#3a3f4b,#202329)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon name={n} size={30} color="#fff" />
          </div>
        ))}
      </div>
      {tapPress > 0 ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0}}>
          <div style={{position: 'absolute', left: HOME_ICON.x - 26, top: HOME_ICON.y - 26, width: 52, height: 52, borderRadius: 52, background: 'rgba(255,255,255,0.35)', opacity: 1 - tapPress, transform: `scale(${0.6 + tapPress})`}} />
        </div>
      ) : null}
    </div>
  );
};

/** centre of the "Gestão" icon on the home screen (screen px) — the tap point */
export const HOME_ICON = {x: 27 + 82 + 41, y: 46 + 28 + 2 * 109 + 33};
