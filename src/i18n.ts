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
  activationCode: string;
  activationCodePlaceholder: string;
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
  addPet: string;
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
  selectPet: string;
  update: string;
  save: string;
  delete: string;
  yourVisits: string;

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

  // AI Assistant
  aiAssistant: string;
  askAiAssistant: string;

  // Hamburger Menu
  deleteAccount: string;
  back: string;
};

const en: Translations = {
  appTitle: "Pause First™",
  appSubtitle: "A structured clarity tool for veterinary visits",
  loading: "Loading...",
  logout: "Logout",
  error: "Error",
  saved: "Saved!",

  // Auth
  welcome: "Welcome to Pause First",
  accountInfo: "Walk in prepared. Partner in your pet's care.",
  email: "Email",
  password: "Password",
  createPassword: "Create a password",
  activationCode: "Activation code",
  activationCodePlaceholder: "Enter the activation code from your purchase email.",
  signUp: "Create account",
  login: "Log in",
  sendReset: "Send reset link",
  forgotPassword: "Forgot password?",
  backToLogin: "Back to login",

  // Pets
  myPets: "My Animals",
  petName: "Animal's Name",
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
  addPet: "Add Animal",
  savePet: "Save Animal",
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
  selectPet: "Select animal",
  update: "Update",
  save: "Save",
  delete: "Delete",
  yourVisits: "Your Visits",

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
  close: "Close",

  // AI Assistant
  aiAssistant: "Pause First AI Assistant",
  askAiAssistant: "Ask AI assistant?",

  // Hamburger Menu
  deleteAccount: "Delete Account",
  back: "Back",
};

const da: Translations = {
  appTitle: "Pause First™",
  appSubtitle: "Et struktureret værktøj til dyrlægekonsultationer",
  loading: "Indlæser...",
  logout: "Log ud",
  error: "Fejl",
  saved: "Gemt!",

  // Auth
  welcome: "Velkommen til Pause First",
  accountInfo: "Mød godt forberedt op. Vær en aktiv partner i dit dyrs pleje.",
  email: "E-mail",
  password: "Adgangskode",
  createPassword: "Opret en adgangskode",
  activationCode: "Aktiveringskode",
  activationCodePlaceholder: "Indtast aktiveringskoden fra din købsmail.",
  signUp: "Opret konto",
  login: "Log ind",
  sendReset: "Send nulstillingslink",
  forgotPassword: "Glemt adgangskode?",
  backToLogin: "Tilbage til login",

  // Pets
  myPets: "Mine dyr",
  petName: "Dyrets navn",
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
  addPet: "Tilføj dyr",
  savePet: "Gem dyr",
  editPet: "Rediger",
  deletePet: "Slet",

  // Visits
  myVisits: "Mine besøg",
  prepareVisit: "Forbered besøg",
  visitDate: "Besøgsdato (eller forventet)",
  mainConcern: "Hovedbekymring — Hvad bragte dig herind i dag?",
  whenStart: "Hvornår startede det?",
  howProgressing: "Hvordan udvikler det sig?",
  patterns: "Mønstre eller udløsende faktorer",
  associatedSigns: "Tilknyttede tegn (Hvad er anderledes?)",
  previousTreatment: "Tidligere behandling",
  questionsVet: "Spørgsmål til dyrlægen",
  savePrep: "Gem besøgsforberedelse",
  clearForm: "Ryd formular",
  selectPet: "Vælg dyr",
  update: "Opdater",
  save: "Gem",
  delete: "Slet",
  yourVisits: "Dine besøg",

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
  close: "Luk",

  // AI Assistant
  aiAssistant: "Pause First AI-assistent",
  askAiAssistant: "Spørg AI-assistenten?",

  // Hamburger Menu
  deleteAccount: "Slet konto",
  back: "Tilbage",
};

export function useTranslation(lang: Lang): Translations {
  return lang === "da" ? da : en;
}
