// Preenche sinopse, ano, gêneros, episódios e duração dos títulos que já estavam salvos.
// Só mexe nos títulos que ainda não têm esses dados. Pode rodar mais de uma vez.
// Uso: node scripts/completar-detalhes.mjs
import { PrismaClient } from '@prisma/client';

try {
  process.loadEnvFile(); // lê o .env (chave do TMDB)
} catch {}

const prisma = new PrismaClient();
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const GENEROS_ANILIST = {
  Action: 'Ação', Adventure: 'Aventura', Comedy: 'Comédia', Drama: 'Drama', Ecchi: 'Ecchi',
  Fantasy: 'Fantasia', Horror: 'Terror', 'Mahou Shoujo': 'Garota mágica', Mecha: 'Mecha',
  Music: 'Música', Mystery: 'Mistério', Psychological: 'Psicológico', Romance: 'Romance',
  'Sci-Fi': 'Ficção científica', 'Slice of Life': 'Cotidiano', Sports: 'Esportes',
  Supernatural: 'Sobrenatural', Thriller: 'Suspense',
};
const GENEROS_TMDB = {
  28: 'Ação', 12: 'Aventura', 16: 'Animação', 35: 'Comédia', 80: 'Crime', 99: 'Documentário',
  18: 'Drama', 10751: 'Família', 14: 'Fantasia', 36: 'História', 27: 'Terror', 10402: 'Música',
  9648: 'Mistério', 10749: 'Romance', 878: 'Ficção científica', 10770: 'Cinema TV', 53: 'Suspense',
  10752: 'Guerra', 37: 'Faroeste', 10759: 'Ação e aventura', 10762: 'Infantil', 10763: 'Notícias',
  10764: 'Reality', 10765: 'Ficção científica e fantasia', 10766: 'Novela', 10767: 'Talk show',
  10768: 'Guerra e política',
};

function limparDescricao(d) {
  if (!d) return null;
  const t = d
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;/g, "'")
    .replace(/\n*\(Source:[^)]*\)\s*$/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return t || null;
}

const QUERY = `
query ($search: String) {
  Page(perPage: 8) {
    media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
      id seasonYear startDate { year } episodes duration genres
      description(asHtml: false)
      coverImage { large }
    }
  }
}`;

async function anilist(nome) {
  for (let t = 0; t < 4; t++) {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { search: nome } }),
    });
    if (res.status === 429) {
      const s = Number(res.headers.get('retry-after') ?? 30);
      console.log(`   limite da API atingido, aguardando ${s}s...`);
      await esperar((s + 1) * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
    return (await res.json()).data.Page.media;
  }
  throw new Error('limite de requisições da AniList');
}

async function tmdb(caminho, params = {}) {
  const chave = process.env.TMDB_API_KEY;
  if (!chave) throw new Error('TMDB_API_KEY não encontrada no .env');
  const qs = new URLSearchParams({ language: 'pt-BR', ...params });
  const headers = {};
  if (chave.startsWith('eyJ')) headers.Authorization = `Bearer ${chave}`;
  else qs.set('api_key', chave);
  const res = await fetch(`https://api.themoviedb.org/3/${caminho}?${qs}`, { headers });
  if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
  return res.json();
}

const pendentes = await prisma.anime.findMany({
  where: { sinopse: null, idExterno: null },
  orderBy: { dataAdicao: 'asc' },
});
console.log(`${pendentes.length} títulos sem detalhes\n`);

const completos = [];
const naoAchados = [];
const erros = [];

let n = 0;
for (const a of pendentes) {
  n++;
  const prefixo = `[${n}/${pendentes.length}] ${a.titulo}`;
  try {
    let dados = null;

    if (a.tipo === 'anime') {
      const candidatos = await anilist(a.titulo);
      await esperar(800);
      const m = candidatos.find((c) => c.coverImage.large === a.urlCapa); // a capa identifica com certeza
      if (m) {
        dados = {
          idExterno: m.id,
          ano: m.seasonYear ?? m.startDate?.year ?? null,
          sinopse: limparDescricao(m.description),
          generos: (m.genres ?? []).map((g) => GENEROS_ANILIST[g]).filter(Boolean),
          episodios: m.episodes ?? null,
          duracao: m.duration ?? null,
        };
      }
    } else {
      const caminho = a.tipo === 'filme' ? 'movie' : 'tv';
      const busca = await tmdb(`search/${caminho}`, { query: a.titulo, include_adult: 'false' });
      const r = busca.results.find((x) => x.poster_path && a.urlCapa.endsWith(x.poster_path));
      if (r) {
        const d = await tmdb(`${caminho}/${r.id}`);
        const data = a.tipo === 'filme' ? d.release_date : d.first_air_date;
        dados = {
          idExterno: r.id,
          ano: data ? Number(String(data).slice(0, 4)) || null : null,
          sinopse: d.overview || null,
          generos: (d.genres ?? []).map((g) => GENEROS_TMDB[g.id] ?? g.name),
          episodios: a.tipo === 'serie' ? (d.number_of_episodes ?? null) : null,
          duracao: a.tipo === 'filme' ? d.runtime || null : (d.episode_run_time?.[0] ?? null),
        };
      }
      await esperar(250);
    }

    if (!dados) {
      console.log(`${prefixo} -> não identificado`);
      naoAchados.push(a.titulo);
      continue;
    }

    await prisma.anime.update({
      where: { id: a.id },
      data: { ...dados, generos: dados.generos.length ? dados.generos.join('|') : null },
    });
    console.log(`${prefixo} -> ok`);
    completos.push(a.titulo);
  } catch (e) {
    console.log(`${prefixo} -> ERRO: ${e.message}`);
    erros.push(`${a.titulo}: ${e.message}`);
  }
}

console.log(`\nPronto. Completos: ${completos.length} | não identificados: ${naoAchados.length} | erros: ${erros.length}`);
if (naoAchados.length) console.log('Não identificados:\n  - ' + naoAchados.join('\n  - '));
if (erros.length) console.log('Erros (rode de novo):\n  - ' + erros.join('\n  - '));
await prisma.$disconnect();
