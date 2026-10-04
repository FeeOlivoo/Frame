'use client';
import { useEffect, useState } from 'react';
import { EscolherEstrelas } from '@/components/Estrelas';
import { Anime } from '@/lib/types';

interface Props {
  fila: Anime[]; // fotografia dos títulos sem nota, no momento em que abriu
  onNota: (id: string, nota: number) => void;
  onFechar: () => void;
}

export default function AvaliarRapido({ fila, onNota, onFechar }: Props) {
  const [i, setI] = useState(0);
  const atual = fila[i];

  function avaliar(n: number) {
    onNota(atual.id, n);
    setI((x) => x + 1);
  }

  // teclas 1 a 5 no computador
  useEffect(() => {
    if (!atual) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '5') {
        onNota(atual.id, Number(e.key));
        setI((x) => x + 1);
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [atual, onNota]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onFechar}>
      <div
        className="fade-in max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-lg bg-panel p-6 text-ink sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {atual ? (
          <>
            <p className="text-sm text-mute">
              Avaliar {i + 1} de {fila.length}
            </p>
            <img src={atual.urlCapa} alt="" className="mx-auto mt-4 h-64 rounded-sm object-cover" />
            <h2 className="mt-4 text-center font-display text-2xl leading-tight">{atual.titulo}</h2>
            <div className="mt-3 flex justify-center">
              <EscolherEstrelas valor={null} onChange={(n) => n && avaliar(n)} />
            </div>
            <div className="mt-5 flex items-center justify-between text-sm">
              <button onClick={() => setI(i + 1)} className="text-accent hover:underline">
                Pular
              </button>
              <button onClick={onFechar} className="text-mute hover:text-ink">
                Fechar
              </button>
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <h2 className="font-display text-2xl">Fila concluída</h2>
            <p className="mt-2 text-sm text-mute">Não há mais títulos para avaliar nesta rodada.</p>
            <button onClick={onFechar} className="mt-5 rounded-sm bg-ink px-5 py-2 text-sm text-paper hover:bg-accent">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
