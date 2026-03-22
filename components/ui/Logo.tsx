interface LogoProps {
  size?: number;
  className?: string;
  id?: string;
}

export default function Logo({ size = 28, className, id = "logo-g" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill={`url(#${id})`} />
      <circle cx="16" cy="9" r="3" fill="white" fillOpacity="0.95" />
      <circle cx="8" cy="23" r="3" fill="white" fillOpacity="0.95" />
      <circle cx="24" cy="23" r="3" fill="white" fillOpacity="0.95" />
      <line x1="16" y1="9" x2="8" y2="23" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
      <line x1="16" y1="9" x2="24" y2="23" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
      <line x1="8" y1="23" x2="24" y2="23" stroke="white" strokeWidth="1.5" strokeOpacity="0.45" />
    </svg>
  );
}
