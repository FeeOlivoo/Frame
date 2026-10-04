import { buscarAnimes, Resultado } from './anilist';
import { Anime, Tipo } from './types';

export type { Resultado };

// tudo o que é guardado a partir de uma escolha na busca
export interface Escolha {
  titulo: string;
  urlCapa: string;
  ano: number | null;
  sinopse: string | null;
  generos: string[];
  episodios: number | null;
  duracao: number | null;
  idExterno: number | null;
}

export function paraEscolha(r: Resultado): Escolha {
  return {
    titulo: r.titulo,
    urlCapa: r.urlCapa,
    ano: r.ano,
    sinopse: r.sinopse,
    generos: r.generos,
    episodios: r.episodios,
    duracao: r.duracao,
    idExterno: r.id,
  };
}

export function deAnime(a: Anime): Escolha {
  return {
    titulo: a.titulo,
    urlCapa: a.urlCapa,
    ano: a.ano,
    sinopse: a.sinopse,
    generos: a.generos,
    episodios: a.episodios,
    duracao: a.duracao,
    idExterno: a.idExterno,
  };
}

// anime -> AniList (direto do navegador) | filme e série -> TMDB (via /api/tmdb, que guarda a chave)
export async function buscarTitulos(tipo: Tipo, q: string): Promise<Resultado[]> {
  if (tipo === 'anime') return buscarAnimes(q);
  const res = await fetch(`/api/tmdb?tipo=${tipo}&q=${encodeURIComponent(q)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.erro ?? 'Não foi possível buscar.');
  return json;
}

export async function extrasTmdb(tipo: Tipo, id: number): Promise<{ episodios: number | null; duracao: number | null }> {
  const res = await fetch(`/api/tmdb/detalhes?tipo=${tipo}&id=${id}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.erro ?? 'Não foi possível buscar os detalhes.');
  return json;
}
