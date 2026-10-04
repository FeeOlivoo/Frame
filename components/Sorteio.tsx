'use client';
import { useState } from 'react';
import { Anime } from '@/lib/types';

function sortear(lista: Anime[], evitarId?: string) {
  const opcoes = lista.length > 1 ? lista.filter((a) => a.id !== evitarId) : lista;
  return opcoes[Math.floor(Math.random() * opcoes.length)];
}

interface Props {
  candidatos: Anime[];
  onVer: (a: Anime) => void;
  onFechar: () => void;
}

export default function Sorteio({ candidatos, onVer, onFechar }: Props) {
  const [atual, setAtual] = useState(() => sortear(candidatos));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onFechar}>
      <div
        className="fade-in max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-lg bg-panel p-6 text-ink sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-mute">Que tal assistir este?</p>
        <div className="mt-4 flex items-center gap-4">
          <img src={atual.urlCapa} alt="" className="h-40 w-28 flex-none rounded-sm object-cover" />
          <h2 className="font-display text-3xl leading-tight">{atual.titulo}</h2>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            onClick={() => onVer(atual)}
            className="rounded-sm bg-ink px-5 py-2 text-sm text-paper transition-colors hover:bg-accent"
          >
            Ver detalhes
          </button>
          {candidatos.length > 1 && (
            <button onClick={() => setAtual(sortear(candidatos, atual.id))} className="text-sm text-accent hover:underline">
              Sortear outro
            </button>
          )}
          <button onClick={onFechar} className="text-sm text-mute hover:text-ink sm:ml-auto">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
