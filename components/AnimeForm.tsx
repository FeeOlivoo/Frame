'use client';
import { useEffect, useState } from 'react';
import { EscolherEstrelas } from '@/components/Estrelas';
import { buscarTitulos, deAnime, Escolha, extrasTmdb, paraEscolha, Resultado } from '@/lib/busca';
import { Anime, Status, STATUS_LABEL, Tipo, TIPO_INFO } from '@/lib/types';

interface Props {
  tipo: Tipo; // seção atual (usada ao adicionar)
  inicial?: Anime;
  onSalvo: () => void;
  onFechar: () => void;
}

const CAMPO =
  'w-full border-b border-ink bg-transparent py-2 text-base outline-none placeholder:text-faint focus:border-accent';

export default function AnimeForm({ tipo, inicial, onSalvo, onFechar }: Props) {
  const tipoAtual: Tipo = inicial?.tipo ?? tipo;
  const info = TIPO_INFO[tipoAtual];

  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sel, setSel] = useState<Escolha | null>(inicial ? deAnime(inicial) : null);
  const [status, setStatus] = useState<Status>(inicial?.status ?? 'quero_ver');
  const [nota, setNota] = useState<number | null>(inicial?.nota ?? null);
  const [personagem, setPersonagem] = useState(inicial?.personagemFavorito ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  const curta = busca.trim().length < 2;

  // busca com debounce
  useEffect(() => {
    if (curta) return;
    let ativo = true;
    setBuscando(true);
    const t = setTimeout(() => {
      buscarTitulos(tipoAtual, busca.trim())
        .then((r) => {
          if (!ativo) return;
          setResultados(r);
          setErro(null);
        })
        .catch((e) => {
          if (!ativo) return;
          setResultados([]);
          setErro(e?.message || 'Não foi possível buscar. Confira sua internet.');
        })
        .finally(() => {
          if (ativo) setBuscando(false);
        });
    }, 400);
    return () => {
      ativo = false;
      clearTimeout(t);
    };
  }, [busca, curta, tipoAtual]);

  async function escolher(r: Resultado) {
    setSel(paraEscolha(r));
    // filme e série: duração e episódios só vêm numa segunda consulta
    if (tipoAtual !== 'anime') {
      try {
        const extra = await extrasTmdb(tipoAtual, r.id);
        setSel((s) => (s ? { ...s, ...extra } : s));
      } catch {}
    }
  }

  async function salvar() {
    if (!sel) return;
    setSalvando(true);
    setErroSalvar(null);
    const res = await fetch(inicial ? `/api/animes/${inicial.id}` : '/api/animes', {
      method: inicial ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...sel,
        tipo: tipoAtual,
        status,
        nota: status === 'quero_ver' ? null : nota,
        personagemFavorito: personagem,
        favorito: inicial?.favorito ?? false,
        comentario: inicial?.comentario ?? null,
      }),
    });
    if (!res.ok) {
      setSalvando(false);
      setErroSalvar(
        res.status === 401 ? 'Sua sessão expirou. Feche, entre de novo e tente outra vez.' : 'Não foi possível salvar.'
      );
      return;
    }
    onSalvo();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onFechar}>
      <div
        className="fade-in max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-lg bg-panel p-6 text-ink sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-5 font-display text-2xl">
          {inicial ? `Editar ${info.singular}` : `Adicionar ${info.singular}`}
        </h2>

        {!inicial && !sel && (
          <>
            <input
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={info.placeholderBusca}
              className={CAMPO}
            />
            {!curta && buscando && <p className="mt-3 text-sm text-mute">Buscando…</p>}
            {!curta && !buscando && erro && <p className="mt-3 text-sm text-alert">{erro}</p>}
            {!curta && !buscando && !erro && resultados.length === 0 && (
              <p className="mt-3 text-sm text-mute">Nenhum resultado.</p>
            )}
            <ul className="mt-2">
              {!curta &&
                resultados.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => escolher(r)}
                      className="flex w-full items-center gap-3 border-b border-rule py-2 text-left transition-colors hover:bg-wash"
                    >
                      <img src={r.urlCapa} alt="" className="h-16 w-11 flex-none rounded-sm object-cover" />
                      <span className="min-w-0">
                        <span className="block font-display text-lg leading-snug">{r.titulo}</span>
                        <span className="flex flex-wrap gap-x-3 text-sm text-mute">
                          {r.ano && <span>{r.ano}</span>}
                          {r.alternativo && <span>{r.alternativo}</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </>
        )}

        {sel && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <img src={sel.urlCapa} alt="" className="h-24 w-16 flex-none rounded-sm object-cover" />
              <div className="min-w-0 flex-1">
                <div className="font-display text-xl leading-snug">{sel.titulo}</div>
                {(sel.ano || sel.generos.length > 0) && (
                  <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-mute">
                    {sel.ano && <span>{sel.ano}</span>}
                    {sel.generos.length > 0 && <span>{sel.generos.slice(0, 3).join(', ')}</span>}
                  </p>
                )}
              </div>
              {!inicial && (
                <button onClick={() => setSel(null)} className="text-sm text-accent hover:underline">
                  Trocar
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`rounded-sm border py-2 text-sm transition-colors ${
                    status === s ? 'border-ink bg-ink text-paper' : 'border-rule text-mute hover:text-ink'
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>

            {status !== 'quero_ver' && (
              <div>
                <p className="mb-1 text-sm text-mute">Nota</p>
                <EscolherEstrelas valor={nota} onChange={setNota} />
              </div>
            )}

            <input
              value={personagem}
              onChange={(e) => setPersonagem(e.target.value)}
              placeholder="Personagem favorito"
              className={CAMPO}
            />

            {erroSalvar && <p className="text-sm text-alert">{erroSalvar}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={onFechar} className="flex-1 rounded-sm border border-rule py-2 text-sm text-mute hover:text-ink">
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="flex-1 rounded-sm bg-ink py-2 text-sm text-paper transition-colors hover:bg-accent disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
