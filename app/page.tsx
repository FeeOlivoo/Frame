'use client';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import AnimeForm from '@/components/AnimeForm';
import AvaliarRapido from '@/components/AvaliarRapido';
import Coracao from '@/components/Coracao';
import Detalhes from '@/components/Detalhes';
import Entrar from '@/components/Entrar';
import { Estrelas } from '@/components/Estrelas';
import Estatisticas from '@/components/Estatisticas';
import Sorteio from '@/components/Sorteio';
import TemaToggle from '@/components/TemaToggle';
import { Anime, Status, STATUS_LABEL, STATUS_SINGULAR, Tipo, TIPO_INFO, TIPOS } from '@/lib/types';

type Ordem = 'recentes' | 'nota' | 'az';

const ABAS = Object.keys(STATUS_LABEL) as Status[];
const JSON_HEADERS = { 'Content-Type': 'application/json' };
// busca sem diferenciar maiúsculas nem acentos
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function ordenar(arr: Anime[], ordem: Ordem) {
  const c = [...arr];
  if (ordem === 'nota') c.sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0) || a.titulo.localeCompare(b.titulo));
  else if (ordem === 'az') c.sort((a, b) => a.titulo.localeCompare(b.titulo));
  else c.sort((a, b) => b.dataAdicao.localeCompare(a.dataAdicao));
  return c;
}

