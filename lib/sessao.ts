import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const NOME = 'sessao';
const DURACAO_S = 60 * 60 * 24 * 30; // 30 dias

export const COOKIE = {
  nome: NOME,
  opcoes: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACAO_S,
  },
};

export const sessaoConfigurada = () => Boolean(process.env.SENHA_EDICAO && process.env.SEGREDO_SESSAO);

const assinar = (valor: string) =>
  createHmac('sha256', process.env.SEGREDO_SESSAO ?? '').update(valor).digest('base64url');

export function senhaConfere(tentativa: string) {
  const senha = process.env.SENHA_EDICAO;
  if (!senha || !process.env.SEGREDO_SESSAO) return false;
  const a = createHash('sha256').update(tentativa).digest();
  const b = createHash('sha256').update(senha).digest();
  return timingSafeEqual(a, b);
}

export function criarToken() {
  const base = `editor.${Math.floor(Date.now() / 1000) + DURACAO_S}`;
  return `${base}.${assinar(base)}`;
}

function tokenValido(token?: string) {
  if (!token || !process.env.SEGREDO_SESSAO) return false;
  const partes = token.split('.');
  if (partes.length !== 3) return false;
  const [papel, exp, assinatura] = partes;
  const a = Buffer.from(assinatura);
  const b = Buffer.from(assinar(`${papel}.${exp}`));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return papel === 'editor' && Number(exp) > Date.now() / 1000;
}

export async function ehEditor() {
  return tokenValido((await cookies()).get(NOME)?.value);
}

export const negado = () => NextResponse.json({ erro: 'Entre com a senha para editar.' }, { status: 401 });
