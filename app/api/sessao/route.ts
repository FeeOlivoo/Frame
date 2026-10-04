import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
// Removemos as importações antigas de senhaConfere e sessaoConfigurada
import { COOKIE, criarToken, ehEditor } from '@/lib/sessao';

const prisma = new PrismaClient();

export async function GET() {
  return NextResponse.json({ editor: await ehEditor(), configurado: true });
}

export async function POST(req: Request) {
  try {
    const { email, senha } = await req.json();

    if (!email || !senha) {
      return NextResponse.json({ erro: 'Email e senha são obrigatórios.' }, { status: 400 });
    }

    // 1. Busca o utilizador pelo email no banco de dados
    const usuario = await prisma.user.findUnique({
      where: { email }
    });

    if (!usuario) {
      await new Promise((r) => setTimeout(r, 800)); // Atrasa a resposta para evitar ataques de força bruta
      return NextResponse.json({ erro: 'Email ou senha incorretos.' }, { status: 401 });
    }

    // 2. Compara a senha digitada com a senha criptografada no banco
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      await new Promise((r) => setTimeout(r, 800));
      return NextResponse.json({ erro: 'Email ou senha incorretos.' }, { status: 401 });
    }

    // 3. Login com sucesso! 
    const res = NextResponse.json({ editor: true, nome: usuario.nome });
    
    // Passamos o ID do utilizador para dentro do token para sabermos de quem é a lista
    res.cookies.set(COOKIE.nome, await criarToken(usuario.id), COOKIE.opcoes);
    
    return res;
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json({ erro: 'Erro interno no servidor.' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ editor: false });
  res.cookies.set(COOKIE.nome, '', { ...COOKIE.opcoes, maxAge: 0 });
  return res;
}