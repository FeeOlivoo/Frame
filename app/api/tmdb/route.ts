import { NextResponse } from 'next/server';
import { ehEditor, negado } from '@/lib/sessao';
import { GENEROS_TMDB } from '@/lib/generos';
import { tmdb } from '@/lib/tmdb';

// Busca filmes e séries no TMDB.
export async function GET(req: Request) {
  if (!(await ehEditor())) return negado();
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get('tipo');
  const q = searchParams.get('q')?.trim();
  if ((tipo !== 'filme' && tipo !== 'serie') || !q) {
    return NextResponse.json({ erro: 'Parâmetros inválidos.' }, { status: 400 });
  }

  const r = await tmdb(`search/${tipo === 'filme' ? 'movie' : 'tv'}`, { query: q, include_adult: 'false' });
  if ('erro' in r) return NextResponse.json({ erro: r.erro }, { status: r.status });

  const resultados = r.json.results
    .filter((x: any) => x.poster_path)
    .slice(0, 8)
    .map((x: any) => {
      const titulo = tipo === 'filme' ? x.title : x.name;
      const original = tipo === 'filme' ? x.original_title : x.original_name;
      const data = tipo === 'filme' ? x.release_date : x.first_air_date;
      return {
        id: x.id,
        titulo,
        alternativo: original && original !== titulo ? original : null,
        ano: data ? Number(String(data).slice(0, 4)) || null : null,
        sinopse: x.overview || null,
        generos: (x.genre_ids ?? []).map((id: number) => GENEROS_TMDB[id]).filter(Boolean),
        episodios: null,
        duracao: null,
        urlCapa: `https://image.tmdb.org/t/p/w342${x.poster_path}`,
      };
    });
  return NextResponse.json(resultados);
}
