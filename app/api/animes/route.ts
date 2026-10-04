import { NextResponse } from 'next/server';
import { ehEditor, negado } from '@/lib/sessao';
import { prisma } from '@/lib/prisma';
import { traduzirParaPt } from '@/lib/traduzir';
import { dadosDoAnime, paraCliente, validar } from '@/lib/validacao';

export async function GET() {
  const animes = await prisma.anime.findMany({ orderBy: { dataAdicao: 'desc' } });
  return NextResponse.json(animes.map(paraCliente));
}

export async function POST(req: Request) {
  if (!(await ehEditor())) return negado();
  const b = await req.json();
  const erro = validar(b);
  if (erro) return NextResponse.json({ erro }, { status: 400 });

  const dados = dadosDoAnime(b);
  // a AniList só tem sinopse em inglês: traduz ao salvar um anime novo (se falhar, guarda o original)
  if (dados.tipo === 'anime' && dados.sinopse) {
    try {
      const traduzida = await traduzirParaPt(dados.sinopse);
      if (traduzida) dados.sinopse = traduzida;
    } catch {}
  }

  const anime = await prisma.anime.create({ data: dados });
  return NextResponse.json(paraCliente(anime), { status: 201 });
}
