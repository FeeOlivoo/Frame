export type Status = 'assistido' | 'quero_ver';
export type Tipo = 'anime' | 'filme' | 'serie';

export const TIPOS: Tipo[] = ['anime', 'filme', 'serie'];

export const STATUS_LABEL: Record<Status, string> = {
  assistido: 'Assistidos',
  quero_ver: 'Quero ver',
};

export const STATUS_SINGULAR: Record<Status, string> = {
  assistido: 'Assistido',
  quero_ver: 'Quero ver',
};

export const TIPO_INFO: Record<
  Tipo,
  { secao: string; titulo: string; singular: string; plural: string; placeholderBusca: string }
> = {
  anime: {
    secao: 'Animes',
    titulo: 'Lista de Animes',
    singular: 'anime',
    plural: 'animes',
    placeholderBusca: 'Nome do anime, em inglês ou japonês',
  },
  filme: {
    secao: 'Filmes',
    titulo: 'Lista de Filmes',
    singular: 'filme',
    plural: 'filmes',
    placeholderBusca: 'Nome do filme',
  },
  serie: {
    secao: 'Séries',
    titulo: 'Lista de Séries',
    singular: 'série',
    plural: 'séries',
    placeholderBusca: 'Nome da série',
  },
};

export interface Anime {
  id: string;
  tipo: Tipo;
  titulo: string;
  urlCapa: string;
  status: Status;
  nota: number | null;
  personagemFavorito: string | null;
  favorito: boolean;
  sinopse: string | null;
  ano: number | null;
  generos: string[];
  episodios: number | null;
  duracao: number | null;
  idExterno: number | null;
  comentario: string | null;
  dataAdicao: string;
}
