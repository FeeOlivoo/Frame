'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setMensagem('');
    setEnviando(true);

    try {
      const res = await fetch('/api/senha/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.erro || 'Não foi possível enviar o email.');
      setMensagem(data.mensagem);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar o email.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-10 text-ink sm:flex sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-lg bg-panel p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-3xl">Esqueci minha senha</h1>
        <p className="mt-2 text-sm text-mute">Informe o email da sua conta e enviaremos um link para criar uma nova senha.</p>

        <form onSubmit={enviar} className="mt-6 space-y-5">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full border-b border-ink bg-transparent py-2 outline-none placeholder:text-faint focus:border-accent"
          />

          {erro && <p className="text-sm text-red-500">{erro}</p>}
          {mensagem && <p className="text-sm text-green-600">{mensagem}</p>}

          <button disabled={enviando} className="w-full rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent disabled:opacity-50">
            {enviando ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>

        <Link href="/" className="mt-6 block text-center text-sm text-mute hover:text-ink">Voltar para o início</Link>
      </div>
    </main>
  );
}
