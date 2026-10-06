import { CompassMark } from "./compass-mark";
import { CheckIcon } from "./ui";

const REASONS = [
  { text: "İkiniz de uzun vadeli bir ilişki arıyorsunuz.", match: true },
  { text: "8 önemli konuda ortak beklentiniz var.", match: true },
  { text: "7 temel yaşam tercihinde uyumlusunuz.", match: true },
  { text: "2 konuda farklı düşünüyorsunuz.", match: false },
];

export function CompatibilityCard() {
  return (
    <figure className="w-full max-w-sm">
      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_24px_60px_-28px_rgba(42,32,39,0.45)] sm:p-7">
        <figcaption className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
            Örnek uyum kartı
          </span>
          <CompassMark className="h-7 w-7" angle={35} />
        </figcaption>
        <p className="mt-4 font-display text-2xl text-ink">Güçlü Uyum</p>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          <span className="h-1.5 flex-1 rounded-full bg-ember" />
          <span className="h-1.5 flex-1 rounded-full bg-ember" />
          <span className="h-1.5 flex-1 rounded-full bg-sand-deep" />
        </div>
        <ul className="mt-6 space-y-3.5">
          {REASONS.map((r) => (
            <li key={r.text} className="flex gap-3 text-sm leading-snug text-ink-soft">
              {r.match ? (
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
              ) : (
                <span className="mt-[7px] ml-[5px] mr-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-brass" aria-hidden />
              )}
              <span>{r.text}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 border-t border-ink/10 pt-4 text-xs leading-relaxed text-ink-muted">
          Uydurma yüzdeler yok. Uyum, iki tarafın gerçek cevaplarından hesaplanır ve nedeniyle gösterilir.
        </p>
      </div>
    </figure>
  );
}
