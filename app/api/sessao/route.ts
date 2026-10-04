import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { COOKIE, criarToken, obterIdLogado, opcoesCookie } from '@/lib/sessao';

// quem está olhando: logado (com o nome) ou visitante?
export async function GET() {
  const userId = await obterIdLogado();
  if (!userId) return NextResponse.json({ editor: false, configurado: true });

  const usuario = await prisma.user.findUnique({ where: { id: userId }, select: { nome: true } });
  return NextResponse.json({ editor: Boolean(usuario), nome: usuario?.nome, configurado: true });
}

export async function POST(req: Request) {
  try {
    const corpo = await req.json().catch(() => ({}));
    const email = typeof corpo.email === 'string' ? corpo.email.trim() : '';
    const senha = typeof corpo.senha === 'string' ? corpo.senha : '';
    const lembrar = corpo.lembrar !== false; // "lembrar de mim" (padrão: sim)

    if (!email || !senha) {
      return NextResponse.json({ erro: 'Email e senha são obrigatórios.' }, { status: 400 });
    }

    // e-mail sem diferenciar maiúsculas de minúsculas
    const usuario = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    // a mesma mensagem (e o mesmo atraso) para e-mail inexistente e senha errada
    const senhaValida = usuario ? await bcrypt.compare(senha, usuario.senha) : false;
    if (!usuario || !senhaValida) {
      await new Promise((r) => setTimeout(r, 800)); // atrapalha tentativas em sequência
      return NextResponse.json({ erro: 'Email ou senha incorretos.' }, { status: 401 });
    }

    const res = NextResponse.json({ editor: true, nome: usuario.nome });
    res.cookies.set(COOKIE.nome, await criarToken(usuario.id, lembrar), opcoesCookie(lembrar));
    return res;
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ erro: 'Erro interno no servidor.' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ editor: false });
  res.cookies.set(COOKIE.nome, '', { ...COOKIE.opcoes, maxAge: 0 });
  return res;
}
