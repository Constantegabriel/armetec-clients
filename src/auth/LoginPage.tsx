import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';

type Mode = 'signin' | 'signup';

const MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'User already registered': 'Este e-mail já tem conta. Use “Entrar”.',
  'Email not confirmed': 'Confirme seu e-mail pelo link que enviamos antes de entrar.',
};

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    const { data, error: err } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (err) return setError(MESSAGES[err.message] ?? err.message);
    if (mode === 'signup' && !data.session) {
      setInfo('Conta criada. Abra o link que enviamos para o seu e-mail e depois entre aqui.');
      setMode('signin');
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <Logo size="lg" />
        <p className="muted">Monte o escopo dos projetos junto com o cliente.</p>

        <label className="field">
          <span>E-mail</span>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <div className="alert error">{error}</div>}
        {info && <div className="alert info">{info}</div>}

        <button className="btn primary block" disabled={busy}>
          {busy ? 'Aguarde…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
        </button>
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
          }}
        >
          {mode === 'signin' ? 'Primeiro acesso? Criar conta' : 'Já tenho conta. Entrar'}
        </button>
      </form>
    </div>
  );
}
