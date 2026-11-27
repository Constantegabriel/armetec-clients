import React from 'react';
import {COLORS, FONTS} from '../config/theme';
import {hash01} from '../utils/random';
import {Avatar, Dot, Icon, Label, Pill, glass} from './ui';

/** The "operational noise" vocabulary: documents, messages, files, folders, notifications, tasks. */

export type WorkKind = 'doc' | 'msg' | 'file' | 'folder' | 'note' | 'task' | 'sheet';
export const WORK_SIZE: Record<WorkKind, [number, number]> = {
  doc: [300, 390],
  msg: [400, 120],
  file: [330, 92],
  folder: [250, 190],
  note: [380, 96],
  task: [420, 132],
  sheet: [360, 240],
};

const DOCS = ['Contrato_cliente_rev3.pdf', 'Proposta_comercial.docx', 'Orçamento_março.pdf', 'Relatório_mensal.docx', 'Ata_reunião.pdf'];
const FILES = ['planilha_estoque_v12.xlsx', 'clientes_ATUALIZADO.xlsx', 'notas_fiscais_out.zip', 'pedidos_semana(2).xlsx', 'financeiro_FINAL_ok.xlsx'];
const FOLDERS = ['Financeiro 2026', 'Clientes antigos', 'Backup (não apagar)', 'Pedidos', 'Documentos RH'];
const MSGS = [
  {n: 'Carla', i: 'CM', t: 'Alguém sabe onde está a planilha atualizada?'},
  {n: 'Rafael', i: 'RS', t: 'Me manda de novo aquele orçamento?'},
  {n: 'Juliana', i: 'JA', t: 'Esse pedido já foi conferido?'},
  {n: 'Diego', i: 'DP', t: 'Preciso do relatório até às 17h.'},
  {n: 'Fernanda', i: 'FL', t: 'Qual versão do contrato é a certa?'},
];
const NOTES = [
  {t: '14 e-mails não lidos', i: 'mail'},
  {t: 'Prazo do relatório: hoje', i: 'bell'},
  {t: '3 pedidos aguardando conferência', i: 'clock'},
  {t: 'Estoque divergente', i: 'box'},
  {t: 'Lembrete: atualizar planilha', i: 'bell'},
] as const;
export const TASK_TEXT = 'Conferir pedidos e atualizar planilha';

export const DocItem: React.FC<{k: number}> = ({k}) => (
  <div style={{...glass({radius: 14, tint: 0.9}), width: '100%', height: '100%', padding: 26, boxSizing: 'border-box', background: 'linear-gradient(170deg,#202024,#141416)'}}>
    <div style={{display: 'flex', gap: 10, alignItems: 'center', marginBottom: 22}}>
      <Icon name="file" size={22} color={COLORS.gray} />
      <Label size={15} color={COLORS.white} weight={600}>
        {DOCS[k % DOCS.length]}
      </Label>
    </div>
    {Array.from({length: 11}, (_, i) => (
      <div
        key={i}
        style={{
          height: 9,
          borderRadius: 5,
          marginBottom: 13,
          width: `${i % 4 === 3 ? 45 : 70 + hash01(i, k) * 28}%`,
          background: i === 0 ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.11)',
        }}
      />
    ))}
    <div style={{position: 'absolute', bottom: 22, right: 22}}>
      <Pill size={12}>pág. {1 + (k % 9)}</Pill>
    </div>
  </div>
);

export const MsgItem: React.FC<{k: number}> = ({k}) => {
  const m = MSGS[k % MSGS.length];
  return (
    <div style={{...glass({radius: 22}), width: '100%', height: '100%', display: 'flex', gap: 16, alignItems: 'center', padding: '0 22px', boxSizing: 'border-box'}}>
      <Avatar initials={m.i} size={48} hue={(k * 40) % 120} />
      <div style={{minWidth: 0}}>
        <div style={{display: 'flex', gap: 10, alignItems: 'baseline'}}>
          <Label size={17} color={COLORS.white} weight={600}>
            {m.n}
          </Label>
          <Label size={13}>agora</Label>
        </div>
        <Label size={17} color="#d4d4d8" style={{whiteSpace: 'normal', lineHeight: 1.3}}>
          {m.t}
        </Label>
      </div>
    </div>
  );
};

