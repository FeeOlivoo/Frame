// Chamada ao TMDB feita no servidor, com a chave do .env
export async function tmdb(
  caminho: string,
  params: Record<string, string> = {}
): Promise<{ json: any } | { erro: string; status: 500 | 502 }> {
  const chave = process.env.TMDB_API_KEY;
  if (!chave) return { erro: 'Falta configurar a chave do TMDB no arquivo .env.', status: 500 };

  const qs = new URLSearchParams({ language: 'pt-BR', ...params });
  const headers: Record<string, string> = {};
  // aceita tanto a chave curta (v3) quanto o token longo (v4)
  if (chave.startsWith('eyJ')) headers.Authorization = `Bearer ${chave}`;
  else qs.set('api_key', chave);

  const res = await fetch(`https://api.themoviedb.org/3/${caminho}?${qs}`, { headers });
  if (!res.ok) {
    const erro = res.status === 401 ? 'A chave do TMDB não foi aceita. Confira o .env.' : 'Erro ao consultar o TMDB.';
    return { erro, status: 502 };
  }
  return { json: await res.json() };
}
