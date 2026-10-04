'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
type Visao = 'home' | 'perfil';

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

function Icon({ name, size = 20 }: { name: 'home' | 'bookmark' | 'check' | 'search' | 'star' | 'plus' | 'user' | 'shuffle'; size?: number }) {
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5M9 21v-7h6v7" /></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    check: <path d="m5 12 4.5 4.5L19 7" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    shuffle: <><path d="M3 7h3c4 0 5 10 9 10h6" /><path d="m18 14 3 3-3 3" /><path d="M3 17h3c1.7 0 2.8-1.2 3.8-2.8" /><path d="M15.5 7H21l-3 3" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function Home() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [tipo, setTipo] = useState<Tipo>('anime');
  const [aba, setAba] = useState<Status>('assistido');
  const [aberto, setAberto] = useState<Anime | null>(null);
  const [form, setForm] = useState<{ editar?: Anime } | null>(null);
  const [busca, setBusca] = useState('');
  const [vista, setVista] = useState<'lista' | 'capas'>('capas');
  const [ordem, setOrdem] = useState<Ordem>('recentes');
  const [sorteio, setSorteio] = useState(false);
  const [rapido, setRapido] = useState<Anime[] | null>(null);
  const [genero, setGenero] = useState('');
  const [estatisticas, setEstatisticas] = useState(false);
  const [editor, setEditor] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState('Meu Perfil');
  const [visao, setVisao] = useState<Visao>('home');

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/animes');
      if (res.ok) setAnimes(await res.json());
    } catch {}
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    fetch('/api/sessao').then((r) => r.json()).then((j) => {
      setEditor(Boolean(j.editor));
      if (j.nome) setNomeUsuario(j.nome);
    }).catch(() => {});
  }, []);

  const info = TIPO_INFO[tipo];
  const daSecao = useMemo(() => animes.filter((a) => a.tipo === tipo), [animes, tipo]);
  const favoritos = useMemo(() => daSecao.filter((a) => a.favorito), [daSecao]);
  const queroVer = useMemo(() => daSecao.filter((a) => a.status === 'quero_ver'), [daSecao]);
  const assistidos = useMemo(() => daSecao.filter((a) => a.status === 'assistido'), [daSecao]);
  const semNota = useMemo(() => daSecao.filter((a) => a.status === 'assistido' && a.nota == null), [daSecao]);
  const generosDaSecao = useMemo(() => [...new Set(daSecao.flatMap((a) => a.generos))].sort((a, b) => a.localeCompare(b, 'pt')), [daSecao]);
  const termo = norm(busca.trim());
  const lista = useMemo(() => ordenar(
    (termo ? daSecao.filter((a) => norm(a.titulo).includes(termo)) : daSecao.filter((a) => a.status === aba))
      .filter((a) => !genero || a.generos.includes(genero)), ordem
  ), [daSecao, aba, termo, genero, ordem]);

  const heroAnime = useMemo(() => ordenar(daSecao, 'nota')[0] ?? null, [daSecao]);
  const recent = useMemo(() => ordenar(animes, 'recentes').slice(0, 6), [animes]);
  const totalAvaliacoes = useMemo(() => animes.filter((a) => a.nota != null).length, [animes]);
  const mediaNota = useMemo(() => {
    const notas = animes.map((a) => a.nota).filter((n): n is number => n != null);
    return notas.length ? (notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(1) : '—';
  }, [animes]);

  function trocarSecao(t: Tipo) { setTipo(t); setBusca(''); setGenero(''); setVisao('home'); }

  async function api(url: string, init?: RequestInit) {
    const r = await fetch(url, init);
    if (r.status === 401) { setEditor(false); setEntrando(true); }
    if (!r.ok) carregar();
    return r;
  }

  async function sair() {
    await fetch('/api/sessao', { method: 'DELETE' });
    setEditor(false); setAnimes([]); setVisao('home');
  }

  async function salvarComentario(id: string, comentario: string | null) {
    const r = await api(`/api/animes/${id}`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ comentario }) });
    if (!r.ok) throw new Error('falha ao salvar o comentário');
    setAnimes((p) => p.map((x) => x.id === id ? { ...x, comentario } : x));
    setAberto((p) => p && p.id === id ? { ...p, comentario } : p);
  }

  async function alternarFavorito(a: Anime) {
    const novo = !a.favorito;
    setAnimes((p) => p.map((x) => x.id === a.id ? { ...x, favorito: novo } : x));
    setAberto((p) => p && p.id === a.id ? { ...p, favorito: novo } : p);
    await api(`/api/animes/${a.id}`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ favorito: novo }) });
  }

  async function alternarStatus(a: Anime) {
    if (!editor) { setEntrando(true); return; }
    const novo: Status = a.status === 'assistido' ? 'quero_ver' : 'assistido';
    setAnimes((p) => p.map((x) => x.id === a.id ? { ...x, status: novo } : x));
    setAberto((p) => p && p.id === a.id ? { ...p, status: novo } : p);
    await api(`/api/animes/${a.id}`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ status: novo }) });
  }

  return (
    <div className={`app-shell theme-dark topic-${tipo}`} data-secao={tipo}>
      <aside className="sidebar">
        <div>
          <button className="logo" onClick={() => setVisao('home')} aria-label="Ir para o início">FR<span>A</span>ME</button>
          <nav className="side-nav" aria-label="Navegação principal">
            <button className={`nav-link ${visao === 'home' && !busca && aba === 'assistido' ? 'nav-active' : ''}`} onClick={() => { setVisao('home'); setAba('assistido'); setBusca(''); }}><Icon name="home" /> Início</button>
            <button className={`nav-link ${visao === 'home' && aba === 'quero_ver' ? 'nav-active' : ''}`} onClick={() => { setVisao('home'); setAba('quero_ver'); setBusca(''); }}><Icon name="bookmark" /> Quero assistir <span className="accent-badge">{queroVer.length}</span></button>
            <button className={`nav-link ${visao === 'home' && aba === 'assistido' ? 'nav-active' : ''}`} onClick={() => { setVisao('home'); setAba('assistido'); setBusca(''); }}><Icon name="check" /> Já assisti <span className="accent-badge">{assistidos.length}</span></button>
            <button className={`nav-link ${visao === 'perfil' ? 'nav-active' : ''}`} onClick={() => setVisao('perfil')}><Icon name="user" /> Meu perfil</button>
          </nav>
        </div>
        <div className="sidebar-profile">
          <p className="sidebar-eyebrow">Seu perfil</p>
          <button className="profile-row" onClick={() => setVisao('perfil')}>
            <div className="profile-avatar">{nomeUsuario.slice(0, 2).toUpperCase()}</div>
            <div className="profile-row-text"><strong>{nomeUsuario}</strong><span>{totalAvaliacoes} avaliações</span></div>
          </button>
          <div className="sidebar-actions"><TemaToggle />{editor ? <button onClick={sair}>Sair</button> : <button onClick={() => setEntrando(true)}>Entrar</button>}</div>
        </div>
      </aside>

      <main className="content">
        <header className="app-header">
          <div className="mobile-heading">
            <button className="mobile-logo" onClick={() => setVisao('home')}>FR<span>A</span>ME</button>
            <button className="mobile-avatar" onClick={() => setVisao('perfil')} aria-label="Abrir perfil">{nomeUsuario.slice(0, 2).toUpperCase()}</button>
          </div>
          {visao === 'home' && <div className="search-wrap">
            <Icon name="search" size={18} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Busque por um título..." aria-label="Buscar títulos" />
            {busca && <button className="clear-search" onClick={() => setBusca('')} aria-label="Limpar busca">×</button>}
            <kbd>⌘ K</kbd>
          </div>}
          {visao === 'home' && editor && <button className="header-add" onClick={() => setForm({})}><Icon name="plus" size={17} /> Adicionar título</button>}
        </header>

        {visao === 'home' ? <>
          <div className="media-tabs" role="tablist" aria-label="Tipo de conteúdo">
            {TIPOS.map((t) => <button key={t} role="tab" aria-selected={tipo === t} className={`media-tab ${tipo === t ? 'media-tab-active' : ''}`} onClick={() => trocarSecao(t)}><span className="media-tab-dot" />{TIPO_INFO[t].secao}</button>)}
          </div>

          {heroAnime && !termo && <section className="hero" aria-label="Destaque">
            <img src={heroAnime.urlCapa} alt="" />
            <div className="hero-overlay" />
            <div className="hero-content">
              <div className="hero-accent"><span /> Destaque da sua lista</div>
              <h1>{heroAnime.titulo}</h1>
              <p>{heroAnime.sinopse || `Seu título ${heroAnime.tipo === 'anime' ? 'de anime' : heroAnime.tipo === 'serie' ? 'de série' : 'de filme'} em destaque.`}</p>
              <div className="hero-actions">
                <button className="hero-primary" onClick={() => setAberto(heroAnime)}><Icon name="plus" size={17} /> Ver detalhes</button>
                {heroAnime.nota != null && <span className="hero-score"><span className="hero-accent"><Icon name="star" size={15} /></span>{heroAnime.nota}</span>}
              </div>
            </div>
            <p className="hero-meta">{TIPO_INFO[heroAnime.tipo].secao} {heroAnime.ano ? `• ${heroAnime.ano}` : ''}{heroAnime.episodios ? ` • ${heroAnime.episodios} episódios` : ''}</p>
          </section>}

          <section id="explorar" className="explore-section">
            <div className="explore-heading">
              <div><p className="eyebrow">{lista.length} títulos nesta lista</p><h2 className="section-title">{termo ? `Resultados para “${busca.trim()}”` : STATUS_LABEL[aba]}</h2></div>
              <div className="list-tabs" role="tablist" aria-label="Filtrar lista">
                <button className={`filter-btn ${aba === 'quero_ver' && !termo ? 'filter-active' : ''}`} onClick={() => { setAba('quero_ver'); setBusca(''); }}>Quero assistir</button>
                <button className={`filter-btn ${aba === 'assistido' && !termo ? 'filter-active' : ''}`} onClick={() => { setAba('assistido'); setBusca(''); }}>Já assisti</button>
              </div>
            </div>

            <div className="tools-row">
              <div className="quick-links">
                {queroVer.length > 0 && <button onClick={() => setSorteio(true)}><Icon name="shuffle" size={14} /> Sortear</button>}
                {editor && semNota.length > 0 && <button onClick={() => setRapido(semNota)}><Icon name="star" size={14} /> Avaliar {semNota.length}</button>}
                {daSecao.length > 0 && <button onClick={() => setEstatisticas(true)}>Estatísticas</button>}
              </div>
              <div className="secondary-tools">
                <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar"><option value="recentes">Mais recentes</option><option value="nota">Maior nota</option><option value="az">A-Z</option></select>
                {generosDaSecao.length > 0 && <select value={genero} onChange={(e) => setGenero(e.target.value)} aria-label="Filtrar por gênero"><option value="">Todos os gêneros</option>{generosDaSecao.map((g) => <option key={g} value={g}>{g}</option>)}</select>}
                <div className="view-toggle"><button className={vista === 'capas' ? 'active' : ''} onClick={() => setVista('capas')}>Capas</button><button className={vista === 'lista' ? 'active' : ''} onClick={() => setVista('lista')}>Lista</button></div>
              </div>
            </div>

            {lista.length === 0 ? <div className="empty-state"><p>{termo ? `Nada encontrado para “${busca.trim()}”.` : 'Nenhum título nesta lista.'}</p>{editor && !termo && <button onClick={() => setForm({})}>Adicionar {info.singular} agora</button>}</div> : vista === 'capas' ? <div className="poster-grid">
              {lista.map((a, index) => <article key={a.id} className={`poster-card media-${a.tipo}`}>
                <button className="poster-click" onClick={() => setAberto(a)} aria-label={`Abrir ${a.titulo}`}>
                  <div className="poster-image"><img src={a.urlCapa} alt={`Capa de ${a.titulo}`} loading="lazy" /><span className="rank">{String(index + 1).padStart(2, '0')}</span>{a.favorito && <span className="favorite-badge"><Coracao cheio /></span>}<span className={`save-btn ${a.status === 'assistido' ? 'saved' : ''}`} onClick={(e) => { e.stopPropagation(); void alternarStatus(a); }}>{a.status === 'assistido' ? <Icon name="check" size={17} /> : <Icon name="bookmark" size={17} />}</span></div>
                  <div className="poster-info"><div className="poster-meta"><span>{STATUS_SINGULAR[a.status]}{a.ano ? ` • ${a.ano}` : ''}</span>{a.nota != null && <span className="poster-score"><Icon name="star" size={12} /> {a.nota}</span>}</div><h3>{a.titulo}</h3></div>
                </button>
              </article>)}
            </div> : <ul className="list-view">{lista.map((a) => <li key={a.id}><button onClick={() => setAberto(a)}><img src={a.urlCapa} alt="" /><div><strong>{a.titulo}</strong><span>{STATUS_SINGULAR[a.status]}{a.ano ? ` • ${a.ano}` : ''}</span></div>{a.nota != null && <Estrelas valor={a.nota} />}</button></li>)}</ul>}
          </section>
        </> : <section className="profile-page">
          <div className="profile-hero"><div className="profile-glow" /><div className="profile-main"><div className="profile-photo">{nomeUsuario.slice(0, 2).toUpperCase()}</div><div><p className="eyebrow">Seu perfil</p><h1>{nomeUsuario}</h1><p className="profile-handle">Sua coleção pessoal no FRAME.</p></div></div>{editor && <button className="edit-profile" onClick={() => setForm({})}>Adicionar título</button>}</div>
          <div className="profile-stats"><div><strong>{animes.length}</strong><span>Títulos</span></div><div><strong>{totalAvaliacoes}</strong><span>Avaliações</span></div><div><strong>{mediaNota}</strong><span>Nota média</span></div></div>
          <div className="profile-columns"><div><div className="profile-section-heading"><div><p className="eyebrow">Atividade recente</p><h2 className="section-title">Sua coleção</h2></div><button onClick={() => setVisao('home')}>Ver lista</button></div><div className="recent-list">{recent.length ? recent.map((a) => <button className="recent-item" key={a.id} onClick={() => setAberto(a)}><img src={a.urlCapa} alt="" /><div><span>{TIPO_INFO[a.tipo].secao}</span><h3>{a.titulo}</h3>{a.nota != null && <span><Icon name="star" size={12} /> {a.nota}</span>}</div></button>) : <div className="empty-state">Sua coleção ainda está vazia.</div>}</div></div><aside className="settings-card"><h2>Atalhos</h2><button onClick={() => setEstatisticas(true)}>Ver estatísticas <span>→</span></button><button onClick={() => { setVisao('home'); setAba('quero_ver'); }}>Quero assistir <span>{animes.filter(a => a.status === 'quero_ver').length}</span></button><button onClick={() => { setVisao('home'); setAba('assistido'); }}>Já assisti <span>{animes.filter(a => a.status === 'assistido').length}</span></button>{editor ? <button onClick={sair}>Encerrar sessão <span>→</span></button> : <button onClick={() => setEntrando(true)}>Entrar na conta <span>→</span></button>}</aside></div>
        </section>}
      </main>

      <nav className="bottom-nav" aria-label="Navegação mobile"><button className={visao === 'home' ? 'bottom-active' : ''} onClick={() => setVisao('home')}><Icon name="home" size={19} /><span>Início</span></button><button onClick={() => { if (editor) setForm({}); else setEntrando(true); }} className="bottom-add" aria-label="Adicionar"><Icon name="plus" size={22} /></button><button className={visao === 'perfil' ? 'bottom-active' : ''} onClick={() => setVisao('perfil')}><Icon name="user" size={19} /><span>Perfil</span></button></nav>

      {aberto && <Detalhes anime={aberto} podeEditar={editor} onFechar={() => setAberto(null)} onEditar={() => { setForm({ editar: aberto }); setAberto(null); }} onFavoritar={() => alternarFavorito(aberto)} onComentario={(t) => salvarComentario(aberto.id, t)} onGenero={(g) => { setGenero(g); setBusca(''); setAba(aberto.status); setAberto(null); }} onExcluir={async () => { await api(`/api/animes/${aberto.id}`, { method: 'DELETE' }); setAberto(null); carregar(); }} />}
      {form && <AnimeForm tipo={tipo} inicial={form.editar} onFechar={() => setForm(null)} onSalvo={() => { setForm(null); carregar(); }} />}
      {sorteio && <Sorteio candidatos={queroVer} onVer={(a) => { setSorteio(false); setAberto(a); }} onFechar={() => setSorteio(false)} />}
      {estatisticas && <Estatisticas itens={daSecao} titulo={info.plural} tipo={tipo} onFechar={() => setEstatisticas(false)} />}
      {entrando && <Entrar onEntrou={() => { setEntrando(false); setEditor(true); carregar(); fetch('/api/sessao').then(r => r.json()).then(j => { if (j.nome) setNomeUsuario(j.nome); }).catch(() => {}); }} onFechar={() => setEntrando(false)} />}
      {rapido && <AvaliarRapido fila={rapido} onNota={async (id, nota) => { setAnimes((p) => p.map((x) => x.id === id ? { ...x, nota } : x)); await api(`/api/animes/${id}`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ nota }) }); }} onFechar={() => setRapido(null)} />}
    </div>
  );
}
