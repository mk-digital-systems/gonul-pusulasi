type Props = {
  className?: string;
  angle?: number;
  title?: string;
};

// Marka işareti: logodaki altın pusula yıldızının sade hali; kuzey ucu gül tonunda.
export function CompassMark({ className, angle = 0, title }: Props) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="24" cy="24" r="17" fill="none" stroke="var(--color-brass)" strokeWidth="1.6" />
      <circle cx="24" cy="24" r="12.5" fill="none" stroke="var(--color-brass)" strokeOpacity="0.45" strokeWidth="1" />
      <g
        transform={`rotate(${angle} 24 24)`}
        style={{ transition: "transform 900ms cubic-bezier(.2,.8,.2,1)" }}
      >
        {/* Ara yönler */}
        {[45, 135, 225, 315].map((a) => (
          <path
            key={a}
            d="M24 13 L25.6 24 L22.4 24 Z"
            fill="var(--color-brass)"
            fillOpacity="0.55"
            transform={`rotate(${a} 24 24)`}
          />
        ))}
        {/* Doğu-batı */}
        <path d="M5 24 L24 21.6 L43 24 L24 26.4 Z" fill="var(--color-brass)" />
        {/* Güney */}
        <path d="M24 45 L26.6 24 L21.4 24 Z" fill="var(--color-brass)" />
        {/* Kuzey */}
        <path d="M24 3 L26.6 24 L21.4 24 Z" fill="var(--color-ember)" />
        <circle cx="24" cy="24" r="2.2" fill="var(--color-paper)" stroke="var(--color-brass)" strokeWidth="1" />
      </g>
    </svg>
  );
}
