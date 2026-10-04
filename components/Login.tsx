'use client';
import { useState } from 'react';
import { NOME_APP } from '@/lib/config';

const FOTO =
  'https://images.unsplash.com/photo-1649511125503-3b23dc239c96?auto=format&fit=crop&w=1400&q=85';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

interface Props {
  onEntrou: (nome: string) => void;
}

export default function Login({ onEntrou }: Props) {
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      if (modo === 'criar') {
        const r = await fetch('/api/usuarios', {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({ nome, email, senha }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          setErro(j.erro ?? 'Não foi possível criar a conta.');
          setEnviando(false);
          return;
        }
      }
      const r = await fetch('/api/sessao', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ email, senha, lembrar }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(j.erro ?? 'Não foi possível entrar.');
        setEnviando(false);
        return;
      }
      onEntrou(j.nome ?? nome);
    } catch {
      setErro('Sem conexão. Tente de novo.');
      setEnviando(false);
    }
  }

  function trocarModo(novo: 'entrar' | 'criar') {
    setModo(novo);
    setErro(null);
  }

  return (
    <div className="login-page">
      <section className="login-art">
        <div className="login-logo">
          <div className="logo">
            <span>{NOME_APP}</span>
          </div>
        </div>
        <img src={FOTO} alt="Fachada iluminada de um cinema à noite" />
        <div className="login-overlay" />
        <blockquote>“Toda história que nos atravessa merece ser lembrada.”</blockquote>
        <small>FOTO POR RYAN ANCILL · UNSPLASH</small>
      </section>

      <section className="login-form-wrap">
        <form onSubmit={enviar}>
          <span className="eyebrow">{modo === 'entrar' ? 'BEM-VINDO DE VOLTA' : 'CRIE SUA CONTA'}</span>
          <h1>
            {modo === 'entrar' ? (
              <>
                Continue sua
                <br />
                <em>história.</em>
              </>
            ) : (
              <>
                Comece a sua
                <br />
                <em>coleção.</em>
              </>
            )}
          </h1>
          <p>{modo === 'entrar' ? 'Entre para acessar sua coleção pessoal.' : 'Crie uma conta para guardar as suas histórias.'}</p>

          {modo === 'criar' && (
            <label>
              Nome
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como quer ser chamado"
                autoComplete="name"
                maxLength={60}
                required
              />
            </label>
          )}
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={modo === 'criar' ? 'Mínimo de 8 caracteres' : 'Sua senha'}
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
              minLength={modo === 'criar' ? 8 : undefined}
              required
            />
          </label>

          <div className="form-help">
            <label>
              <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} /> Lembrar de mim
            </label>
            {modo === 'entrar' && <a href="/esqueci-senha">Esqueci minha senha</a>}
          </div>

          {erro && (
            <div className="form-error" role="alert">
              {erro}
            </div>
          )}

          <button className="login-submit" type="submit" disabled={enviando}>
            {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          <p className="signup">
            {modo === 'entrar' ? (
              <>
                Ainda não tem uma conta?{' '}
                <button type="button" onClick={() => trocarModo('criar')}>
                  Crie agora
                </button>
              </>
            ) : (
              <>
                Já tem uma conta?{' '}
                <button type="button" onClick={() => trocarModo('entrar')}>
                  Entrar
                </button>
              </>
            )}
          </p>
        </form>
      </section>
    </div>
  );
}
