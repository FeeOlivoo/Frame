// Copia os títulos salvos em backup-animes.json para o banco online (Postgres).
// Uso: node scripts/importar-dados.mjs
import { readFileSync, existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const arquivo = process.argv[2] ?? 'backup-animes.json';
if (!existsSync(arquivo)) {
  console.error(`Não encontrei ${arquivo}. Rode antes: node scripts/exportar-dados.mjs`);
  process.exit(1);
}

const prisma = new PrismaClient();
const linhas = JSON.parse(readFileSync(arquivo, 'utf8'));

const data = (v) => {
  if (v == null) return new Date();
  if (typeof v === 'number' || /^\d+$/.test(String(v))) return new Date(Number(v));
  return new Date(v);
};

const registros = linhas.map((l) => ({
  id: l.id,
  tipo: l.tipo ?? 'anime',
  titulo: l.titulo,
  urlCapa: l.url_capa,
  status: l.status === 'assistindo' ? 'assistido' : l.status,
  nota: l.nota ?? null,
  personagemFavorito: l.personagem_favorito ?? null,
  favorito: Boolean(l.favorito),
  sinopse: l.sinopse ?? null,
  ano: l.ano ?? null,
  generos: l.generos ?? null,
  episodios: l.episodios ?? null,
  duracao: l.duracao ?? null,
  idExterno: l.id_externo ?? null,
  dataAdicao: data(l.data_adicao),
}));

const jaTem = await prisma.anime.count();
if (jaTem > 0) {
  console.log(`O banco online já tem ${jaTem} títulos. Para não duplicar, nada foi importado.`);
  await prisma.$disconnect();
  process.exit(0);
}

const r = await prisma.anime.createMany({ data: registros, skipDuplicates: true });
console.log(`${r.count} de ${registros.length} títulos importados para o banco online.`);
await prisma.$disconnect();
