import Link from "next/link";
import { notFound } from "next/navigation";
import { manageModerationStaffAction } from "@/app/actions/moderation";
import { FormField, MessageBanner, SelectInput, TextInput } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/user";
import { getModerationStaff, getMyStaffRole } from "@/lib/data/moderation";

const ROLE_LABELS = {
  admin: "Admin",
  moderator: "Moderatör",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export default async function ModerationStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; bildirim?: string }>;
}) {
  const [staffRole, user, { hata, bildirim }] = await Promise.all([
    getMyStaffRole(),
    getCurrentUser(),
    searchParams,
  ]);
  if (staffRole !== "admin" || !user) notFound();

  const staff = await getModerationStaff();

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
        Yönetim · Admin
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">Moderasyon ekibi</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
        Yetki yalnızca mevcut Supabase Auth kullanıcı UUID’sine verilir. Aktif olmayan hesaba
        yetki atanamaz ve admin kendi admin rolünü kaldıramaz.
      </p>

      <div className="mt-8">
        <MessageBanner error={hata} notice={bildirim} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/yonetim/sikayetler" className={buttonStyles.secondary}>
          Şikâyet kuyruğu
        </Link>
        <Link href="/yonetim/islemler" className={buttonStyles.secondary}>
          İşlem geçmişi
        </Link>
      </div>

      <form
        action={manageModerationStaffAction}
        className="mt-8 space-y-4 rounded-[2rem] border border-ink/10 bg-paper p-6"
      >
        <h2 className="font-display text-2xl text-ink">Personel ekle</h2>
        <FormField
          label="Auth kullanıcı UUID’si"
          hint="Supabase Dashboard → Authentication → Users bölümündeki kullanıcı kimliği."
        >
          <TextInput name="userId" required autoComplete="off" placeholder="00000000-0000-0000-0000-000000000000" />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Rol">
            <SelectInput name="role" defaultValue="moderator">
              <option value="moderator">Moderatör</option>
              <option value="admin">Admin</option>
            </SelectInput>
          </FormField>
          <FormField label="Durum">
            <SelectInput name="isActive" defaultValue="true">
              <option value="true">Etkin</option>
              <option value="false">Pasif</option>
            </SelectInput>
          </FormField>
        </div>
        <button type="submit" className={buttonStyles.primary}>Personeli kaydet</button>
      </form>

      <div className="mt-8 space-y-4">
        {staff.map((member) => {
          const isCurrentAdmin = member.user_id === user.id;

          return (
            <article
              key={member.user_id}
              className="rounded-[2rem] border border-ink/10 bg-paper p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl text-ink">
                    {member.display_name ?? "Profili tamamlanmamış kullanıcı"}
                  </h2>
                  <p className="mt-1 break-all text-xs text-ink-muted">{member.user_id}</p>
                </div>
                <span className="rounded-full bg-sand px-3 py-1.5 text-xs font-semibold text-ink-soft">
                  {ROLE_LABELS[member.role]} · {member.is_active ? "Etkin" : "Pasif"}
                </span>
              </div>

              <p className="mt-4 text-xs text-ink-muted">
                Son güncelleme: {formatDate(member.updated_at)}
                {member.created_by_display_name ? ` · Ekleyen: ${member.created_by_display_name}` : ""}
              </p>

              {isCurrentAdmin ? (
                <p className="mt-4 rounded-xl bg-sand/60 p-4 text-sm text-ink-soft">
                  Kendi etkin admin rolünü bu ekrandan değiştiremezsin.
                </p>
              ) : (
                <form action={manageModerationStaffAction} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <input type="hidden" name="userId" value={member.user_id} />
                  <FormField label="Rol">
                    <SelectInput name="role" defaultValue={member.role}>
                      <option value="moderator">Moderatör</option>
                      <option value="admin">Admin</option>
                    </SelectInput>
                  </FormField>
                  <FormField label="Durum">
                    <SelectInput name="isActive" defaultValue={String(member.is_active)}>
                      <option value="true">Etkin</option>
                      <option value="false">Pasif</option>
                    </SelectInput>
                  </FormField>
                  <button type="submit" className={buttonStyles.secondary}>Güncelle</button>
                </form>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
