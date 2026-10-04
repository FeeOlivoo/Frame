'use client';

import { FormEvent, Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function FormularioRedefinirSenha() {
  const params = useSearchParams();
  const token = useMemo(() => params.get('token') ?? '', [params]);
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function redefinir(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setMensagem('');
    if (!token) return setErro('Link de recuperação inválido.');
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.');
    if (senha !== confirmacao) return setErro('As senhas não coincidem.');

    setEnviando(true);
    try {
      const res = await fetch('/api/senha/redefinir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.erro || 'Não foi possível alterar a senha.');
      setMensagem('Senha alterada com sucesso! Agora você pode entrar com a nova senha.');
      setSenha('');
      setConfirmacao('');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível alterar a senha.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-10 text-ink sm:flex sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-lg bg-panel p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-3xl">Nova senha</h1>
        <p className="mt-2 text-sm text-mute">Crie uma nova senha para a sua conta.</p>

        <form onSubmit={redefinir} className="mt-6 space-y-5">
          <input type="password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Nova senha" autoComplete="new-password" className="w-full border-b border-ink bg-transparent py-2 outline-none placeholder:text-faint focus:border-accent" />
          <input type="password" required minLength={6} value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} placeholder="Confirmar nova senha" autoComplete="new-password" className="w-full border-b border-ink bg-transparent py-2 outline-none placeholder:text-faint focus:border-accent" />

          {erro && <p className="text-sm text-red-500">{erro}</p>}
          {mensagem && <p className="text-sm text-green-600">{mensagem}</p>}

          <button disabled={enviando || !token} className="w-full rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent disabled:opacity-50">
            {enviando ? 'Salvando...' : 'Alterar senha'}
          </button>
        </form>

        <Link href="/" className="mt-6 block text-center text-sm text-mute hover:text-ink">Voltar para o início</Link>
      </div>
    </main>
  );
}

export default function RedefinirSenhaPage() {
  return <Suspense fallback={<main className="min-h-screen bg-paper px-5 py-10 text-ink" />}>
    <FormularioRedefinirSenha />
  </Suspense>;
}
