import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import PhotoUpload from '../modules/PhotoUpload';
import './GetQuote.css'; // Reuse wizard base styles
import './SubmitPhotos.css';

// ─── Step configuration ──────────────────────────────────

interface StepConfig {
  id: string;
  progressLabel: string; // empty = hidden from progress bar
  type: 'intro' | 'photo' | 'yes-no' | 'additional' | 'done';
  photoKey?: string;
  title: string;
  subtitle?: string;
  hint?: string;
  required?: boolean;
}

const STEPS: StepConfig[] = [
  {
    id: 'intro',
    progressLabel: 'Intro',
    type: 'intro',
    title: 'Help Us See Your Home',
    subtitle:
      'We need a few photos of your heating equipment and electrical setup to finalize your quote. This takes about 5 minutes and works great from your phone.',
  },
  {
    id: 'mechanical-room',
    progressLabel: 'Furnace',
    type: 'photo',
    photoKey: 'mechanical-room',
    title: 'Your Mechanical Room',
    subtitle:
      'Take a wide shot showing your furnace or boiler and the area around it. We need to see the equipment and any visible ductwork or piping.',
    hint: 'Tip: Stand back far enough so we can see the full setup. Your mechanical room is usually in the basement, a utility closet, or the garage.',
    required: true,
  },
  {
    id: 'second-furnace-q',
    progressLabel: '',
    type: 'yes-no',
    title: 'Do you have a second furnace or air handler?',
    subtitle:
      'Some homes have two heating units — for example, one per floor. Most homes only have one.',
  },
  {
    id: 'second-furnace-photo',
    progressLabel: '',
    type: 'photo',
    photoKey: 'second-furnace',
    title: 'Second Furnace',
    subtitle: 'Take a wide shot of your second furnace or air handler, similar to the first.',
    required: true,
  },
  {
    id: 'electrical-panel',
    progressLabel: 'Electrical',
    type: 'photo',
    photoKey: 'electrical-panel',
    title: 'Your Electrical Panel',
    subtitle:
      'Open the panel door and take a photo showing all the breakers and their labels. This helps us determine if your panel can support a heat pump.',
    hint: 'Tip: Your main electrical panel is usually in the basement, garage, or a hallway closet.',
    required: true,
  },
  {
    id: 'main-breaker',
    progressLabel: 'Breaker',
    type: 'photo',
    photoKey: 'main-breaker',
    title: 'Main Breaker Close-Up',
    subtitle:
      'Take a close-up of the main breaker switch at the top (or bottom) of your panel. We need to see the amperage number — it usually says 100A, 150A, or 200A.',
    hint: 'Tip: The main breaker is the largest switch and is usually at the very top of the panel.',
    required: true,
  },
  {
    id: 'sub-panel-q',
    progressLabel: '',
    type: 'yes-no',
    title: 'Do you have any additional electrical sub-panels?',
    subtitle:
      'Some homes have a second panel in the garage, an addition, or near the AC unit. If you\'re not sure, select No.',
  },
  {
    id: 'sub-panel-photo',
    progressLabel: '',
    type: 'photo',
    photoKey: 'sub-panel',
    title: 'Additional Panel',
    subtitle: 'Take a photo of the sub-panel with the door open, showing all breakers.',
    required: true,
  },
  {
    id: 'outdoor-unit',
    progressLabel: 'Outdoor',
    type: 'photo',
    photoKey: 'outdoor-unit',
    title: 'Outdoor Unit or Installation Location',
    subtitle:
      'If you have an existing AC or heat pump outside, take a photo of it. If not, take a photo of where you\'d like the new outdoor unit installed.',
    hint: 'Tip: We need to see the area around the unit too — clearance, surface, and access.',
    required: true,
  },
  {
    id: 'ac-nameplate',
    progressLabel: 'Nameplate',
    type: 'photo',
    photoKey: 'ac-nameplate',
    title: 'AC / Heat Pump Nameplate',
    subtitle:
      'If you have an outdoor unit, take a close-up of the nameplate sticker on its side. This shows the model number and capacity. Skip this if you don\'t have an outdoor unit.',
    hint: 'Tip: The nameplate is usually a silver or white sticker on the side or back of the unit.',
    required: false,
  },
  {
    id: 'additional',
    progressLabel: 'Extras',
    type: 'additional',
    title: 'Anything Else?',
    subtitle:
      'If there\'s anything else you think would help us understand your setup — unusual wiring, a tight space, damage, or anything you want us to see — upload it here. This is completely optional.',
  },
  {
    id: 'done',
    progressLabel: 'Done',
    type: 'done',
    title: 'Photos Submitted!',
    subtitle:
      'Thank you! Our team will review your photos and finalize your system design. We\'ll reach out within 1 business day with your confirmed price.',
  },
];

// ─── Component ───────────────────────────────────────────

