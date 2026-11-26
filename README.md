# Armetec · Escopo

Painel visual (estilo n8n) para montar o escopo de um projeto **junto com o cliente**, na reunião.
O bloco inicial é o cliente (empresa + nicho). Dele saem blocos ligados: páginas, funcionalidades,
integrações e observações, cada um com sua lista do que vai conter. Tudo fica salvo na nuvem,
com login, e abre de qualquer notebook.

> Também neste repositório: [`catalogo/`](catalogo/README.md), um site de catálogo com carrinho e pedido pelo WhatsApp.

## Como usar

| Ação | Como |
| --- | --- |
| Novo bloco ligado | botão **+ bloco ligado** no bloco, ou **+ Bloco** na barra (liga ao bloco selecionado) |
| Ligar dois blocos | arraste a bolinha da direita até outro bloco |
| Criar bloco puxando | arraste a bolinha da direita e solte no vazio |
| Bloco solto | duplo clique no fundo |
| Novo item na lista | `Enter` (`Shift+Enter` quebra linha); `Backspace` em item vazio apaga |
| Marcar item como combinado | clique na bolinha do item |
| Trocar tipo do bloco | clique no rótulo colorido (Página, Funcionalidade…) |
| Remover ligação | clique na ligação → botão ✕ (ou tecla `Delete`) |
| Arrumar tudo | **Organizar** |
| Mover / zoom | arraste o fundo · rolagem do touchpad move · pinça ou `Ctrl` + rolagem dá zoom |
| Exportar | **Exportar** → texto (copiar / .md), imprimir / PDF, backup .json, duplicar como modelo |

O salvamento é automático. Se a internet cair no meio da reunião, as alterações ficam guardadas
no notebook e sobem sozinhas quando a conexão voltar (o indicador no topo mostra o estado).

## Configuração (uma vez só)

### 1. Supabase (banco + login)

1. Crie uma conta e um projeto em [supabase.com](https://supabase.com) (plano gratuito).
2. Em **SQL Editor → New query**, cole o conteúdo de
   [`supabase/migrations/001_projects.sql`](supabase/migrations/001_projects.sql) e clique em **Run**.
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon / public**.
4. (Opcional, recomendado) Em **Authentication → Sign In / Providers → Email**, depois de criar
   sua conta, desative **Allow new users to sign up** para ninguém mais criar conta no seu painel.
5. Em **Authentication → URL Configuration**, coloque em **Site URL** o endereço da Vercel
   (ex.: `https://armetec-clients.vercel.app`), para o link de confirmação de e-mail funcionar.

### 2. Vercel (hospedagem)

1. Em [vercel.com](https://vercel.com), **Add New → Project** e importe este repositório.
   A Vercel detecta Vite sozinha.
2. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = chave anon / public
3. **Deploy**. A cada push na branch principal, o site é atualizado automaticamente.

A chave *anon* pode ficar no front-end: quem protege os dados são as regras de segurança (RLS)
criadas pelo SQL. Cada usuário só vê os próprios projetos.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com os dados do Supabase
npm run dev
```

Sem o `.env.local` o app roda em **modo local**: sem login, salvando só no navegador. Útil para testar.

## Estrutura

```
src/
  App.tsx               rotas e proteção por login
  auth/                 sessão (Supabase Auth) e tela de login
  data/                 acesso a dados: interface ProjectRepo + Supabase e localStorage
  lib/                  tipos, tipos de bloco (cores/ícones), modelos iniciais, cliente Supabase
  editor/
    store.ts            estado do editor (zustand): todas as ações sobre blocos, itens e ligações
    useAutosave.ts      salvamento automático + rascunho local para quando estiver sem internet
    Canvas.tsx          canvas (React Flow)
    nodes/              bloco do cliente, bloco de escopo, lista de itens
    layout.ts           botão "Organizar" (layout em árvore)
    outline.ts          grafo → lista ordenada → Markdown
    PrintView.tsx       versão para impressão / PDF
  pages/                lista de projetos e editor
  styles/               tokens de cor (base.css), componentes (app.css), editor (editor.css)
supabase/migrations/    SQL do banco
```

Stack: Vite, React 19, TypeScript, [React Flow](https://reactflow.dev), Zustand, Supabase, lucide-react.
