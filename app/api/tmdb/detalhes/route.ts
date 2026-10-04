import { NextResponse } from 'next/server';
import { ehEditor, negado } from '@/lib/sessao';
import { tmdb } from '@/lib/tmdb';

// Duração (filme) e episódios (série): só vêm na consulta de detalhes do TMDB.
export async function GET(req: Request) {
  if (!(await ehEditor())) return negado();
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get('tipo');
  const id = Number(searchParams.get('id'));
  if ((tipo !== 'filme' && tipo !== 'serie') || !Number.isInteger(id)) {
    return NextResponse.json({ erro: 'Parâmetros inválidos.' }, { status: 400 });
  }

  const r = await tmdb(`${tipo === 'filme' ? 'movie' : 'tv'}/${id}`);
  if ('erro' in r) return NextResponse.json({ erro: r.erro }, { status: r.status });

  const d = r.json;
  return NextResponse.json(
    tipo === 'filme'
      ? { episodios: null, duracao: d.runtime || null }
      : { episodios: d.number_of_episodes ?? null, duracao: d.episode_run_time?.[0] ?? null }
  );
}
