import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {camSmooth, type SmoothKey, type V3} from '../animations/camera';
import {CssWorld, Plane} from '../components/CssWorld';
import {COLORS, FONTS} from '../config/theme';
import {DAY_EVENTS, DayFeed, DigitalClock, KpiCard, REPORT, ReportDoc} from '../interfaces/DailyReport';
import {ContactShadow, Floor, Laptop, LAPTOP, Monitor, MONITOR, Phone, PHONE} from '../interfaces/Devices';
import {ChatAppIcon, HOME_ICON, HomeScreen, LockScreen, SCREEN, WhatsAppChat} from '../interfaces/PhoneScreens';
import {AppLaptop, AppPhone, type SyncState} from '../interfaces/SystemApps';
import {DesktopDashboard} from '../interfaces/DesktopDashboard';
import {Label} from '../interfaces/ui';
import {Title, eyebrow, keyline} from '../typography/Title';
import {EASE} from '../utils/easing';
import {useLayout} from '../utils/layout';
import {clamp, lerp} from '../utils/math';
import {beat, prog, sceneEnd} from '../utils/time';

/**
 * SCENES 06 + 07 — one continuous move.
 * 06 · Automatic daily reports: the day is recorded → 19:59:57 … 20:00 → the
 *      automation fires → indicators converge into a report built on screen →
 *      the report travels to a smartphone → notification → the chat opens.
 * 07 · Mobility: the same phone → home screen → tap the installed system (opens
 *      full screen, like a native app) → the environment changes around it
 *      (office → home) → desktop and notebook join → one sale flows through all
 *      three devices → final ecosystem composition.
 * All data is fictional and demonstrative.
 */
const S6 = beat('s06');
const CLOCK = beat('s06_clock');
const EIGHT = beat('s06_eight');
const REPORT_T = beat('s06_report');
const SEND = beat('s06_send');
const NOTIFY = beat('s06_notify');
const OPEN = beat('s06_open');
const S7 = beat('s07');
const HOME = beat('s07_home');
const TAP = beat('s07_tap');
const APP = beat('s07_open');
const ENV = beat('s07_env');
const DEVICES = beat('s07_devices');
const SALE = beat('s07_sale');
const STOCK = beat('s07_stock');
const NOTE = beat('s07_notify');
const TABLET_T = beat('s07_tablet');
const FINAL = beat('s07_final');
const END = sceneEnd('s07-mobilidade');

/* --------------------------------- staging --------------------------------- */

const useStaging = (v: boolean) => {
  const PH: V3 = [3400, 0, -1400];
  // studio set: everything rests on one floor (no floating devices)
  const FY = PH[1] + PHONE.h / 2;
  const LP: V3 = v ? [PH[0] - 1700, FY - LAPTOP.h / 2 - 4, PH[2] - 350] : [PH[0] - 2500, FY - LAPTOP.h / 2 - 4, PH[2] - 400];
  const TB: V3 = v ? [PH[0] - 650, FY - MONITOR.stand - MONITOR.h / 2, PH[2] - 1900] : [PH[0] - 1150, FY - MONITOR.stand - MONITOR.h / 2, PH[2] - 1700];
  const feed = v ? {x: 0, y: -330, w: 820, h: 640} : {x: -470, y: 0, w: 760, h: 640};
  const kpis = REPORT.lines.map((_, i) =>
    v ? {x: (i % 2 ? 1 : -1) * 215, y: 210 + Math.floor(i / 2) * 150} : {x: 300 + (i % 2) * 380, y: -230 + Math.floor(i / 2) * 160},
  );
  return {PH, LP, TB, FY, feed, kpis};
};

const rotY = (deg: number, d: number): V3 => [Math.sin((deg * Math.PI) / 180) * d, 0, Math.cos((deg * Math.PI) / 180) * d];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/* ------------------------------- environments ------------------------------ */

/** Abstract, defocused places (no stock imagery): office daylight ↔ warm home. */
/**
 * Product studio: dark cyclorama, a soft backlight behind the set (rim-lights
 * the devices), a lit horizon and a perspective floor grid fading into depth.
 */
