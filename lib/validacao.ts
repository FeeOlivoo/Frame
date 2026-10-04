const TIPOS = ['anime', 'filme', 'serie'];
const STATUS = ['assistido', 'quero_ver'];

export function notaValida(n: unknown) {
  return n === null || (Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 5);
}

export function validar(b: any): string | null {
  if (!b?.titulo || !b?.urlCapa) return 'titulo e urlCapa são obrigatórios';
  if (!TIPOS.includes(b.tipo)) return 'tipo inválido';
  if (!STATUS.includes(b.status)) return 'status inválido';
  if (b.nota != null && !notaValida(b.nota)) return 'nota deve ser de 1 a 5 estrelas';
  return null;
}

const inteiro = (n: unknown) => (Number.isInteger(n) ? (n as number) : null);

export function dadosDoAnime(b: any) {
  return {
    tipo: b.tipo as string,
    titulo: b.titulo as string,
    urlCapa: b.urlCapa as string,
    status: b.status as string,
    nota: b.status === 'quero_ver' ? null : (b.nota ?? null),
    personagemFavorito: b.personagemFavorito || null,
    favorito: Boolean(b.favorito),
    sinopse: typeof b.sinopse === 'string' && b.sinopse ? b.sinopse : null,
    ano: inteiro(b.ano),
    generos: Array.isArray(b.generos) && b.generos.length ? b.generos.join('|') : null,
    episodios: inteiro(b.episodios),
    duracao: inteiro(b.duracao),
    idExterno: inteiro(b.idExterno),
    comentario: typeof b.comentario === 'string' && b.comentario.trim() ? b.comentario.trim().slice(0, 2000) : null,
  };
}

// no banco os gêneros são um texto "A|B|C"; para o navegador viram uma lista
export function paraCliente<T extends { generos: string | null }>(a: T) {
  return { ...a, generos: a.generos ? a.generos.split('|') : [] };
}
