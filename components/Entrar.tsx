'use client';
import { useState } from 'react';

interface Props {
  onEntrou: () => void;
  onFechar: () => void;
}

export default function Entrar({ onEntrou, onFechar }: Props) {
  // Estado para controlar se estamos na tela de login ou de cadastro
  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('entrar');
  
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function submeter() {
    // Bloqueia se faltarem dados
    if (!email || !senha || (modo === 'cadastrar' && !nome)) return;
    
    setEnviando(true);
    setErro(null);
    setSucesso(null);

    try {
      if (modo === 'cadastrar') {
        // Envia os dados para a nossa NOVA rota de criação de usuários
        const res = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, email, senha }),
        });
        
        const j = await res.json().catch(() => ({}));

        if (res.ok) {
          setSucesso('Conta criada com sucesso! Faça login para continuar.');
          setModo('entrar'); // Volta para a tela de login
          setSenha(''); // Limpa a senha por segurança
        } else {
          setErro(j.erro ?? 'Não foi possível criar a conta.');
        }
      } else {
        // Modo Entrar (Login)
        const res = await fetch('/api/sessao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha }), // Agora envia email e senha
        });
        
        if (res.ok) {
          onEntrou();
          return;
        }
        const j = await res.json().catch(() => ({}));
        setErro(j.erro ?? 'Email ou senha incorretos.');
      }
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
          submeter();
        }}
        className="fade-in w-full max-w-sm rounded-t-lg bg-panel p-6 text-ink sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl">
          {modo === 'entrar' ? 'Entrar' : 'Criar Conta'}
        </h2>
        <p className="mt-2 text-sm text-mute">
          {modo === 'entrar' 
            ? 'Entre para gerir a sua lista de animes.' 
            : 'Crie uma conta para fazer a sua própria lista.'}
        </p>

        {/* O campo de Nome só aparece no modo de cadastro */}
        {modo === 'cadastrar' && (
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu Nome"
            aria-label="Seu Nome"
            className="mt-5 w-full border-b border-ink bg-transparent py-2 text-base outline-none placeholder:text-faint focus:border-accent"
          />
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          aria-label="Email"
          className="mt-5 w-full border-b border-ink bg-transparent py-2 text-base outline-none placeholder:text-faint focus:border-accent"
        />

        <input
          type="password"
          autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          aria-label="Senha"
          className="mt-5 w-full border-b border-ink bg-transparent py-2 text-base outline-none placeholder:text-faint focus:border-accent"
        />

        {erro && <p className="mt-3 text-sm text-alert text-red-500">{erro}</p>}
        {sucesso && <p className="mt-3 text-sm text-green-500">{sucesso}</p>}

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={enviando || !email || !senha || (modo === 'cadastrar' && !nome)}
            className="rounded-sm bg-ink px-5 py-2 text-sm text-paper transition-colors hover:bg-accent disabled:opacity-50"
          >
            {enviando ? 'A aguardar...' : (modo === 'entrar' ? 'Entrar' : 'Cadastrar')}
          </button>
          <button type="button" onClick={onFechar} className="text-sm text-mute hover:text-ink">
            Cancelar
          </button>
        </div>
        
        {/* Botão para alternar entre Login e Cadastro */}
        <div className="mt-6 border-t border-rule pt-4 text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setModo(modo === 'entrar' ? 'cadastrar' : 'entrar');
              setErro(null);
              setSucesso(null);
            }}
            className="text-mute hover:text-ink"
          >
            {modo === 'entrar' 
              ? 'Não tem conta? Registe-se aqui.' 
              : 'Já tem conta? Entre aqui.'}
          </button>
        </div>
      </form>
    </div>
  );
}