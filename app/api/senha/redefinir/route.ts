import { NextResponse } from 'next/server';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function segredo() {
  return process.env.SEGREDO_SESSAO ?? 'segredo_padrao_dev';
}

function assinar(valor: string) {
  return createHmac('sha256', segredo()).update(valor).digest('base64url');
}

function fingerprintSenha(senhaHash: string) {
  return createHmac('sha256', segredo()).update(senhaHash).digest('base64url');
}

function lerToken(token: string) {
  try {
    const [payload, assinatura] = token.split('.');
    if (!payload || !assinatura) return null;

    const base = Buffer.from(payload, 'base64url').toString('utf8');
    const assinaturaEsperada = assinar(base);
    const a = Buffer.from(assinatura);
    const b = Buffer.from(assinaturaEsperada);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const [userId, expTexto, senhaFingerprint] = base.split('.');
    const exp = Number(expTexto);
    if (!userId || !senhaFingerprint || !Number.isFinite(exp) || exp < Date.now()) return null;

    return { userId, exp, senhaFingerprint };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { token, senha } = await req.json();
    const tokenTexto = String(token ?? '').trim();
    const novaSenha = String(senha ?? '');

    if (!tokenTexto || novaSenha.length < 6) {
      return NextResponse.json({ erro: 'Informe uma senha com pelo menos 6 caracteres.' }, { status: 400 });
    }

    const dados = lerToken(tokenTexto);
    if (!dados) {
      return NextResponse.json({ erro: 'Este link é inválido ou expirou. Solicite outro.' }, { status: 400 });
    }

    const usuario = await prisma.user.findUnique({ where: { id: dados.userId } });
    if (!usuario) {
      return NextResponse.json({ erro: 'Este link é inválido ou expirou. Solicite outro.' }, { status: 400 });
    }

    const atual = fingerprintSenha(usuario.senha);
    const a = Buffer.from(atual);
    const b = Buffer.from(dados.senhaFingerprint);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ erro: 'Este link já foi utilizado. Solicite uma nova recuperação.' }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await prisma.user.update({
      where: { id: usuario.id },
      data: { senha: senhaHash },
    });

    return NextResponse.json({ sucesso: true, mensagem: 'Senha alterada com sucesso.' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json({ erro: 'Erro interno no servidor.' }, { status: 500 });
  }
}
