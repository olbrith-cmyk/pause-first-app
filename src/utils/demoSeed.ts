import type { Lang } from "../i18n";
import type { Pet, Visit, VisitNote } from "../firestore";
import { addPet, addVisit, addVisitNote } from "../firestore";

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// Populates a brand-new (typically anonymous/demo) account with one pet and
// two visits — one finished with notes, one still a draft — so the demo
// shows what a visit history looks like once it's had time to build up,
// instead of a single empty pet profile.
export async function seedDemoData(userId: string, lang: Lang): Promise<void> {
  const isDa = lang === "da";

  const pet: Pet = {
    userId,
    name: isDa ? "Bella" : "Bella",
    species: isDa ? "Hund" : "Dog",
    age: "",
    breedType: isDa ? "Labrador" : "Labrador",
    dateOfBirth: "15/03/2023",
    sex: isDa ? "Hun" : "Female",
    neuteredStatus: isDa ? "Steriliseret" : "Spayed",
    weight: "22 kg",
    microchip: "999000123456789",
    allergies: isDa ? "Ingen kendte" : "None known",
    medications: "",
    diet: isDa ? "Royal Canin Medium Adult, 2 gange dagligt" : "Royal Canin Medium Adult, twice daily",
    medsSupplements: [],
    vaccinations: [{ vaccine: "DHPPi", dateGiven: "01/03/2026", notes: isDa ? "Ingen reaktion" : "No reaction" }],
    preventativesList: [
      {
        type: isDa ? "Loppe/flåt" : "Flea/Tick",
        productName: "NexGard",
        howOften: isDa ? "Månedligt" : "Monthly",
        lastGiven: "01/06/2026"
      }
    ],
    clinic: isDa ? "Cykeldyrlægen" : "Cykeldyrlægen",
    emergencyContact: "",
    notes: "",
    surgeries: "",
    lifestyle: isDa ? "Indendørs/udendørs, ingen andre dyr i hjemmet" : "Indoor/outdoor, no other pets at home"
  };

  const petRef = await addPet(pet);
  const petId = petRef.id;

  const oldVisit: Visit = {
    userId,
    petId,
    visitDate: isoDateDaysAgo(75),
    mainConcern: isDa ? "Halter på højre forben efter en løbetur" : "Limping on the right front leg after a run",
    urgency: "concerned",
    whenStart: isDa ? "Opstod pludseligt efter en løbetur i skoven" : "Started suddenly after a run in the woods",
    durationValue: "2",
    durationUnit: "days",
    trend: "better",
    howProgressing: isDa ? "Blev bedre efter et par dages ro" : "Improved after a couple of days of rest",
    patterns: "",
    associatedSigns: "",
    currentStatus: {
      appetite: "normal",
      drinking: "normal",
      energy: "changed",
      energyNotes: isDa ? "Mindre legesyg, undgår trapper" : "Less playful, avoiding stairs",
      toileting: "normal",
      gi: "normal",
      breathing: "normal",
      mobilityPain: "changed",
      mobilityPainNotes: isDa
        ? "Undgår at støtte på højre forben, ingen synlig hævelse"
        : "Avoiding weight on the right front leg, no visible swelling",
      skinEars: "normal",
      otherNotes: ""
    },
    previousTreatment: isDa ? "Ro og kort snor i 3 dage" : "Rest and short leash walks for 3 days",
    questionsVet: isDa
      ? "Jeg vil gerne vide, om vi skal have røntgen taget, eller om det er nok at fortsætte med ro"
      : "I want to know if we should get an X-ray, or if continued rest is enough",
    status: "final"
  };

  const oldVisitRef = await addVisit(oldVisit);

  const oldNote: VisitNote = {
    userId,
    visitId: oldVisitRef.id,
    vetName: isDa ? "Dyrlæge Larsen" : "Dr. Larsen",
    diagnosis: isDa ? "Mild forstrækning, ingen tegn på brud" : "Mild strain, no sign of fracture",
    testsPerformed: isDa ? "Fysisk undersøgelse" : "Physical exam",
    treatmentMeds: isDa ? "Ingen medicin nødvendig" : "No medication needed",
    homeInstructions: isDa ? "Begrænset aktivitet i en uge" : "Limited activity for one week",
    followUp: isDa ? "Ingen opfølgning nødvendig, kontakt ved forværring" : "No follow-up needed, contact us if it worsens"
  };

  await addVisitNote(oldNote);

  const newVisit: Visit = {
    userId,
    petId,
    visitDate: isoDateDaysAgo(0),
    mainConcern: isDa ? "Kløer sig meget om ørerne på det seneste" : "Scratching her ears a lot lately",
    urgency: "routine",
    whenStart: "",
    howProgressing: "",
    patterns: "",
    associatedSigns: "",
    previousTreatment: "",
    questionsVet: "",
    status: "draft"
  };

  await addVisit(newVisit);
}
