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
  accountInfoDetail: string;
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
  sex: string;
  weight: string;
  microchip: string;
  allergies: string;
  diet: string;
  notes: string;
  savePet: string;
  editPet: string;
  deletePet: string;

  // Visits
  myVisits: string;

  // Visit Notes
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
  accountInfo: "Every great vet visit starts before you arrive.",
  accountInfoDetail: "Prepare for a calmer, more productive conversation with your vet.",
  email: "Email",
  password: "Password",
  createPassword: "Create a password",
  activationCode: "Activation code",
  activationCodePlaceholder: "Enter your activation code",
  signUp: "Create account",
  login: "Log in",
  sendReset: "Send reset link",
  forgotPassword: "Forgot password?",
  backToLogin: "Back to login",

  // Pets
  myPets: "My Animals",
  petName: "Animal's Name",
  species: "Species",
  sex: "Sex",
  weight: "Weight",
  microchip: "Microchip",
  allergies: "Allergies",
  diet: "Diet",
  notes: "Notes",
  savePet: "Save Animal",
  editPet: "Edit",
  deletePet: "Delete",

  // Visits
  myVisits: "My Visits",

  // Visit Notes
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
  welcome: "Velkommen til Pause First",
  accountInfo: "Saml det vigtigste på forhånd.",
  accountInfoDetail: "Et godt dyrlægebesøg starter før du træder ind ad døren.",
  email: "E-mail",
  password: "Adgangskode",
  createPassword: "Opret en adgangskode",
  activationCode: "Aktiveringskode",
  activationCodePlaceholder: "Indtast din aktiveringskode",
  signUp: "Opret konto",
  login: "Log ind",
  sendReset: "Send nulstillingslink",
  forgotPassword: "Glemt adgangskode?",
  backToLogin: "Tilbage til login",

  // Pets
  myPets: "Mine dyr",
  petName: "Dyrets navn",
  species: "Art",
  sex: "Køn",
  weight: "Vægt",
  microchip: "Mikrochip",
  allergies: "Allergier",
  diet: "Diæt",
  notes: "Noter",
  savePet: "Gem dyr",
  editPet: "Rediger",
  deletePet: "Slet",

  // Visits
  myVisits: "Mine besøg",

  // Visit Notes
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

  // Hamburger Menu
  deleteAccount: "Slet konto",
  back: "Tilbage",
};

export function useTranslation(lang: Lang): Translations {
  return lang === "da" ? da : en;
}
