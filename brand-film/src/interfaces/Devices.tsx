import React from 'react';
import {Group, Plane} from '../components/CssWorld';

/**
 * Premium devices built as real 3D volumes in the CSS camera space: front glass
 * with bezel, metal side bands (with light catching the edge depending on the
 * viewing angle), back plate. Screens are live DOM — fully animated interfaces.
 */

const metal = (angle: number) => {
  // a moving specular band across the frame as the device turns
  const p = 50 + Math.sin((angle * Math.PI) / 180) * 40;
  return `linear-gradient(90deg, #2a2a2f 0%, #5c5c64 ${p - 18}%, #d9d9df ${p}%, #5c5c64 ${p + 18}%, #26262a 100%)`;
};

type Pose = {x: number; y: number; z: number; rx?: number; ry?: number; rz?: number; scale?: number};

/** Generic slab: w x h face, depth d, corner radius r. */
const Slab: React.FC<Pose & {w: number; h: number; d: number; r: number; screen: React.ReactNode; inset: number; opacity?: number; light?: number}> = ({
  w,
  h,
  d,
  r,
  screen,
  inset,
  opacity = 1,
  light = 0,
  ...p
}) => {
  const ry = p.ry ?? 0;
  return (
    <Group x={p.x} y={p.y} z={p.z} rx={p.rx} ry={ry} rz={p.rz} scale={p.scale}>
      {/* back */}
      <Plane x={0} y={0} z={-d / 2} ry={180} w={w} h={h} opacity={opacity} sharp>
        <div style={{width: '100%', height: '100%', borderRadius: r, background: 'linear-gradient(150deg,#3b3b41,#1d1d21 60%,#131316)'}} />
      </Plane>
      {/* sides (inset by the corner radius so rounded corners read cleanly) */}
      <Plane x={w / 2} y={0} z={0} ry={90} w={d} h={h - r * 1.1} opacity={opacity} sharp>
        <div style={{width: '100%', height: '100%', background: metal(ry + 90), borderRadius: d / 2}} />
      </Plane>
      <Plane x={-w / 2} y={0} z={0} ry={-90} w={d} h={h - r * 1.1} opacity={opacity} sharp>
        <div style={{width: '100%', height: '100%', background: metal(ry - 90), borderRadius: d / 2}} />
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
            boxShadow: `inset 0 0 0 2px #7a7a82, inset 0 0 0 4px #1a1a1d, 0 ${h * 0.06}px ${h * 0.12}px rgba(0,0,0,0.55)`,
            padding: inset,
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          <div style={{width: '100%', height: '100%', borderRadius: Math.max(6, r - inset), overflow: 'hidden', position: 'relative', background: '#000'}}>
            {screen}
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

export const PHONE = {w: 410, h: 880, d: 30, r: 66, inset: 14};
export const TABLET = {w: 1120, h: 820, d: 22, r: 44, inset: 26};

export const Phone: React.FC<Pose & {screen: React.ReactNode; opacity?: number; light?: number}> = (p) => (
  <Slab {...p} w={PHONE.w} h={PHONE.h} d={PHONE.d} r={PHONE.r} inset={PHONE.inset} />
);
export const Tablet: React.FC<Pose & {screen: React.ReactNode; opacity?: number; light?: number}> = (p) => (
  <Slab {...p} w={TABLET.w} h={TABLET.h} d={TABLET.d} r={TABLET.r} inset={TABLET.inset} />
);

export const LAPTOP = {w: 1560, h: 1000, screenW: 1440, screenH: 900, deck: 980};

/** Laptop: lid (live screen) + keyboard deck + front lip. Hinge at the lid's bottom edge. */
export const Laptop: React.FC<Pose & {screen: React.ReactNode; opacity?: number}> = ({screen, opacity = 1, ...p}) => (
  <Group x={p.x} y={p.y} z={p.z} rx={p.rx} ry={p.ry} rz={p.rz} scale={p.scale}>
    <Plane x={0} y={LAPTOP.h / 2 + 4} z={LAPTOP.deck / 2} rx={90} w={LAPTOP.w + 30} h={LAPTOP.deck} opacity={opacity} sharp>
      <div style={{width: '100%', height: '100%', borderRadius: '0 0 40px 40px', background: 'linear-gradient(180deg,#2c2c31,#1d1d21 60%,#151518)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.08)', position: 'relative'}}>
        <div style={{position: 'absolute', left: 90, right: 90, top: 70, height: 470, display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 10}}>
          {Array.from({length: 14 * 6}, (_, i) => (
            <div key={i} style={{borderRadius: 8, background: 'linear-gradient(180deg,#121214,#0b0b0d)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'}} />
          ))}
        </div>
        <div style={{position: 'absolute', left: '50%', marginLeft: -300, width: 600, top: 590, height: 340, borderRadius: 26, background: 'linear-gradient(180deg,#26262b,#1f1f23)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.07)'}} />
      </div>
    </Plane>
    <Plane x={0} y={LAPTOP.h / 2 + 16} z={LAPTOP.deck} w={LAPTOP.w + 30} h={24} opacity={opacity} sharp>
      <div style={{width: '100%', height: '100%', borderRadius: '0 0 18px 18px', background: 'linear-gradient(180deg,#5a5a62,#121214)'}} />
    </Plane>
    <Plane x={0} y={0} z={-8} ry={180} w={LAPTOP.w} h={LAPTOP.h} opacity={opacity} sharp>
      <div style={{width: '100%', height: '100%', borderRadius: 40, background: 'linear-gradient(150deg,#3a3a40,#1b1b1f)'}} />
    </Plane>
    <Plane x={0} y={0} z={0} w={LAPTOP.w} h={LAPTOP.h} opacity={opacity} sharp>
      <div style={{width: '100%', height: '100%', borderRadius: 40, background: '#060607', boxShadow: 'inset 0 0 0 3px #3a3a40, inset 0 0 0 5px #0a0a0c, 0 80px 160px rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
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
