import React from 'react';
import {Group, Plane} from '../components/CssWorld';

/**
 * Premium devices built as real 3D volumes in the CSS camera space: front glass
 * with bezel, metal side bands (with light catching the edge depending on the
 * viewing angle), back plate. Screens are live DOM — fully animated interfaces.
 */

const metal = (angle: number, tone: 'titanium' | 'silver' = 'titanium') => {
  // a moving specular band across the frame as the device turns
  const p = 50 + Math.sin((angle * Math.PI) / 180) * 40;
  return tone === 'silver'
    ? `linear-gradient(90deg, #8d9096 0%, #c9ccd1 ${p - 18}%, #f4f5f7 ${p}%, #c9ccd1 ${p + 18}%, #8a8d93 100%)`
    : `linear-gradient(90deg, #3a3936 0%, #6f6c66 ${p - 18}%, #d8d4cc ${p}%, #6f6c66 ${p + 18}%, #34332f 100%)`;
};

type Pose = {x: number; y: number; z: number; rx?: number; ry?: number; rz?: number; scale?: number};

/** Generic slab: w x h face, depth d, corner radius r. */
const Slab: React.FC<Pose & {w: number; h: number; d: number; r: number; screen: React.ReactNode; inset: number; opacity?: number; light?: number; island?: boolean; cameras?: boolean}> = ({
  w,
  h,
  d,
  r,
  screen,
  inset,
  opacity = 1,
  light = 0,
  island,
  cameras,
  ...p
}) => {
  const ry = p.ry ?? 0;
  return (
    <Group x={p.x} y={p.y} z={p.z} rx={p.rx} ry={ry} rz={p.rz} scale={p.scale}>
      {/* back */}
      <Plane x={0} y={0} z={-d / 2} ry={180} w={w} h={h} opacity={opacity} sharp>
        <div style={{width: '100%', height: '100%', borderRadius: r, background: 'linear-gradient(150deg,#5a5853,#3a3935 55%,#2b2a27)', position: 'relative'}}>
          {cameras ? (
            <div style={{position: 'absolute', right: w * 0.06, top: w * 0.06, width: w * 0.42, height: w * 0.42, borderRadius: w * 0.11, background: 'linear-gradient(150deg,#4a4945,#2a2926)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.12), 0 6px 14px rgba(0,0,0,0.5)'}}>
              {[
                [0.27, 0.27],
                [0.27, 0.73],
                [0.73, 0.5],
              ].map(([x, y], i) => (
                <div key={i} style={{position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, width: w * 0.15, height: w * 0.15, marginLeft: -w * 0.075, marginTop: -w * 0.075, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #3c4a6a, #07080c 55%)', boxShadow: '0 0 0 4px #1b1b1d, 0 0 0 6px #6b6a66'}} />
              ))}
            </div>
          ) : null}
        </div>
      </Plane>
      {/* sides (inset by the corner radius so rounded corners read cleanly) */}
      <Plane x={w / 2} y={0} z={0} ry={90} w={d} h={h - r * 1.1} opacity={opacity} sharp>
        <div style={{width: '100%', height: '100%', background: metal(ry + 90), borderRadius: d / 2, position: 'relative'}}>
          {island ? <div style={{position: 'absolute', left: '22%', right: '22%', top: '22%', height: '11%', borderRadius: 6, background: metal(ry + 70), boxShadow: '0 0 0 1px rgba(0,0,0,0.35)'}} /> : null}
        </div>
      </Plane>
      <Plane x={-w / 2} y={0} z={0} ry={-90} w={d} h={h - r * 1.1} opacity={opacity} sharp>
        <div style={{width: '100%', height: '100%', background: metal(ry - 90), borderRadius: d / 2, position: 'relative'}}>
          {island
            ? [
                [0.14, 0.05],
                [0.24, 0.09],
                [0.36, 0.09],
              ].map(([t, hh], i) => <div key={i} style={{position: 'absolute', left: '22%', right: '22%', top: `${t * 100}%`, height: `${hh * 100}%`, borderRadius: 6, background: metal(ry - 70), boxShadow: '0 0 0 1px rgba(0,0,0,0.35)'}} />)
            : null}
        </div>
      </Plane>
      <Plane x={0} y={-h / 2} z={0} rx={90} w={w - r * 1.1} h={d} opacity={opacity} sharp>
        <div style={{width: '100%', height: '100%', background: metal(ry), borderRadius: d / 2}} />
      </Plane>
      <Plane x={0} y={h / 2} z={0} rx={-90} w={w - r * 1.1} h={d} opacity={opacity} sharp>
        <div style={{width: '100%', height: '100%', background: metal(ry + 30), borderRadius: d / 2}} />
      </Plane>
      {/* front: frame ring + glass + live screen */}
      <Plane x={0} y={0} z={d / 2} w={w} h={h} opacity={opacity} sharp>
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: r,
            background: '#050506',
            boxShadow: `inset 0 0 0 2px #8a877f, inset 0 0 0 4px #1a1a1d, 0 ${h * 0.06}px ${h * 0.12}px rgba(0,0,0,0.55)`,
            padding: inset,
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          <div style={{width: '100%', height: '100%', borderRadius: Math.max(6, r - inset), overflow: 'hidden', position: 'relative', background: '#000'}}>
            {screen}
            {island ? <div style={{position: 'absolute', left: '50%', top: 11, width: w * 0.3, height: 34, marginLeft: -w * 0.15, borderRadius: 20, background: '#000', zIndex: 30}} /> : null}
            {/* glass reflection, moves with the device angle */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `linear-gradient(${115 + ry * 0.6}deg, rgba(255,255,255,${0.1 + light * 0.08}) 0%, rgba(255,255,255,0.02) 32%, transparent 45%)`,
              }}
            />
          </div>
        </div>
      </Plane>
    </Group>
  );
};

/** iPhone-class proportions (≈19.5:9), titanium frame, Dynamic Island, thin bezels. */
export const PHONE = {w: 410, h: 888, d: 30, r: 70, inset: 12};
export const TABLET = {w: 1120, h: 820, d: 22, r: 44, inset: 26};

export const Phone: React.FC<Pose & {screen: React.ReactNode; opacity?: number; light?: number}> = (p) => (
  <Slab {...p} w={PHONE.w} h={PHONE.h} d={PHONE.d} r={PHONE.r} inset={PHONE.inset} island cameras />
);
export const Tablet: React.FC<Pose & {screen: React.ReactNode; opacity?: number; light?: number}> = (p) => (
  <Slab {...p} w={TABLET.w} h={TABLET.h} d={TABLET.d} r={TABLET.r} inset={TABLET.inset} />
);

export const LAPTOP = {w: 1560, h: 1000, screenW: 1440, screenH: 900, deck: 980};

/** Laptop: lid (live screen) + keyboard deck + front lip. Hinge at the lid's bottom edge. */
export const Laptop: React.FC<Pose & {screen: React.ReactNode; opacity?: number}> = ({screen, opacity = 1, ...p}) => (
  <Group x={p.x} y={p.y} z={p.z} rx={p.rx} ry={p.ry} rz={p.rz} scale={p.scale}>
    <Plane x={0} y={LAPTOP.h / 2 + 4} z={LAPTOP.deck / 2} rx={90} w={LAPTOP.w + 30} h={LAPTOP.deck} opacity={opacity} sharp>
      <div style={{width: '100%', height: '100%', borderRadius: '0 0 40px 40px', background: 'linear-gradient(180deg,#d3d5d9,#b9bcc1 60%,#a7aab0)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.35)', position: 'relative'}}>
        <div style={{position: 'absolute', left: 90, right: 90, top: 70, height: 470, display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 10}}>
          {Array.from({length: 14 * 6}, (_, i) => (
            <div key={i} style={{borderRadius: 8, background: 'linear-gradient(180deg,#1c1c1f,#0e0e10)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)'}} />
          ))}
        </div>
        <div style={{position: 'absolute', left: '50%', marginLeft: -300, width: 600, top: 590, height: 340, borderRadius: 26, background: 'linear-gradient(180deg,#c6c9ce,#b3b6bb)', boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,0.12)'}} />
      </div>
    </Plane>
    <Plane x={0} y={LAPTOP.h / 2 + 16} z={LAPTOP.deck} w={LAPTOP.w + 30} h={24} opacity={opacity} sharp>
      <div style={{width: '100%', height: '100%', borderRadius: '0 0 18px 18px', background: 'linear-gradient(180deg,#e2e4e7,#8f9297)'}} />
    </Plane>
    <Plane x={0} y={0} z={-8} ry={180} w={LAPTOP.w} h={LAPTOP.h} opacity={opacity} sharp>
      <div style={{width: '100%', height: '100%', borderRadius: 40, background: 'linear-gradient(150deg,#d9dbde,#a9acb1)'}} />
    </Plane>
    <Plane x={0} y={0} z={0} w={LAPTOP.w} h={LAPTOP.h} opacity={opacity} sharp>
      <div style={{width: '100%', height: '100%', borderRadius: 40, background: '#060607', boxShadow: 'inset 0 0 0 3px #b9bcc1, inset 0 0 0 6px #0a0a0c, 0 80px 160px rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{width: LAPTOP.screenW, height: LAPTOP.screenH, borderRadius: 10, overflow: 'hidden', position: 'relative', background: '#000'}}>
          {screen}
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.07), transparent 38%)', pointerEvents: 'none'}} />
        </div>
      </div>
    </Plane>
  </Group>
);

/** Glossy floor with a soft light pool (gives devices a place to live). */
export const Floor: React.FC<{y: number; z: number; w: number; d: number; opacity?: number; warm?: number}> = ({y, z, w, d, opacity = 1, warm = 0}) => (
  <Plane x={0} y={y} z={z} rx={90} w={w} h={d} opacity={opacity} sharp>
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `radial-gradient(ellipse 45% 40% at 50% 50%, rgba(${warm ? '255,200,150' : '160,175,255'},0.16), rgba(20,20,24,0.6) 50%, rgba(5,5,5,0) 75%)`,
      }}
    />
  </Plane>
);

