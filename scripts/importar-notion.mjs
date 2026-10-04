// Importa a checklist do Notion (.md) para o banco do app.
// Uso:   node scripts/importar-notion.mjs scripts/checklist.md --simular   (só testa)
//        node scripts/importar-notion.mjs scripts/checklist.md             (salva de verdade)
import { readFileSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const arquivo = process.argv[2];
const simular = process.argv.includes('--simular');
if (!arquivo) {
  console.error('Uso: node scripts/importar-notion.mjs <arquivo.md> [--simular]');
  process.exit(1);
}

const prisma = new PrismaClient();
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- leitura da lista ----------
function limpar(s) {
  return s.replace(/📌/g, '').replace(/\s+/g, ' ').trim();
}

function lerLista(texto) {
  const itens = [];
  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.trim();
    if (!linha || linha.startsWith('#')) continue;
    const m = linha.match(/^[-*]\s*\[( |x|X)\]\s*(.+)$/);
    if (m) {
      // [x] = assistido | [ ] = quero ver
      itens.push({ nome: limpar(m[2]), status: m[1] === ' ' ? 'quero_ver' : 'assistido' });
    } else if (!linha.startsWith('-')) {
      // linhas soltas, sem checkbox = quero ver
      itens.push({ nome: limpar(linha), status: 'quero_ver' });
    }
  }
  return itens.filter((i) => i.nome);
}

// ---------- comparação de títulos ----------
const norm = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

function similaridade(a, b) {
  const A = new Set(norm(a).split(' ').filter(Boolean));
  const B = new Set(norm(b).split(' ').filter(Boolean));
  if (!A.size || !B.size) return 0;
  let comuns = 0;
  for (const t of A) if (B.has(t)) comuns++;
  return comuns / Math.max(A.size, B.size);
}

function melhorCandidato(nome, candidatos) {
  let melhor = null;
  let melhorNota = -1;
  for (const c of candidatos) {
    const nomes = [c.title.romaji, c.title.english, ...(c.synonyms ?? [])].filter(Boolean);
    const nota = Math.max(...nomes.map((n) => similaridade(nome, n)));
    if (nota > melhorNota) { melhor = c; melhorNota = nota; }
  }
  return { anime: melhor, nota: melhorNota };
}

// ---------- AniList ----------
const QUERY = `
query ($search: String) {
  Page(perPage: 5) {
    media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
      id
      title { romaji english }
      synonyms
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

// ---------- principal ----------
const itens = lerLista(readFileSync(arquivo, 'utf8'));
console.log(`${itens.length} animes na lista${simular ? ' (SIMULAÇÃO: nada será salvo)' : ''}\n`);

const existentes = await prisma.anime.findMany({ select: { titulo: true, urlCapa: true } });
const titulos = new Set(existentes.map((a) => norm(a.titulo)));
const capas = new Set(existentes.map((a) => a.urlCapa));

const rel = { salvos: [], conferir: [], naoEncontrados: [], pulados: [], erros: [] };

let n = 0;
for (const item of itens) {
  n++;
  const prefixo = `[${n}/${itens.length}] ${item.nome}`;
  try {
    const candidatos = await buscar(item.nome);
    await esperar(800); // respeita o limite de ~90 req/min da AniList

    if (!candidatos.length) {
      console.log(`${prefixo} -> NÃO ENCONTRADO`);
      rel.naoEncontrados.push(item.nome);
      continue;
    }

    const { anime, nota } = melhorCandidato(item.nome, candidatos);
    const titulo = anime.title.romaji ?? anime.title.english;
    const urlCapa = anime.coverImage.large;

    if (titulos.has(norm(titulo)) || capas.has(urlCapa)) {
      console.log(`${prefixo} -> já existe, pulado`);
      rel.pulados.push(`${item.nome} (${titulo})`);
      continue;
    }

    const linha = `${item.nome}  =>  ${titulo}  [${item.status}]`;
    if (nota < 0.6) {
      console.log(`${prefixo} -> ${titulo}  (CONFERIR)`);
      rel.conferir.push(linha);
    } else {
      console.log(`${prefixo} -> ${titulo}`);
      rel.salvos.push(linha);
    }

    if (!simular) {
      await prisma.anime.create({
        data: { titulo, urlCapa, status: item.status, nota: null, personagemFavorito: null },
      });
    }
    titulos.add(norm(titulo));
    capas.add(urlCapa);
  } catch (e) {
    console.log(`${prefixo} -> ERRO: ${e.message}`);
    rel.erros.push(`${item.nome}: ${e.message}`);
  }
}

const secao = (t, l) => `${t} (${l.length})\n${l.map((x) => '  - ' + x).join('\n') || '  (nenhum)'}\n`;
const texto = [
  simular ? 'SIMULAÇÃO - nada foi salvo\n' : '',
  secao('CONFERIR: o app achou algo, mas o título pode estar errado', rel.conferir),
  secao('NÃO ENCONTRADOS: adicione pelo app', rel.naoEncontrados),
  secao('ERROS: rode o script de novo', rel.erros),
  secao('JÁ EXISTIAM (pulados)', rel.pulados),
  secao('OK', rel.salvos),
].join('\n');
writeFileSync('relatorio-importacao.txt', texto);

console.log(`\nPronto. OK: ${rel.salvos.length} | conferir: ${rel.conferir.length} | não encontrados: ${rel.naoEncontrados.length} | erros: ${rel.erros.length} | pulados: ${rel.pulados.length}`);
console.log('Detalhes em relatorio-importacao.txt');
await prisma.$disconnect();
