import React, { useState } from 'react';
import { ChevronLeft, Mail, FileText, Check } from 'lucide-react';
import '../styles/PrepareWizard.css';

interface PrepareWizardProps {
  petId: string;
  visitId: string;
  onClose: () => void;
  onSave: (data: PrepareData) => Promise<void>;
  initialData?: PrepareData;
}

interface PrepareData {
  petId: string;
  visitId: string;
  reasonForVisit: string;
  currentSymptoms: string;
  recentChanges: string;
  medications: string;
  allergies: string;
  questions: string;
}

type WizardStep = 'wizard' | 'review' | 'done';

export const PrepareWizard: React.FC<PrepareWizardProps> = ({
  petId,
  visitId,
  onClose,
  onSave,
  initialData,
}) => {
  const [step, setStep] = useState<WizardStep>('wizard');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<PrepareData>(
    initialData || {
      petId,
      visitId,
      reasonForVisit: '',
      currentSymptoms: '',
      recentChanges: '',
      medications: '',
      allergies: '',
      questions: '',
    }
  );

  const handleInputChange = (field: keyof PrepareData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    setStep('review');
  };

  const handleBack = () => {
    if (step === 'review') {
      setStep('wizard');
    } else if (step === 'done') {
      setStep('review');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      setStep('done');
    } catch (error) {
      console.error('Error saving preparation:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDone = () => {
    onClose();
  };

  const handleEmailPDF = () => {
    alert('Email feature coming soon!');
  };

  const handleDownloadPDF = () => {
    alert('PDF download feature coming soon!');
  };

  return (
    <div className="prepare-wizard-overlay">
      <div className="prepare-wizard-modal">
        {/* Header */}
        <div className="wizard-header">
          <button className="back-btn" onClick={handleBack} disabled={step === 'wizard'}>
            <ChevronLeft size={20} />
          </button>
          <h2>
            {step === 'wizard' && 'Prepare Your Visit'}
            {step === 'review' && 'Review Your Prep'}
            {step === 'done' && 'Your Prep is Ready!'}
          </h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="wizard-content">
          {/* WIZARD STEP */}
          {step === 'wizard' && (
            <div className="wizard-form">
              <div className="form-group">
                <label>Reason for Visit</label>
                <textarea
                  placeholder="What's the main reason for this visit?"
                  value={formData.reasonForVisit}
                  onChange={(e) => handleInputChange('reasonForVisit', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Current Symptoms</label>
                <textarea
                  placeholder="Describe any symptoms you've noticed..."
                  value={formData.currentSymptoms}
                  onChange={(e) => handleInputChange('currentSymptoms', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Recent Changes</label>
                <textarea
                  placeholder="Any changes in behavior, appetite, or activity?"
                  value={formData.recentChanges}
                  onChange={(e) => handleInputChange('recentChanges', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Current Medications</label>
                <textarea
                  placeholder="List any medications your pet is taking..."
                  value={formData.medications}
                  onChange={(e) => handleInputChange('medications', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Allergies or Sensitivities</label>
                <textarea
                  placeholder="Any known allergies or sensitivities?"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Questions for Your Vet</label>
                <textarea
                  placeholder="What do you want to ask your vet?"
                  value={formData.questions}
                  onChange={(e) => handleInputChange('questions', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* REVIEW STEP */}
          {step === 'review' && (
            <div className="review-content">
              <div className="review-section">
                <h3>Reason for Visit</h3>
                <p>{formData.reasonForVisit || '(Not provided)'}</p>
              </div>

              <div className="review-section">
                <h3>Current Symptoms</h3>
                <p>{formData.currentSymptoms || '(Not provided)'}</p>
              </div>

              <div className="review-section">
                <h3>Recent Changes</h3>
                <p>{formData.recentChanges || '(Not provided)'}</p>
              </div>

              <div className="review-section">
                <h3>Current Medications</h3>
                <p>{formData.medications || '(Not provided)'}</p>
              </div>

              <div className="review-section">
                <h3>Allergies or Sensitivities</h3>
                <p>{formData.allergies || '(Not provided)'}</p>
              </div>

              <div className="review-section">
                <h3>Questions for Your Vet</h3>
                <p>{formData.questions || '(Not provided)'}</p>
              </div>
            </div>
          )}

          {/* DONE STEP */}
          {step === 'done' && (
            <div className="done-content">
              <div className="done-icon">
                <Check size={48} />
              </div>
              <h3>Your prep is ready!</h3>
              <p>You're all set for your vet visit. Walk in prepared and partner in your pet's care.</p>

              <div className="done-options">
                <button className="option-btn primary" onClick={handleDone}>
                  Done (Saved in app)
                </button>

                <button className="option-btn secondary" onClick={handleEmailPDF}>
                  <Mail size={18} />
                  Email to Myself
                </button>

                <button className="option-btn secondary" onClick={handleDownloadPDF}>
                  <FileText size={18} />
                  Download as PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Actions */}
        <div className="wizard-footer">
          {step === 'wizard' && (
            <button className="btn-primary" onClick={handleNext}>
              Review
            </button>
          )}

          {step === 'review' && (
            <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Visit'}
            </button>
          )}

          {step === 'done' && (
            <button className="btn-primary" onClick={handleDone}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
