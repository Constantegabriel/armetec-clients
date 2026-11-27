import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {camPath, type CamKey} from '../animations/camera';
import {combine, dissolveOut, focusIn, riseIn} from '../animations/kinetic';
import {CssWorld, Group, Plane} from '../components/CssWorld';
import {VolumetricBeams} from '../components/Light';
import {COLORS} from '../config/theme';
import {AutomationFlow} from '../interfaces/Platform';
import {BrowserFrame, Opportunity, PhoneFrame, SITE, Website} from '../interfaces/Website';
import {SplitText} from '../typography/SplitText';
import {EASE} from '../utils/easing';
import {useLayout} from '../utils/layout';
import {clamp, lerp} from '../utils/math';
import {beat, prog, sec} from '../utils/time';
import {S5_FINAL_DISTANCE, S5_TARGET_Y, stationSize} from './S05Platform';

/**
 * SCENE 06 — the last system interface becomes a browser window; the camera
 * pulls back to a laptop; a phone rises and the very same layout reflows to
 * mobile; real business opportunities arrive.
 */
const S6 = beat('s06_browser');
const LAP = beat('s06_laptop');
const PHONE = beat('s06_phone');
const OPP = beat('s06_opportunities');
const END = sec(55);

const LW = 1560;
const LH = 1000;
const SCREEN = {w: 1440, h: 900};
const BD = 980;

const Laptop: React.FC<{children: React.ReactNode; reveal: number}> = ({children, reveal}) => (
  <Group>
    {/* base deck (lies flat, hinge at z=0) */}
    <Plane x={0} y={LH / 2 + 4} z={BD / 2} rx={90} w={LW + 30} h={BD} opacity={reveal} sharp>
      <div style={{width: '100%', height: '100%', borderRadius: '0 0 40px 40px', background: 'linear-gradient(180deg,#2c2c31,#1d1d21 60%,#151518)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.08)', position: 'relative'}}>
        <div style={{position: 'absolute', left: 90, right: 90, top: 70, height: 470, display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 10}}>
          {Array.from({length: 14 * 6}, (_, i) => (
            <div key={i} style={{borderRadius: 8, background: 'linear-gradient(180deg,#121214,#0b0b0d)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'}} />
          ))}
        </div>
        <div style={{position: 'absolute', left: '50%', marginLeft: -300, width: 600, top: 590, height: 340, borderRadius: 26, background: 'linear-gradient(180deg,#26262b,#1f1f23)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.07)'}} />
      </div>
    </Plane>
    <Plane x={0} y={LH / 2 + 16} z={BD} w={LW + 30} h={24} opacity={reveal} sharp>
      <div style={{width: '100%', height: '100%', borderRadius: '0 0 18px 18px', background: 'linear-gradient(180deg,#3a3a40,#121214)'}} />
    </Plane>
    {/* lid */}
    <Plane x={0} y={0} z={0} w={LW} h={LH} opacity={reveal} sharp>
      <div style={{width: '100%', height: '100%', borderRadius: 40, background: 'linear-gradient(180deg,#0c0c0e,#060607)', boxShadow: 'inset 0 0 0 3px #2a2a30, inset 0 0 0 5px #0a0a0c, 0 80px 160px rgba(0,0,0,0.7)'}} />
    </Plane>
    <Plane x={0} y={0} z={2} w={SCREEN.w} h={SCREEN.h} sharp>
      {children}
    </Plane>
  </Group>
);

