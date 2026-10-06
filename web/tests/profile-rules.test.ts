import assert from "node:assert/strict";
import test from "node:test";
import {
  ageOn,
  defaultAgePreference,
  effectiveAgePreference,
  isAtLeastMinimumAge,
  maximumBirthDateForMinimumAge,
} from "../src/lib/profile-rules.ts";

const TODAY = new Date("2026-10-06T12:00:00.000Z");

test("30. yaş günü kullanıcı uygundur", () => {
  assert.equal(ageOn("1996-10-06", TODAY), 30);
  assert.equal(isAtLeastMinimumAge("1996-10-06", TODAY), true);
});

test("30. yaş gününden bir gün önce kullanıcı uygun değildir", () => {
  assert.equal(ageOn("1996-10-07", TODAY), 29);
  assert.equal(isAtLeastMinimumAge("1996-10-07", TODAY), false);
});

test("varsayılan yaş aralığı 30 altına inmez", () => {
  assert.deepEqual(defaultAgePreference(30), { min: 30, max: 35 });
  assert.deepEqual(defaultAgePreference(44), { min: 39, max: 49 });
});

test("kesin yaş aralığı genişletilmeden korunur", () => {
  assert.deepEqual(effectiveAgePreference(44, { min: 41, max: 46 }), {
    min: 41,
    max: 46,
    source: "exact",
  });
});

test("tek tarafı eksik veya 30 altı aralık reddedilir", () => {
  assert.throws(() => effectiveAgePreference(44, { min: 40, max: null }));
  assert.throws(() => effectiveAgePreference(44, { min: 29, max: 45 }));
});

test("tarih alanının en yeni kabul edilen değeri hesaplanır", () => {
  assert.equal(maximumBirthDateForMinimumAge(TODAY), "1996-10-06");
});
