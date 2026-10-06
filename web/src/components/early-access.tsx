"use client";

import { startTransition, useActionState, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Container, SectionHeading, buttonStyles } from "./ui";
import { InviteShare } from "./invite-share";
import { Turnstile, type TurnstileHandle } from "./turnstile";
import { ABROAD_OPTION, CITIES } from "@/lib/cities";
import { BIRTH_YEARS, PREVIEW_MODE, SITE } from "@/lib/site";
import { GENDERS, GOALS, parseWaitlistForm, type FieldErrors } from "@/lib/waitlist/form";
import { submitWaitlist, type JoinState } from "@/lib/waitlist/actions";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type Errors = FieldErrors;

const fieldBase =
  "mt-2 block w-full rounded-xl border bg-white px-4 py-3 text-base text-ink transition-colors focus:border-ember focus:outline-none";

function fieldClass(error?: string) {
  return `${fieldBase} ${error ? "border-ember" : "border-ink/20"}`;
}

function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-ink-muted">(isteğe bağlı)</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-ember-deep">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SuccessPanel() {
  return (
    <div className="text-center" role="status">
      <p className="font-display text-3xl text-ink">Neredeyse tamam.</p>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-soft">
        E-postana bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladığında erken erişim listesine
        katılmış olacaksın. E-posta birkaç dakika içinde gelmezse gereksiz (spam) klasörüne de bak.
      </p>
      {PREVIEW_MODE ? (
        <>
          <p className="mx-auto mt-3 max-w-md text-xs text-ink-muted">
            (Önizleme: e-posta gönderilmedi, veri kaydedilmedi.)
          </p>
          <div className="mt-10">
            {/* Gerçek davet bağlantısı, e-posta doğrulandıktan sonra gösterilir. */}
            <InviteShare inviteUrl={`${SITE.url}/?ref=ORNEK`} sample />
          </div>
        </>
      ) : null}
    </div>
  );
}

const INITIAL: JoinState = { status: "idle" };

