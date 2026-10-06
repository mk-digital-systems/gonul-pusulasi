import { FormField, SelectInput, TextInput } from "./form-controls";
import type { City, Profile, RelationshipGoal } from "@/lib/data/profile";

export function EditableProfileFields({
  cities,
  goals,
  profile,
}: {
  cities: City[];
  goals: RelationshipGoal[];
  profile?: Profile;
}) {
  return (
    <>
      <FormField label="Görünen ad">
        <TextInput
          name="displayName"
          autoComplete="nickname"
          minLength={2}
          maxLength={50}
          defaultValue={profile?.display_name ?? ""}
          required
        />
      </FormField>
      <FormField label="Şehir" hint="Kesin konumun kullanılmaz; diğer kullanıcılara yalnızca şehir bilgisi gösterilir.">
        <SelectInput name="cityId" defaultValue={profile?.city_id ?? ""} required>
          <option value="" disabled>Seçiniz</option>
          {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
        </SelectInput>
      </FormField>
      <FormField label="İlişki amacı">
        <SelectInput name="relationshipGoal" defaultValue={profile?.relationship_goal_code ?? ""} required>
          <option value="" disabled>Seçiniz</option>
          {goals.map((goal) => <option key={goal.code} value={goal.code}>{goal.label}</option>)}
        </SelectInput>
      </FormField>
      <fieldset className="rounded-2xl border border-ink/10 p-5">
        <legend className="px-2 text-sm font-semibold text-ink">Kesin yaş tercihi</legend>
        <p className="text-sm leading-relaxed text-ink-muted">
          Boş bırakırsan kendi yaşının yaklaşık ±5 yılı kullanılır ve alt sınır asla 30’un altına inmez. Aralık girersen sistem bunu genişletmez.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="En düşük yaş">
            <TextInput name="agePreferenceMin" type="number" min={30} inputMode="numeric" defaultValue={profile?.age_preference_min ?? ""} />
          </FormField>
          <FormField label="En yüksek yaş">
            <TextInput name="agePreferenceMax" type="number" min={30} inputMode="numeric" defaultValue={profile?.age_preference_max ?? ""} />
          </FormField>
        </div>
      </fieldset>
    </>
  );
}
