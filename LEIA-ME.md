# Meus Animes — passo a passo (Windows / PowerShell)

1. Criar o projeto base:
   npx create-next-app@latest anime-tracker --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*"
   cd anime-tracker

2. Instalar o Prisma (versão 6, banco SQLite — sem instalar nada além disso):
   npm i prisma@6 @prisma/client@6
   npx prisma init --datasource-provider sqlite

3. Copie as pastas deste zip para dentro do projeto, sobrescrevendo:
   prisma/schema.prisma, lib/, components/, app/page.tsx, app/layout.tsx, app/api/
   E cole o conteúdo de globals-append.css no FINAL de app/globals.css.

4. Criar o banco e rodar:
   npx prisma migrate dev --name init
   npm run dev

5. Abra http://localhost:3000. Para mostrar no celular, acesse http://IP-DO-PC:3000
   (mesma rede Wi-Fi) ou publique na Vercel (troque SQLite por Postgres/Turso nesse caso).
