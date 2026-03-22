interface ColorDotProps {
  color: string;
  className?: string;
}

export function ColorDot({ color, className = "" }: ColorDotProps) {
  return (
    <div
      className={`w-2 h-2 rounded-full flex-shrink-0 ${className}`.trim()}
      style={{ background: color }}
    />
  );
}
