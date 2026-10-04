'use client';
import { useEffect, useState } from 'react';

export default function TemaToggle() {
  const [escuro, setEscuro] = useState(false);

  // o script do layout já aplicou a classe; aqui só lemos o estado atual
  useEffect(() => {
    setEscuro(document.documentElement.classList.contains('dark'));
  }, []);

  function alternar() {
    const novo = !escuro;
    document.documentElement.classList.toggle('dark', novo);
    try {
      localStorage.setItem('tema', novo ? 'escuro' : 'claro');
    } catch {}
    setEscuro(novo);
  }

  return (
    <button
      onClick={alternar}
      aria-pressed={escuro}
      aria-label="Alternar modo noturno"
      className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-mute transition-colors hover:text-ink"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {escuro ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
        )}
      </svg>
      <span className="hidden sm:inline">{escuro ? 'Modo claro' : 'Modo noturno'}</span>
    </button>
  );
}
