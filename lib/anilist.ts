import { GENEROS_ANILIST } from './generos';

const QUERY = `
query ($search: String) {
  Page(perPage: 8) {
    media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
      id
      seasonYear
      startDate { year }
      episodes
      duration
      genres
      description(asHtml: false)
      title { romaji english }
      coverImage { large }
    }
  }
}`;

export interface Resultado {
  id: number;
  titulo: string; // inglês quando existe, senão romaji
  alternativo: string | null; // nome original, para reconhecer
  ano: number | null;
  sinopse: string | null;
  generos: string[];
  episodios: number | null;
  duracao: number | null;
  urlCapa: string;
}

function limparDescricao(d: string | null): string | null {
  if (!d) return null;
  const texto = d
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;/g, "'")
    .replace(/\n*\(Source:[^)]*\)\s*$/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return texto || null;
}

export async function buscarAnimes(search: string): Promise<Resultado[]> {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { search } }),
  });
  const json = await res.json();
  return json.data.Page.media.map((m: any): Resultado => {
    const { english, romaji } = m.title;
    return {
      id: m.id,
      titulo: english ?? romaji,
      alternativo: english && romaji && english !== romaji ? romaji : null,
      ano: m.seasonYear ?? m.startDate?.year ?? null,
      sinopse: limparDescricao(m.description),
      generos: (m.genres ?? []).map((g: string) => GENEROS_ANILIST[g]).filter(Boolean),
      episodios: m.episodes ?? null,
      duracao: m.duration ?? null,
      urlCapa: m.coverImage.large,
    };
  });
}
