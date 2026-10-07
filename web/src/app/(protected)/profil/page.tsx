import { redirect } from "next/navigation";
import {
  deleteProfilePhotoAction,
  updateProfileAction,
  uploadProfilePhotoAction,
} from "@/app/actions/profile";
import { MessageBanner } from "@/components/form-controls";
import { EditableProfileFields } from "@/components/profile-form-fields";
import { buttonStyles } from "@/components/ui";
import { getMyAccountAndProfile, getProfileOptions } from "@/lib/data/profile";
import { getMyProfilePhoto } from "@/lib/data/profile-photos";

const PHOTO_STATUS_LABELS = {
  pending: "İncelemede",
  approved: "Onaylandı",
  rejected: "Reddedildi",
} as const;

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ hata?: string; bildirim?: string }> }) {
  const [{ account, profile }, options, photo, { hata, bildirim }] = await Promise.all([
    getMyAccountAndProfile(),
    getProfileOptions(),
    getMyProfilePhoto(),
    searchParams,
  ]);

  if (!account.onboarding_completed_at) redirect("/onboarding");
  if (account.status === "deletion_requested" || account.status === "suspended") redirect("/hesabim");

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Profil</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Profilini düzenle</h1>
      <p className="mt-4 leading-relaxed text-ink-soft">
        Doğum tarihi ve cinsiyet, ilk onaydan sonra normal profil düzenlemesinden değiştirilemez.
      </p>
      <div className="mt-8"><MessageBanner error={hata} notice={bildirim} /></div>

      <section className="mt-6 rounded-[2rem] border border-ink/10 bg-paper p-6 sm:p-8">
        <h2 className="font-display text-2xl text-ink">Profil fotoğrafı</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Fotoğraf isteğe bağlıdır. JPEG, PNG veya WebP yükleyebilirsin; dosya sunucuda
          EXIF bilgisinden arındırılır, kare WebP’ye dönüştürülür ve onaylanana kadar
          diğer kullanıcılara gösterilmez.
        </p>

        {photo ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-[10rem_1fr] sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/profil-fotografi/${profile.user_id}?v=${encodeURIComponent(photo.uploaded_at)}`}
              alt="Profil fotoğrafın"
              width={160}
              height={160}
              className="aspect-square w-40 rounded-2xl object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-ink">
                Durum: {PHOTO_STATUS_LABELS[photo.status]}
              </p>
              {photo.status === "pending" ? (
                <p className="mt-2 text-sm text-ink-soft">Yeni fotoğraf moderasyon incelemesinde.</p>
              ) : null}
              {photo.moderation_note ? (
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Moderasyon notu: {photo.moderation_note}
                </p>
              ) : null}
              <form action={deleteProfilePhotoAction} className="mt-4">
                <button type="submit" className={buttonStyles.secondary}>Fotoğrafı kaldır</button>
              </form>
            </div>
          </div>
        ) : null}

        <form action={uploadProfilePhotoAction} className="mt-5 space-y-4">
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            required
            className="block w-full rounded-xl border border-ink/20 bg-white px-4 py-3 text-sm text-ink"
          />
          <p className="text-xs leading-relaxed text-ink-muted">
            En fazla 8 MB ve en az 400×400 piksel. Yeni yükleme varsa önceki fotoğrafın yerini alır.
          </p>
          <button type="submit" className={buttonStyles.primary}>
            {photo ? "Yeni fotoğraf yükle" : "Fotoğraf yükle"}
          </button>
        </form>
      </section>

      <form action={updateProfileAction} className="mt-6 space-y-6 rounded-[2rem] border border-ink/10 bg-paper p-6 sm:p-8">
        <EditableProfileFields cities={options.cities} goals={options.goals} profile={profile} />
        <button type="submit" className={buttonStyles.primary}>Değişiklikleri kaydet</button>
      </form>
    </section>
  );
}
