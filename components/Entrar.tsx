'use client';
import { useState } from 'react';

interface Props {
  onEntrou: () => void;
  onFechar: () => void;
}

export default function Entrar({ onEntrou, onFechar }: Props) {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar() {
    if (!senha) return;
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch('/api/sessao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha }),
      });
      if (res.ok) {
        onEntrou();
        return;
      }
      const j = await res.json().catch(() => ({}));
      setErro(j.erro ?? 'Não foi possível entrar.');
    } catch {
      setErro('Sem conexão. Tente de novo.');
    }
    setEnviando(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onFechar}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          entrar();
        }}
        className="fade-in w-full max-w-sm rounded-t-lg bg-panel p-6 text-ink sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl">Entrar para editar</h2>
        <p className="mt-2 text-sm text-mute">Só quem tem a senha pode adicionar, avaliar ou excluir.</p>
        <input
          autoFocus
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          aria-label="Senha"
          className="mt-5 w-full border-b border-ink bg-transparent py-2 text-base outline-none placeholder:text-faint focus:border-accent"
        />
        {erro && <p className="mt-3 text-sm text-alert">{erro}</p>}
        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            disabled={enviando || !senha}
            className="rounded-sm bg-ink px-5 py-2 text-sm text-paper transition-colors hover:bg-accent disabled:opacity-50"
          >
            Entrar
          </button>
          <button type="button" onClick={onFechar} className="text-sm text-mute hover:text-ink">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
