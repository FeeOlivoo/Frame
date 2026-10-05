'use client';
import { useEffect, useState } from 'react';
import Coracao from '@/components/Coracao';
import { Estrelas } from '@/components/Estrelas';
import OndeAssistir from '@/components/OndeAssistir';
import { Anime, STATUS_SINGULAR } from '@/lib/types';

const duracaoTotal = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}min` : ''}` : `${min}min`;

type Aba = 'sobre' | 'comentario' | 'onde';

interface Props {
  anime: Anime;
  podeEditar: boolean;
  onEditar: () => void;
  onExcluir: () => void;
  onFavoritar: () => void;
  onGenero: (g: string) => void;
  onComentario: (texto: string | null) => Promise<void>;
  onFechar: () => void;
}

export default function Detalhes({
  anime,
  podeEditar,
  onEditar,
  onExcluir,
  onFavoritar,
  onGenero,
  onComentario,
  onFechar,
}: Props) {
  // quem quer assistir já abre direto em "Onde assistir"
  const [aba, setAba] = useState<Aba>(anime.status === 'quero_ver' ? 'onde' : 'sobre');
  const [texto, setTexto] = useState(anime.comentario ?? '');
  const [estado, setEstado] = useState<'parado' | 'salvando' | 'salvo' | 'erro'>('parado');
  const alterado = texto.trim() !== (anime.comentario ?? '');

  // Esc fecha
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [onFechar]);

  async function salvarComentario() {
    setEstado('salvando');
    try {
      await onComentario(texto.trim() || null);
      setEstado('salvo');
    } catch {
      setEstado('erro');
    }
  }

  const medidas: string[] = [];
  if (anime.ano) medidas.push(String(anime.ano));
  if (anime.tipo === 'filme') {
    if (anime.duracao) medidas.push(duracaoTotal(anime.duracao));
  } else {
    if (anime.episodios) medidas.push(`${anime.episodios} ${anime.episodios === 1 ? 'episódio' : 'episódios'}`);
    if (anime.duracao) medidas.push(`${anime.duracao} min por episódio`);
  }

  return (
    <div
      className="fade-in fixed inset-0 z-50 overflow-y-auto bg-paper text-ink"
      role="dialog"
      aria-modal="true"
      aria-label={anime.titulo}
    >
      <div className="mx-auto max-w-3xl px-5 pb-20 pt-6 sm:px-8">
        <button onClick={onFechar} className="flex items-center gap-1 text-sm text-mute transition-colors hover:text-ink">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12.5 4.5L7 10l5.5 5.5" />
          </svg>
          Voltar
        </button>

        <div className="mt-8 flex flex-col gap-8 sm:flex-row">
          <img
            src={anime.urlCapa}
            alt={anime.titulo}
            className="aspect-[2/3] w-44 flex-none self-start rounded-sm object-cover sm:w-56"
          />

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-4xl leading-tight sm:text-5xl">{anime.titulo}</h1>

            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-mute">
              {medidas.map((m) => (
                <span key={m}>{m}</span>
              ))}
              <span className="text-accent">{STATUS_SINGULAR[anime.status]}</span>
            </p>

            {anime.nota != null && (
              <div className="mt-4">
                <Estrelas valor={anime.nota} tamanho="h-5 w-5" />
              </div>
            )}

            {anime.generos.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {anime.generos.map((g) => (
                  <li key={g}>
                    <button
                      onClick={() => onGenero(g)}
                      className="rounded-sm border border-rule px-2.5 py-1 text-sm text-mute transition-colors hover:border-accent hover:text-accent"
                    >
                      {g}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <nav className="mt-8 flex items-center gap-x-2 border-b border-rule pb-2 text-sm" aria-label="Seções do título">
              <button
                onClick={() => setAba('sobre')}
                aria-pressed={aba === 'sobre'}
                className={`py-1 transition-colors ${
                  aba === 'sobre' ? 'text-ink underline decoration-accent decoration-2 underline-offset-8' : 'text-mute hover:text-ink'
                }`}
              >
                Sobre
              </button>
              <span className="text-faint" aria-hidden="true">
                /
              </span>
              <button
                onClick={() => setAba('comentario')}
                aria-pressed={aba === 'comentario'}
                className={`py-1 transition-colors ${
                  aba === 'comentario' ? 'text-ink underline decoration-accent decoration-2 underline-offset-8' : 'text-mute hover:text-ink'
                }`}
              >
                Comentário
              </button>
              <span className="text-faint" aria-hidden="true">
                /
              </span>
              <button
                onClick={() => setAba('onde')}
                aria-pressed={aba === 'onde'}
                className={`py-1 transition-colors ${
                  aba === 'onde' ? 'text-ink underline decoration-accent decoration-2 underline-offset-8' : 'text-mute hover:text-ink'
                }`}
              >
                Onde assistir
              </button>
            </nav>

            {aba === 'onde' ? (
              <OndeAssistir anime={anime} />
            ) : aba === 'sobre' ? (
              <div className="mt-6">
                {anime.sinopse && (
                  <p className="max-w-prose whitespace-pre-line font-display text-lg leading-relaxed">{anime.sinopse}</p>
                )}
                {anime.personagemFavorito && (
                  <p className={`text-sm text-mute ${anime.sinopse ? 'mt-6' : ''}`}>
                    Personagem favorito
                    <span className="block font-display text-xl italic text-ink">{anime.personagemFavorito}</span>
                  </p>
                )}
                {!anime.sinopse && !anime.personagemFavorito && <p className="text-mute">Sem sinopse salva.</p>}
              </div>
            ) : podeEditar ? (
              <div className="mt-6">
                <label htmlFor="comentario" className="sr-only">
                  Seu comentário
                </label>
                <textarea
                  id="comentario"
                  value={texto}
                  onChange={(e) => {
                    setTexto(e.target.value);
                    setEstado('parado');
                  }}
                  rows={7}
                  maxLength={2000}
                  placeholder="O que você achou? O que gostou, o que não gostou, o melhor momento..."
                  className="w-full resize-y border border-rule bg-transparent p-3 text-base leading-relaxed outline-none placeholder:text-faint focus:border-accent"
                />
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <button
                    onClick={salvarComentario}
                    disabled={!alterado || estado === 'salvando'}
                    className="rounded-sm bg-ink px-5 py-2 text-paper transition-colors hover:bg-accent disabled:opacity-40"
                  >
                    Salvar comentário
                  </button>
                  {estado === 'salvo' && !alterado && <span className="text-mute">Salvo</span>}
                  {estado === 'erro' && <span className="text-alert">Não foi possível salvar.</span>}
                  <span className="ml-auto tabular-nums text-faint">{texto.length}/2000</span>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                {anime.comentario ? (
                  <p className="max-w-prose whitespace-pre-line font-display text-lg leading-relaxed">{anime.comentario}</p>
                ) : (
                  <p className="text-mute">Sem comentário ainda.</p>
                )}
              </div>
            )}

            {podeEditar ? (
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                <button onClick={onEditar} className="rounded-sm bg-ink px-5 py-2 text-sm text-paper transition-colors hover:bg-accent">
                  Editar
                </button>
                <button
                  onClick={onFavoritar}
                  aria-pressed={anime.favorito}
                  className="flex items-center gap-1.5 text-sm text-mute transition-colors hover:text-ink"
                >
                  <Coracao cheio={anime.favorito} className="h-4 w-4 text-accent" />
                  {anime.favorito ? 'Nos favoritos' : 'Favoritar'}
                </button>
                <button
                  onClick={() => confirm('Excluir da lista?') && onExcluir()}
                  className="text-sm text-alert hover:underline sm:ml-auto"
                >
                  Excluir
                </button>
              </div>
            ) : (
              anime.favorito && (
                <p className="mt-8 flex items-center gap-1.5 text-sm text-mute">
                  <Coracao cheio className="h-4 w-4 text-accent" />
                  Nos favoritos
                </p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
