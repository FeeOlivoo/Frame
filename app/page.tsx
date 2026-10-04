'use client';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import AnimeForm from '@/components/AnimeForm';
import AvaliarRapido from '@/components/AvaliarRapido';
import Coracao from '@/components/Coracao';
import Detalhes from '@/components/Detalhes';
import Estatisticas from '@/components/Estatisticas';
import Login from '@/components/Login';
import Sorteio from '@/components/Sorteio';
import { NOME_APP } from '@/lib/config';
import { Anime, Status, Tipo, TIPO_INFO } from '@/lib/types';

type Sessao = 'carregando' | 'logado' | 'deslogado';
type Visao = 'biblioteca' | 'perfil';

const ORDEM_ABAS: Tipo[] = ['filme', 'serie', 'anime'];
const ACENTOS = ['purple', 'orange', 'blue', 'red'];
const JSON_HEADERS = { 'Content-Type': 'application/json' };

// busca sem diferenciar maiúsculas nem acentos
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const iniciais = (nome: string) =>
  nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'EU';
const acentoDe = (id: string) => ACENTOS[[...id].reduce((s, c) => s + c.charCodeAt(0), 0) % ACENTOS.length];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    film: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 5v14M17 5v14M3 9h4M17 9h4M3 15h4M17 15h4" /></>,
    tv: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="m8 2 4 4 4-4" /></>,
    spark: <><path d="m12 3 1.3 4.7L18 9l-4.7 1.3L12 15l-1.3-4.7L6 9l4.7-1.3L12 3Z" /><path d="m5 15 .7 2.3L8 18l-2.3.7L5 21l-.7-2.3L2 18l2.3-.7L5 15Z" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    list: <><path d="M9 6h12M9 12h12M9 18h12" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    heart: <path d="M20.8 5.8a5.5 5.5 0 0 0-7.8 0L12 6.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" />,
    quote: <><path d="M9 11H4a1 1 0 0 0-1 1v5h5v-5c0-4-2-6-4-7" /><path d="M20 11h-5a1 1 0 0 0-1 1v5h5v-5c0-4-2-6-4-7" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M15 3h5a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-5" /></>,
    edit: <><path d="m14 4 6 6L8 22H2v-6L14 4Z" /><path d="m12 6 6 6" /></>,
    arrow: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Rating({ value }: { value: number }) {
  return (
    <div className="rating" role="img" aria-label={value ? `${value} de 5 estrelas` : 'Sem nota'}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} className={n <= value ? 'filled' : ''} disabled tabIndex={-1} aria-hidden="true">
          <Icon name="star" size={15} />
        </button>
      ))}
    </div>
  );
}

function MediaCard({ a, onAbrir, onEditar, onMarcar }: { a: Anime; onAbrir: () => void; onEditar: () => void; onMarcar: () => void }) {
  const assistido = a.status === 'assistido';
  return (
    <article className="media-card">
      <div className="poster-wrap">
        <img src={a.urlCapa} alt={`Capa de ${a.titulo}`} loading="lazy" />
        <div className="poster-shade" />
        <span className={`genre-pill ${acentoDe(a.id)}`}>{a.generos[0] ?? TIPO_INFO[a.tipo].secao}</span>
        {a.favorito && (
          <span className="fav-badge" aria-label="Favorito">
            <Coracao cheio className="h-3.5 w-3.5" />
          </span>
        )}
        {assistido ? (
          <div className="poster-rating"><Rating value={a.nota ?? 0} /></div>
        ) : (
          <div className="watchlist-badge"><Icon name="plus" size={13} /> Quero assistir</div>
        )}
        <button className="poster-open" onClick={onAbrir} aria-label={`Abrir ${a.titulo}`} />
      </div>
      <div className="card-body">
        <div className="title-row">
          <div>
            <h3>{a.titulo}</h3>
            {a.ano && <span>{a.ano}</span>}
          </div>
          <button onClick={onEditar} aria-label={`Editar ${a.titulo}`}><Icon name="edit" size={17} /></button>
        </div>
        {assistido ? (
          a.personagemFavorito && (
            <div className="character">
              <span><Icon name="heart" size={14} /></span>
              <div><small>PERSONAGEM FAVORITO</small><strong>{a.personagemFavorito}</strong></div>
            </div>
          )
        ) : (
          <div className="watchlist-note">
            <span>Salvo para assistir depois</span>
            <button onClick={onMarcar}>Marcar como assistido <Icon name="check" size={13} /></button>
          </div>
        )}
        {a.comentario && (
          <blockquote><Icon name="quote" size={13} /><p>{a.comentario}</p></blockquote>
        )}
      </div>
    </article>
  );
}

