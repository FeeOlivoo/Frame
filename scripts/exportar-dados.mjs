// Salva todos os títulos do banco local (SQLite) em backup-animes.json.
// Rode ANTES de trocar para o banco online. Serve também como backup.
// Uso: node scripts/exportar-dados.mjs   (na pasta do projeto)
import { DatabaseSync } from 'node:sqlite';
import { existsSync, writeFileSync } from 'node:fs';

const caminho = process.argv[2] ?? 'prisma/dev.db';
if (!existsSync(caminho)) {
  console.error(`Não encontrei ${caminho}. Rode este comando dentro da pasta do projeto.`);
  process.exit(1);
}

const db = new DatabaseSync(caminho, { readOnly: true });
const linhas = db.prepare('SELECT * FROM animes').all();
writeFileSync('backup-animes.json', JSON.stringify(linhas, null, 2));
console.log(`${linhas.length} títulos salvos em backup-animes.json`);
