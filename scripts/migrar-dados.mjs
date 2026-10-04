// Roda UMA vez depois de atualizar o banco:
//  - move os animes que estavam em "Assistindo" para "Assistidos"
//  - converte as notas de 1-10 para 1-5 estrelas (8 vira 4, 9 vira 5, 3 vira 2...)
// Uso: node scripts/migrar-dados.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const vendo = await prisma.anime.updateMany({
  where: { status: 'assistindo' },
  data: { status: 'assistido' },
});
console.log(`Movidos de "Assistindo" para "Assistidos": ${vendo.count}`);

const comNota = await prisma.anime.findMany({
  where: { nota: { not: null } },
  select: { id: true, titulo: true, nota: true },
});

// se existe alguma nota acima de 5, ainda está na escala antiga (1-10)
if (!comNota.some((a) => a.nota > 5)) {
  console.log('Notas: nada a converter (nenhuma nota acima de 5, ou já convertidas).');
} else {
  for (const a of comNota) {
    const nova = Math.max(1, Math.round(a.nota / 2));
    await prisma.anime.update({ where: { id: a.id }, data: { nota: nova } });
    console.log(`  ${a.titulo}: ${a.nota} -> ${nova} estrelas`);
  }
  console.log(`Notas convertidas: ${comNota.length}`);
}

await prisma.$disconnect();
