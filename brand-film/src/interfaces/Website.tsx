import React from 'react';
import {COLORS, FONTS} from '../config/theme';
import {EASE} from '../utils/easing';
import {clamp, lerp} from '../utils/math';
import {Icon, Label} from './ui';

/**
 * Demo website of a fictional client ("Vértice Arquitetura"). `m` morphs the
 * layout from desktop (0, 1280x800) to mobile (1, 390x844): every block
 * interpolates its rect and type size, and text genuinely re-wraps.
 */
export const SITE = {desktop: {w: 1280, h: 800}, mobile: {w: 390, h: 844}};

type R = [number, number, number, number]; // x y w h
const mix = (a: R, b: R, k: number): R => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)];

const BLOCKS: Record<string, {d: R; m: R}> = {
  nav: {d: [0, 0, 1280, 76], m: [0, 0, 390, 64]},
  image: {d: [660, 112, 570, 440], m: [16, 76, 358, 250]},
  text: {d: [64, 150, 560, 300], m: [20, 344, 350, 220]},
  ctas: {d: [64, 470, 520, 64], m: [20, 572, 350, 124]},
  s1: {d: [64, 600, 368, 170], m: [16, 716, 358, 118]},
  s2: {d: [456, 600, 368, 170], m: [16, 846, 358, 118]},
  s3: {d: [848, 600, 368, 170], m: [16, 976, 358, 118]},
};

/** Architectural "photograph" made of light and geometry (no stock imagery). */
const ArchImage: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', inset: 0, borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(180deg,#2b3550 0%,#5d6a8c 46%,#c9b79c 100%)'}}>
    <div style={{position: 'absolute', left: '-10%', right: '-10%', bottom: '18%', height: '60%', background: 'radial-gradient(ellipse 50% 60% at 70% 100%, rgba(255,214,170,0.55), transparent 70%)'}} />
    {/* building volumes */}
    <div style={{position: 'absolute', left: '12%', bottom: '12%', width: '52%', height: '46%', background: 'linear-gradient(90deg,#e9e6df,#cfcac0)', transform: `translateX(${t * -0.05}px)`}} />
    <div style={{position: 'absolute', left: '30%', bottom: '58%', width: '56%', height: '18%', background: 'linear-gradient(90deg,#f4f1ea,#d8d2c6)', boxShadow: '0 18px 30px rgba(0,0,0,0.25)'}} />
    <div style={{position: 'absolute', left: '17%', bottom: '18%', width: '40%', height: '30%', background: 'linear-gradient(180deg,#1d2433,#3a465f)', opacity: 0.92}}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{position: 'absolute', left: `${i * 25}%`, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.25)'}} />
      ))}
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.25), transparent 40%)'}} />
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%', background: 'linear-gradient(180deg,#5d6b52,#39432f)'}} />
    <div style={{position: 'absolute', left: '64%', bottom: '12%', width: 10, height: '30%', background: '#2c3326'}} />
    <div style={{position: 'absolute', left: '58%', bottom: '34%', width: 90, height: 90, borderRadius: 90, background: 'radial-gradient(circle,#4d5c3f,#2f3a27)'}} />
  </div>
);

const SERV = [
  {t: 'Projetos residenciais', d: 'Do conceito à obra, com acompanhamento completo.'},
  {t: 'Espaços corporativos', d: 'Ambientes que reforçam a cultura da sua empresa.'},
  {t: 'Interiores sob medida', d: 'Marcenaria, iluminação e curadoria de materiais.'},
];

