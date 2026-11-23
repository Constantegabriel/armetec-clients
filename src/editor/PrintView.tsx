import { KINDS } from '@/lib/kinds';
import type { Outline } from './outline';

/** Versão limpa para impressão / PDF. Fica escondida na tela (ver estilos @media print). */
export function PrintView({ outline }: { outline: Outline }) {
  const { client, entries } = outline;
  const notes = client?.items.filter((i) => i.text.trim()) ?? [];

  return (
    <div className="print-view">
      <header>
        <h1>{client?.company.trim() || 'Projeto sem nome'}</h1>
        {client?.niche.trim() && <p className="print-niche">{client.niche.trim()}</p>}
        <p className="print-date">Escopo atualizado em {new Date().toLocaleDateString('pt-BR')}</p>
      </header>

      {notes.length > 0 && (
        <section>
          <h2>Observações gerais</h2>
          <ul>
            {notes.map((i) => (
              <li key={i.id}>{i.text}</li>
            ))}
          </ul>
        </section>
      )}

      {entries.map(({ node, depth }) => {
        const items = node.data.items.filter((i) => i.text.trim());
        return (
          <section key={node.id} style={{ marginLeft: (depth - 1) * 22 }}>
            <h2>
              {node.data.title.trim() || '(sem título)'} <span className="print-tag">{KINDS[node.data.kind].label}</span>
            </h2>
            {items.length > 0 && (
              <ul>
                {items.map((i) => (
                  <li key={i.id}>{i.text}</li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
