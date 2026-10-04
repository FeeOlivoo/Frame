import { createHmac, timingSafeEqual } from 'node:crypto';
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

const assinar = (valor: string) =>
  createHmac('sha256', process.env.SEGREDO_SESSAO ?? 'segredo_padrao_dev').update(valor).digest('base64url');

// Agora o token é criado usando o ID real do usuário
export async function criarToken(userId: string) {
  const base = `${userId}.${Math.floor(Date.now() / 1000) + DURACAO_S}`;
  return `${base}.${assinar(base)}`;
}

// Extrai e valida o ID guardado dentro do token
function lerIdDoToken(token?: string): string | null {
  if (!token) return null;
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  
  const [userId, exp, assinatura] = partes;
  const a = Buffer.from(assinatura);
  const b = Buffer.from(assinar(`${userId}.${exp}`));
  
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now() / 1000) return null; // Sessão expirada
  
  return userId;
}

// Nova função crucial que usaremos no banco de dados para saber "quem" está logado
export async function obterIdLogado() {
  const c = await cookies();
  return lerIdDoToken(c.get(NOME)?.value);
}

// Mantemos o nome ehEditor para o seu frontend continuar funcionando sem quebrar
export async function ehEditor() {
  const userId = await obterIdLogado();
  return Boolean(userId); // Retorna true se houver um usuário logado
}

export const negado = () => NextResponse.json({ erro: 'Entre com a sua conta para editar.' }, { status: 401 });