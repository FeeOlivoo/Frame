import { NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DURACAO_MS = 30 * 60 * 1000;

function segredo() {
  return process.env.SEGREDO_SESSAO ?? 'segredo_padrao_dev';
}

function assinar(valor: string) {
  return createHmac('sha256', segredo()).update(valor).digest('base64url');
}

function criarTokenReset(userId: string, exp: number, senhaHash: string) {
  const senhaFingerprint = createHmac('sha256', segredo()).update(senhaHash).digest('base64url');
  const base = `${userId}.${exp}.${senhaFingerprint}`;
  return `${Buffer.from(base).toString('base64url')}.${assinar(base)}`;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const emailNormalizado = String(email ?? '').trim().toLowerCase();

    if (!emailNormalizado) {
      return NextResponse.json({ erro: 'Informe o seu email.' }, { status: 400 });
    }

    const usuario = await prisma.user.findUnique({
      where: { email: emailNormalizado },
    });

    // Não revelamos se o email existe ou não.
    if (!usuario) {
      return NextResponse.json({
        sucesso: true,
        mensagem: 'Se existir uma conta com esse email, você receberá um link para redefinir a senha.',
      });
    }

    const exp = Date.now() + DURACAO_MS;
    const token = criarTokenReset(usuario.id, exp, usuario.senha);
    const origin = new URL(req.url).origin;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
    const resetUrl = `${appUrl.replace(/\/$/, '')}/redefinir-senha?token=${encodeURIComponent(token)}`;

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
      console.error('Password reset não configurado: faltam RESEND_API_KEY ou RESEND_FROM_EMAIL.');
      return NextResponse.json({ erro: 'O envio de email para recuperação ainda não está configurado.' }, { status: 503 });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [usuario.email],
        subject: 'Redefinição de senha — FRAME',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#181818">
            <h2>Redefinir sua senha</h2>
            <p>Olá, ${escapeHtml(usuario.nome)}!</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no FRAME.</p>
            <p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#181818;color:#fff;text-decoration:none;border-radius:6px">Redefinir senha</a></p>
            <p>Esse link expira em 30 minutos. Depois que a senha for alterada, links anteriores deixam de funcionar.</p>
            <p>Se você não solicitou isso, pode ignorar este email.</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const detalhe = await emailResponse.text();
      console.error('Erro ao enviar email de reset:', detalhe);
      return NextResponse.json({ erro: 'Não foi possível enviar o email de recuperação agora.' }, { status: 502 });
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Se existir uma conta com esse email, você receberá um link para redefinir a senha.',
    });
  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error);
    return NextResponse.json({ erro: 'Erro interno no servidor.' }, { status: 500 });
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