export const FileItem: React.FC<{k: number}> = ({k}) => (
  <div style={{...glass({radius: 16}), width: '100%', height: '100%', display: 'flex', gap: 16, alignItems: 'center', padding: '0 20px', boxSizing: 'border-box'}}>
    <div style={{width: 50, height: 50, borderRadius: 12, background: 'rgba(127,209,168,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Icon name="grid" size={24} color={COLORS.success} />
    </div>
    <div>
      <Label size={17} color={COLORS.white} weight={600}>
        {FILES[k % FILES.length]}
      </Label>
      <Label size={13}>{(1 + hash01(k, 3) * 9).toFixed(1)} MB · modificado ontem</Label>
    </div>
  </div>
);

export const FolderItem: React.FC<{k: number}> = ({k}) => (
  <div style={{width: '100%', height: '100%', position: 'relative'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: '42%', height: 34, borderRadius: '14px 14px 0 0', background: '#2a2a30'}} />
    <div style={{...glass({radius: 14, tint: 0.9}), position: 'absolute', inset: '22px 0 0 0', background: 'linear-gradient(170deg,#2c2c33,#1a1a1e)', padding: 22, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'}}>
      <Label size={18} color={COLORS.white} weight={600}>
        {FOLDERS[k % FOLDERS.length]}
      </Label>
      <Label size={13}>{12 + Math.floor(hash01(k, 5) * 230)} itens</Label>
    </div>
  </div>
);

export const NoteItem: React.FC<{k: number}> = ({k}) => {
  const n = NOTES[k % NOTES.length];
  return (
    <div style={{...glass({radius: 20}), width: '100%', height: '100%', display: 'flex', gap: 16, alignItems: 'center', padding: '0 22px', boxSizing: 'border-box'}}>
      <div style={{width: 46, height: 46, borderRadius: 14, background: 'rgba(233,184,114,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Icon name={n.i} size={22} color={COLORS.warning} />
      </div>
      <Label size={18} color={COLORS.white} weight={500}>
        {n.t}
      </Label>
      <div style={{flex: 1}} />
      <Dot color={COLORS.warning} size={9} />
    </div>
  );
};

/** Task card. `check` 0..1 animates the checkbox; `ghost` shows a duplicated, reset copy. */
export const TaskItem: React.FC<{check?: number; label?: string; meta?: string; accent?: boolean}> = ({check = 0, label = TASK_TEXT, meta = 'Diária · manual', accent}) => (
  <div
    style={{
      ...glass({radius: 20}),
      width: '100%',
      height: '100%',
      display: 'flex',
      gap: 20,
      alignItems: 'center',
      padding: '0 26px',
      boxSizing: 'border-box',
      boxShadow: accent ? `inset 0 0 0 1.5px ${COLORS.accent}88, 0 20px 60px rgba(0,0,0,0.5)` : glass().boxShadow,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        flexShrink: 0,
        border: `2px solid ${check > 0.5 ? COLORS.accent : 'rgba(255,255,255,0.3)'}`,
        background: check > 0.5 ? COLORS.accent : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${1 + Math.sin(Math.min(1, check) * Math.PI) * 0.15})`,
      }}
    >
      {check > 0.5 ? <Icon name="check" size={24} color="#fff" /> : null}
    </div>
    <div>
      <Label size={20} color={COLORS.white} weight={600} style={{textDecoration: check > 0.98 ? 'line-through' : undefined, textDecorationColor: 'rgba(255,255,255,0.4)'}}>
        {label}
      </Label>
      <Label size={14}>{meta}</Label>
    </div>
  </div>
);

export const SheetItem: React.FC<{k: number}> = ({k}) => (
  <div style={{...glass({radius: 14, tint: 0.85}), width: '100%', height: '100%', padding: 14, boxSizing: 'border-box'}}>
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0}}>
      {Array.from({length: 40}, (_, i) => (
        <div key={i} style={{height: 25, borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 6px', display: 'flex', alignItems: 'center'}}>
          {hash01(i, k) > 0.3 ? <div style={{height: 6, width: `${40 + hash01(i, k + 1) * 50}%`, borderRadius: 3, background: i < 5 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.14)'}} /> : null}
        </div>
      ))}
    </div>
  </div>
);

export const WorkItem: React.FC<{kind: WorkKind; k: number; check?: number}> = ({kind, k, check}) => {
  switch (kind) {
    case 'doc':
      return <DocItem k={k} />;
    case 'msg':
      return <MsgItem k={k} />;
    case 'file':
      return <FileItem k={k} />;
    case 'folder':
      return <FolderItem k={k} />;
    case 'note':
      return <NoteItem k={k} />;
    case 'task':
      return <TaskItem check={check} />;
    default:
      return <SheetItem k={k} />;
  }
};

/** Floating search bar with typed query and a status line. */
export const SearchBar: React.FC<{query: string; caret: boolean; status: string; progress: number; w?: number}> = ({query, caret, status, progress, w = 760}) => (
  <div style={{width: w}}>
    <div style={{...glass({radius: 26, tint: 0.88}), height: 96, display: 'flex', alignItems: 'center', gap: 20, padding: '0 30px', boxShadow: `inset 0 0 0 1.5px ${COLORS.accent}66, 0 40px 100px rgba(0,0,0,0.7)`}}>
      <Icon name="search" size={34} color={COLORS.white} />
      <div style={{fontFamily: FONTS.sans, fontSize: 32, color: COLORS.white, fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden'}}>
        {query}
        {caret ? <span style={{display: 'inline-block', width: 3, height: 34, background: COLORS.accent, marginLeft: 3, verticalAlign: 'middle'}} /> : null}
      </div>
    </div>
    <div style={{...glass({radius: 18, tint: 0.8}), marginTop: 12, padding: '16px 26px', display: 'flex', alignItems: 'center', gap: 16}}>
      <div style={{flex: 1}}>
        <Label size={18} color={COLORS.gray}>
          {status}
        </Label>
        <div style={{marginTop: 10, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
          <div style={{height: '100%', width: `${progress * 100}%`, background: `linear-gradient(90deg, transparent, ${COLORS.accent})`}} />
        </div>
      </div>
    </div>
  </div>
);