export default function Home() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [tipo, setTipo] = useState<Tipo>('anime');
  const [aba, setAba] = useState<Status>('assistido');
  const [aberto, setAberto] = useState<Anime | null>(null);
  const [form, setForm] = useState<{ editar?: Anime } | null>(null);
  const [busca, setBusca] = useState('');
  const [vista, setVista] = useState<'lista' | 'capas'>('lista');
  const [ordem, setOrdem] = useState<Ordem>('recentes');
  const [sorteio, setSorteio] = useState(false);
  const [rapido, setRapido] = useState<Anime[] | null>(null);
  const [genero, setGenero] = useState('');
  const [estatisticas, setEstatisticas] = useState(false);
  const [editor, setEditor] = useState(false);
  const [entrando, setEntrando] = useState(false);

  const carregar = useCallback(async () => {
    setAnimes(await (await fetch('/api/animes')).json());
  }, []);
  useEffect(() => {
    carregar();
  }, [carregar]);

  // quem está vendo é o dono (pode editar) ou visitante (só vê)?
  useEffect(() => {
    fetch('/api/sessao')
      .then((r) => r.json())
      .then((j) => setEditor(Boolean(j.editor)))
      .catch(() => {});
  }, []);

  const info = TIPO_INFO[tipo];
  const daSecao = useMemo(() => animes.filter((a) => a.tipo === tipo), [animes, tipo]);
  const favoritos = useMemo(() => daSecao.filter((a) => a.favorito), [daSecao]);
  const queroVer = useMemo(() => daSecao.filter((a) => a.status === 'quero_ver'), [daSecao]);
  const semNota = useMemo(() => daSecao.filter((a) => a.status === 'assistido' && a.nota == null), [daSecao]);

  const generosDaSecao = useMemo(
    () => [...new Set(daSecao.flatMap((a) => a.generos))].sort((a, b) => a.localeCompare(b, 'pt')),
    [daSecao]
  );

  // com texto na busca, procura em todas as listas da seção; sem texto, mostra a aba atual
  const termo = norm(busca.trim());
  const lista = useMemo(
    () =>
      ordenar(
        (termo ? daSecao.filter((a) => norm(a.titulo).includes(termo)) : daSecao.filter((a) => a.status === aba)).filter(
          (a) => !genero || a.generos.includes(genero)
        ),
        ordem
      ),
    [daSecao, aba, termo, ordem, genero]
  );

  function trocarSecao(t: Tipo) {
    setTipo(t);
    setBusca('');
    setGenero('');
  }

  // se a sessão expirou, volta a pedir a senha e desfaz a mudança na tela
  async function api(url: string, init?: RequestInit) {
    const r = await fetch(url, init);
    if (r.status === 401) {
      setEditor(false);
      setEntrando(true);
    }
    if (!r.ok) carregar();
    return r;
  }

  async function sair() {
    await fetch('/api/sessao', { method: 'DELETE' });
    setEditor(false);
  }

  async function salvarComentario(id: string, comentario: string | null) {
    const r = await api(`/api/animes/${id}`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ comentario }) });
    if (!r.ok) throw new Error('falha ao salvar o comentário');
    setAnimes((p) => p.map((x) => (x.id === id ? { ...x, comentario } : x)));
    setAberto((p) => (p && p.id === id ? { ...p, comentario } : p));
  }

  async function alternarFavorito(a: Anime) {
    const novo = !a.favorito;
    setAnimes((p) => p.map((x) => (x.id === a.id ? { ...x, favorito: novo } : x)));
    setAberto((p) => (p && p.id === a.id ? { ...p, favorito: novo } : p));
    await api(`/api/animes/${a.id}`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ favorito: novo }) });
  }

  async function avaliar(id: string, nota: number) {
    setAnimes((p) => p.map((x) => (x.id === id ? { ...x, nota } : x)));
    await api(`/api/animes/${id}`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ nota }) });
  }

  return (
    <main
      data-secao={tipo}
      className="mx-auto min-h-screen max-w-3xl px-5 pb-24 pt-8 sm:px-8 sm:pt-12"
    >
      <div className="mb-8 flex items-center justify-between gap-2 text-sm">
        <nav aria-label="Seções" className="flex gap-2">
          {TIPOS.map((t) => (
            <button
              key={t}
              onClick={() => trocarSecao(t)}
              aria-pressed={tipo === t}
              className={`rounded-sm px-3 py-1.5 transition-colors ${
                tipo === t ? 'bg-ink text-paper' : 'text-mute hover:bg-wash hover:text-ink'
              }`}
            >
              {TIPO_INFO[t].secao}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <TemaToggle />
          {editor ? (
            <button onClick={sair} className="rounded-sm px-2 py-1.5 text-mute transition-colors hover:text-ink">
              Sair
            </button>
          ) : (
            <button onClick={() => setEntrando(true)} className="rounded-sm px-2 py-1.5 text-mute transition-colors hover:text-ink">
              Entrar
            </button>
          )}
        </div>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl">{info.titulo}</h1>
          <p className="mt-3 text-sm text-mute">
            {daSecao.length} {daSecao.length === 1 ? info.singular : info.plural}
          </p>
        </div>
        {editor && (
          <button
            onClick={() => setForm({})}
            className="rounded-sm bg-ink px-4 py-2 text-sm text-paper transition-colors hover:bg-accent"
          >
            Adicionar {info.singular}
          </button>
        )}
      </header>

      {!termo && favoritos.length > 0 && (
        <section className="mt-10" aria-label="Favoritos">
          <h2 className="font-display text-2xl">Favoritos</h2>
          <ul className="-mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8">
            {favoritos.map((a) => (
              <li key={a.id} className="w-28 flex-none sm:w-32">
                <button onClick={() => setAberto(a)} className="block w-full text-left">
                  <img src={a.urlCapa} alt="" className="aspect-[2/3] w-full rounded-sm object-cover" />
                  <span className="mt-2 line-clamp-2 block font-display text-base leading-snug">{a.titulo}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="sticky top-0 z-10 -mx-5 mt-8 bg-paper/95 px-5 pt-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="relative">
          <svg
            className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-mute"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="M13 13l4 4" strokeLinecap="round" />
          </svg>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar na sua lista"
            aria-label="Buscar na sua lista"
            className="w-full border-b border-ink bg-transparent py-2 pl-7 pr-9 text-base outline-none placeholder:text-faint focus:border-accent"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              aria-label="Limpar busca"
              className="absolute right-0 top-1/2 -translate-y-1/2 px-2 text-xl leading-none text-mute hover:text-ink"
            >
              ×
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-b border-rule pb-2 text-sm">
          {termo ? (
            <p className="text-mute">
              {lista.length} {lista.length === 1 ? 'resultado' : 'resultados'} em todas as listas
            </p>
          ) : (
            <nav className="flex flex-wrap items-center gap-x-2">
              {ABAS.map((s, i) => (
                <Fragment key={s}>
                  {i > 0 && (
                    <span className="text-faint" aria-hidden="true">
                      /
                    </span>
                  )}
                  <button
                    onClick={() => setAba(s)}
                    aria-pressed={aba === s}
                    className={`py-1 transition-colors ${
                      aba === s
                        ? 'text-ink underline decoration-accent decoration-2 underline-offset-8'
                        : 'text-mute hover:text-ink'
                    }`}
                  >
                    {STATUS_LABEL[s]}{' '}
                    <span className="text-faint">{daSecao.filter((a) => a.status === s).length}</span>
                  </button>
                </Fragment>
              ))}
            </nav>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setVista('lista')}
              aria-pressed={vista === 'lista'}
              className={vista === 'lista' ? 'text-ink' : 'text-mute hover:text-ink'}
            >
              Lista
            </button>
            <button
              onClick={() => setVista('capas')}
              aria-pressed={vista === 'capas'}
              className={vista === 'capas' ? 'text-ink' : 'text-mute hover:text-ink'}
            >
              Capas
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3 text-sm text-mute">
        <label className="flex items-center gap-2">
          Ordenar
          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
            className="rounded-sm border border-rule bg-transparent px-2 py-1 text-ink"
          >
            <option value="recentes" className="bg-panel text-ink">Mais recentes</option>
            <option value="nota" className="bg-panel text-ink">Maior nota</option>
            <option value="az" className="bg-panel text-ink">A a Z</option>
          </select>
        </label>
        {generosDaSecao.length > 0 && (
          <label className="flex items-center gap-2">
            Gênero
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              className="max-w-40 rounded-sm border border-rule bg-transparent px-2 py-1 text-ink"
            >
              <option value="" className="bg-panel text-ink">Todos</option>
              {generosDaSecao.map((g) => (
                <option key={g} value={g} className="bg-panel text-ink">{g}</option>
              ))}
            </select>
          </label>
        )}
        {queroVer.length > 0 && (
          <button onClick={() => setSorteio(true)} className="text-accent hover:underline">
            Sortear para assistir
          </button>
        )}
        {editor && semNota.length > 0 && (
          <button onClick={() => setRapido(semNota)} className="text-accent hover:underline">
            Avaliar {semNota.length} sem nota
          </button>
        )}
        {daSecao.length > 0 && (
          <button onClick={() => setEstatisticas(true)} className="text-accent hover:underline">
            Estatísticas
          </button>
        )}
      </div>

      {/* key faz a lista reaparecer suavemente a cada troca de seção ou aba */}
      <section key={`${tipo}-${termo ? 'busca' : aba}-${vista}`} className="fade-in">
        {lista.length === 0 ? (
          <p className="py-16 text-mute">
            {termo
              ? `Nada encontrado para “${busca.trim()}”.`
              : editor
                ? `Nada por aqui ainda. Use “Adicionar ${info.singular}” para começar.`
                : 'Nada por aqui ainda.'}
          </p>
        ) : vista === 'lista' ? (
          <ul>
            {lista.map((a) => (
              <li key={a.id} className="border-b border-rule">
                <button
                  onClick={() => setAberto(a)}
                  className="flex w-full items-center gap-4 py-3 text-left transition-colors hover:bg-wash"
                >
                  <img src={a.urlCapa} alt="" className="h-20 w-14 flex-none rounded-sm object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block font-display text-xl leading-snug">
                      {a.titulo}
                      {a.favorito && (
                        <Coracao cheio className="ml-2 inline-block h-3.5 w-3.5 align-baseline text-accent" />
                      )}
                    </span>
                    <span className="mt-0.5 flex flex-wrap gap-x-4 text-sm text-mute">
                      {termo && <span className="text-accent">{STATUS_SINGULAR[a.status]}</span>}
                      {a.personagemFavorito && <span className="italic">Favorito: {a.personagemFavorito}</span>}
                      {a.comentario && <span>Com comentário</span>}
                    </span>
                  </span>
                  {a.nota != null && (
                    <span className="flex-none">
                      <Estrelas valor={a.nota} />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid grid-cols-3 gap-x-4 gap-y-6 pt-3 sm:grid-cols-4">
            {lista.map((a) => (
              <li key={a.id}>
                <button onClick={() => setAberto(a)} className="block w-full text-left">
                  <img src={a.urlCapa} alt="" className="aspect-[2/3] w-full rounded-sm object-cover" />
                  <span className="mt-2 line-clamp-2 block font-display text-base leading-snug">
                    {a.titulo}
                    {a.favorito && (
                      <Coracao cheio className="ml-1.5 inline-block h-3 w-3 align-baseline text-accent" />
                    )}
                  </span>
                  {a.nota != null && (
                    <span className="mt-1 block">
                      <Estrelas valor={a.nota} tamanho="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {aberto && (
        <Detalhes
          anime={aberto}
          podeEditar={editor}
          onFechar={() => setAberto(null)}
          onEditar={() => {
            setForm({ editar: aberto });
            setAberto(null);
          }}
          onFavoritar={() => alternarFavorito(aberto)}
          onComentario={(t) => salvarComentario(aberto.id, t)}
          onGenero={(g) => {
            setGenero(g);
            setBusca('');
            setAba(aberto.status);
            setAberto(null);
          }}
          onExcluir={async () => {
            await api(`/api/animes/${aberto.id}`, { method: 'DELETE' });
            setAberto(null);
            carregar();
          }}
        />
      )}

      {form && (
        <AnimeForm
          tipo={tipo}
          inicial={form.editar}
          onFechar={() => setForm(null)}
          onSalvo={() => {
            setForm(null);
            carregar();
          }}
        />
      )}

      {sorteio && (
        <Sorteio
          candidatos={queroVer}
          onVer={(a) => {
            setSorteio(false);
            setAberto(a);
          }}
          onFechar={() => setSorteio(false)}
        />
      )}

      {estatisticas && (
        <Estatisticas itens={daSecao} titulo={info.plural} tipo={tipo} onFechar={() => setEstatisticas(false)} />
      )}

      {entrando && (
        <Entrar
          onEntrou={() => {
            setEntrando(false);
            setEditor(true);
          }}
          onFechar={() => setEntrando(false)}
        />
      )}

      {rapido && <AvaliarRapido fila={rapido} onNota={avaliar} onFechar={() => setRapido(null)} />}
    </main>
  );
}
