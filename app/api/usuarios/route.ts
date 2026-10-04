import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Lista de e-mails que podem criar conta, na variável EMAILS_PERMITIDOS (separados por vírgula).
// Se a variável não existir, NINGUÉM consegue criar conta.
function emailLiberado(email: string) {
  const liberados = (process.env.EMAILS_PERMITIDOS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return liberados.includes(email);
}

export async function POST(request: Request) {
  try {
    const corpo = await request.json().catch(() => ({}));
    const nome = typeof corpo.nome === 'string' ? corpo.nome.trim() : '';
    const email = typeof corpo.email === 'string' ? corpo.email.trim().toLowerCase() : '';
    const senha = typeof corpo.senha === 'string' ? corpo.senha : '';

    if (!nome || !email || !senha) {
      return NextResponse.json({ erro: 'Preencha todos os campos.' }, { status: 400 });
    }
    if (nome.length > 60) {
      return NextResponse.json({ erro: 'O nome pode ter no máximo 60 caracteres.' }, { status: 400 });
    }
    if (!EMAIL_VALIDO.test(email)) {
      return NextResponse.json({ erro: 'Digite um e-mail válido.' }, { status: 400 });
    }
    if (senha.length < 8 || senha.length > 72) {
      return NextResponse.json({ erro: 'A senha precisa ter de 8 a 72 caracteres.' }, { status: 400 });
    }
    if (!emailLiberado(email)) {
      return NextResponse.json(
        { erro: 'Este e-mail ainda não foi liberado. Peça acesso a quem administra o app.' },
        { status: 403 }
      );
    }

    const jaExiste = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (jaExiste) {
      return NextResponse.json({ erro: 'Este email já está em uso.' }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    await prisma.user.create({ data: { nome, email, senha: senhaHash } });

    return NextResponse.json({ sucesso: true, mensagem: 'Usuário criado com sucesso!' }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ erro: 'Erro interno no servidor.' }, { status: 500 });
  }
}