export default function Home() {
  const [sessao, setSessao] = useState<Sessao>('carregando');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [visao, setVisao] = useState<Visao>('biblioteca');
  const [tipo, setTipo] = useState<Tipo>('anime');
  const [prateleira, setPrateleira] = useState<Status>('assistido');
  const [busca, setBusca] = useState('');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [genero, setGenero] = useState('');
  const [aberto, setAberto] = useState<Anime | null>(null);
  const [form, setForm] = useState<{ editar?: Anime } | null>(null);
  const [sorteio, setSorteio] = useState<Anime[] | null>(null);
  const [rapido, setRapido] = useState<Anime[] | null>(null);
  const [estatisticas, setEstatisticas] = useState(false);

  // a primeira pergunta é sempre: já existe uma sessão salva? Se não, abre o login.
  useEffect(() => {
    fetch('/api/sessao')
      .then((r) => r.json())
      .then((j) => {
        if (j.editor) {
          setNomeUsuario(j.nome ?? '');
          setSessao('logado');
        } else {
          setSessao('deslogado');
        }
      })
      .catch(() => setSessao('deslogado'));
  }, []);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/animes');
      if (res.ok) setAnimes(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (sessao === 'logado') carregar();
  }, [sessao, carregar]);

  const info = TIPO_INFO[tipo];
  const daSecao = useMemo(() => animes.filter((a) => a.tipo === tipo), [animes, tipo]);
  const queroVer = useMemo(() => daSecao.filter((a) => a.status === 'quero_ver'), [daSecao]);
  const semNota = useMemo(() => daSecao.filter((a) => a.status === 'assistido' && a.nota == null), [daSecao]);

  const termo = norm(busca.trim());
  const lista = useMemo(
    () =>
      daSecao.filter(
        (a) =>
          (termo ? norm(a.titulo).includes(termo) : a.status === prateleira) && (!genero || a.generos.includes(genero))
      ),
    [daSecao, prateleira, termo, genero]
  );

  // números do perfil (todas as seções juntas)
  const perfil = useMemo(() => {
    const assistidos = animes.filter((a) => a.status === 'assistido');
    const notas = assistidos.map((a) => a.nota).filter((n): n is number => n != null);
    const contagem = new Map<string, number>();
    for (const a of assistidos) for (const g of a.generos) contagem.set(g, (contagem.get(g) ?? 0) + 1);
    const generoTop = [...contagem.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;
    const porTipo = ORDEM_ABAS.map((t) => ({ t, n: assistidos.filter((a) => a.tipo === t).length }));
    const recentes = [...assistidos].sort((x, y) => y.dataAdicao.localeCompare(x.dataAdicao)).slice(0, 4);
    return {
      total: assistidos.length,
      media: notas.length ? (notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(1).replace('.', ',') : '–',
      cinco: notas.filter((n) => n === 5).length,
      generoTop,
      porTipo,
      maxTipo: Math.max(1, ...porTipo.map((p) => p.n)),
      recentes,
    };
  }, [animes]);

  // ---- ações ----
  async function api(url: string, init?: RequestInit) {
    const r = await fetch(url, init);
    if (r.status === 401) {
      setSessao('deslogado');
      setAnimes([]);
    } else if (!r.ok) {
      carregar();
    }
    return r;
  }

  async function sair() {
    await fetch('/api/sessao', { method: 'DELETE' });
    setSessao('deslogado');
    setAnimes([]);
    setVisao('biblioteca');
    setAberto(null);
  }

  function irParaSecao(t: Tipo) {
    setTipo(t);
    setVisao('biblioteca');
    setBusca('');
    setGenero('');
  }

  const atualiza = (id: string, mudanca: Partial<Anime>) => {
    setAnimes((p) => p.map((x) => (x.id === id ? { ...x, ...mudanca } : x)));
    setAberto((p) => (p && p.id === id ? { ...p, ...mudanca } : p));
  };

  async function alternarFavorito(a: Anime) {
    const novo = !a.favorito;
    atualiza(a.id, { favorito: novo });
    await api(`/api/animes/${a.id}`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ favorito: novo }) });
  }

  async function alternarStatus(a: Anime) {
    const novo: Status = a.status === 'assistido' ? 'quero_ver' : 'assistido';
    atualiza(a.id, { status: novo });
    await api(`/api/animes/${a.id}`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ status: novo }) });
  }

  async function avaliar(id: string, nota: number) {
    atualiza(id, { nota });
    await api(`/api/animes/${id}`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ nota }) });
  }

  async function salvarComentario(id: string, comentario: string | null) {
    const r = await api(`/api/animes/${id}`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ comentario }) });
    if (!r.ok) throw new Error('falha ao salvar o comentário');
    atualiza(id, { comentario });
  }

  // ---- telas de entrada ----
  if (sessao === 'carregando') {
    return (
      <div className="login-splash">
        <div className="logo"><span>{NOME_APP}</span></div>
      </div>
    );
  }

  if (sessao === 'deslogado') {
    return (
      <Login
        onEntrou={(nome) => {
          setNomeUsuario(nome);
          setVisao('biblioteca');
          setSessao('logado');
        }}
      />
    );
  }

  const abas: { t: Tipo; icone: string }[] = [
    { t: 'filme', icone: 'film' },
    { t: 'serie', icone: 'tv' },
    { t: 'anime', icone: 'spark' },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo"><span>{NOME_APP}</span></div>
        <nav>
          <p className="nav-label">MINHA BIBLIOTECA</p>
          {abas.map(({ t, icone }) => (
            <button key={t} className={visao === 'biblioteca' && tipo === t ? 'active' : ''} onClick={() => irParaSecao(t)}>
              <Icon name={icone} />
              <span>{TIPO_INFO[t].secao}</span>
              {visao === 'biblioteca' && tipo === t && <i />}
            </button>
          ))}
          <p className="nav-label secondary">CONTA</p>
          <button className={visao === 'perfil' ? 'active' : ''} onClick={() => setVisao('perfil')}>
            <Icon name="user" />
            <span>Meu perfil</span>
          </button>
        </nav>
        <div className="sidebar-foot">
          <div className="tiny-art">{iniciais(nomeUsuario)}</div>
          <p>Sua história,<br />frame por frame.</p>
        </div>
      </aside>

      <div className="content-shell">
        <header>
          <div className="mobile-logo"><div className="logo"><span>{NOME_APP}</span></div></div>
          <div className="header-actions">
            <button className="add-button" onClick={() => setForm({})}>
              <Icon name="plus" size={18} /> Adicionar à lista
            </button>
            <button className="avatar-button" onClick={() => setVisao('perfil')} aria-label="Abrir perfil">
              {iniciais(nomeUsuario)}
            </button>
          </div>
        </header>

        {visao === 'biblioteca' ? (
          <main className="page library-page">
            <section className="intro">
              <div>
                <span className="eyebrow">SUA COLEÇÃO</span>
                <h1>O que marcou<br /><em>você?</em></h1>
              </div>
              <p>Guarde as histórias que ficaram, seus personagens favoritos e tudo que você sentiu assistindo.</p>
            </section>

            <div className="tabs" role="tablist">
              {abas.map(({ t }) => (
                <button key={t} role="tab" aria-selected={tipo === t} className={tipo === t ? 'active' : ''} onClick={() => irParaSecao(t)}>
                  {TIPO_INFO[t].secao}
                  <span>{animes.filter((a) => a.tipo === t).length}</span>
                </button>
              ))}
              <button className="tab-add" onClick={() => setForm({})} aria-label="Adicionar à lista">
                <Icon name="plus" size={18} />
              </button>
            </div>

            <div className="shelf-switch" aria-label="Tipo de lista">
              <button className={prateleira === 'assistido' ? 'active' : ''} onClick={() => { setPrateleira('assistido'); setBusca(''); }}>
                <Icon name="check" size={15} /> Assistidos <span>{daSecao.filter((a) => a.status === 'assistido').length}</span>
              </button>
              <button className={prateleira === 'quero_ver' ? 'active' : ''} onClick={() => { setPrateleira('quero_ver'); setBusca(''); }}>
                <Icon name="plus" size={15} /> Quero assistir <span>{queroVer.length}</span>
              </button>
            </div>

            <section className="toolbar">
              <label className="search">
                <Icon name="search" size={18} />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar na sua lista..." aria-label="Buscar na sua lista" />
              </label>
              <div className="view-toggle">
                <button className={layout === 'grid' ? 'active' : ''} onClick={() => setLayout('grid')} aria-label="Visualização em grade"><Icon name="grid" size={17} /></button>
                <button className={layout === 'list' ? 'active' : ''} onClick={() => setLayout('list')} aria-label="Visualização em lista"><Icon name="list" size={18} /></button>
              </div>
            </section>

            {(queroVer.length > 0 || semNota.length > 0 || genero) && (
              <div className="tool-links">
                {genero && <button onClick={() => setGenero('')}>Gênero: {genero} ×</button>}
                {queroVer.length > 0 && <button onClick={() => setSorteio(queroVer)}>Sortear o que assistir</button>}
                {semNota.length > 0 && <button onClick={() => setRapido(semNota)}>Avaliar {semNota.length} sem nota</button>}
              </div>
            )}

            <div className={`media-grid ${layout}`}>
              {lista.map((a) => (
                <MediaCard
                  key={a.id}
                  a={a}
                  onAbrir={() => setAberto(a)}
                  onEditar={() => setForm({ editar: a })}
                  onMarcar={() => alternarStatus(a)}
                />
              ))}
            </div>

            {lista.length === 0 && (
              <div className="empty">
                <Icon name="film" size={34} />
                <h2>{termo ? 'Nada encontrado' : 'Nenhum título por aqui'}</h2>
                <p>
                  {termo
                    ? `Não achei “${busca.trim()}” em ${info.plural}.`
                    : prateleira === 'assistido'
                      ? `Que tal adicionar o primeiro ${info.singular} que você assistiu?`
                      : `Salve aqui os próximos ${info.plural} que quer assistir.`}
                </p>
                {!termo && (
                  <button className="primary-button" onClick={() => setForm({})}>
                    <Icon name="plus" size={18} /> Adicionar {info.singular}
                  </button>
                )}
              </div>
            )}
          </main>
        ) : (
          <main className="page profile-page">
            <button className="back-link" onClick={() => setVisao('biblioteca')}>
              Minha biblioteca <Icon name="arrow" size={16} />
            </button>

            <section className="profile-hero">
              <div className="profile-avatar">{iniciais(nomeUsuario)}<span /></div>
              <div className="profile-copy">
                <span className="eyebrow">SEU ESPAÇO</span>
                <h1>{nomeUsuario || 'Meu perfil'}</h1>
                <p>{animes.length} {animes.length === 1 ? 'título' : 'títulos'} na sua coleção</p>
              </div>
            </section>

            <section className="stat-grid">
              <div><strong>{perfil.total}</strong><span>Títulos assistidos</span></div>
              <div><strong>{perfil.media}</strong><span>Média de avaliação</span></div>
              <div><strong>{perfil.cinco}</strong><span>Favoritos 5 estrelas</span></div>
            </section>

            <section className="profile-section">
              <div className="section-heading">
                <div><span className="eyebrow">RETROSPECTIVA</span><h2>Seu gosto em números</h2></div>
                <span className="year-badge">{new Date().getFullYear()}</span>
              </div>
              <div className="taste-card">
                <div className="taste-visual"><span>Seu gênero<br />mais assistido</span><strong>{perfil.generoTop ?? '—'}</strong></div>
                <div className="taste-details">
                  {perfil.porTipo.map(({ t, n }) => (
                    <div key={t}>
                      <span>{TIPO_INFO[t].secao}</span>
                      <i><b style={{ width: `${(n / perfil.maxTipo) * 100}%` }} /></i>
                      <strong>{n}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {perfil.recentes.length > 0 && (
              <section className="profile-section">
                <div className="section-heading"><div><span className="eyebrow">MAIS RECENTES</span><h2>Últimas histórias</h2></div></div>
                <div className="recent-row">
                  {perfil.recentes.map((a) => (
                    <div key={a.id} role="button" tabIndex={0} onClick={() => setAberto(a)} onKeyDown={(e) => e.key === 'Enter' && setAberto(a)}>
                      <img src={a.urlCapa} alt="" />
                      <span>{a.titulo}</span>
                      <Rating value={a.nota ?? 0} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="account-section">
              <span className="eyebrow">ATALHOS E CONTA</span>
              <div className="account-menu">
                <button onClick={() => { setVisao('biblioteca'); setEstatisticas(true); }}>
                  <span><i><Icon name="grid" size={18} /></i><div><strong>Estatísticas</strong><small>Notas, gêneros e tempo assistido em {info.plural}</small></div></span>
                  <Icon name="arrow" size={16} />
                </button>
                <button onClick={() => { setVisao('biblioteca'); queroVer.length ? setSorteio(queroVer) : setPrateleira('quero_ver'); }}>
                  <span><i><Icon name="spark" size={18} /></i><div><strong>Sortear o que assistir</strong><small>Escolhe um da sua lista de {info.plural} para ver</small></div></span>
                  <Icon name="arrow" size={16} />
                </button>
                {semNota.length > 0 && (
                  <button onClick={() => { setVisao('biblioteca'); setRapido(semNota); }}>
                    <span><i><Icon name="star" size={18} /></i><div><strong>Avaliar {semNota.length} sem nota</strong><small>Passe pelos títulos e toque nas estrelas</small></div></span>
                    <Icon name="arrow" size={16} />
                  </button>
                )}
                <button onClick={() => { window.location.href = '/esqueci-senha'; }}>
                  <span><i><Icon name="shield" size={18} /></i><div><strong>Alterar senha</strong><small>Enviamos um link para o seu e-mail</small></div></span>
                  <Icon name="arrow" size={16} />
                </button>
                <button className="menu-logout" onClick={sair}>
                  <span><i><Icon name="logout" size={18} /></i><div><strong>Sair da conta</strong><small>Você poderá entrar novamente quando quiser</small></div></span>
                  <Icon name="arrow" size={16} />
                </button>
              </div>
              <p className="app-version">{NOME_APP}</p>
            </section>
          </main>
        )}
      </div>

      {aberto && (
        <Detalhes
          anime={aberto}
          podeEditar
          onFechar={() => setAberto(null)}
          onEditar={() => { setForm({ editar: aberto }); setAberto(null); }}
          onFavoritar={() => alternarFavorito(aberto)}
          onComentario={(t) => salvarComentario(aberto.id, t)}
          onGenero={(g) => {
            setTipo(aberto.tipo);
            setPrateleira(aberto.status);
            setGenero(g);
            setBusca('');
            setVisao('biblioteca');
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
          onSalvo={() => { setForm(null); carregar(); }}
        />
      )}

      {sorteio && (
        <Sorteio candidatos={sorteio} onVer={(a) => { setSorteio(null); setAberto(a); }} onFechar={() => setSorteio(null)} />
      )}

      {estatisticas && <Estatisticas itens={daSecao} titulo={info.plural} tipo={tipo} onFechar={() => setEstatisticas(false)} />}

      {rapido && <AvaliarRapido fila={rapido} onNota={avaliar} onFechar={() => setRapido(null)} />}
    </div>
  );
}
