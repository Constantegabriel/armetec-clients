export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className={`logo logo-${size}`}>
      <svg viewBox="0 0 32 32" aria-hidden>
        <path d="M16 3l13 13-13 13L3 16z" fill="currentColor" />
      </svg>
      <span>
        Armetec <b>Escopo</b>
      </span>
    </span>
  );
}