const Headline: React.FC<{f: number; at: number; out: number; a: string; b: string}> = ({f, at, out, a, b}) => {
  const L = useLayout();
  const s = L.u;
  if (f < at - 5 || f > out + 30) return null;
  const top = L.vertical ? -L.height / 2 + L.safe.top + 70 * s : -L.height / 2 + 110 * s;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{position: 'absolute', transform: `translateY(${top}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <SplitText text={a} size={(L.vertical ? 44 : 40) * s} weight={300} tracking={0.3} color={COLORS.gray} state={combine(focusIn(f, at, {spread: 0.3}), dissolveOut(f, out))} />
        <SplitText
          text={b}
          size={(L.vertical ? 100 : 92) * s}
          weight={700}
          tracking={-0.015}
          state={combine(riseIn(f, at + 10, {stagger: 1.5}), dissolveOut(f, out + 2, {stagger: 0.5}))}
          prevState={combine(riseIn(f - 1, at + 10, {stagger: 1.5}), dissolveOut(f - 1, out + 2, {stagger: 0.5}))}
        />
      </div>
    </AbsoluteFill>
  );
};

export const S06Digital: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame() + from;
  const L = useLayout();
  const v = L.vertical;
  const {panel} = stationSize(v);
  const d0 = S5_FINAL_DISTANCE(v);
  const ty = S5_TARGET_Y(v);

  const keys: CamKey[] = [
    // identical framing to the end of scene 05 (the automation panel)
    {f: from, pos: [0, ty, d0], target: [0, ty, 0], lens: 35, aperture: 0.8},
    {f: S6 + 8, pos: [0, ty, d0], target: [0, ty, 0], lens: 35, aperture: 0.8},
    // pull-back reveal of the laptop (slightly high, looking down onto the deck)
    {f: PHONE - 10, pos: v ? [-260, -620, 3600] : [-420, -520, 2900], target: v ? [140, 260, 300] : [160, 200, 300], lens: 35, aperture: 0.7, ease: EASE.out},
    {f: END + 20, pos: v ? [-120, -560, 3200] : [-260, -460, 2600], target: v ? [200, 320, 300] : [240, 240, 300], lens: 35, aperture: 0.8, ease: EASE.inOut},
  ];
  const cam = camPath(f, keys, 2);

  // panel → browser morph (size, chrome, content)
  const morph = EASE.inOut(prog(f, S6 + 4, S6 + 46, EASE.linear));
  const w = lerp(panel.w, SCREEN.w, morph);
  const h = lerp(panel.h, SCREEN.h, morph);
  const siteScale = SCREEN.w / SITE.desktop.w;
  const reveal = prog(f, LAP - 6, LAP + 40, EASE.out);

  // phone + responsive reflow
  const phoneIn = EASE.out(prog(f, PHONE - 20, PHONE + 30, EASE.linear));
  const reflow = prog(f, PHONE + 6, PHONE + 70, EASE.linear);
  const phoneW = 440;
  const phoneH = 900;
  const phonePos = v ? {x: 330, y: 360, z: 900} : {x: 980, y: 230, z: 620};
  const siteT = f - S6 - 20;
  const scroll = prog(f, OPP, END, EASE.inOut) * 260;

  const opps = [
    {icon: 'quote' as const, title: 'Nova solicitação de orçamento', sub: 'Projeto residencial · 180 m²', time: 'agora'},
    {icon: 'mail' as const, title: 'Novo contato pelo site', sub: 'Formulário · Espaços corporativos', time: '1 min'},
    {icon: 'chat' as const, title: 'Mensagem recebida', sub: '“Gostaria de agendar uma visita.”', time: '2 min'},
  ];

  return (
    <AbsoluteFill style={{background: COLORS.black}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 100% 70% at 50% 110%, rgba(81,112,255,0.22), rgba(16,20,36,0.35) 45%, transparent 75%)'}} />
      <VolumetricBeams opacity={0.35} angle={-18} />
      <CssWorld cam={cam}>
        <Laptop reveal={reveal}>
          <div style={{width: SCREEN.w, height: SCREEN.h, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{width: w, height: h, position: 'relative', flexShrink: 0}}>
              {/* outgoing system interface */}
              {morph < 1 ? (
                <div style={{position: 'absolute', inset: 0, opacity: 1 - clamp(morph * 1.6)}}>
                  <AutomationFlow w={panel.w} h={panel.h} t={9999} vertical={v} />
                </div>
              ) : null}
              <div style={{position: 'absolute', inset: 0, opacity: clamp(morph * 1.6 - 0.3)}}>
                <BrowserFrame w={w} h={h} url="verticearquitetura.com.br" chrome={morph}>
                  <div style={{transform: `scale(${siteScale})`, transformOrigin: '0 0'}}>
                    <Website m={0} t={siteT} scroll={scroll * 0.6} />
                  </div>
                </BrowserFrame>
              </div>
            </div>
          </div>
        </Laptop>
      </CssWorld>

      {/* devices + opportunities live on their own layer: always in front of the laptop, never intersecting it */}
      <CssWorld cam={cam}>
        {/* the layout lifts off the screen and reflows into the phone */}
        {phoneIn > 0 ? (
          <Plane x={lerp(0, phonePos.x, phoneIn)} y={lerp(80, phonePos.y, phoneIn)} z={lerp(-200, phonePos.z, phoneIn)} ry={lerp(0, -14, phoneIn)} w={phoneW} h={phoneH} opacity={clamp(phoneIn * 2)}>
            <PhoneFrame w={phoneW} h={phoneH}>
              <div style={{transform: `scale(${(phoneW * 0.93) / lerp(SITE.desktop.w, SITE.mobile.w, EASE.inOut(reflow))})`, transformOrigin: '0 0', paddingTop: 0}}>
                <div style={{paddingTop: 44 * (1 - 0)}}>
                  <Website m={reflow} t={siteT} scroll={scroll} />
                </div>
              </div>
            </PhoneFrame>
          </Plane>
        ) : null}

        {opps.map((o, i) => {
          const a = EASE.out(prog(f, OPP + i * 16, OPP + i * 16 + 30, EASE.linear));
          if (a <= 0) return null;
          const base = v ? {x: -260, y: 560 + i * 140, z: 1150} : {x: -520, y: -280 + i * 140, z: 1000};
          return (
            <Plane key={i} x={base.x} y={base.y + (1 - a) * 80} z={base.z} ry={v ? 6 : 10} w={620} h={118} opacity={a} sharp>
              <Opportunity {...o} />
            </Plane>
          );
        })}
      </CssWorld>

      <Headline f={f} at={S6 + 40} out={OPP - 30} a="PRESENÇA" b="DIGITAL" />
      <Headline f={f} at={OPP - 6} out={END - 30} a="NOVAS" b="OPORTUNIDADES" />
    </AbsoluteFill>
  );
};
