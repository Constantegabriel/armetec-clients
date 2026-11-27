import React from 'react';
import {COLORS, FONTS} from '../config/theme';
import {EASE} from '../utils/easing';
import {clamp} from '../utils/math';
import {Avatar, Icon, Label, glass} from './ui';

/** Windows used in "Procurando informações" — fictional data. */

export const Cursor: React.FC<{x: number; y: number; press?: number}> = ({x, y, press = 0}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, zIndex: 20}}>
    {press > 0 ? <div style={{position: 'absolute', left: -22, top: -22, width: 44, height: 44, borderRadius: 44, border: `2px solid ${COLORS.accentSoft}`, opacity: 1 - press, transform: `scale(${0.4 + press})`}} /> : null}
    <svg width={30} height={36} viewBox="0 0 24 28" style={{position: 'absolute', left: -3, top: -2, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))', transform: `scale(${1 - Math.sin(press * Math.PI) * 0.12})`}}>
      <path d="M2 2 L2 22 L7.5 17 L11 25 L14.5 23.5 L11 15.8 L18.5 15.8 Z" fill="#fff" stroke="#111" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  </div>
);

const WinChrome: React.FC<{title: string; icon: Parameters<typeof Icon>[0]['name']; w: number; h: number; children: React.ReactNode; accent?: string}> = ({title, icon, w, h, children, accent}) => (
  <div style={{...glass({radius: 16, tint: 0.94}), width: w, height: h, display: 'flex', flexDirection: 'column'}}>
    <div style={{height: 52, display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)'}}>
      {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
        <div key={c} style={{width: 12, height: 12, borderRadius: 12, background: c, opacity: 0.8}} />
      ))}
      <div style={{width: 10}} />
      <Icon name={icon} size={18} color={accent ?? COLORS.gray} />
      <Label size={17} color={COLORS.white} weight={600}>
        {title}
      </Label>
    </div>
    <div style={{flex: 1, position: 'relative', overflow: 'hidden'}}>{children}</div>
  </div>
);

