export type Lang = "en" | "da";

export type Translations = {
  appTitle: string;
  appSubtitle: string;
  loading: string;
  logout: string;
  error: string;
  saved: string;
  
  // Auth
  welcome: string;
  accountInfo: string;
  email: string;
  password: string;
  createPassword: string;
  signUp: string;
  login: string;
  sendReset: string;
  forgotPassword: string;
  backToLogin: string;

  // Pets
  myPets: string;
  petName: string;
  species: string;
  age: string;
  sex: string;
  weight: string;
  microchip: string;
  allergies: string;
  medications: string;
  diet: string;
  clinic: string;
  emergencyContact: string;
  notes: string;
  savePet: string;
  editPet: string;
  deletePet: string;

  // Visits
  myVisits: string;
  prepareVisit: string;
  visitDate: string;
  mainConcern: string;
  whenStart: string;
  howProgressing: string;
  patterns: string;
  associatedSigns: string;
  previousTreatment: string;
  questionsVet: string;
  savePrep: string;
  clearForm: string;

  // Visit Notes
  visitNotes: string;
  vetName: string;
  diagnosis: string;
  testsPerformed: string;
  treatmentMeds: string;
  homeInstructions: string;
  followUp: string;
  saveNote: string;
  cancel: string;

  // View Document
  viewDocument: string;

  // Modals
  emergencyGuide: string;
  medicalDisclaimer: string;
  close: string;
};

const en: Translations = {
  appTitle: "Pause First™",
  appSubtitle: "A structured clarity tool for veterinary visits",
  loading: "Loading...",
  logout: "Logout",
  error: "Error",
  saved: "Saved!",
  
  // Auth
  welcome: "Welcome",
  accountInfo: "Create an account or log in to save your pets and visits.",
  email: "Email",
  password: "Password",
  createPassword: "Create a password",
  signUp: "Sign up",
  login: "Log in",
  sendReset: "Send reset link",
  forgotPassword: "Forgot password?",
  backToLogin: "Back to login",
  
  // Pets
  myPets: "My Pets",
  petName: "Pet's Name",
  species: "Species",
  age: "Age",
  sex: "Sex",
  weight: "Weight",
  microchip: "Microchip",
  allergies: "Allergies",
  medications: "Medications",
  diet: "Diet",
  clinic: "Clinic",
  emergencyContact: "Emergency Contact",
  notes: "Notes",
  savePet: "Save Pet",
  editPet: "Edit",
  deletePet: "Delete",

  // Visits
  myVisits: "My Visits",
  prepareVisit: "Prepare Visit",
  visitDate: "Visit Date (or Expected)",
  mainConcern: "Main Concern — What brought you in today?",
  whenStart: "When Did This Start?",
  howProgressing: "How Is It Progressing?",
  patterns: "Patterns or Triggers",
  associatedSigns: "Associated Signs (What Else Is Different?)",
  previousTreatment: "Previous Treatment",
  questionsVet: "Questions for Your Veterinarian",
  savePrep: "Save Visit Preparation",
  clearForm: "Clear Form",

  // Visit Notes
  visitNotes: "Visit Notes",
  vetName: "Veterinarian Name",
  diagnosis: "Diagnosis / Findings",
  testsPerformed: "Tests Performed",
  treatmentMeds: "Medications / Treatment",
  homeInstructions: "Instructions at Home",
  followUp: "Follow-up Plan",
  saveNote: "Save Visit Notes",
  cancel: "Cancel",

  // View Document
  viewDocument: "View Document",

  // Modals
  emergencyGuide: "Emergency Guide",
  medicalDisclaimer: "Medical Disclaimer",
  close: "Close"
};

const da: Translations = {
  appTitle: "Pause First™",
  appSubtitle: "Et struktureret værktøj til dyrlægekonsultationer",
  loading: "Indlæser...",
  logout: "Log ud",
  error: "Fejl",
  saved: "Gemt!",

    // Auth
  welcome: "Velkommen",
  accountInfo: "Opret en konto eller log ind for at gemme dine kæledyr og besøg.",
  email: "E-mail",
  password: "Adgangskode",
  createPassword: "Opret en adgangskode",
  signUp: "Opret konto",
  login: "Log ind",
  sendReset: "Send nulstillingslink",
  forgotPassword: "Glemt adgangskode?",
  backToLogin: "Tilbage til login",
  
  // Pets
  myPets: "Mine kæledyr",
  petName: "Kæledyrets navn",
  species: "Art",
  age: "Alder",
  sex: "Køn",
  weight: "Vægt",
  microchip: "Mikrochip",
  allergies: "Allergier",
  medications: "Medicin",
  diet: "Diæt",
  clinic: "Klinik",
  emergencyContact: "Nødkontakt",
  notes: "Noter",
  savePet: "Gem kæledyr",
  editPet: "Rediger",
  deletePet: "Slet",

  // Visits
  myVisits: "Mine besøg",
  prepareVisit: "Forbered besøg",
  visitDate: "Besøgsdato (eller forventet)",
  mainConcern: "Hovedbekymring — Hvad bragte dig herind i dag?",
  whenStart: "Hvornår startede det?",
  howProgressing: "Hvordan udvikler det sig?",
  patterns: "Mønstre eller triggere",
  associatedSigns: "Tilknyttede tegn (Hvad er anderledes?)",
  previousTreatment: "Tidligere behandling",
  questionsVet: "Spørgsmål til dyrlægen",
  savePrep: "Gem besøgsforberedelse",
  clearForm: "Ryd formular",

  // Visit Notes
  visitNotes: "Besøgsnoter",
  vetName: "Dyrlægens navn",
  diagnosis: "Diagnose / Resultater",
  testsPerformed: "Udførte tests",
  treatmentMeds: "Medicin / Behandling",
  homeInstructions: "Instruktioner derhjemme",
  followUp: "Opfølgningsplan",
  saveNote: "Gem besøgsnoter",
  cancel: "Annuller",

  // View Document
  viewDocument: "Se dokument",

  // Modals
  emergencyGuide: "Nødvejledning",
  medicalDisclaimer: "Medicinsk ansvarsfraskrivelse",
  close: "Luk"
};

export function useTranslation(lang: Lang): Translations {
  return lang === "da" ? da : en;
}
