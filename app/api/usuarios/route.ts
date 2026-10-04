import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { nome, email, senha } = await request.json();

    // 1. Verifica se os dados foram enviados
    if (!nome || !email || !senha) {
      return NextResponse.json({ erro: 'Preencha todos os campos.' }, { status: 400 });
    }

    // 2. Verifica se o usuário já existe no banco
    const usuarioExistente = await prisma.user.findUnique({
      where: { email }
    });

    if (usuarioExistente) {
      return NextResponse.json({ erro: 'Este email já está em uso.' }, { status: 400 });
    }

    // 3. Criptografa a senha para segurança
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // 4. Salva o novo usuário no banco de dados
    const novoUsuario = await prisma.user.create({
      data: {
        nome,
        email,
        senha: senhaHash,
      },
    });

    return NextResponse.json(
      { sucesso: true, mensagem: 'Usuário criado com sucesso!' },
      { status: 201 }
    );

  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json({ erro: 'Erro interno no servidor.' }, { status: 500 });
  }
}