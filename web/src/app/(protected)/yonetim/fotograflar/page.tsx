import Link from "next/link";
import { notFound } from "next/navigation";
import { moderateProfilePhotoAction } from "@/app/actions/moderation";
import { FormField, MessageBanner, TextArea } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";
import {
  getModerationProfilePhotos,
  getMyStaffRole,
  type ModerationProfilePhoto,
} from "@/lib/data/moderation";
import { profilePhotoModerationFilterSchema } from "@/lib/validation/profile-photo";

const STATUS_LABELS = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export default async function ModerationPhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; hata?: string; bildirim?: string }>;
}) {
  const [{ durum, hata, bildirim }, staffRole] = await Promise.all([
    searchParams,
    getMyStaffRole(),
  ]);
  if (!staffRole) notFound();

  const parsedFilter = profilePhotoModerationFilterSchema.safeParse(durum ?? "pending");
  const filter = parsedFilter.success ? parsedFilter.data : "pending";
  const photos = await getModerationProfilePhotos(
    filter === "all" ? null : (filter as ModerationProfilePhoto["photo_status"]),
  );

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
        Yönetim · {staffRole === "admin" ? "Admin" : "Moderatör"}
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">Profil fotoğrafları</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
        Yeni veya değiştirilen fotoğraflar onaylanana kadar Keşfet’te görünmez.
        Fotoğraf kullanımı isteğe bağlıdır ve kararlar manuel olarak verilir.
      </p>

      <div className="mt-8">
        <MessageBanner error={hata} notice={bildirim} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/yonetim/sikayetler" className={buttonStyles.secondary}>
          Şikâyet kuyruğu
        </Link>
        {staffRole === "admin" ? (
          <Link href="/yonetim/ekip" className={buttonStyles.secondary}>
            Moderasyon ekibi
          </Link>
        ) : null}
      </div>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Fotoğraf durumu filtresi">
        {[
          ["pending", "Bekleyen"],
          ["approved", "Onaylanan"],
          ["rejected", "Reddedilen"],
          ["all", "Tümü"],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={`/yonetim/fotograflar?durum=${value}`}
            className={filter === value ? buttonStyles.primary : buttonStyles.secondary}
          >
            {label}
          </Link>
        ))}
      </nav>

      {photos.length === 0 ? (
        <p className="mt-6 rounded-[2rem] border border-ink/10 bg-paper p-6 text-sm text-ink-muted">
          Bu durumda profil fotoğrafı bulunmuyor.
        </p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {photos.map((photo) => (
            <article key={photo.user_id} className="overflow-hidden rounded-[2rem] border border-ink/10 bg-paper">
              {/* Private fotoğraflar yetki denetimli Route Handler üzerinden sunulur. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/profil-fotografi/${photo.user_id}`}
                alt={`${photo.display_name ?? "Kullanıcı"} profil fotoğrafı`}
                width={1024}
                height={1024}
                className="aspect-square w-full object-cover"
              />
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl text-ink">
                      {photo.display_name ?? "Profili tamamlanmamış kullanıcı"}
                    </h2>
                    <p className="mt-1 break-all text-xs text-ink-muted">{photo.user_id}</p>
                  </div>
                  <span className="rounded-full bg-sand px-3 py-1.5 text-xs font-semibold text-ink-soft">
                    {STATUS_LABELS[photo.photo_status]}
                  </span>
                </div>

                <p className="mt-4 text-xs text-ink-muted">
                  Yüklendi: {formatDate(photo.uploaded_at)} · {Math.ceil(photo.byte_size / 1024)} KB
                </p>

                {photo.moderation_note ? (
                  <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                    <strong>Moderasyon notu:</strong> {photo.moderation_note}
                  </p>
                ) : null}

                {photo.photo_status === "pending" ? (
                  <form action={moderateProfilePhotoAction} className="mt-5 space-y-4 border-t border-ink/10 pt-5">
                    <input type="hidden" name="userId" value={photo.user_id} />
                    <FormField label="Moderasyon notu" hint="Onayda isteğe bağlı; rette en az 10 karakter.">
                      <TextArea name="note" rows={3} maxLength={1000} />
                    </FormField>
                    <div className="flex flex-wrap gap-3">
                      <button type="submit" name="status" value="approved" className={buttonStyles.primary}>
                        Fotoğrafı onayla
                      </button>
                      <button type="submit" name="status" value="rejected" className={buttonStyles.secondary}>
                        Fotoğrafı reddet
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
