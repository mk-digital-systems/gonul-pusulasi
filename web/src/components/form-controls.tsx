import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const controlClass =
  "mt-2 w-full rounded-xl border border-ink/20 bg-white px-4 py-3 text-ink shadow-sm outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/15";

export function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      {children}
      {hint ? <span className="mt-1.5 block text-xs leading-relaxed text-ink-muted">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${controlClass} ${props.className ?? ""}`} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${controlClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${controlClass} ${props.className ?? ""}`} />;
}

export function MessageBanner({
  error,
  notice,
}: {
  error?: string;
  notice?: string;
}) {
  if (!error && !notice) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
        error
          ? "border-ember/30 bg-ember-soft/60 text-ember-deep"
          : "border-moss/30 bg-moss/10 text-moss"
      }`}
    >
      {error ?? notice}
    </p>
  );
}
