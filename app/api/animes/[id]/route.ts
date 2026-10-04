import { NextResponse } from 'next/server';
import { negado, obterIdLogado } from '@/lib/sessao';
import { prisma } from '@/lib/prisma';
import { dadosDoAnime, notaValida, paraCliente, validar } from '@/lib/validacao';

type Ctx = { params: Promise<{ id: string }> };

const naoEncontrado = () => NextResponse.json({ erro: 'Título não encontrado.' }, { status: 404 });

// o título precisa existir E pertencer a quem está logado
const doDono = (id: string, userId: string) => prisma.anime.findFirst({ where: { id, userId }, select: { id: true } });

export async function PUT(req: Request, { params }: Ctx) {
  const userId = await obterIdLogado();
  if (!userId) return negado();
  const { id } = await params;
  if (!(await doDono(id, userId))) return naoEncontrado();

  const b = await req.json();
  const erro = validar(b);
  if (erro) return NextResponse.json({ erro }, { status: 400 });
  const anime = await prisma.anime.update({ where: { id }, data: dadosDoAnime(b) });
  return NextResponse.json(paraCliente(anime));
}

// atualização parcial: favoritar, avaliar e comentar sem reenviar o resto
export async function PATCH(req: Request, { params }: Ctx) {
  const userId = await obterIdLogado();
  if (!userId) return negado();
  const { id } = await params;
  if (!(await doDono(id, userId))) return naoEncontrado();

  const b = await req.json();
  const data: { favorito?: boolean; nota?: number | null; comentario?: string | null; status?: string } = {};
  if (typeof b.favorito === 'boolean') data.favorito = b.favorito;
  if ('nota' in b) {
    if (!notaValida(b.nota)) return NextResponse.json({ erro: 'nota deve ser de 1 a 5 estrelas' }, { status: 400 });
    data.nota = b.nota;
  }
  // marcar como assistido / quero assistir (a nota é mantida, para não perder a avaliação ao alternar)
  if ('status' in b) {
    if (b.status !== 'assistido' && b.status !== 'quero_ver') {
      return NextResponse.json({ erro: 'status inválido' }, { status: 400 });
    }
    data.status = b.status;
  }
  if ('comentario' in b) {
    if (b.comentario !== null && (typeof b.comentario !== 'string' || b.comentario.length > 2000)) {
      return NextResponse.json({ erro: 'comentário inválido (máximo de 2000 caracteres)' }, { status: 400 });
    }
    data.comentario = b.comentario?.trim() || null;
  }
  if (!Object.keys(data).length) return NextResponse.json({ erro: 'nada para atualizar' }, { status: 400 });
  const anime = await prisma.anime.update({ where: { id }, data });
  return NextResponse.json(paraCliente(anime));
}

export async function DELETE(_: Request, { params }: Ctx) {
  const userId = await obterIdLogado();
  if (!userId) return negado();
  const { id } = await params;
  if (!(await doDono(id, userId))) return naoEncontrado();

  await prisma.anime.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