const Studio: React.FC<{k: number}> = ({k}) =>
  k <= 0 ? null : (
    <AbsoluteFill style={{opacity: k, pointerEvents: 'none', overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #0e1016 0%, #0a0b10 52%, #050506 100%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 55% 30% at 50% 38%, rgba(120,140,255,0.22), rgba(81,112,255,0.06) 45%, transparent 75%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 6% at 50% 58%, rgba(200,210,255,0.16), transparent 70%)'}} />
      <div
        style={{
          position: 'absolute',
          left: '-60%',
          right: '-60%',
          top: '58%',
          height: '80%',
          transformOrigin: '50% 0%',
          transform: 'perspective(900px) rotateX(72deg)',
          backgroundImage:
            'linear-gradient(rgba(160,175,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(160,175,255,0.10) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), transparent 70%)',
          WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), transparent 70%)',
        }}
      />
    </AbsoluteFill>
  );

const Environment: React.FC<{home: number; yaw: number; strength: number}> = ({home, yaw, strength}) => {
  const L = useLayout();
  const px = -yaw * 9;
  const office = (1 - home) * strength;
  const warm = home * strength;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {/* office: tall window light, cool bokeh, desk edge */}
      <AbsoluteFill style={{opacity: office, transform: `translateX(${px}px)`}}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{position: 'absolute', left: `${-10 + i * 26}%`, top: '-5%', width: '11%', height: '78%', background: 'linear-gradient(180deg, rgba(190,205,255,0.20), rgba(150,170,230,0.05))', filter: 'blur(26px)'}} />
        ))}
        {Array.from({length: 14}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: `${(i * 37) % 100}%`, top: `${20 + ((i * 53) % 50)}%`, width: 40 + (i % 4) * 30, height: 40 + (i % 4) * 30, borderRadius: 200, background: 'rgba(170,190,255,0.10)', filter: 'blur(6px)'}} />
        ))}
        <div style={{position: 'absolute', left: 0, right: 0, top: L.vertical ? '72%' : '70%', height: 3, background: 'rgba(200,210,255,0.18)', filter: 'blur(2px)'}} />
      </AbsoluteFill>
      {/* home: lamp pool, warm bokeh, shelves */}
      <AbsoluteFill style={{opacity: warm, transform: `translateX(${px * 1.2}px)`}}>
        <div style={{position: 'absolute', left: '-15%', top: '5%', width: '70%', height: '60%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,190,130,0.32), transparent 65%)', filter: 'blur(20px)'}} />
        <div style={{position: 'absolute', right: '-10%', top: '30%', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,150,90,0.18), transparent 65%)', filter: 'blur(30px)'}} />
        {Array.from({length: 12}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: `${(i * 29 + 8) % 100}%`, top: `${15 + ((i * 41) % 55)}%`, width: 30 + (i % 3) * 40, height: 30 + (i % 3) * 40, borderRadius: 200, background: 'rgba(255,200,140,0.14)', filter: 'blur(7px)'}} />
        ))}
        {[0.28, 0.46].map((y) => (
          <div key={y} style={{position: 'absolute', left: '55%', right: '-5%', top: `${y * 100}%`, height: 6, background: 'rgba(255,215,170,0.14)', filter: 'blur(3px)'}} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------------------------- scene ---------------------------------- */

export const S06S07Connected: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame() + from;
  const L = useLayout();
  const v = L.vertical;
  const {PH, LP, TB, FY, feed, kpis} = useStaging(v);
  const d0 = v ? 1500 : 1350;
  const dPh = v ? 1750 : 1250; // phone medium shot
  const dClose = v ? 760 : 700; // chat close-up
  const lift = v ? -300 : -120; // compose the phone below the titles
  // close-ups always frame the WHOLE device (no cropped sides)
  const lp18 = rotY(22, v ? 3100 : 2150);
  const dIM = v ? 3600 : 2500;
  const mid: V3 = [v ? PH[0] - 800 : PH[0] - 1150, FY - 700, PH[2] - 700];
  const wide: V3 = add(mid, [0, v ? -500 : -380, v ? 5200 : 4100]);
  const keys: SmoothKey[] = [
    {f: from, pos: [140, -60, d0 + 500], target: [0, 0, 0], lens: 38, aperture: 0.7},
    {f: CLOCK - 12, pos: [-90, 30, d0], target: [0, 20, 0], lens: 38, aperture: 0.9},
    {f: EIGHT, pos: [0, -30, d0 - 200], target: [0, -20, 300], lens: 40, focus: d0 - 200 - 300, aperture: 1.4},
    {f: REPORT_T + 20, pos: [20, 40, d0 + 150], target: [0, 40, 300], lens: 40, aperture: 1},
    {f: SEND, pos: [40, 20, d0], target: [0, 20, 300], lens: 40, aperture: 1},
    // follow the report to the phone (crane arc)
    {f: SEND + 30, pos: [PH[0] * 0.45, -560, PH[2] * 0.45 + 1150], target: [PH[0] * 0.5, -300, PH[2] * 0.5], lens: 40, roll: -2, aperture: 0.8},
    {f: NOTIFY - 4, pos: add(PH, [-140, lift, dPh]), target: add(PH, [0, lift * 0.85, 0]), lens: 40, aperture: 1.3},
    // the message is opened: cinematic push-in
    {f: OPEN + 24, pos: add(PH, [0, -10, dClose]), target: add(PH, [0, 0, 0]), lens: 40, aperture: 1.6},
    {f: S7 - 10, pos: add(PH, [30, -20, dClose - 30]), target: add(PH, [0, 0, 0]), lens: 40, aperture: 1.6},
    // pull back: home screen, tap, the system opens
    {f: HOME + 10, pos: add(PH, [0, lift, dPh - 120]), target: add(PH, [0, lift * 0.85, 0]), lens: 40, aperture: 1.3},
    {f: APP + 40, pos: add(PH, [-90, lift, dPh - 220]), target: add(PH, [0, lift * 0.85, 0]), lens: 40, aperture: 1.3},
    // orbit: the place changes around the phone
    {f: ENV + 100, pos: add(PH, add(rotY(34, dPh), [0, lift - 40, 0])), target: add(PH, [0, lift * 0.85, 0]), lens: 42, aperture: 1.4},
    // reveal the studio: desktop centre, notebook left, phone right
    {f: DEVICES + 50, pos: wide, target: mid, lens: 36, aperture: 0.7, stop: true},
    // zoom into the desktop
    {f: DEVICES + 110, pos: add(TB, [160, -120, dIM]), target: add(TB, [0, 150, 0]), lens: 40, aperture: 0.6},
    // one sale flows through the devices: notebook → phone → desktop
    {f: SALE - 8, pos: add(LP, add(lp18, [0, -520, 0])), target: add(LP, [0, 260, 320]), lens: 40, aperture: 0.6, stop: true},
    {f: STOCK + 16, pos: add(LP, add(lp18, [60, -500, -160])), target: add(LP, [0, 260, 320]), lens: 40, aperture: 0.6},
    {f: NOTE + 8, pos: add(PH, [140, -80, v ? 1550 : 1150]), target: add(PH, [0, -90, 0]), lens: 40, aperture: 1.3, stop: true},
    {f: TABLET_T + 22, pos: add(TB, [160, -120, dIM - 150]), target: add(TB, [0, 150, 0]), lens: 40, aperture: 0.6, stop: true},
    // final composition: zoom out, slow orbit around the integrated set
    {f: FINAL + 40, pos: add(wide, [-260, 0, 0]), target: mid, lens: 36, aperture: 0.7},
    {f: END + 20, pos: add(wide, [240, 40, -160]), target: mid, lens: 36, aperture: 0.7},
  ];
  const cam = camSmooth(f, keys, 2);

  /* ------------------------------ ops (scene 6) ------------------------------ */
  const shown = clamp((f - S6 - 10) / ((CLOCK - S6 - 30) / DAY_EVENTS.length), 0, DAY_EVENTS.length);
  const opsFade = 1 - prog(f, SEND + 6, SEND + 40, EASE.inOut);
  const clockIn = EASE.out(prog(f, CLOCK - 6, CLOCK + 24, EASE.linear)) * (1 - prog(f, REPORT_T - 10, REPORT_T + 20, EASE.inOut));
  const tick = 57 + clamp((f - CLOCK) / (EIGHT - CLOCK)) * 3;
  const fire = prog(f, EIGHT, EIGHT + 40, EASE.out);
  const converge = EASE.dolly(prog(f, EIGHT + 12, REPORT_T + 10, EASE.linear));
  const build = prog(f, REPORT_T, SEND - 6, EASE.linear);
  const toCapsule = EASE.inOut(prog(f, SEND - 8, SEND + 10, EASE.linear));
  const fly = EASE.inOut(prog(f, SEND + 6, NOTIFY - 6, EASE.linear));
  const capsuleOn = f >= SEND && f < NOTIFY;
  const capPos: V3 = [lerp(0, PH[0], fly), lerp(40, PH[1] - 120, fly) - Math.sin(fly * Math.PI) * 420, lerp(300, PH[2] + 40, fly)];

  /* ------------------------------ phone screen ------------------------------- */
  const notify = prog(f, NOTIFY, NOTIFY + 22, EASE.linear);
  const openChat = EASE.inOut(prog(f, OPEN, OPEN + 22, EASE.linear));
  const reveal = prog(f, OPEN + 18, S7 - 20, EASE.linear);
  const homeK = EASE.inOut(prog(f, HOME - 6, HOME + 22, EASE.linear));
  const tapPress = f >= TAP && f < TAP + 18 ? (f - TAP) / 18 : 0;
  const appK = EASE.dolly(prog(f, APP, APP + 30, EASE.linear));
  const sync: SyncState = {
    sale: prog(f, SALE - 10, SALE + 30, EASE.linear),
    stock: prog(f, STOCK, STOCK + 26, EASE.linear),
    notify: prog(f, NOTE, NOTE + 24, EASE.linear),
    finance: prog(f, TABLET_T, TABLET_T + 50, EASE.linear),
    frame: f,
  };
  const phoneScreen = (
    <div style={{width: SCREEN.w, height: SCREEN.h, position: 'relative', overflow: 'hidden'}}>
      {f < S7 + 60 ? (
        <>
          <LockScreen notify={notify} />
          {openChat > 0 ? (
            <div style={{position: 'absolute', inset: 0, transformOrigin: '50% 40%', transform: `scale(${0.9 + 0.1 * openChat}) translateY(${-homeK * 120}px)`, opacity: openChat * (1 - homeK), borderRadius: 24, overflow: 'hidden'}}>
              <WhatsAppChat reveal={reveal} />
            </div>
          ) : null}
        </>
      ) : null}
      {homeK > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: homeK}}>
          <HomeScreen tapPress={tapPress} highlight={prog(f, TAP - 30, TAP, EASE.linear) * (1 - appK)} />
        </div>
      ) : null}
      {appK > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: `${HOME_ICON.x}px ${HOME_ICON.y}px`,
            transform: `scale(${lerp(0.17, 1, appK)})`,
            borderRadius: lerp(60, 0, appK),
            overflow: 'hidden',
            opacity: clamp(appK * 3),
          }}
        >
          <AppPhone s={sync} open={prog(f, APP + 16, APP + 46, EASE.linear)} />
        </div>
      ) : null}
    </div>
  );
  const phoneIn = EASE.out(prog(f, SEND + 10, NOTIFY - 10, EASE.linear));
  const devIn = (d: number) => EASE.out(prog(f, DEVICES + d, DEVICES + d + 60, EASE.linear));
  // isolation: while one device is in close-up, the others step out of frame softly
  const iso = (a: number, b: number) => prog(f, a - 18, a, EASE.inOut) * (1 - prog(f, b, b + 18, EASE.inOut));
  const isoMon = Math.max(iso(DEVICES + 80, SALE - 38), iso(TABLET_T - 12, FINAL + 6));
  const isoLap = iso(SALE - 30, NOTE - 30);
  const isoPh = iso(NOTE - 18, TABLET_T - 24);
  const showLap = 1 - Math.max(isoMon, isoPh);
  const showMon = 1 - Math.max(isoLap, isoPh);
  const showPh = f < DEVICES ? 1 : 1 - Math.max(isoMon, isoLap);
  const envMix = prog(f, ENV, ENV + 90, EASE.inOut);
  const envStrength = prog(f, SEND + 20, NOTIFY, EASE.inOut) * (1 - prog(f, DEVICES - 30, DEVICES + 40, EASE.inOut));
  const studio = prog(f, DEVICES - 40, DEVICES + 40, EASE.inOut);
  const phoneRy = -8 + Math.sin(prog(f, ENV, DEVICES, EASE.linear) * Math.PI) * 10;
  const wordPool = (a: number, b: number) => prog(f, a - 20, a + 10) * (1 - prog(f, b, b + 30));

  return (
    <AbsoluteFill style={{background: COLORS.black}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 100% 70% at 50% 110%, rgba(81,112,255,${0.18 * opsFade + 0.06}), transparent 70%)`}} />
      <Environment home={envMix} yaw={cam.yaw ?? 0} strength={envStrength} />
      <Studio k={studio} />
      <CssWorld cam={cam}>
        {/* ---- the day being recorded ---- */}
        {opsFade > 0.01 ? (
          <>
            <Plane x={feed.x} y={feed.y} z={-60} w={feed.w} h={feed.h} opacity={EASE.out(prog(f, S6 - 10, S6 + 20)) * opsFade * (1 - converge * 0.6)}>
              <DayFeed w={feed.w} h={feed.h} shown={shown} />
            </Plane>
            {REPORT.lines.map((l, i) => {
              const a = EASE.out(prog(f, S6 + 20 + i * 18, S6 + 50 + i * 18, EASE.linear));
              const target = {x: 0, y: -200 + i * 70};
              const cx = lerp(kpis[i].x, target.x, converge);
              const cy = lerp(kpis[i].y, target.y, converge);
              const counted = l.v * clamp((shown - 0.5) / DAY_EVENTS.length);
              return (
                <Plane key={l.k} x={cx} y={cy} z={lerp(80, 300, converge)} w={340} h={124} scale={lerp(1, 0.55, converge)} opacity={a * (1 - clamp((converge - 0.75) / 0.25)) * opsFade}>
                  <KpiCard w={340} h={124} label={l.k} value={counted} kind={l.fmt} icon={l.icon} glow={converge > 0 ? Math.sin(converge * Math.PI) : 0} />
                </Plane>
              );
            })}
            {/* 20:00 — the digital clock */}
            {clockIn > 0.01 ? (
              <Plane x={0} y={-20} z={300} w={900} h={360} opacity={clockIn} sharp>
                <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
                  <div style={{position: 'absolute', inset: -60, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.85), transparent 75%)'}} />
                  {fire > 0 ? <div style={{position: 'absolute', left: '50%', top: '45%', width: 300, height: 300, marginLeft: -150, marginTop: -150, borderRadius: 300, border: `3px solid ${COLORS.accent}`, opacity: 1 - fire, transform: `scale(${0.5 + fire * 2.4})`}} /> : null}
                  <div style={{position: 'relative'}}>
                    <DigitalClock tick={tick} size={L.vertical ? 104 : 120} armed={fire} />
                  </div>
                  <Label size={22} color={fire > 0 ? COLORS.accentSoft : COLORS.gray} weight={500} caps style={{position: 'relative', marginTop: 10, letterSpacing: '0.3em'}}>
                    {fire > 0 ? 'Automação iniciada' : 'Relatório diário · 20:00'}
                  </Label>
                </div>
              </Plane>
            ) : null}
            {/* the report, built in front of the viewer */}
            {build > 0 && toCapsule < 1 ? (
              <Plane x={0} y={40} z={300} w={620} h={700} scale={lerp(1, 0.12, toCapsule)} opacity={EASE.out(clamp(build * 5)) * (1 - toCapsule)} sharp>
                <ReportDoc w={620} h={700} build={build} />
              </Plane>
            ) : null}
          </>
        ) : null}
        {/* the report travelling as a message */}
        {capsuleOn ? (
          <Plane x={capPos[0]} y={capPos[1]} z={capPos[2]} w={420} h={96} scale={1.6} opacity={clamp(toCapsule * 3) * (1 - prog(f, NOTIFY - 10, NOTIFY, EASE.linear))} sharp>
            <div style={{width: '100%', height: '100%', borderRadius: 48, background: 'rgba(24,26,32,0.95)', boxShadow: `inset 0 0 0 1.5px rgba(0,168,132,0.6), 0 0 60px rgba(0,168,132,0.35)`, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', boxSizing: 'border-box'}}>
              <ChatAppIcon size={54} />
              <div>
                <Label size={19} color={COLORS.white} weight={700}>
                  Relatório diário
                </Label>
                <Label size={15}>enviando automaticamente…</Label>
              </div>
            </div>
          </Plane>
        ) : null}

        {/* ---- devices ---- */}
        <Floor y={FY + 2} z={PH[2] - 900} w={9000} d={6000} opacity={phoneIn * 0.9} warm={envMix * (1 - studio)} />
        <ContactShadow x={PH[0]} y={FY} z={PH[2]} w={620} d={160} opacity={phoneIn * showPh} />
        <ContactShadow x={LP[0]} y={FY} z={LP[2] + LAPTOP.deck / 2} w={2100} d={1500} opacity={devIn(0) * 0.8 * showLap} />
        <ContactShadow x={TB[0]} y={FY} z={TB[2] + 40} w={900} d={620} opacity={devIn(24) * showMon} />
        {devIn(0) * showLap > 0.01 ? (
          <Laptop x={LP[0]} y={LP[1]} z={LP[2] - (1 - devIn(0)) * 500} ry={22} opacity={devIn(0) * showLap} screen={<AppLaptop s={sync} w={LAPTOP.screenW} h={LAPTOP.screenH} />} />
        ) : null}
        {devIn(24) * showMon > 0.01 ? (
          <Monitor x={TB[0]} y={TB[1]} z={TB[2] - (1 - devIn(24)) * 500} opacity={devIn(24) * showMon} screen={<DesktopDashboard s={sync} w={MONITOR.screenW} h={MONITOR.screenH} t={f - DEVICES} />} />
        ) : null}
        {phoneIn * showPh > 0.01 ? <Phone x={PH[0]} y={PH[1] + (1 - phoneIn) * 200} z={PH[2]} ry={phoneRy} opacity={phoneIn * showPh} light={envMix} screen={phoneScreen} /> : null}
      </CssWorld>

      {/* ---- strategic type (each with a local light falloff for contrast) ---- */}
      <Title f={f} at={S6 + 40} out={CLOCK - 20} anchor="top" lines={[eyebrow('RELATÓRIOS', v ? 40 : 36), keyline('AUTOMÁTICOS.', v ? 112 : 104)]} />
      <Title f={f} at={CLOCK + 30} out={REPORT_T - 6} anchor="bottom" offset={v ? -40 : 0} scrim={1.3} lines={[keyline('TODOS OS DIAS.', v ? 86 : 80)]} />
      <Title f={f} at={NOTIFY + 4} out={OPEN - 16} anchor="top" lines={[eyebrow('DIRETO NO SEU', v ? 40 : 36), keyline('WHATSAPP.', v ? 112 : 104)]} />
      <Title f={f} at={S7 + 40} out={TAP - 10} anchor="top" lines={[keyline('SUA EMPRESA.', v ? 96 : 88), {...keyline('SEU CONTROLE.', v ? 96 : 88), color: COLORS.accentSoft, delay: 22}]} />
      <Title f={f} at={ENV + 20} out={DEVICES - 10} anchor="top" lines={[eyebrow('DE ONDE', v ? 40 : 36), keyline('ESTIVER.', v ? 120 : 110)]} />
      <Title f={f} at={FINAL + 10} out={END - 26} anchor="top" lines={[eyebrow('COM A PRATICIDADE DE UM APLICATIVO', v ? 28 : 30), keyline('TUDO CONECTADO.', v ? 100 : 96)]} />
      {/* small legend: what is being synchronised (factual, inside safe area) */}
      <SyncLegend f={f} pool={wordPool(SALE - 20, FINAL - 20)} />
    </AbsoluteFill>
  );
};

const SyncLegend: React.FC<{f: number; pool: number}> = ({f, pool}) => {
  const L = useLayout();
  if (pool <= 0.01) return null;
  const steps = [
    {t: 'Venda registrada no notebook', at: SALE},
    {t: 'Estoque atualizado', at: STOCK},
    {t: 'Notificação no celular', at: NOTE},
    {t: 'Financeiro atualizado no computador', at: TABLET_T},
  ];
  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', pointerEvents: 'none'}}>
      <div
        style={{
          marginTop: L.height - L.safe.bottom - 230 * L.u,
          opacity: pool,
          padding: `${16 * L.u}px ${24 * L.u}px`,
          borderRadius: 20 * L.u,
          background: 'rgba(8,8,10,0.78)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10 * L.u,
        }}
      >
        {steps.map((s) => {
          const on = prog(f, s.at, s.at + 14, EASE.out);
          return (
            <div key={s.t} style={{display: 'flex', alignItems: 'center', gap: 12 * L.u, opacity: 0.35 + 0.65 * on}}>
              <div style={{width: 12 * L.u, height: 12 * L.u, borderRadius: 12, background: on > 0.5 ? COLORS.accent : 'rgba(255,255,255,0.25)', boxShadow: on > 0.5 ? `0 0 12px ${COLORS.accent}` : undefined}} />
              <div style={{fontFamily: FONTS.sans, fontSize: 24 * L.u, color: COLORS.white, fontWeight: on > 0.5 ? 600 : 400}}>{s.t}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
