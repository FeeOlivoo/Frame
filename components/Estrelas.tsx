const PONTOS = '12,2.5 14.9,8.9 21.8,9.3 16.5,13.8 18.2,20.5 12,16.8 5.8,20.5 7.5,13.8 2.2,9.3 9.1,8.9';

function Estrela({ cheia, classe }: { cheia: boolean; classe: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${classe} ${cheia ? 'text-ink' : 'text-faint'}`} aria-hidden="true">
      <polygon
        points={PONTOS}
        fill={cheia ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// exibição (somente leitura)
export function Estrelas({ valor, tamanho = 'h-4 w-4' }: { valor: number | null; tamanho?: string }) {
  if (valor == null) return null;
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`Nota ${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Estrela key={n} cheia={n <= valor} classe={tamanho} />
      ))}
    </span>
  );
}

// seletor do formulário
export function EscolherEstrelas({
  valor,
  onChange,
}: {
  valor: number | null;
  onChange: (n: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
          aria-pressed={valor != null && n <= valor}
          className="p-0.5"
        >
          <Estrela cheia={valor != null && n <= valor} classe="h-8 w-8" />
        </button>
      ))}
      {valor != null && (
        <button type="button" onClick={() => onChange(null)} className="ml-2 text-sm text-mute hover:text-ink">
          Limpar
        </button>
      )}
    </div>
  );
}
