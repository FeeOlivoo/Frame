// Tradução automática para português, pelo serviço público do Google Tradutor (sem chave).
// Devolve null se o texto já estiver em português. Lança erro se o serviço falhar.

async function traduzirTrecho(trecho: string): Promise<{ texto: string; idioma: string }> {
  const url =
    'https://translate.googleapis.com/translate_a/single?' +
    new URLSearchParams({ client: 'gtx', sl: 'auto', tl: 'pt', dt: 't', q: trecho });
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Tradutor HTTP ${res.status}`);
  const json = await res.json();
  return { texto: (json[0] as any[]).map((s) => s[0]).join(''), idioma: json[2] };
}

// o serviço aceita trechos curtos: quebra nos finais de frase
function dividir(p: string, max = 1200): string[] {
  if (p.length <= max) return [p];
  const saida: string[] = [];
  let atual = '';
  for (const frase of p.split(/(?<=[.!?])\s+/)) {
    if (atual && (atual + ' ' + frase).length > max) {
      saida.push(atual);
      atual = frase;
    } else {
      atual = atual ? atual + ' ' + frase : frase;
    }
  }
  if (atual) saida.push(atual);
  return saida;
}

export async function traduzirParaPt(texto: string): Promise<string | null> {
  const paragrafos = texto.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const saida: string[] = [];
  let primeiro = true;
  for (const p of paragrafos) {
    const partes: string[] = [];
    for (const trecho of dividir(p)) {
      const r = await traduzirTrecho(trecho);
      if (primeiro && r.idioma === 'pt') return null; // já está em português
      primeiro = false;
      partes.push(r.texto);
    }
    saida.push(partes.join(' '));
  }
  return saida.join('\n\n') || null;
}
