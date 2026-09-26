import {
  changeDraft,
  makeDraft,
  validDate,
  validateAll,
  validateStep,
} from "./model";
test("changing fuel and conditional answers clears obsolete data", () => {
  let d = {
    ...makeDraft(),
    fuel: "Natural gas",
    gas: "National Grid",
    assessment: "Completed",
    assessmentYear: "2025",
    additional: true,
    additionalName: "Someone",
    additionalContact: "a@example.com",
  };
  d = changeDraft(d, "fuel", "Oil");
  expect(d.gas).toBe("");
  d = changeDraft(d, "assessment", "Not yet");
  expect(d.assessmentYear).toBe("");
  d = changeDraft(d, "additional", false);
  expect(d.additionalName).toBe("");
  expect(d.additionalContact).toBe("");
});
test("assessment skips equipment-detail requirements but keeps shared context", () => {
  const d = {
    ...makeDraft(),
    intent: "assessment" as const,
    fuel: "Not sure",
    timeline: "Just exploring",
  };
  expect(validateStep(d, 3)).toEqual({});
  expect(validateStep({ ...d, intent: "heat-pump" }, 3)).toHaveProperty(
    "heating",
  );
});
test("the first step always requires a phone number for follow-up", () => {
  const d = {
    ...makeDraft(),
    firstName: "Alex",
    lastName: "Example",
    email: "alex@example.com",
    phone: "202-555-0130",
    zip: "02420",
  };
  expect(validateStep(d, 0)).toEqual({});
  expect(validateStep({ ...d, phone: "" }, 0)).toHaveProperty("phone");
  expect(validateStep({ ...d, phone: "123" }, 0)).toHaveProperty("phone");
  expect(validateStep({ ...d, email: "" }, 0)).toEqual({});
  expect(validateStep(d, 4)).toHaveProperty("consent");
});
test("blank intake cannot be submitted and past assessment dates are rejected", () => {
  expect(Object.keys(validateAll(makeDraft())).length).toBeGreaterThan(10);
  expect(
    validateStep({ ...makeDraft(), preferredDate: "2000-01-01" }, 4),
  ).toHaveProperty("preferredDate");
});

test("assessment does not get blocked by hidden equipment fields and invalid dates are rejected", () => {
  const d = {
    ...makeDraft(),
    intent: "assessment" as const,
    ownership: "I own my home",
    homeType: "Single-family",
    size: "20",
    year: "1000",
  };
  expect(validateStep(d, 2)).toEqual({});
  expect(validateStep({ ...d, intent: "heat-pump" }, 2)).toHaveProperty("size");
  expect(validDate("2099-02-31")).toBe(false);
  expect(validateStep({ ...d, zip: "02903" }, 0)).toHaveProperty("zip");
});
