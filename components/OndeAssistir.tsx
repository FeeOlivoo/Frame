'use client';
import { useEffect, useState } from 'react';
import { Anime } from '@/lib/types';

interface Opcao {
  nome: string;
  logo: string | null;
  url: string;
  tipo: 'assinatura' | 'gratis' | 'aluguel' | 'compra';
}
interface Dados {
  opcoes: Opcao[];
  paginaCompleta: string | null;
  buscaWeb: string;
  fonte: 'tmdb' | 'anilist';
}

const ROTULO: Record<Opcao['tipo'], string> = {
  assinatura: 'Assinatura',
  gratis: 'Grátis',
  aluguel: 'Alugar',
  compra: 'Comprar',
};

// guarda a resposta enquanto a página está aberta, para não consultar de novo a cada troca de aba
const cache = new Map<string, Dados>();

export default function OndeAssistir({ anime }: { anime: Anime }) {
  const [dados, setDados] = useState<Dados | null>(cache.get(anime.id) ?? null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (cache.has(anime.id)) return;
    let ativo = true;
    const qs = new URLSearchParams({ tipo: anime.tipo, titulo: anime.titulo });
    if (anime.idExterno) qs.set('id', String(anime.idExterno));
    fetch(`/api/onde-assistir?${qs}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.erro ?? 'Não foi possível consultar.');
        return j as Dados;
      })
      .then((j) => {
        cache.set(anime.id, j);
        if (ativo) setDados(j);
      })
      .catch((e) => {
        if (ativo) setErro(e.message);
      });
    return () => {
      ativo = false;
    };
  }, [anime.id, anime.tipo, anime.titulo, anime.idExterno]);

  if (erro) return <p className="mt-6 text-alert">{erro}</p>;
  if (!dados) return <p className="mt-6 text-mute">Procurando onde assistir…</p>;

  return (
    <div className="mt-6">
      {dados.opcoes.length > 0 ? (
        <ul className="space-y-2">
          {dados.opcoes.map((o) => (
            <li key={o.nome}>
              <a
                href={o.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-sm border border-rule px-3 py-2.5 transition-colors hover:border-accent"
              >
                {o.logo ? (
                  <img src={o.logo} alt="" className="h-9 w-9 flex-none rounded-sm object-cover" />
                ) : (
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-sm bg-wash text-sm">{o.nome[0]}</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base">{o.nome}</span>
                  <span className="block text-sm text-mute">{ROTULO[o.tipo]}</span>
                </span>
                <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none text-mute" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 17 17 7M8 7h9v9" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-mute">
          {dados.fonte === 'tmdb'
            ? 'Não encontramos este título em nenhum streaming no Brasil.'
            : 'A AniList não tem links de streaming para este anime.'}
        </p>
      )}

      <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {dados.paginaCompleta && (
          <a href={dados.paginaCompleta} target="_blank" rel="noopener noreferrer" className="text-mute underline hover:text-ink">
            Ver todas as opções
          </a>
        )}
        <a href={dados.buscaWeb} target="_blank" rel="noopener noreferrer" className="text-mute underline hover:text-ink">
          Pesquisar na web
        </a>
      </p>

      <p className="mt-4 text-xs text-faint">
        {dados.fonte === 'tmdb'
          ? 'Disponibilidade no Brasil: dados do JustWatch, via TMDB. Pode mudar sem aviso.'
          : 'Links fornecidos pela AniList. A disponibilidade pode variar de país para país.'}
      </p>
    </div>
  );
}
