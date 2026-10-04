-- CreateTable
CREATE TABLE "animes" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'anime',
    "titulo" TEXT NOT NULL,
    "url_capa" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'quero_ver',
    "nota" INTEGER,
    "personagem_favorito" TEXT,
    "favorito" BOOLEAN NOT NULL DEFAULT false,
    "sinopse" TEXT,
    "ano" INTEGER,
    "generos" TEXT,
    "episodios" INTEGER,
    "duracao" INTEGER,
    "id_externo" INTEGER,
    "data_adicao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "animes_pkey" PRIMARY KEY ("id")
);
