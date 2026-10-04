import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { segredo } from '@/lib/sessao';

const assinar = (valor: string) => createHmac('sha256', segredo()).update(valor).digest('base64url');
const fingerprintSenha = (senhaHash: string) => createHmac('sha256', segredo()).update(senhaHash).digest('base64url');

function iguais(x: string, y: string) {
  const a = Buffer.from(x);
  const b = Buffer.from(y);
  return a.length === b.length && timingSafeEqual(a, b);
}

function lerToken(token: string) {
  try {
    const [payload, assinatura] = token.split('.');
    if (!payload || !assinatura) return null;

    const base = Buffer.from(payload, 'base64url').toString('utf8');
    if (!iguais(assinatura, assinar(base))) return null;

    const [userId, expTexto, senhaFingerprint] = base.split('.');
    const exp = Number(expTexto);
    if (!userId || !senhaFingerprint || !Number.isFinite(exp) || exp < Date.now()) return null;

    return { userId, senhaFingerprint };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const corpo = await req.json().catch(() => ({}));
    const token = String(corpo.token ?? '').trim();
    const novaSenha = String(corpo.senha ?? '');

    // mesma regra do cadastro
    if (!token || novaSenha.length < 8 || novaSenha.length > 72) {
      return NextResponse.json({ erro: 'A senha precisa ter de 8 a 72 caracteres.' }, { status: 400 });
    }

    const dados = lerToken(token);
    const usuario = dados ? await prisma.user.findUnique({ where: { id: dados.userId } }) : null;
    if (!dados || !usuario) {
      return NextResponse.json({ erro: 'Este link é inválido ou expirou. Solicite outro.' }, { status: 400 });
    }

    if (!iguais(fingerprintSenha(usuario.senha), dados.senhaFingerprint)) {
      return NextResponse.json({ erro: 'Este link já foi utilizado. Solicite uma nova recuperação.' }, { status: 400 });
    }

    await prisma.user.update({ where: { id: usuario.id }, data: { senha: await bcrypt.hash(novaSenha, 10) } });
    return NextResponse.json({ sucesso: true, mensagem: 'Senha alterada com sucesso.' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json({ erro: 'Erro interno no servidor.' }, { status: 500 });
  }
}