const SubmitPhotos: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [photos, setPhotos] = useState<Record<string, File>>({});
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, 'idle' | 'uploading' | 'success' | 'error'>>({});
  const [yesNoAnswers, setYesNoAnswers] = useState<Record<string, boolean | undefined>>({});
  const [additionalPhotos, setAdditionalPhotos] = useState<File[]>([]);
  const [additionalStatuses, setAdditionalStatuses] = useState<('idle' | 'uploading' | 'success' | 'error')[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const step = STEPS[currentStep];

  // Progress bar: only show steps with a label
  const visibleSteps = useMemo(() => STEPS.filter((s) => s.progressLabel), []);
  const currentVisibleIndex = useMemo(() => {
    // Find the closest visible step at or before currentStep
    for (let i = currentStep; i >= 0; i--) {
      const idx = visibleSteps.findIndex((v) => v.id === STEPS[i].id);
      if (idx !== -1) return idx;
    }
    return 0;
  }, [currentStep, visibleSteps]);

  // ─── Upload logic ───
  const uploadPhoto = async (photoKey: string, file: File) => {
    if (!leadId) return;
    setUploadStatuses((prev) => ({ ...prev, [photoKey]: 'uploading' }));

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('photoKey', photoKey);

    try {
      const res = await fetch(`/api/leads/${leadId}/photos`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setUploadStatuses((prev) => ({ ...prev, [photoKey]: 'success' }));
      } else {
        setUploadStatuses((prev) => ({ ...prev, [photoKey]: 'error' }));
      }
    } catch {
      setUploadStatuses((prev) => ({ ...prev, [photoKey]: 'error' }));
    }
  };

  const handleFileSelected = (photoKey: string, file: File) => {
    setPhotos((prev) => ({ ...prev, [photoKey]: file }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[photoKey];
      return next;
    });
    uploadPhoto(photoKey, file);
  };

  const handleFileClear = (photoKey: string) => {
    setPhotos((prev) => {
      const next = { ...prev };
      delete next[photoKey];
      return next;
    });
    setUploadStatuses((prev) => ({ ...prev, [photoKey]: 'idle' }));
  };

  // ─── Additional photos ───
  const handleAdditionalFile = (index: number, file: File) => {
    if (!leadId) return;
    const updated = [...additionalPhotos];
    updated[index] = file;
    setAdditionalPhotos(updated);

    const statuses = [...additionalStatuses];
    statuses[index] = 'uploading';
    setAdditionalStatuses(statuses);

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('photoKey', `additional-${index}`);

    fetch(`/api/leads/${leadId}/photos`, { method: 'POST', body: formData })
      .then((res) => {
        const s = [...additionalStatuses];
        s[index] = res.ok ? 'success' : 'error';
        setAdditionalStatuses(s);
      })
      .catch(() => {
        const s = [...additionalStatuses];
        s[index] = 'error';
        setAdditionalStatuses(s);
      });
  };

  const addAdditionalSlot = () => {
    setAdditionalPhotos((prev) => [...prev, undefined as any]);
    setAdditionalStatuses((prev) => [...prev, 'idle']);
  };

  // ─── Navigation ───
  const handleNext = () => {
    setErrors({});

    // Validate photo steps
    if (step.type === 'photo' && step.required && !photos[step.photoKey!]) {
      setErrors({ [step.photoKey!]: 'Please upload a photo to continue' });
      return;
    }

    // Validate yes/no steps
    if (step.type === 'yes-no') {
      if (yesNoAnswers[step.id] === undefined) {
        setErrors({ [step.id]: 'Please select an option' });
        return;
      }
      // If "No", skip the conditional photo step that follows
      if (!yesNoAnswers[step.id]) {
        setCurrentStep((prev) => prev + 2);
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    const prevIdx = currentStep - 1;
    if (prevIdx < 0) return;

    // If stepping back over a conditional photo step where user said "No", skip it
    const prevStep = STEPS[prevIdx];
    if (prevStep.type === 'photo' && prevIdx > 0) {
      const questionStep = STEPS[prevIdx - 1];
      if (questionStep.type === 'yes-no' && !yesNoAnswers[questionStep.id]) {
        setCurrentStep(prevIdx - 1);
        return;
      }
    }

    setCurrentStep(prevIdx);
  };

  // ─── Renderers ───

  const renderIntro = () => (
    <div className="wizard-step">
      <h2 className="wizard-step__title">{step.title}</h2>
      <p className="wizard-step__subtitle">{step.subtitle}</p>

      <div className="sp-time-estimate">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        About 5 minutes
      </div>

      <div className="sp-checklist">
        <h3 className="wizard-section__title">What you'll need to photograph:</h3>
        {[
          { label: 'Furnace / Mechanical Room', desc: 'A wide shot of your heating equipment' },
          { label: 'Electrical Panel', desc: 'Open the door so we can see the breakers' },
          { label: 'Main Breaker', desc: 'A close-up showing the amperage number' },
          { label: 'Outdoor AC Unit', desc: 'Or the spot where you\'d like one installed' },
        ].map((item) => (
          <div key={item.label} className="sp-checklist-item">
            <span className="sp-checklist-icon">&#10003;</span>
            <div>
              <strong>{item.label}</strong>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPhotoStep = () => (
    <div className="wizard-step">
      <h2 className="wizard-step__title">{step.title}</h2>
      {step.subtitle && <p className="wizard-step__subtitle">{step.subtitle}</p>}
      <PhotoUpload
        photoKey={step.photoKey!}
        label={step.required ? 'Upload Photo' : 'Upload Photo (Optional)'}
        hint={step.hint}
        required={step.required}
        onFileSelected={handleFileSelected}
        onFileClear={handleFileClear}
        currentFile={photos[step.photoKey!] || null}
        uploadStatus={uploadStatuses[step.photoKey!] || 'idle'}
        errorMessage={errors[step.photoKey!]}
      />
    </div>
  );

  const renderYesNo = () => (
    <div className="wizard-step">
      <h2 className="wizard-step__title">{step.title}</h2>
      {step.subtitle && <p className="wizard-step__subtitle">{step.subtitle}</p>}
      {errors[step.id] && <span className="wizard-error">{errors[step.id]}</span>}
      <div className="wizard-option-row">
        {[
          { value: true, label: 'Yes' },
          { value: false, label: 'No' },
        ].map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            className={`wizard-option-btn ${yesNoAnswers[step.id] === opt.value ? 'wizard-option-btn--active' : ''}`}
            onClick={() => {
              setYesNoAnswers((prev) => ({ ...prev, [step.id]: opt.value }));
              setErrors((prev) => {
                const next = { ...prev };
                delete next[step.id];
                return next;
              });
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderAdditional = () => (
    <div className="wizard-step">
      <h2 className="wizard-step__title">{step.title}</h2>
      {step.subtitle && <p className="wizard-step__subtitle">{step.subtitle}</p>}
      {additionalPhotos.map((file, idx) => (
        <PhotoUpload
          key={idx}
          photoKey={`additional-${idx}`}
          label={`Additional Photo ${idx + 1}`}
          onFileSelected={(_key, f) => handleAdditionalFile(idx, f)}
          onFileClear={() => {
            const updated = [...additionalPhotos];
            updated.splice(idx, 1);
            setAdditionalPhotos(updated);
            const statuses = [...additionalStatuses];
            statuses.splice(idx, 1);
            setAdditionalStatuses(statuses);
          }}
          currentFile={file || null}
          uploadStatus={additionalStatuses[idx] || 'idle'}
        />
      ))}
      <button type="button" className="sp-add-photo-btn" onClick={addAdditionalSlot}>
        + Add a Photo
      </button>
    </div>
  );

  const renderDone = () => (
    <div className="wizard-step wizard-step--centered">
      <div className="sp-done-icon">&#10003;</div>
      <h2 className="wizard-step__title">{step.title}</h2>
      <p className="wizard-step__subtitle">{step.subtitle}</p>
      <div className="sp-done-summary">
        <strong>{Object.keys(photos).length + additionalPhotos.filter(Boolean).length} photos submitted</strong>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step.type) {
      case 'intro': return renderIntro();
      case 'photo': return renderPhotoStep();
      case 'yes-no': return renderYesNo();
      case 'additional': return renderAdditional();
      case 'done': return renderDone();
      default: return null;
    }
  };

  // ─── Main render ───
  return (
    <div className="wizard">
      {/* Progress Bar */}
      <div className="wizard-progress">
        <div className="wizard-progress__inner">
          {visibleSteps.map((vs, i) => {
            const isActive = i === currentVisibleIndex;
            const isCompleted = i < currentVisibleIndex;
            return (
              <div
                key={vs.id}
                className={`wizard-progress__step ${isActive ? 'wizard-progress__step--active' : ''} ${isCompleted ? 'wizard-progress__step--completed' : ''}`}
              >
                <div className="wizard-progress__dot">
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span className="wizard-progress__label">{vs.progressLabel}</span>
                {i < visibleSteps.length - 1 && <div className="wizard-progress__line" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="wizard-content">
        <div className="wizard-card">
          {renderCurrentStep()}
        </div>
      </div>

      {/* Navigation */}
      {step.type !== 'done' && (
        <div className="wizard-nav">
          <div className="wizard-nav__inner">
            {currentStep > 0 ? (
              <button type="button" className="btn btn--secondary" onClick={handleBack}>
                Back
              </button>
            ) : (
              <div />
            )}
            <button type="button" className="btn btn--primary btn--lg" onClick={handleNext}>
              {step.type === 'intro' ? 'Get Started' : currentStep === STEPS.length - 2 ? 'Finish' : 'Continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitPhotos;
