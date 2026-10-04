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
  const [vista, setVista] = useState<'lista' | 'capas'>('capas'); // Padrão capas inspirado no figma
  const [ordem, setOrdem] = useState<Ordem>('recentes');
  const [sorteio, setSorteio] = useState(false);
  const [rapido, setRapido] = useState<Anime[] | null>(null);
  const [genero, setGenero] = useState('');
  const [estatisticas, setEstatisticas] = useState(false);
  const [editor, setEditor] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState('Meu Perfil');
  const [visaoMobile, setVisaoMobile] = useState<'home' | 'perfil'>('home');

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/animes');
      if (res.ok) setAnimes(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    fetch('/api/sessao')
      .then((r) => r.json())
      .then((j) => {
        setEditor(Boolean(j.editor));
        if (j.nome) setNomeUsuario(j.nome);
      })
      .catch(() => {});
  }, []);

  const info = TIPO_INFO[tipo];
  const daSecao = useMemo(() => animes.filter((a) => a.tipo === tipo), [animes, tipo]);
  const favoritos = useMemo(() => daSecao.filter((a) => a.favorito), [daSecao]);
  const queroVer = useMemo(() => daSecao.filter((a) => a.status === 'quero_ver'), [daSecao]);
  const assistidos = useMemo(() => daSecao.filter((a) => a.status === 'assistido'), [daSecao]);
  const semNota = useMemo(() => daSecao.filter((a) => a.status === 'assistido' && a.nota == null), [daSecao]);

  const generosDaSecao = useMemo(
    () => [...new Set(daSecao.flatMap((a) => a.generos))].sort((a, b) => a.localeCompare(b, 'pt')),
    [daSecao]
  );

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
    setAnimes([]);
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

  return (
    <div className={`app-shell theme-dark topic-${tipo}`} data-secao={tipo}>
      {/* Barra Lateral Inspirada no Figma (Desktop) */}
      <aside className="sidebar">
        <div>
          <a className="logo" href="#" onClick={() => setVisaoMobile('home')}>
            FRAME<span>.</span>
          </a>
          <nav className="mt-12 space-y-1">
            <button
              onClick={() => { setAba('assistido'); setVisaoMobile('home'); }}
              className={`nav-link w-full text-left ${aba === 'assistido' ? 'nav-active' : ''}`}
            >
              Já assisti <span className="ml-auto text-xs opacity-60">{assistidos.length}</span>
            </button>
            <button
              onClick={() => { setAba('quero_ver'); setVisaoMobile('home'); }}
              className={`nav-link w-full text-left ${aba === 'quero_ver' ? 'nav-active' : ''}`}
            >
              Quero assistir <span className="ml-auto text-xs opacity-60">{queroVer.length}</span>
            </button>
            {favoritos.length > 0 && (
              <button
                onClick={() => setVisaoMobile('home')}
                className="nav-link w-full text-left text-accent"
              >
                Favoritos ⭐ <span className="ml-auto text-xs opacity-60">{favoritos.length}</span>
              </button>
            )}
          </nav>
        </div>

        <div className="border-t border-rule pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 font-bold text-accent text-sm">
                {nomeUsuario.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{nomeUsuario}</p>
                <p className="text-xs text-mute">{daSecao.length} itens salvos</p>
              </div>
            </div>
            <TemaToggle />
          </div>

          <div className="flex items-center justify-between pt-2">
            {editor ? (
              <button onClick={sair} className="text-xs text-alert hover:underline">
                Terminar sessão
              </button>
            ) : (
              <button onClick={() => setEntrando(true)} className="text-xs text-accent hover:underline font-semibold">
                Entrar na conta
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="content">
        <header className="app-header">
          {/* Seletor de Tipo (Anime, Série, Filme) no topo estilo abas do figma */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist">
            {TIPOS.map((t) => (
              <button
                key={t}
                onClick={() => trocarSecao(t)}
                role="tab"
                aria-selected={tipo === t}
                className={`media-tab ${tipo === t ? 'media-tab-active' : ''}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                {TIPO_INFO[t].secao}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {editor && (
              <button
                onClick={() => setForm({})}
                className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-paper transition hover:bg-accent sm:text-sm"
              >
                + Adicionar {info.singular}
              </button>
            )}
          </div>
        </header>

        {/* Barra de Pesquisa e Ferramentas */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="search-wrap">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="M13 13l4 4" strokeLinecap="round" />
            </svg>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={`Buscar em ${info.plural.toLowerCase()}...`}
              aria-label="Buscar na sua lista"
            />
            {busca && (
              <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink">
                ×
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-mute">
            <select
              value={ordem}
              onChange={(e) => setOrdem(e.target.value as Ordem)}
              className="rounded-md border border-rule bg-panel px-3 py-1.5 text-ink text-xs outline-none"
            >
              <option value="recentes">Mais recentes</option>
              <option value="nota">Maior nota</option>
              <option value="az">Ordem A-Z</option>
            </select>

            {generosDaSecao.length > 0 && (
              <select
                value={genero}
                onChange={(e) => setGenero(e.target.value)}
                className="rounded-md border border-rule bg-panel px-3 py-1.5 text-ink text-xs outline-none max-w-[140px]"
              >
                <option value="">Todos os gêneros</option>
                {generosDaSecao.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1 bg-panel border border-rule rounded-md p-0.5">
              <button
                onClick={() => setVista('capas')}
                className={`px-2.5 py-1 text-xs rounded ${vista === 'capas' ? 'bg-ink text-paper font-semibold' : 'hover:text-ink'}`}
              >
                Capas
              </button>
              <button
                onClick={() => setVista('lista')}
                className={`px-2.5 py-1 text-xs rounded ${vista === 'lista' ? 'bg-ink text-paper font-semibold' : 'hover:text-ink'}`}
              >
                Lista
              </button>
            </div>
          </div>
        </div>

        {/* Atalhos Rápidos Extras */}
        <div className="mb-6 flex flex-wrap items-center gap-4 text-xs">
          {!termo && ABAS.map((s) => (
            <button
              key={s}
              onClick={() => setAba(s)}
              className={`pb-1 font-medium transition-colors border-b-2 ${aba === s ? 'border-accent text-ink font-bold' : 'border-transparent text-mute hover:text-ink'}`}
            >
              {STATUS_LABEL[s]} ({daSecao.filter((a) => a.status === s).length})
            </button>
          ))}
          {queroVer.length > 0 && (
            <button onClick={() => setSorteio(true)} className="text-accent hover:underline ml-auto font-medium">
              🎲 Sortear o que assistir
            </button>
          )}
          {editor && semNota.length > 0 && (
            <button onClick={() => setRapido(semNota)} className="text-accent hover:underline font-medium">
              ⭐ Avaliar {semNota.length} sem nota
            </button>
          )}
          {daSecao.length > 0 && (
            <button onClick={() => setEstatisticas(true)} className="text-accent hover:underline font-medium">
              📊 Estatísticas
            </button>
          )}
        </div>

        {/* Listagem Real de Animes/Séries/Filmes com o Design do Figma */}
        <section className="fade-in">
          {lista.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-rule py-20 text-center">
              <p className="font-display text-xl text-mute">
                {termo ? `Nada encontrado para “${busca.trim()}”.` : 'Nenhum título encontrado nesta seção.'}
              </p>
              {editor && !termo && (
                <button
                  onClick={() => setForm({})}
                  className="mt-4 rounded-md bg-ink px-4 py-2 text-xs font-bold text-paper hover:bg-accent"
                >
                  Adicionar {info.singular} agora
                </button>
              )}
            </div>
          ) : vista === 'capas' ? (
            <div className="poster-grid">
              {lista.map((a, index) => (
                <article key={a.id} className="poster-card group cursor-pointer" onClick={() => setAberto(a)}>
                  <div className="poster-image">
                    <img src={a.urlCapa} alt={a.titulo} loading="lazy" />
                    <span className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {a.favorito && (
                      <span className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-accent backdrop-blur">
                        <Coracao cheio className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <div className="pt-3">
                    <div className="flex items-center justify-between text-xs text-mute mb-1">
                      <span>{STATUS_SINGULAR[a.status]} {a.ano ? `• ${a.ano}` : ''}</span>
                      {a.nota != null && (
                        <span className="flex items-center gap-1 font-semibold text-ink">
                          ⭐ {a.nota}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-base leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                      {a.titulo}
                    </h3>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-rule">
              {lista.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => setAberto(a)}
                    className="flex w-full items-center gap-4 py-3 text-left transition-colors hover:bg-wash px-2 rounded-lg"
                  >
                    <img src={a.urlCapa} alt="" className="h-16 w-11 flex-none rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <span className="line-clamp-1 font-display text-lg leading-snug font-semibold">
                        {a.titulo}
                        {a.favorito && <Coracao cheio className="ml-2 inline-block h-3.5 w-3.5 text-accent align-baseline" />}
                      </span>
                      <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-mute">
                        <span className="text-accent">{STATUS_SINGULAR[a.status]}</span>
                        {a.ano && <span>{a.ano}</span>}
                        {a.comentario && <span className="italic">Com comentário</span>}
                      </span>
                    </div>
                    {a.nota != null && (
                      <div className="flex-none">
                        <Estrelas valor={a.nota} />
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Navegação Inferior Mobile */}
      <nav className="bottom-nav">
        <button onClick={() => { setAba('assistido'); }} className="bottom-link">
          <span>✔️ Vistos</span>
        </button>
        {editor && (
          <button onClick={() => setForm({})} className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper shadow-lg hover:bg-accent">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        )}
        <button onClick={() => setAba('quero_ver')} className="bottom-link">
          <span>🔖 Quero ver</span>
        </button>
      </nav>

      {/* Modais do Sistema */}
      {aberto && (
        <Detalhes
          anime={aberto}
          podeEditar={editor}
          onFechar={() => setAberto(null)}
          onEditar={() => { setForm({ editar: aberto }); setAberto(null); }}
          onFavoritar={() => alternarFavorito(aberto)}
          onComentario={(t) => salvarComentario(aberto.id, t)}
          onGenero={(g) => { setGenero(g); setBusca(''); setAba(aberto.status); setAberto(null); }}
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
          onSalvo={() => { setForm(null); carregar(); }}
        />
      )}

      {sorteio && (
        <Sorteio candidatos={queroVer} onVer={(a) => { setSorteio(false); setAberto(a); }} onFechar={() => setSorteio(false)} />
      )}

      {estatisticas && (
        <Estatisticas itens={daSecao} titulo={info.plural} tipo={tipo} onFechar={() => setEstatisticas(false)} />
      )}

      {entrando && (
        <Entrar
          onEntrou={() => {
            setEntrando(false);
            setEditor(true);
            carregar();
            fetch('/api/sessao').then(r => r.json()).then(j => { if (j.nome) setNomeUsuario(j.nome); }).catch(() => {});
          }}
          onFechar={() => setEntrando(false)}
        />
      )}

      {rapido && <AvaliarRapido fila={rapido} onNota={async (id, nota) => {
        setAnimes((p) => p.map((x) => (x.id === id ? { ...x, nota } : x)));
        await api(`/api/animes/${id}`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ nota }) });
      }} onFechar={() => setRapido(null)} />}
    </div>
  );
}