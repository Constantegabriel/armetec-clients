import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, FolderOpen, LogOut, MoreHorizontal, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { Logo } from '@/components/Logo';
import { Menu } from '@/components/Menu';
import { Modal } from '@/components/Modal';
import { repo } from '@/data';
import { isCloud } from '@/lib/supabase';
import { buildGraph, TEMPLATES } from '@/lib/templates';
import type { Project, ProjectGraph, ProjectSummary } from '@/lib/types';

const relative = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
function timeAgo(iso: string): string {
  const diff = (Date.parse(iso) - Date.now()) / 1000;
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 30],
    ['month', 12],
    ['year', Infinity],
  ];
  let value = diff;
  for (const [unit, size] of steps) {
    if (Math.abs(value) < size) return relative.format(Math.round(value), unit);
    value /= size;
  }
  return '';
}

export function ProjectsPage() {
  const { email, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    try {
      setProjects(await repo.list());
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar os projetos. Verifique a conexão.');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!projects || !q) return projects;
    return projects.filter((p) => `${p.name} ${p.niche}`.toLowerCase().includes(q));
  }, [projects, query]);

  async function duplicate(id: string) {
    const src = await repo.get(id);
    if (!src) return;
    await repo.create({ name: `${src.name} (cópia)`, niche: src.niche, data: src.data });
    void reload();
  }

  async function remove(p: ProjectSummary) {
    if (!window.confirm(`Excluir o projeto “${p.name}” definitivamente?`)) return;
    await repo.remove(p.id);
    void reload();
  }

  async function importFile(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<Project>;
      const data = parsed.data as ProjectGraph | undefined;
      if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) throw new Error('formato');
      const created = await repo.create({ name: parsed.name ?? 'Importado', niche: parsed.niche ?? '', data });
      navigate(`/p/${created.id}`);
    } catch {
      window.alert('Arquivo inválido. Use um backup .json exportado por este sistema.');
    }
  }

  return (
    <div className="projects-page">
      <header className="topbar">
        <Logo />
        <span className="grow" />
        {isCloud ? (
          <>
            <span className="muted hide-sm">{email}</span>
            <button className="icon-btn" onClick={() => void signOut()} title="Sair">
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <span className="badge" title="Configure o Supabase para salvar na nuvem (veja o README)">
            Modo local
          </span>
        )}
      </header>

      <main className="projects-main">
        <div className="projects-toolbar">
          <h1>Projetos</h1>
          <span className="grow" />
          <label className="search">
            <Search size={16} />
            <input placeholder="Buscar cliente ou nicho" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <button className="btn" onClick={() => fileInput.current?.click()} title="Importar backup .json">
            <Upload size={16} />
            <span className="hide-sm">Importar</span>
          </button>
          <button className="btn primary" onClick={() => setCreating(true)}>
            <Plus size={16} /> Novo projeto
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importFile(f);
              e.target.value = '';
            }}
          />
        </div>

        {error && <div className="alert error">{error}</div>}
        {!projects && !error && <p className="muted">Carregando…</p>}

        {filtered && filtered.length === 0 && (
          <div className="empty">
            <FolderOpen size={40} />
            <p>{query ? 'Nenhum projeto encontrado.' : 'Nenhum projeto ainda. Comece pelo primeiro cliente.'}</p>
            {!query && (
              <button className="btn primary" onClick={() => setCreating(true)}>
                <Plus size={16} /> Novo projeto
              </button>
            )}
          </div>
        )}

        {filtered && filtered.length > 0 && (
          <div className="project-grid">
            {filtered.map((p) => (
              <article key={p.id} className="project-card">
                <Link to={`/p/${p.id}`} className="project-link">
                  <h3>{p.name}</h3>
                  <p className="muted">{p.niche || 'Sem nicho'}</p>
                  <footer>
                    <span>
                      {p.blockCount} {p.blockCount === 1 ? 'bloco' : 'blocos'}
                    </span>
                    <span>{timeAgo(p.updatedAt)}</span>
                  </footer>
                </Link>
                <Menu
                  trigger={({ toggle }) => (
                    <button className="icon-btn card-menu" onClick={toggle} title="Mais ações">
                      <MoreHorizontal size={18} />
                    </button>
                  )}
                >
                  {(close) => (
                    <>
                      <button onClick={() => (void duplicate(p.id), close())}>
                        <Copy size={16} /> Duplicar
                      </button>
                      <button className="danger" onClick={() => (void remove(p), close())}>
                        <Trash2 size={16} /> Excluir
                      </button>
                    </>
                  )}
                </Menu>
              </article>
            ))}
          </div>
        )}
      </main>

      {creating && <NewProjectModal onClose={() => setCreating(false)} onCreated={(id) => navigate(`/p/${id}`)} />}
    </div>
  );
}

function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [company, setCompany] = useState('');
  const [niche, setNiche] = useState('');
  const [templateId, setTemplateId] = useState('blank');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
      const project = await repo.create({
        name: company.trim() || 'Novo cliente',
        niche: niche.trim(),
        data: buildGraph(template, company.trim(), niche.trim()),
      });
      onCreated(project.id);
    } catch (err) {
      console.error(err);
      window.alert('Não foi possível criar o projeto. Verifique a conexão.');
      setBusy(false);
    }
  }

  return (
    <Modal title="Novo projeto" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Empresa</span>
          <input autoFocus value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ex.: Clínica Sorriso" />
        </label>
        <label className="field">
          <span>Nicho</span>
          <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Ex.: Odontologia" />
        </label>
        <fieldset className="field">
          <span>Começar com</span>
          <div className="template-grid">
            {TEMPLATES.map((t) => (
              <label key={t.id} className={`template${templateId === t.id ? ' is-active' : ''}`}>
                <input type="radio" name="template" value={t.id} checked={templateId === t.id} onChange={() => setTemplateId(t.id)} />
                <strong>{t.name}</strong>
                <small>{t.description}</small>
              </label>
            ))}
          </div>
        </fieldset>
        <button className="btn primary block" disabled={busy}>
          {busy ? 'Criando…' : 'Criar e abrir'}
        </button>
      </form>
    </Modal>
  );
}
