import { NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { segredo } from '@/lib/sessao';

const DURACAO_MS = 30 * 60 * 1000;
const MENSAGEM = 'Se existir uma conta com esse email, você receberá um link para redefinir a senha.';

const assinar = (valor: string) => createHmac('sha256', segredo()).update(valor).digest('base64url');

function criarTokenReset(userId: string, exp: number, senhaHash: string) {
  // a "impressão" da senha atual faz o link morrer assim que a senha for trocada
  const senhaFingerprint = createHmac('sha256', segredo()).update(senhaHash).digest('base64url');
  const base = `${userId}.${exp}.${senhaFingerprint}`;
  return `${Buffer.from(base).toString('base64url')}.${assinar(base)}`;
}

export async function POST(req: Request) {
  try {
    const corpo = await req.json().catch(() => ({}));
    const email = String(corpo.email ?? '').trim();
    if (!email) return NextResponse.json({ erro: 'Informe o seu email.' }, { status: 400 });

    // erro de configuração: igual para todo mundo (não revela se o e-mail existe)
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) {
      console.error('Recuperação de senha não configurada: faltam RESEND_API_KEY ou RESEND_FROM_EMAIL.');
      return NextResponse.json({ erro: 'O envio de email para recuperação ainda não está configurado.' }, { status: 503 });
    }

    const usuario = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (!usuario) return NextResponse.json({ sucesso: true, mensagem: MENSAGEM });

    const token = criarTokenReset(usuario.id, Date.now() + DURACAO_MS, usuario.senha);
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, '');
    const resetUrl = `${appUrl}/redefinir-senha?token=${encodeURIComponent(token)}`;

    const envio = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
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
            <p>Esse link expira em 30 minutos e só funciona uma vez.</p>
            <p>Se você não solicitou isso, pode ignorar este email.</p>
          </div>
        `,
      }),
    });

    // falha no envio fica só no log: a resposta é a mesma, exista a conta ou não
    if (!envio.ok) console.error('Erro ao enviar email de reset:', await envio.text());

    return NextResponse.json({ sucesso: true, mensagem: MENSAGEM });
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
