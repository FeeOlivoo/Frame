'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function RedefinirSenhaForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function redefinir(e: FormEvent) {
    e.preventDefault();

    setErro('');
    setMensagem('');

    if (!token) {
      setErro('Link de recuperação inválido ou incompleto.');
      return;
    }

    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmacao) {
      setErro('As senhas não são iguais.');
      return;
    }

    setEnviando(true);

    try {
      const res = await fetch('/api/senha/redefinir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          senha,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.erro || 'Não foi possível alterar a senha.'
        );
      }

      setMensagem(
        data.mensagem ||
          'Senha alterada com sucesso! Agora você pode entrar com a nova senha.'
      );

      setSenha('');
      setConfirmacao('');
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : 'Não foi possível alterar a senha.'
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-10 text-ink sm:flex sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-lg bg-panel p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-3xl">
          Redefinir senha
        </h1>

        <p className="mt-2 text-sm text-mute">
          Digite sua nova senha abaixo.
        </p>

        <form onSubmit={redefinir} className="mt-6 space-y-5">
          <input
            type="password"
            required
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Nova senha"
            autoComplete="new-password"
            className="w-full border-b border-ink bg-transparent py-2 outline-none placeholder:text-faint focus:border-accent"
          />

          <input
            type="password"
            required
            minLength={6}
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            placeholder="Confirme a nova senha"
            autoComplete="new-password"
            className="w-full border-b border-ink bg-transparent py-2 outline-none placeholder:text-faint focus:border-accent"
          />

          {erro && (
            <p className="text-sm text-red-500">
              {erro}
            </p>
          )}

          {mensagem && (
            <p className="text-sm text-green-600">
              {mensagem}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent disabled:opacity-50"
          >
            {enviando ? 'Alterando...' : 'Alterar senha'}
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-mute hover:text-ink"
        >
          Voltar para o início
        </Link>
      </div>
    </main>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-paper px-5 py-10 text-ink sm:flex sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-lg bg-panel p-6 shadow-sm sm:p-8">
            <p className="text-sm text-mute">
              Carregando...
            </p>
          </div>
        </main>
      }
    >
      <RedefinirSenhaForm />
    </Suspense>
  );
}