export const Website: React.FC<{m: number; t: number; scroll?: number}> = ({m, t, scroll = 0}) => {
  const W = lerp(SITE.desktop.w, SITE.mobile.w, m);
  const H = lerp(SITE.desktop.h, SITE.mobile.h, m);
  const b = (k: keyof typeof BLOCKS) => mix(BLOCKS[k].d, BLOCKS[k].m, EASE.inOut(m));
  const box = (r: R, extra?: React.CSSProperties): React.CSSProperties => ({position: 'absolute', left: r[0], top: r[1] - scroll, width: r[2], height: r[3], ...extra});
  const heroIn = (d: number) => EASE.out(clamp((t - d) / 24));
  const nav = b('nav');
  return (
    <div style={{width: W, height: H, position: 'relative', overflow: 'hidden', background: '#f6f4ef', fontFamily: FONTS.sans, color: '#16181d'}}>
      {/* nav */}
      <div style={box(nav, {display: 'flex', alignItems: 'center', padding: `0 ${lerp(64, 20, m)}px`, boxSizing: 'border-box', borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#f6f4ef', zIndex: 2})}>
        <div style={{fontFamily: FONTS.display, fontWeight: 700, letterSpacing: '0.18em', fontSize: lerp(20, 16, m)}}>VÉRTICE</div>
        <div style={{flex: 1}} />
        <div style={{display: 'flex', gap: 32, opacity: 1 - clamp(m * 3), fontSize: 15, color: '#4a4d55', marginRight: 28}}>
          {['Projetos', 'Serviços', 'Sobre', 'Contato'].map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <div style={{opacity: 1 - clamp(m * 3), background: '#16181d', color: '#fff', borderRadius: 999, padding: '10px 18px', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap'}}>Solicitar orçamento</div>
        <div style={{position: 'absolute', right: 20, opacity: clamp(m * 3 - 2), display: 'flex', flexDirection: 'column', gap: 5}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{width: 22, height: 2, background: '#16181d'}} />
          ))}
        </div>
      </div>
      {/* hero image */}
      <div style={box(b('image'), {opacity: heroIn(4), transform: `scale(${1.04 - 0.04 * heroIn(4)})`})}>
        <ArchImage t={t} />
      </div>
      {/* hero text */}
      <div style={box(b('text'))}>
        <div style={{fontSize: lerp(13, 11, m), letterSpacing: '0.22em', color: '#8a7a63', fontWeight: 600, opacity: heroIn(8)}}>ARQUITETURA &amp; INTERIORES</div>
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: lerp(60, 34, m),
            lineHeight: 1.04,
            letterSpacing: '-0.03em',
            fontWeight: 600,
            marginTop: lerp(18, 10, m),
            opacity: heroIn(12),
            transform: `translateY(${(1 - heroIn(12)) * 20}px)`,
          }}
        >
          Espaços que traduzem quem você é.
        </div>
        <div style={{fontSize: lerp(18, 15, m), lineHeight: 1.5, color: '#5a5e68', marginTop: lerp(20, 12, m), opacity: heroIn(18)}}>
          Projetos autorais para residências e empresas, com atendimento próximo do primeiro traço à entrega.
        </div>
      </div>
      {/* CTAs */}
      <div style={box(b('ctas'), {display: 'flex', flexDirection: m > 0.5 ? 'column' : 'row', gap: 14, opacity: heroIn(22)})}>
        <div style={{background: '#16181d', color: '#fff', borderRadius: 999, padding: '0 28px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontWeight: 600, fontSize: 16, flex: m > 0.5 ? undefined : '0 0 auto'}}>
          Solicitar orçamento <Icon name="arrow" size={18} color="#fff" />
        </div>
        <div style={{border: '1.5px solid #16181d', borderRadius: 999, padding: '0 28px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16}}>Ver projetos</div>
      </div>
      {/* services */}
      {(['s1', 's2', 's3'] as const).map((k, i) => (
        <div key={k} style={box(b(k), {background: '#fff', borderRadius: 18, padding: lerp(28, 18, m), boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', opacity: heroIn(28 + i * 4)})}>
          <div style={{width: 40, height: 40, borderRadius: 12, background: '#efe9df', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: lerp(18, 10, m)}}>
            <Icon name={(['grid', 'users', 'box'] as const)[i]} size={20} color="#8a7a63" />
          </div>
          <div style={{fontSize: lerp(20, 17, m), fontWeight: 600}}>{SERV[i].t}</div>
          <div style={{fontSize: lerp(15, 13, m), color: '#6a6e78', marginTop: 6, lineHeight: 1.45}}>{SERV[i].d}</div>
        </div>
      ))}
    </div>
  );
};

/* ---------------------------------- devices --------------------------------- */

/** Browser chrome around content. */
export const BrowserFrame: React.FC<{w: number; h: number; url: string; children: React.ReactNode; chrome?: number}> = ({w, h, url, children, chrome = 1}) => (
  <div style={{width: w, height: h, borderRadius: 16, overflow: 'hidden', background: '#1b1b1f', position: 'relative'}}>
    <div style={{height: 52 * chrome, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', opacity: chrome, overflow: 'hidden'}}>
      {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
        <div key={c} style={{width: 12, height: 12, borderRadius: 12, background: c, opacity: 0.85}} />
      ))}
      <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
        <div style={{background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '7px 60px', display: 'flex', alignItems: 'center', gap: 8}}>
          <Icon name="globe" size={14} color={COLORS.gray} />
          <Label size={14} color="#d4d4d8">
            {url}
          </Label>
        </div>
      </div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 52 * chrome, bottom: 0, overflow: 'hidden'}}>{children}</div>
  </div>
);

export const PhoneFrame: React.FC<{w: number; h: number; children: React.ReactNode}> = ({w, h, children}) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: w * 0.16,
      padding: w * 0.035,
      boxSizing: 'border-box',
      background: 'linear-gradient(145deg,#4a4a52,#1c1c20 40%,#0d0d10)',
      boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.18), inset 0 0 0 6px #0a0a0c, 0 60px 120px rgba(0,0,0,0.7)',
      position: 'relative',
    }}
  >
    <div style={{width: '100%', height: '100%', borderRadius: w * 0.13, overflow: 'hidden', position: 'relative', background: '#000'}}>
      {children}
      <div style={{position: 'absolute', top: 12, left: '50%', marginLeft: -w * 0.14, width: w * 0.28, height: 30, borderRadius: 20, background: '#000'}} />
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(125deg, rgba(255,255,255,0.12), transparent 35%)', pointerEvents: 'none'}} />
    </div>
  </div>
);

/** Opportunity notification (quote request, contact, message). */
export const Opportunity: React.FC<{icon: 'quote' | 'mail' | 'chat'; title: string; sub: string; time: string}> = ({icon, title, sub, time}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      borderRadius: 22,
      background: 'linear-gradient(160deg, rgba(40,40,46,0.92), rgba(18,18,22,0.95))',
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.08), 0 30px 80px rgba(0,0,0,0.6)`,
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      padding: '0 24px',
      boxSizing: 'border-box',
      fontFamily: FONTS.sans,
    }}
  >
    <div style={{width: 52, height: 52, borderRadius: 16, background: 'rgba(81,112,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
      <Icon name={icon} size={26} color={COLORS.accentSoft} />
    </div>
    <div style={{flex: 1, minWidth: 0}}>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <Label size={19} color={COLORS.white} weight={600}>
          {title}
        </Label>
        <Label size={13}>{time}</Label>
      </div>
      <Label size={15} color="#c4c4cc" style={{marginTop: 4}}>
        {sub}
      </Label>
    </div>
  </div>
);