/** 1 — file explorer search */
export const ExplorerSearch: React.FC<{w: number; h: number; t: number; query: string}> = ({w, h, t, query}) => {
  const typed = query.slice(0, Math.max(0, Math.floor(t / 2.1)));
  const searching = t > query.length * 2.1 + 4;
  const results = t > query.length * 2.1 + 34;
  const rows = [
    {n: 'Orçamentos_2024', d: 'Pasta · 214 itens', i: 'folder' as const},
    {n: 'Ventura_contrato_antigo.pdf', d: 'PDF · modificado em 2023', i: 'file' as const},
    {n: 'orcamento_modelo_em_branco.docx', d: 'Documento · modelo', i: 'file' as const},
  ];
  return (
    <WinChrome title="Documentos" icon="folder" w={w} h={h}>
      <div style={{padding: 26}}>
        <div style={{height: 64, borderRadius: 14, background: 'rgba(255,255,255,0.06)', boxShadow: `inset 0 0 0 1.5px ${COLORS.accent}88`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px'}}>
          <Icon name="search" size={24} color={COLORS.white} />
          <div style={{fontFamily: FONTS.sans, fontSize: 24, color: COLORS.white}}>
            {typed}
            {!searching ? <span style={{display: 'inline-block', width: 2, height: 26, background: COLORS.accent, marginLeft: 2, verticalAlign: 'middle'}} /> : null}
          </div>
        </div>
        <div style={{marginTop: 16, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden'}}>
          {searching ? <div style={{width: `${clamp((t - query.length * 2.1 - 4) / 30) * 100}%`, height: '100%', background: COLORS.accent}} /> : null}
        </div>
        <Label size={16} style={{marginTop: 14}}>
          {results ? '3 resultados — nenhum corresponde ao orçamento procurado' : searching ? 'Pesquisando em Documentos…' : ' '}
        </Label>
        {rows.map((r, i) => {
          const a = EASE.out(clamp((t - query.length * 2.1 - 34 - i * 5) / 14));
          return (
            <div key={r.n} style={{display: 'flex', alignItems: 'center', gap: 16, padding: '16px 6px', borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: a * 0.75, transform: `translateY(${(1 - a) * 10}px)`}}>
              <Icon name={r.i} size={26} color={COLORS.gray} />
              <div>
                <Label size={19} color="#d4d4d8" weight={500}>
                  {r.n}
                </Label>
                <Label size={14}>{r.d}</Label>
              </div>
            </div>
          );
        })}
      </div>
    </WinChrome>
  );
};

/** 2 — team chat: everyone points somewhere else */
export const TeamChat: React.FC<{w: number; h: number; t: number}> = ({w, h, t}) => {
  const msgs = [
    {n: 'Você', i: 'VC', me: true, m: 'Alguém tem o orçamento da Ventura?'},
    {n: 'Rafael', i: 'RS', m: 'Mandei por e-mail semana passada'},
    {n: 'Juliana', i: 'JA', m: 'Acho que está na pasta do financeiro'},
    {n: 'Carla', i: 'CM', m: 'Tem uma versão nova, não sei qual é'},
  ];
  return (
    <WinChrome title="Equipe · Comercial" icon="chat" w={w} h={h}>
      <div style={{padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14}}>
        {msgs.map((m, i) => {
          const a = EASE.out(clamp((t - i * 11) / 12));
          if (a <= 0) return null;
          return (
            <div key={i} style={{display: 'flex', gap: 12, alignItems: 'flex-end', flexDirection: m.me ? 'row-reverse' : 'row', opacity: a, transform: `translateY(${(1 - a) * 14}px)`}}>
              {!m.me ? <Avatar initials={m.i} size={38} hue={i * 30} /> : null}
              <div style={{maxWidth: '72%', padding: '12px 16px', borderRadius: 18, background: m.me ? 'rgba(81,112,255,0.28)' : 'rgba(255,255,255,0.07)'}}>
                {!m.me ? (
                  <Label size={13} color={COLORS.accentSoft} weight={600}>
                    {m.n}
                  </Label>
                ) : null}
                <Label size={18} color={COLORS.white} style={{whiteSpace: 'normal', lineHeight: 1.3}}>
                  {m.m}
                </Label>
              </div>
            </div>
          );
        })}
      </div>
    </WinChrome>
  );
};

/** 3 — folder with five "final" versions; the cursor hesitates */
export const VersionsFolder: React.FC<{w: number; h: number; t: number; hover: number; pick: number}> = ({w, h, t, hover, pick}) => {
  const files = ['orcamento_ventura.pdf', 'orcamento_ventura_revisado.xlsx', 'orcamento_ventura_revisado(1).xlsx', 'orcamento_ventura_FINAL.pdf', 'orcamento_ventura_FINAL_v2.pdf'];
  return (
    <WinChrome title="Financeiro › Clientes › Ventura" icon="folder" w={w} h={h}>
      <div style={{padding: '12px 20px'}}>
        <div style={{display: 'flex', padding: '10px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)'}}>
          <Label size={13} caps style={{flex: 1}}>
            Nome
          </Label>
          <Label size={13} caps style={{width: 150}}>
            Modificado
          </Label>
        </div>
        {files.map((fl, i) => {
          const a = EASE.out(clamp((t - i * 3) / 12));
          const hl = Math.round(hover) === i;
          return (
            <div
              key={fl}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '15px 10px',
                borderRadius: 10,
                opacity: a,
                background: hl ? (pick > 0 ? 'rgba(81,112,255,0.3)' : 'rgba(255,255,255,0.07)') : undefined,
              }}
            >
              <Icon name="file" size={24} color={fl.endsWith('pdf') ? '#E07A7A' : '#7FD1A8'} />
              <Label size={18} color={COLORS.white} weight={500} style={{flex: 1}}>
                {fl}
              </Label>
              <Label size={14} style={{width: 150}}>
                {['12/01', '03/02', '03/02', '18/02', '18/02'][i]}/2026
              </Label>
            </div>
          );
        })}
      </div>
    </WinChrome>
  );
};

/** 4 — the opened PDF is outdated */
export const OutdatedPdf: React.FC<{w: number; h: number; t: number}> = ({w, h, t}) => {
  const stamp = EASE.out(clamp((t - 20) / 10));
  return (
    <WinChrome title="orcamento_ventura_FINAL.pdf" icon="file" w={w} h={h} accent="#E07A7A">
      <div style={{position: 'absolute', inset: 24, background: '#f4f3ef', borderRadius: 6, padding: 34, color: '#1c1d21', fontFamily: FONTS.sans}}>
        <div style={{fontSize: 14, letterSpacing: '0.18em', color: '#7a7d86'}}>ORÇAMENTO Nº 0318</div>
        <div style={{fontSize: 30, fontWeight: 700, marginTop: 8}}>Grupo Ventura</div>
        <div style={{fontSize: 15, color: '#6a6e78', marginTop: 4}}>Emitido em 18/02/2026 · validade 15 dias</div>
        {['Kit Instalação', 'Manutenção Mensal', 'Consultoria (h)'].map((x, i) => (
          <div key={x} style={{display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #ddd', fontSize: 18, marginTop: i === 0 ? 28 : 0}}>
            <span>{x}</span>
            <span>{['R$ 1.139,40', 'R$ 450,00', 'R$ 2.640,00'][i]}</span>
          </div>
        ))}
        <div style={{display: 'flex', justifyContent: 'space-between', padding: '16px 0', fontSize: 22, fontWeight: 700}}>
          <span>Total</span>
          <span>R$ 4.229,40</span>
        </div>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '56%',
            transform: `translate(-50%,-50%) rotate(-14deg) scale(${1.6 - 0.6 * stamp})`,
            opacity: stamp,
            border: '4px solid #C94848',
            color: '#C94848',
            borderRadius: 10,
            padding: '10px 22px',
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
          }}
        >
          VERSÃO DESATUALIZADA
        </div>
      </div>
    </WinChrome>
  );
};

/** 5 — a sticky note: the information lives in someone's head */
export const StickyNote: React.FC<{w: number; h: number}> = ({w, h}) => (
  <div
    style={{
      width: w,
      height: h,
      background: 'linear-gradient(160deg,#f3df8f,#e5c96a)',
      borderRadius: 4,
      boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
      padding: 30,
      boxSizing: 'border-box',
      fontFamily: "'Segoe Print','Bradley Hand','Comic Neue', cursive",
      color: '#3a3218',
      fontSize: 30,
      lineHeight: 1.35,
      transform: 'rotate(-3deg)',
    }}
  >
    Orçamento Ventura:
    <br />
    confirmar valor
    <br />
    com o Rafael!!
  </div>
);

/** Pile — generic windows that keep opening */
export const MiniWindow: React.FC<{w: number; h: number; title: string; icon: Parameters<typeof Icon>[0]['name']}> = ({w, h, title, icon}) => (
  <WinChrome title={title} icon={icon} w={w} h={h}>
    <div style={{padding: 22}}>
      {Array.from({length: 7}, (_, i) => (
        <div key={i} style={{height: 12, borderRadius: 6, marginBottom: 16, width: `${50 + ((i * 37) % 45)}%`, background: i === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.1)'}} />
      ))}
    </div>
  </WinChrome>
);
