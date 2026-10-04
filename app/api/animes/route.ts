import { NextResponse } from 'next/server';
import { obterIdLogado, negado } from '@/lib/sessao';
import { prisma } from '@/lib/prisma';
import { traduzirParaPt } from '@/lib/traduzir';
import { dadosDoAnime, paraCliente, validar } from '@/lib/validacao';

export async function GET() {
  const userId = await obterIdLogado();
  
  if (!userId) {
    return NextResponse.json([]);
  }


  await prisma.anime.updateMany({
    where: { userId: null },
    data: { userId: userId }
  });

  const animes = await prisma.anime.findMany({ 
    where: { userId: userId },
    orderBy: { dataAdicao: 'desc' } 
  });
  
  return NextResponse.json(animes.map(paraCliente));
}

export async function POST(req: Request) {
  const userId = await obterIdLogado();
  if (!userId) return negado();
  
  const b = await req.json();
  const erro = validar(b);
  if (erro) return NextResponse.json({ erro }, { status: 400 });

  const dados = dadosDoAnime(b);
  
  if (dados.tipo === 'anime' && dados.sinopse) {
    try {
      const traduzida = await traduzirParaPt(dados.sinopse);
      if (traduzida) dados.sinopse = traduzida;
    } catch {}
  }

  const anime = await prisma.anime.create({ 
    data: { 
      ...dados,
      userId: userId 
    } 
  });
  
  return NextResponse.json(paraCliente(anime), { status: 201 });
}