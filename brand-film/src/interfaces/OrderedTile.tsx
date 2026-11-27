import React from 'react';
import {COLORS} from '../config/theme';
import {hash01} from '../utils/random';
import {Icon, Label, glass, type IconName} from './ui';

/**
 * The ordered state of the chaos: every fragment becomes a precise, uniform
 * module tile. These tiles are the seed of the ArmeTec platform (scene 05).
 */
export const TILE = {w: 340, h: 220, gap: 44};

export const MODULES: Array<{name: string; icon: IconName; metric: string; sub: string}> = [
  {name: 'Clientes', icon: 'users', metric: '1.284', sub: 'cadastros ativos'},
  {name: 'Financeiro', icon: 'wallet', metric: 'Fluxo', sub: 'contas a pagar/receber'},
  {name: 'Vendas', icon: 'cart', metric: 'Pipeline', sub: 'etapas do funil'},
  {name: 'Estoque', icon: 'box', metric: 'Saldo', sub: 'entradas e saídas'},
  {name: 'Orçamentos', icon: 'quote', metric: 'Propostas', sub: 'em aberto'},
  {name: 'Tarefas', icon: 'tasks', metric: 'Rotinas', sub: 'responsáveis e prazos'},
  {name: 'Relatórios', icon: 'report', metric: 'Painéis', sub: 'consolidados'},
  {name: 'Automações', icon: 'bolt', metric: 'Fluxos', sub: 'gatilhos e ações'},
];

export const gridSlots = (vertical: boolean) => {
  const cols = vertical ? 4 : 6;
  const rows = vertical ? 6 : 4;
  const out: Array<{x: number; y: number}> = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      out.push({x: (c - (cols - 1) / 2) * (TILE.w + TILE.gap), y: (r - (rows - 1) / 2) * (TILE.h + TILE.gap)});
  return out;
};

export const OrderedTile: React.FC<{slot: number; f: number}> = ({slot}) => {
  const m = MODULES[slot % MODULES.length];
  const bars = Array.from({length: 12}, (_, i) => 0.25 + hash01(i, slot) * 0.75);
  return (
    <div style={{...glass({radius: 22, tint: 0.85}), width: '100%', height: '100%', padding: 24, boxSizing: 'border-box', display: 'flex', flexDirection: 'column'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        <div style={{width: 40, height: 40, borderRadius: 12, background: 'rgba(81,112,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Icon name={m.icon} size={22} color={COLORS.accentSoft} />
        </div>
        <Label size={20} color={COLORS.white} weight={600}>
          {m.name}
        </Label>
      </div>
      <div style={{flex: 1}} />
      <Label size={15}>{m.sub}</Label>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 5, height: 44, marginTop: 10}}>
        {bars.map((b, i) => (
          <div key={i} style={{flex: 1, height: `${b * 100}%`, borderRadius: 3, background: i === bars.length - 1 ? COLORS.accent : 'rgba(255,255,255,0.16)'}} />
        ))}
      </div>
    </div>
  );
};
