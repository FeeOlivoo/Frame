// Traduz para português as sinopses dos animes que estão em inglês.
// Pode rodar mais de uma vez: o que já está em português é pulado.
// Uso: node scripts/traduzir-sinopses.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function traduzirTrecho(trecho) {
  const url =
    'https://translate.googleapis.com/translate_a/single?' +
    new URLSearchParams({ client: 'gtx', sl: 'auto', tl: 'pt', dt: 't', q: trecho });
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Tradutor HTTP ${res.status}`);
  const json = await res.json();
  return { texto: json[0].map((s) => s[0]).join(''), idioma: json[2] };
}

function dividir(p, max = 1200) {
  if (p.length <= max) return [p];
  const saida = [];
  let atual = '';
  for (const frase of p.split(/(?<=[.!?])\s+/)) {
    if (atual && (atual + ' ' + frase).length > max) {
      saida.push(atual);
      atual = frase;
    } else {
      atual = atual ? atual + ' ' + frase : frase;
    }
  }
  if (atual) saida.push(atual);
  return saida;
}

// devolve null se já estiver em português; lança erro se o serviço falhar
async function traduzir(texto) {
  const paragrafos = texto.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const saida = [];
  let primeiro = true;
  for (const p of paragrafos) {
    const partes = [];
    for (const trecho of dividir(p)) {
      const r = await traduzirTrecho(trecho);
      if (primeiro && r.idioma === 'pt') return null;
      primeiro = false;
      partes.push(r.texto);
      await esperar(300);
    }
    saida.push(partes.join(' '));
  }
  return saida.join('\n\n') || null;
}

const animes = await prisma.anime.findMany({
  where: { tipo: 'anime', sinopse: { not: null } },
  orderBy: { dataAdicao: 'asc' },
});
console.log(`${animes.length} animes com sinopse\n`);

let traduzidos = 0;
let jaPt = 0;
const erros = [];
let falhasSeguidas = 0;

let n = 0;
for (const a of animes) {
  n++;
  const prefixo = `[${n}/${animes.length}] ${a.titulo}`;
  try {
    const nova = await traduzir(a.sinopse);
    falhasSeguidas = 0;
    if (nova === null) {
      console.log(`${prefixo} -> já em português`);
      jaPt++;
      continue;
    }
    await prisma.anime.update({ where: { id: a.id }, data: { sinopse: nova } });
    console.log(`${prefixo} -> traduzido`);
    traduzidos++;
  } catch (e) {
    console.log(`${prefixo} -> ERRO: ${e.message}`);
    erros.push(a.titulo);
    if (++falhasSeguidas >= 5) {
      console.log('\nO serviço de tradução parou de responder. Tente de novo daqui a alguns minutos.');
      break;
    }
  }
}

console.log(`\nPronto. Traduzidos: ${traduzidos} | já em português: ${jaPt} | erros: ${erros.length}`);
if (erros.length) console.log('Rode de novo para tentar os que falharam.');
await prisma.$disconnect();
