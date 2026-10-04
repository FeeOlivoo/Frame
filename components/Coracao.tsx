export default function Coracao({ cheio, className = 'h-4 w-4' }: { cheio: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={cheio ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s-7-4.35-9.5-9C.9 8.9 2.7 5 6.4 5c2 0 3.6 1.1 5.6 3.2C14 6.1 15.6 5 17.6 5c3.7 0 5.5 3.9 3.9 7-2.5 4.65-9.5 9-9.5 9z" />
    </svg>
  );
}
