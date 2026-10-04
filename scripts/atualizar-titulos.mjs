// Troca os títulos já salvos (japonês romanizado) pelo título em inglês.
// Uso:   node scripts/atualizar-titulos.mjs --simular   (só mostra o que mudaria)
//        node scripts/atualizar-titulos.mjs             (salva de verdade)
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const simular = process.argv.includes('--simular');
const prisma = new PrismaClient();
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const QUERY = `
query ($search: String) {
  Page(perPage: 8) {
    media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
      id
      title { romaji english }
      coverImage { large }
    }
  }
}`;

async function buscar(nome) {
  for (let tentativa = 0; tentativa < 4; tentativa++) {
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
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data.Page.media;
  }
  throw new Error('limite de requisições da AniList');
}

const animes = await prisma.anime.findMany({ orderBy: { dataAdicao: 'asc' } });
console.log(`${animes.length} animes no banco${simular ? ' (SIMULAÇÃO: nada será salvo)' : ''}\n`);

const mudados = [];
const iguais = [];
const naoAchados = [];
const erros = [];

let n = 0;
for (const a of animes) {
  n++;
  const prefixo = `[${n}/${animes.length}] ${a.titulo}`;
  try {
    const candidatos = await buscar(a.titulo);
    await esperar(800);

    // a capa identifica o anime com certeza
    const alvo = candidatos.find((c) => c.coverImage.large === a.urlCapa);
    if (!alvo) {
      console.log(`${prefixo} -> não identificado`);
      naoAchados.push(a.titulo);
      continue;
    }

    const novo = alvo.title.english ?? alvo.title.romaji;
    if (novo === a.titulo) {
      console.log(`${prefixo} -> já está certo`);
      iguais.push(a.titulo);
      continue;
    }

    console.log(`${prefixo} -> ${novo}`);
    if (!simular) await prisma.anime.update({ where: { id: a.id }, data: { titulo: novo } });
    mudados.push(`${a.titulo}  =>  ${novo}`);
  } catch (e) {
    console.log(`${prefixo} -> ERRO: ${e.message}`);
    erros.push(`${a.titulo}: ${e.message}`);
  }
}

const secao = (t, l) => `${t} (${l.length})\n${l.map((x) => '  - ' + x).join('\n') || '  (nenhum)'}\n`;
writeFileSync(
  'relatorio-titulos.txt',
  [
    simular ? 'SIMULAÇÃO - nada foi salvo\n' : '',
    secao('ALTERADOS', mudados),
    secao('NÃO IDENTIFICADOS (edite pelo app)', naoAchados),
    secao('ERROS (rode de novo)', erros),
    secao('JÁ ESTAVAM CERTOS', iguais),
  ].join('\n')
);

console.log(`\nPronto. Alterados: ${mudados.length} | já certos: ${iguais.length} | não identificados: ${naoAchados.length} | erros: ${erros.length}`);
console.log('Detalhes em relatorio-titulos.txt');
await prisma.$disconnect();
