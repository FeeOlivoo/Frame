import { NextResponse } from 'next/server';
import { negado, obterIdLogado } from '@/lib/sessao';
import { tmdb } from '@/lib/tmdb';

const PAIS = 'BR'; // país da consulta de disponibilidade

type TipoOpcao = 'assinatura' | 'gratis' | 'aluguel' | 'compra';
interface Opcao {
  nome: string;
  logo: string | null;
  url: string;
  tipo: TipoOpcao;
}

// Serviços para os quais sabemos montar uma busca pelo título. Em celular, o link costuma abrir direto no app
// do serviço (se instalado). Os demais usam a página "onde assistir" do TMDB/JustWatch.
const BUSCA: [RegExp, (q: string) => string][] = [
  [/netflix/, (q) => `https://www.netflix.com/search?q=${q}`],
  [/amazon prime|prime video|amazon video/, (q) => `https://www.primevideo.com/search/?phrase=${q}`],
  [/apple tv/, (q) => `https://tv.apple.com/br/search?term=${q}`],
  [/crunchyroll/, (q) => `https://www.crunchyroll.com/search?q=${q}`],
  [/globoplay/, (q) => `https://globoplay.globo.com/busca/?q=${q}`],
  [/youtube/, (q) => `https://www.youtube.com/results?search_query=${q}`],
  [/google play/, (q) => `https://play.google.com/store/search?q=${q}&c=movies`],
];

function buscaNoServico(nome: string, titulo: string) {
  const regra = BUSCA.find(([re]) => re.test(nome.toLowerCase()));
  return regra ? regra[1](encodeURIComponent(titulo)) : null;
}

// Só as 3 principais aparecem: primeiro quem tem o título na assinatura, depois grátis, aluguel e compra;
// dentro de cada grupo, os serviços mais usados vêm primeiro (a ordem desta lista).
const MAX_OPCOES = 3;
const POPULARES = [
  /netflix/,
  /amazon prime|prime video|amazon video/,
  /disney/,
  /max|hbo/,
  /globoplay/,
  /apple tv/,
  /paramount/,
  /crunchyroll/,
  /youtube/,
  /google play/,
];
const ORDEM_TIPO: Record<TipoOpcao, number> = { assinatura: 0, gratis: 1, aluguel: 2, compra: 3 };

function principais(opcoes: Opcao[]): Opcao[] {
  const peso = (nome: string) => {
    const i = POPULARES.findIndex((re) => re.test(nome.toLowerCase()));
    return i === -1 ? POPULARES.length : i;
  };
  return opcoes
    .map((o, posicao) => ({ o, posicao }))
    .sort((a, b) => ORDEM_TIPO[a.o.tipo] - ORDEM_TIPO[b.o.tipo] || peso(a.o.nome) - peso(b.o.nome) || a.posicao - b.posicao)
    .slice(0, MAX_OPCOES)
    .map(({ o }) => o);
}

const GRUPOS: [string, TipoOpcao][] = [
  ['flatrate', 'assinatura'],
  ['free', 'gratis'],
  ['ads', 'gratis'],
  ['rent', 'aluguel'],
  ['buy', 'compra'],
];

// ---------- filmes e séries: TMDB (dados do JustWatch) ----------
async function doTmdb(tipo: 'filme' | 'serie', id: number | null, titulo: string, buscaWeb: string) {
  const caminho = tipo === 'filme' ? 'movie' : 'tv';

  let tmdbId = id;
  if (!tmdbId) {
    const b = await tmdb(`search/${caminho}`, { query: titulo, include_adult: 'false' });
    if ('erro' in b) throw new Error(b.erro);
    tmdbId = b.json.results?.[0]?.id ?? null;
  }
  if (!tmdbId) return { opcoes: [] as Opcao[], paginaCompleta: null, buscaWeb, fonte: 'tmdb' as const };

  const r = await tmdb(`${caminho}/${tmdbId}/watch/providers`);
  if ('erro' in r) throw new Error(r.erro);

  const pais = r.json.results?.[PAIS];
  const vistos = new Set<string>();
  const opcoes: Opcao[] = [];
  for (const [chave, tipoOpcao] of GRUPOS) {
    for (const p of pais?.[chave] ?? []) {
      if (vistos.has(p.provider_name)) continue;
      vistos.add(p.provider_name);
      opcoes.push({
        nome: p.provider_name,
        logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null,
        url: buscaNoServico(p.provider_name, titulo) ?? pais?.link ?? buscaWeb,
        tipo: tipoOpcao,
      });
    }
  }
  return { opcoes: principais(opcoes), paginaCompleta: (pais?.link as string | undefined) ?? null, buscaWeb, fonte: 'tmdb' as const };
}

// ---------- animes: links de streaming que a AniList guarda ----------
const Q_ID = `query ($id: Int) { Media(id: $id, type: ANIME) { externalLinks { site url type icon isDisabled } } }`;
const Q_BUSCA = `query ($search: String) { Media(search: $search, type: ANIME) { externalLinks { site url type icon isDisabled } } }`;

async function doAnime(id: number | null, titulo: string, buscaWeb: string) {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: id ? Q_ID : Q_BUSCA, variables: id ? { id } : { search: titulo } }),
  });
  if (!res.ok) throw new Error('A AniList não respondeu. Tente de novo em instantes.');

  const links: any[] = (await res.json()).data?.Media?.externalLinks ?? [];
  const vistos = new Set<string>();
  const opcoes: Opcao[] = [];
  for (const l of links) {
    if (l.type !== 'STREAMING' || l.isDisabled || !l.url || vistos.has(l.site)) continue;
    vistos.add(l.site);
    opcoes.push({ nome: l.site, logo: l.icon ?? null, url: l.url, tipo: 'assinatura' });
  }
  return { opcoes: principais(opcoes), paginaCompleta: null, buscaWeb, fonte: 'anilist' as const };
}

export async function GET(req: Request) {
  if (!(await obterIdLogado())) return negado();

  const sp = new URL(req.url).searchParams;
  const tipo = sp.get('tipo');
  const titulo = sp.get('titulo')?.trim() ?? '';
  const id = Number(sp.get('id')) || null;
  if ((tipo !== 'anime' && tipo !== 'filme' && tipo !== 'serie') || !titulo) {
    return NextResponse.json({ erro: 'Parâmetros inválidos.' }, { status: 400 });
  }

  const buscaWeb = `https://www.google.com/search?q=${encodeURIComponent(`onde assistir ${titulo}`)}`;
  try {
    const dados = tipo === 'anime' ? await doAnime(id, titulo, buscaWeb) : await doTmdb(tipo, id, titulo, buscaWeb);
    return NextResponse.json(dados);
  } catch (e) {
    const erro = e instanceof Error ? e.message : 'Não foi possível consultar onde assistir.';
    return NextResponse.json({ erro }, { status: 502 });
  }
}
