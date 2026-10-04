'use client';
import Coracao from '@/components/Coracao';
import { Estrelas } from '@/components/Estrelas';
import { Anime, STATUS_SINGULAR } from '@/lib/types';

interface Props {
  anime: Anime;
  onEditar: () => void;
  onExcluir: () => void;
  onFavoritar: () => void;
  onFechar: () => void;
}

export default function AnimeModal({ anime, onEditar, onExcluir, onFavoritar, onFechar }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onFechar}>
      <div
        className="fade-in max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-lg bg-panel text-ink sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={anime.urlCapa} alt={anime.titulo} className="h-72 w-full object-cover" />
        <div className="p-6">
          <h2 className="font-display text-3xl leading-tight">{anime.titulo}</h2>
          <p className="mt-2 text-sm text-accent">{STATUS_SINGULAR[anime.status]}</p>
          {anime.nota != null && (
            <div className="mt-3">
              <Estrelas valor={anime.nota} tamanho="h-5 w-5" />
            </div>
          )}
          {anime.personagemFavorito && (
            <p className="mt-4 text-sm text-mute">
              Personagem favorito
              <span className="block font-display text-xl italic text-ink">{anime.personagemFavorito}</span>
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
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
        </div>
      </div>
    </div>
  );
}
