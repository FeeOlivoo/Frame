'use client';
import { useEffect } from 'react';
import { Anime, Tipo } from '@/lib/types';

function Barra({ rotulo, valor, max }: { rotulo: string; valor: number; max: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-36 flex-none truncate text-mute">{rotulo}</span>
      <span className="h-2 flex-1 bg-wash">
        <span className="block h-full bg-accent" style={{ width: `${(valor / max) * 100}%` }} />
      </span>
      <span className="w-6 flex-none text-right tabular-nums">{valor}</span>
    </div>
  );
}

interface Props {
  itens: Anime[]; // todos os títulos da seção atual
  titulo: string; // "animes", "filmes" ou "séries"
  tipo: Tipo;
  onFechar: () => void;
}

export default function Estatisticas({ itens, titulo, tipo, onFechar }: Props) {
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [onFechar]);

  const assistidos = itens.filter((a) => a.status === 'assistido');
  const avaliados = assistidos.filter((a) => a.nota != null);
  const media = avaliados.length ? avaliados.reduce((s, a) => s + (a.nota ?? 0), 0) / avaliados.length : null;

  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: avaliados.filter((a) => a.nota === n).length }));
  const maxDist = Math.max(1, ...dist.map((d) => d.c));

  const contagem = new Map<string, number>();
  for (const a of assistidos) for (const g of a.generos) contagem.set(g, (contagem.get(g) ?? 0) + 1);
  const topGeneros = [...contagem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxGenero = Math.max(1, ...topGeneros.map((g) => g[1]));

  const minutos = assistidos.reduce(
    (s, a) => s + (tipo === 'filme' ? (a.duracao ?? 0) : (a.episodios ?? 0) * (a.duracao ?? 0)),
    0
  );
  const horas = Math.round(minutos / 60);
  const episodios = tipo === 'filme' ? 0 : assistidos.reduce((s, a) => s + (a.episodios ?? 0), 0);

  return (
    <div className="fade-in fixed inset-0 z-50 overflow-y-auto bg-paper text-ink" role="dialog" aria-modal="true" aria-label="Estatísticas">
      <div className="mx-auto max-w-3xl px-5 pb-20 pt-6 sm:px-8">
        <button onClick={onFechar} className="flex items-center gap-1 text-sm text-mute transition-colors hover:text-ink">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12.5 4.5L7 10l5.5 5.5" />
          </svg>
          Voltar
        </button>

        <h1 className="mt-8 font-display text-5xl leading-[0.95] tracking-tight">Estatísticas</h1>
        <p className="mt-3 text-sm text-mute">Seus {titulo}, só o que você já assistiu.</p>

        <div className="mt-10 grid grid-cols-2 gap-6 border-y border-rule py-6 sm:grid-cols-4">
          <div>
            <p className="font-display text-5xl leading-none">{assistidos.length}</p>
            <p className="mt-2 text-sm text-mute">assistidos</p>
          </div>
          <div>
            <p className="font-display text-5xl leading-none">{itens.length - assistidos.length}</p>
            <p className="mt-2 text-sm text-mute">para ver</p>
          </div>
          <div>
            <p className="font-display text-5xl leading-none">{itens.filter((a) => a.favorito).length}</p>
            <p className="mt-2 text-sm text-mute">favoritos</p>
          </div>
          <div>
            <p className="font-display text-5xl leading-none">
              {media != null ? media.toFixed(1).replace('.', ',') : '–'}
            </p>
            <p className="mt-2 text-sm text-mute">nota média</p>
          </div>
        </div>

        {avaliados.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl">Como você avalia</h2>
            <div className="mt-4 space-y-2">
              {dist.map((d) => (
                <Barra key={d.n} rotulo={`${d.n} ${d.n === 1 ? 'estrela' : 'estrelas'}`} valor={d.c} max={maxDist} />
              ))}
            </div>
          </section>
        )}

        {topGeneros.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl">Gêneros mais vistos</h2>
            <div className="mt-4 space-y-2">
              {topGeneros.map(([g, c]) => (
                <Barra key={g} rotulo={g} valor={c} max={maxGenero} />
              ))}
            </div>
          </section>
        )}

        {horas > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl">Tempo assistido</h2>
            <p className="mt-3 text-lg">
              Cerca de {horas.toLocaleString('pt-BR')} {horas === 1 ? 'hora' : 'horas'}
              {episodios > 0 && <>, em {episodios.toLocaleString('pt-BR')} episódios</>}.
            </p>
            <p className="mt-1 text-sm text-mute">Estimativa, contando só os títulos que têm esses dados.</p>
          </section>
        )}

        {topGeneros.length === 0 && assistidos.length > 0 && (
          <p className="mt-10 text-sm text-mute">
            Os gêneros e o tempo aparecem quando os títulos têm detalhes salvos. Os novos já entram completos.
          </p>
        )}
      </div>
    </div>
  );
}
