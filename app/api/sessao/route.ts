import { NextResponse } from 'next/server';
import { COOKIE, criarToken, ehEditor, senhaConfere, sessaoConfigurada } from '@/lib/sessao';

// quem está olhando é o dono (pode editar) ou visitante (só vê)?
export async function GET() {
  return NextResponse.json({ editor: await ehEditor(), configurado: sessaoConfigurada() });
}

export async function POST(req: Request) {
  if (!sessaoConfigurada()) {
    return NextResponse.json({ erro: 'A senha ainda não foi configurada no servidor.' }, { status: 500 });
  }
  const { senha } = (await req.json().catch(() => ({}))) as { senha?: unknown };
  if (typeof senha !== 'string' || !senhaConfere(senha)) {
    await new Promise((r) => setTimeout(r, 800)); // atrapalha tentativas em sequência
    return NextResponse.json({ erro: 'Senha incorreta.' }, { status: 401 });
  }
  const res = NextResponse.json({ editor: true });
  res.cookies.set(COOKIE.nome, criarToken(), COOKIE.opcoes);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ editor: false });
  res.cookies.set(COOKIE.nome, '', { ...COOKIE.opcoes, maxAge: 0 });
  return res;
}