export function EarlyAccess() {
  const [state, formAction, pending] = useActionState(
    async (prev: JoinState, data: FormData) => {
      const next = await submitWaitlist(prev, data);
      // Turnstile belirteci tek kullanımlıktır; hata sonrası yenilenir.
      if (next.status === "error") turnstile.current?.reset();
      return next;
    },
    INITIAL,
  );
  const [clientErrors, setClientErrors] = useState<Errors | null>(null);
  const [touched, setTouched] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstile = useRef<TurnstileHandle>(null);

  const errors: Errors =
    clientErrors ?? (state.status === "error" ? (state.errors ?? {}) : {});
  const formMessage = clientErrors === null && state.status === "error" ? state.message : undefined;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    // Form, React'in form eylemiyle değil elle gönderilir: hata olduğunda alanlar temizlenmez.
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const parsed = parseWaitlistForm(data);
    if (!parsed.ok) {
      setClientErrors(parsed.errors);
      document.getElementById(Object.keys(parsed.errors)[0])?.focus();
      return;
    }
    setClientErrors(null);

    if (TURNSTILE_SITE_KEY && !PREVIEW_MODE) {
      if (!turnstileToken) {
        setClientErrors({});
        setTouched(true);
        return;
      }
      data.set("turnstileToken", turnstileToken);
    }

    // Davet kodu ve kampanya kaynağı adres çubuğundan okunur (ilk temas).
    const params = new URLSearchParams(window.location.search);
    for (const key of ["ref", "utm_source", "utm_medium", "utm_campaign"]) {
      data.set(key, params.get(key) ?? "");
    }

    startTransition(() => formAction(data));
  }

  const waitingForTurnstile =
    clientErrors !== null && Object.keys(clientErrors).length === 0 && !turnstileToken;
  const submitted = state.status === "ok";

  const describedBy = (key: keyof Errors) => (errors[key] ? `${key}-error` : undefined);

  return (
    <section id="erken-erisim" className="border-t border-ink/10 bg-sand/60 py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Erken erişim"
              title="Gönül Pusulası açıldığında ilk sen haber al."
              intro="Kayıt bir dakikadan kısa sürer. Yalnızca gerçekten gerekli bilgileri istiyoruz."
            />
            <ul className="mt-8 space-y-3 text-sm leading-relaxed text-ink-soft">
              <li>TC kimlik numarası, soyad, adres veya kesin konum istemiyoruz.</li>
              <li>E-postanı yalnızca kaydını doğrulamak ve uygulama açıldığında haber vermek için kullanırız. Reklam e-postası göndermeyiz.</li>
              <li>Hangi şehirde açılacağımıza, gelen talepleri inceleyerek karar vereceğiz.</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-ink/10 bg-paper p-6 sm:p-9">
            {submitted ? (
              <SuccessPanel />
            ) : (
              <form
                noValidate
                onSubmit={onSubmit}
                onFocusCapture={() => setTouched(true)}
                className="grid gap-6"
              >
                {/* Bot tuzağı: ekran okuyuculardan ve klavyeden de gizli */}
                <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
                  <label>
                    Web siteniz
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <Field id="birthYear" label="Doğum yılı" error={errors.birthYear}>
                    <select
                      id="birthYear"
                      name="birthYear"
                      defaultValue=""
                      className={fieldClass(errors.birthYear)}
                      aria-invalid={!!errors.birthYear}
                      aria-describedby={describedBy("birthYear")}
                    >
                      <option value="" disabled>
                        Seç
                      </option>
                      {BIRTH_YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field id="city" label="Şehir" error={errors.city}>
                    <select
                      id="city"
                      name="city"
                      defaultValue=""
                      className={fieldClass(errors.city)}
                      aria-invalid={!!errors.city}
                      aria-describedby={describedBy("city")}
                    >
                      <option value="" disabled>
                        Seç
                      </option>
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value={ABROAD_OPTION}>{ABROAD_OPTION}</option>
                    </select>
                  </Field>
                </div>

                <fieldset aria-describedby={errors.gender ? "gender-error" : "gender-hint"}>
                  <legend className="text-sm font-semibold text-ink">Cinsiyet</legend>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {GENDERS.map((g, i) => (
                      <label
                        key={g.value}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink/20 bg-white px-4 py-3 text-base text-ink has-[:checked]:border-ember has-[:checked]:bg-ember-soft/40"
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={g.value}
                          id={i === 0 ? "gender" : undefined}
                          className="h-4 w-4 accent-ember"
                        />
                        {g.label}
                      </label>
                    ))}
                  </div>
                  {errors.gender ? (
                    <p id="gender-error" className="mt-1.5 text-xs font-medium text-ember-deep">
                      {errors.gender}
                    </p>
                  ) : (
                    <p id="gender-hint" className="mt-1.5 text-xs text-ink-muted">
                      Gönül Pusulası kadın ve erkek üyeleri birbiriyle tanıştırır.
                    </p>
                  )}
                </fieldset>

                <Field id="goal" label="Ne arıyorsun?" error={errors.goal}>
                  <select
                    id="goal"
                    name="goal"
                    defaultValue=""
                    className={fieldClass(errors.goal)}
                    aria-invalid={!!errors.goal}
                    aria-describedby={describedBy("goal")}
                  >
                    <option value="" disabled>
                      Seç
                    </option>
                    {GOALS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  id="email"
                  label="E-posta"
                  error={errors.email}
                  hint="Yalnızca doğrulama ve açılış bildirimi göndereceğiz."
                >
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    className={fieldClass(errors.email)}
                    aria-invalid={!!errors.email}
                    aria-describedby={describedBy("email")}
                  />
                </Field>

                <div className="grid gap-6 sm:grid-cols-2">
                  <Field id="name" label="Adın" optional>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="given-name"
                      maxLength={40}
                      className={fieldClass()}
                    />
                  </Field>
                  <Field id="platform" label="Telefonun" optional>
                    <select id="platform" name="platform" defaultValue="" className={fieldClass()}>
                      <option value="">Belirtmek istemiyorum</option>
                      <option value="ios">iPhone</option>
                      <option value="android">Android</option>
                    </select>
                  </Field>
                </div>

                <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
                  <input type="checkbox" name="nearbyCities" className="mt-1 h-4 w-4 shrink-0 accent-ember" />
                  <span>
                    Yakın şehirlerden adaylara da açığım. <span className="text-ink-muted">(isteğe bağlı)</span>
                  </span>
                </label>

                <div>
                  <label className="flex items-start gap-3 text-sm leading-relaxed text-ink">
                    <input
                      id="ageConfirm"
                      type="checkbox"
                      name="ageConfirm"
                      className="mt-1 h-4 w-4 shrink-0 accent-ember"
                      aria-invalid={!!errors.ageConfirm}
                      aria-describedby={describedBy("ageConfirm")}
                    />
                    <span>Uygulama açıldığında 30 yaşını doldurmuş olacağım.</span>
                  </label>
                  {errors.ageConfirm ? (
                    <p id="ageConfirm-error" className="mt-1.5 text-xs font-medium text-ember-deep">
                      {errors.ageConfirm}
                    </p>
                  ) : null}
                </div>

                {TURNSTILE_SITE_KEY && !PREVIEW_MODE ? (
                  <Turnstile
                    ref={turnstile}
                    siteKey={TURNSTILE_SITE_KEY}
                    active={touched}
                    onToken={setTurnstileToken}
                  />
                ) : null}

                <div>
                  {formMessage || waitingForTurnstile ? (
                    <p role="alert" className="mb-4 rounded-xl bg-ember-soft/60 px-4 py-3 text-sm text-ember-deep">
                      {formMessage ??
                        "Güvenlik kontrolü tamamlanıyor. Birkaç saniye sonra tekrar dene."}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={pending}
                    className={`${buttonStyles.primary} w-full py-3.5 text-base disabled:opacity-60`}
                  >
                    {pending ? "Gönderiliyor…" : "Erken Erişime Katıl"}
                  </button>
                  <p className="mt-4 text-xs leading-relaxed text-ink-muted">
                    Kişisel verilerinin nasıl işlendiğini{" "}
                    <span className="font-medium text-ink-soft underline decoration-ink/30 underline-offset-2">
                      KVKK Aydınlatma Metni
                    </span>
                    ’nde bulabilirsin. <span className="italic">(Metin hazırlanıyor.)</span>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
