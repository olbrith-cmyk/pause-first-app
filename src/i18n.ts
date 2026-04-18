type Lang = "en" | "da";

const translations = {
  en: {
    appTitle: "Pause First™",
    appSubtitle: "A structured clarity tool for veterinary visits",
    
    // Auth
    welcome: "Welcome to Pause First™",
    accountInfo: "Please enter your account information. This ensures your vet visit preparations are kept private and secure.",
    accountName: "Account Name",
    email: "Email",
    password: "Password",
    createPassword: "Create a secure password",
    signUp: "Sign Up",
    login: "Login",
    forgotPassword: "Forgot password?",
    resetPassword: "Reset Password",
    sendReset: "Send Reset Link",
    backToLogin: "Back to Login",
    logout: "Logout",
    deleteAccount: "Delete Account",
    confirmDelete: "Are you sure? This cannot be undone.",
    
    // Tabs
    myPets: "My Pets",
    prepareVisit: "Prepare Visit",
    visitNotes: "Visit Notes",
    viewDocument: "View Document",
    
    // Pets
    addPet: "Add Pet",
    petName: "Pet Name",
    species: "Species/Breed",
    age: "Age",
    sex: "Sex/Gender",
    weight: "Weight",
    microchip: "Microchip Number",
    allergies: "Allergies",
    medications: "Current Medications",
    diet: "Diet/Food Restrictions",
    clinic: "Veterinary Clinic",
    emergencyContact: "Emergency Contact (Name + Phone)",
    notes: "Notes",
    savePet: "Save Pet",
    deletePet: "Delete Pet",
    editPet: "Edit Pet",
    
    // Visits
    visitDate: "Visit Date (or Expected)",
    mainConcern: "Main Concern — What brought you in today?",
    whenStart: "When Did This Start?",
    howProgressing: "How Is It Progressing?",
    patterns: "Patterns or Triggers",
    associatedSigns: "Associated Signs (What Else Is Different?)",
    previousTreatment: "Previous Treatment",
    questionsVet: "Questions for Your Veterinarian",
    vetName: "Veterinarian Name",
    diagnosis: "Diagnosis / Findings",
    testsPerformed: "Tests Performed",
    treatmentMeds: "Medications / Treatment",
    homeInstructions: "Instructions at Home",
    followUp: "Follow-up Plan",
    savePrep: "Save Visit Preparation",
    saveNotes: "Save Visit Notes",
    clearForm: "Clear Form",
    
    // Modals
    emergencyGuide: "Emergency Guide",
    medicalDisclaimer: "Medical Disclaimer",
    close: "Close",
    
    // Messages
    saved: "Saved!",
    error: "Error",
    loading: "Loading...",
  },
  da: {
    appTitle: "Pause First™",
    appSubtitle: "Et struktureret værktøj til forberedelse til dyrlægekonsultationer",
    
    // Auth
    welcome: "Velkommen til Pause First™",
    accountInfo: "Indtast dine kontooplysninger. Dette sikrer, at dine dyrlægekonsultationer holdes private og sikre.",
    accountName: "Kontonavn",
    email: "Email",
    password: "Adgangskode",
    createPassword: "Opret en sikker adgangskode",
    signUp: "Opret konto",
    login: "Log ind",
    forgotPassword: "Glemt adgangskode?",
    resetPassword: "Nulstil adgangskode",
    sendReset: "Send nulstillings-link",
    backToLogin: "Tilbage til login",
    logout: "Log ud",
    deleteAccount: "Slet konto",
    confirmDelete: "Er du sikker? Dette kan ikke fortrydes.",
    
    // Tabs
    myPets: "Mine kæledyr",
    prepareVisit: "Forbered besøg",
    visitNotes: "Besøgsnoter",
    viewDocument: "Se dokument",
    
    // Pets
    addPet: "Tilføj kæledyr",
    petName: "Navn på kæledyr",
    species: "Art/race",
    age: "Alder",
    sex: "Køn",
    weight: "Vægt",
    microchip: "Chipnummer",
    allergies: "Allergier",
    medications: "Nuværende medicin",
    diet: "Diæt/fødevarerestriktioner",
    clinic: "Dyrlægeklinik",
    emergencyContact: "Nødkontakt (navn + telefon)",
    notes: "Noter",
    savePet: "Gem kæledyr",
    deletePet: "Slet kæledyr",
    editPet: "Rediger kæledyr",
    
    // Visits
    visitDate: "Besøgsdato (eller forventet)",
    mainConcern: "Hovedbekymring — Hvad bragte dig hertil i dag?",
    whenStart: "Hvornår startede det?",
    howProgressing: "Hvordan udvikler det sig?",
    patterns: "Mønstre eller udløsere",
    associatedSigns: "Andre tegn (Hvad er anderledes?)",
    previousTreatment: "Tidligere behandling",
    questionsVet: "Spørgsmål til din dyrlæge",
    vetName: "Dyrlægens navn",
    diagnosis: "Diagnose / Fund",
    testsPerformed: "Udførte tests",
    treatmentMeds: "Medicin / behandling",
    homeInstructions: "Instruktioner derhjemme",
    followUp: "Opfølgningsplan",
    savePrep: "Gem forberedelse til besøg",
    saveNotes: "Gem besøgsnoter",
    clearForm: "Ryd formular",
    
    // Modals
    emergencyGuide: "Nødguide",
    medicalDisclaimer: "Medicinsk ansvarsfraskrivelse",
    close: "Luk",
    
    // Messages
    saved: "Gemt!",
    error: "Fejl",
    loading: "Indlæser...",
  }
};

export const useTranslation = (lang: Lang) => {
  return translations[lang];
};

export type { Lang };