/* ------------------------------ desktop monitor ------------------------------ */

export const MONITOR = {w: 1880, h: 1260, chin: 170, screenW: 1800, screenH: 1012, stand: 420};

/**
 * All-in-one desktop (thin aluminium display with a chin, angled stand, foot).
 * Position = centre of the display panel; the foot rests MONITOR.stand + h/2 below.
 */
export const Monitor: React.FC<Pose & {screen: React.ReactNode; opacity?: number}> = ({screen, opacity = 1, ...p}) => {
  const {w, h, chin, stand} = MONITOR;
  return (
    <Group x={p.x} y={p.y} z={p.z} rx={p.rx} ry={p.ry} rz={p.rz} scale={p.scale}>
      {/* stand: neck + foot */}
      <Plane x={0} y={h / 2 + stand / 2 - 40} z={-70} rx={-12} w={420} h={stand + 80} opacity={opacity} sharp>
        <div style={{width: '100%', height: '100%', background: 'linear-gradient(180deg,#b9bcc1,#e8e9eb 50%,#9da0a6)', borderRadius: 6}} />
      </Plane>
      <Plane x={0} y={h / 2 + stand} z={40} rx={90} w={560} h={420} opacity={opacity} sharp>
        <div style={{width: '100%', height: '100%', background: 'radial-gradient(ellipse at 50% 40%, #eceef0, #b3b6bb)', borderRadius: 24}} />
      </Plane>
      {/* back */}
      <Plane x={0} y={0} z={-14} ry={180} w={w} h={h} opacity={opacity} sharp>
        <div style={{width: '100%', height: '100%', borderRadius: 30, background: 'linear-gradient(150deg,#e3e5e8,#aeb1b6)'}} />
      </Plane>
      {/* front: black glass + display + aluminium chin */}
      <Plane x={0} y={0} z={0} w={w} h={h} opacity={opacity} sharp>
        <div style={{width: '100%', height: '100%', borderRadius: 30, overflow: 'hidden', background: '#060607', boxShadow: '0 90px 180px rgba(0,0,0,0.65), inset 0 0 0 2px #1a1a1c', display: 'flex', flexDirection: 'column'}}>
          <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{width: MONITOR.screenW, height: MONITOR.screenH, overflow: 'hidden', position: 'relative', background: '#000', borderRadius: 6}}>
              {screen}
              <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.06), transparent 40%)', pointerEvents: 'none'}} />
            </div>
          </div>
          <div style={{height: chin, background: 'linear-gradient(180deg,#d7d9dc,#b4b7bc)'}} />
        </div>
      </Plane>
    </Group>
  );
};

/** Soft contact shadow on the floor under an object (grounds it, no floating). */
export const ContactShadow: React.FC<{x: number; y: number; z: number; w: number; d: number; opacity?: number}> = ({x, y, z, w, d, opacity = 1}) => (
  <Plane x={x} y={y - 1} z={z} rx={90} w={w} h={d} opacity={opacity} sharp>
    <div style={{width: '100%', height: '100%', background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.75), rgba(0,0,0,0.35) 45%, transparent 72%)'}} />
  </Plane>
);
