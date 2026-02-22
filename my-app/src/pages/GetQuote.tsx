import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SatelliteViewImage from '../modules/StreetViewImage';
import './GetQuote.css';

// ─── Types ───────────────────────────────────────────────

interface PropertyData {
  id?: string;
  formattedAddress: string;
  addressLine1?: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: string;
  features?: Record<string, any>;
  [key: string]: any;
}

interface HVACPrediction {
  numberOfODU: number;
  typeOfODU: string;
  oduSize: string;
  numberOfIDU: number;
  typeOfIDU: string;
  iduSize: string;
  electricalWorkEstimate?: number;
  hvacWorkEstimate?: number;
  confidence?: string;
  reasoning?: string;
}

interface FormData {
  address: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  corrections: string;
  hasAttic: string;
  basementType: string;
  hasDuctwork: string;
  numberOfFloors: string;
  ownershipStatus: string;
  currentHeating: string;
  installationTimeline: string;
  electricityProvider: string;
  gasProvider: string;
}

// ─── Helpers ─────────────────────────────────────────────

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const TOTAL_STEPS = 7;

const STEP_LABELS = [
  'Address',
  'Contact',
  'Your Home',
  'Details',
  'Utilities',
  'Overview',
  'Your Quote',
];

// ─── Component ───────────────────────────────────────────

const GetQuote: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    address: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    corrections: '',
    hasAttic: '',
    basementType: '',
    hasDuctwork: '',
    numberOfFloors: '',
    ownershipStatus: '',
    currentHeating: '',
    installationTimeline: '',
    electricityProvider: '',
    gasProvider: '',
  });
  const [leadId, setLeadId] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [prediction, setPrediction] = useState<HVACPrediction | null>(null);
  const [ductlessPrediction, setDuctlessPrediction] = useState<HVACPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Field update helper ───
  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ─── Validation ───
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.address.trim()) newErrors.address = 'Please enter your address';
    } else if (step === 2) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!isValidEmail(formData.email)) newErrors.email = 'Please enter a valid email';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      else if (formData.phone.replace(/\D/g, '').length < 10)
        newErrors.phone = 'Please enter a valid phone number';
    } else if (step === 3) {
      if (!formData.hasAttic) newErrors.hasAttic = 'Please select one';
      if (!formData.basementType) newErrors.basementType = 'Please select one';
      if (!formData.hasDuctwork) newErrors.hasDuctwork = 'Please select one';
      if (!formData.numberOfFloors) newErrors.numberOfFloors = 'Please select one';
    } else if (step === 4) {
      if (!formData.ownershipStatus) newErrors.ownershipStatus = 'Please select one';
      if (!formData.currentHeating) newErrors.currentHeating = 'Please select your heating source';
      if (!formData.installationTimeline) newErrors.installationTimeline = 'Please select a timeline';
    } else if (step === 5) {
      if (!formData.electricityProvider) newErrors.electricityProvider = 'Please select your electricity provider';
      if (!formData.gasProvider) newErrors.gasProvider = 'Please select your gas provider';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Create lead + fetch property data ───
  const createLeadAndFetchProperty = async () => {
    setLoading(true);
    setLoadingMessage('Looking up your address...');

    const messages = [
      'Looking up your address...',
      'Analyzing square footage...',
      'Checking property records...',
      'Preparing your home profile...',
    ];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < messages.length) {
        setLoadingMessage(messages[i]);
      }
    }, 1200);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: formData.address,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLeadId(data.lead.id);
        if (data.propertyData) {
          setPropertyData(data.propertyData);
        }
      } else {
        console.error('Create lead error:', data);
      }
    } catch (err) {
      console.error('Network error:', err);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  // ─── Patch lead with partial data ───
  const patchLead = async (fields: Record<string, string>) => {
    if (!leadId) return;
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
    } catch (err) {
      console.error('Patch lead error:', err);
    }
  };

  // ─── Fetch HVAC prediction via lead endpoint ───
  const fetchPrediction = async () => {
    if (!leadId) return;

    setLoading(true);
    setDuctlessPrediction(null);
    setLoadingMessage('Designing your system...');

    const noDucts = formData.hasDuctwork === 'no';

    const messages = !noDucts
      ? [
          'Designing your system...',
          'Evaluating ducted option...',
          'Evaluating ductless option...',
          'Comparing configurations...',
          'Preparing your quote...',
        ]
      : [
          'Designing your system...',
          'Calculating equipment needs...',
          'Estimating costs and rebates...',
          'Preparing your quote...',
        ];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < messages.length) {
        setLoadingMessage(messages[i]);
      }
    }, 2000);

    try {
      const res = await fetch(`/api/leads/${leadId}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (res.ok && data.predictions) {
        const ducted = data.predictions.find((p: any) => p.variant === 'ducted');
        const ductless = data.predictions.find((p: any) => p.variant === 'ductless');

        if (ducted) setPrediction(ducted);
        else if (ductless) setPrediction(ductless);

        if (ducted && ductless) setDuctlessPrediction(ductless);
      } else {
        console.error('Prediction error:', data);
      }
    } catch (err) {
      console.error('Network error:', err);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  // ─── Navigation ───
  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Create lead in DB + fetch property data from RentCast
      setCurrentStep(3);
      await createLeadAndFetchProperty();
    } else if (currentStep === 3) {
      // Save survey data to lead
      await patchLead({
        hasAttic: formData.hasAttic,
        basementType: formData.basementType,
        hasDuctwork: formData.hasDuctwork,
        numberOfFloors: formData.numberOfFloors,
        corrections: formData.corrections,
        status: 'survey_done',
      });
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Save details to lead
      await patchLead({
        ownershipStatus: formData.ownershipStatus,
        currentHeating: formData.currentHeating,
        installationTimeline: formData.installationTimeline,
      });
      setCurrentStep(5);
    } else if (currentStep === 5) {
      // Save utilities to lead
      await patchLead({
        electricityProvider: formData.electricityProvider,
        gasProvider: formData.gasProvider,
      });
      setCurrentStep(6);
    } else if (currentStep === 6) {
      // Fetch prediction via lead endpoint
      setCurrentStep(7);
      await fetchPrediction();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // ─── Generate pricing from prediction ───
  const getPricing = (pred?: HVACPrediction | null) => {
    const p = pred ?? prediction;
    const electrical = p?.electricalWorkEstimate || 1200;
    const hvacWork = p?.hvacWorkEstimate || 4500;
    const permits = 450;
    const subtotal = electrical + hvacWork + permits;
    const rebate = subtotal > 6000 ? 3500 : 2500;
    const total = subtotal - rebate;
    return { electrical, hvacWork, permits, subtotal, rebate, total };
  };

  // ─── Render Steps ─────────────────────────────────────

  const renderStep1 = () => (
    <div className="wizard-step">
      <h2 className="wizard-step__title">Get Your Instant Quote</h2>
      <p className="wizard-step__subtitle">
        Enter your home address and we'll analyze your property to design the perfect heat pump system.
      </p>
      <div className="wizard-step__value-props">
        <div className="value-prop-item">
          <span className="value-prop-icon">&#10003;</span>
          <span>Find your rebates and incentives</span>
        </div>
        <div className="value-prop-item">
          <span className="value-prop-icon">&#10003;</span>
          <span>See a system tailored for your home</span>
        </div>
        <div className="value-prop-item">
          <span className="value-prop-icon">&#10003;</span>
          <span>Get your free, all-inclusive price</span>
        </div>
      </div>
      <div className="wizard-form-group">
        <label className="wizard-label">Home Address</label>
        <input
          type="text"
          className={`wizard-input wizard-input--lg ${errors.address ? 'wizard-input--error' : ''}`}
          placeholder="e.g., 66 Allen St, Lexington, MA 02421"
          value={formData.address}
          onChange={(e) => updateField('address', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleNext()}
          autoFocus
        />
        {errors.address && <span className="wizard-error">{errors.address}</span>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="wizard-step">
      <h2 className="wizard-step__title">Contact Information</h2>
      <p className="wizard-step__subtitle">Tell us how to reach you with your quote details.</p>

      <div className="wizard-form-row">
        <div className="wizard-form-group">
          <label className="wizard-label">First Name</label>
          <input
            type="text"
            className={`wizard-input ${errors.firstName ? 'wizard-input--error' : ''}`}
            placeholder="First name"
            value={formData.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            autoFocus
          />
          {errors.firstName && <span className="wizard-error">{errors.firstName}</span>}
        </div>
        <div className="wizard-form-group">
          <label className="wizard-label">Last Name</label>
          <input
            type="text"
            className={`wizard-input ${errors.lastName ? 'wizard-input--error' : ''}`}
            placeholder="Last name"
            value={formData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
          />
          {errors.lastName && <span className="wizard-error">{errors.lastName}</span>}
        </div>
      </div>
      <div className="wizard-form-group">
        <label className="wizard-label">Email Address</label>
        <input
          type="email"
          className={`wizard-input ${errors.email ? 'wizard-input--error' : ''}`}
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
        />
        {errors.email && <span className="wizard-error">{errors.email}</span>}
      </div>
      <div className="wizard-form-group">
        <label className="wizard-label">Phone Number</label>
        <input
          type="tel"
          className={`wizard-input ${errors.phone ? 'wizard-input--error' : ''}`}
          placeholder="(555) 123-4567"
          value={formData.phone}
          onChange={(e) => updateField('phone', formatPhone(e.target.value))}
        />
        {errors.phone && <span className="wizard-error">{errors.phone}</span>}
      </div>
    </div>
  );

  const renderStep3 = () => {
    if (loading) {
      return (
        <div className="wizard-step wizard-step--centered">
          <div className="wizard-loading">
            <div className="wizard-loading__house">
              <div className="wizard-loading__house-icon">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <path d="M40 10L8 35V70H30V50H50V70H72V35L40 10Z" fill="var(--color-gray-100)" stroke="var(--color-accent)" strokeWidth="2" />
                  <path className="wizard-loading__fill" d="M40 10L8 35V70H30V50H50V70H72V35L40 10Z" fill="var(--color-accent)" opacity="0.15" />
                  <rect x="34" y="25" width="12" height="12" rx="2" fill="var(--color-accent)" opacity="0.4" />
                </svg>
              </div>
              <div className="wizard-loading__spinner" />
            </div>
            <p className="wizard-loading__text">{loadingMessage}</p>
          </div>
        </div>
      );
    }

    if (!propertyData) {
      return (
        <div className="wizard-step wizard-step--centered">
          <p>Unable to load property data. Please go back and try again.</p>
        </div>
      );
    }

    return (
      <div className="wizard-step">
        <h2 className="wizard-step__title">Your Home</h2>
        <p className="wizard-step__subtitle">
          We found the following information about your property. Please verify the details below.
        </p>

        {propertyData.latitude && propertyData.longitude && (
          <div className="wizard-satellite">
            <SatelliteViewImage
              latitude={propertyData.latitude}
              longitude={propertyData.longitude}
              width={560}
              height={280}
              zoom={18}
              mapType="satellite"
            />
          </div>
        )}

        {/* Property data from RentCast */}
        <div className="wizard-property-grid">
          <div className="wizard-property-field">
            <span className="wizard-property-label">Address</span>
            <span className="wizard-property-value">{propertyData.formattedAddress}</span>
          </div>
          <div className="wizard-property-field">
            <span className="wizard-property-label">Property Type</span>
            <span className="wizard-property-value">{propertyData.propertyType || 'N/A'}</span>
          </div>
          <div className="wizard-property-field">
            <span className="wizard-property-label">Year Built</span>
            <span className="wizard-property-value">{propertyData.yearBuilt || 'N/A'}</span>
          </div>
          <div className="wizard-property-field">
            <span className="wizard-property-label">Square Footage</span>
            <span className="wizard-property-value">{propertyData.squareFootage?.toLocaleString() || 'N/A'} sq ft</span>
          </div>
          <div className="wizard-property-field">
            <span className="wizard-property-label">Bedrooms</span>
            <span className="wizard-property-value">{propertyData.bedrooms || 'N/A'}</span>
          </div>
          <div className="wizard-property-field">
            <span className="wizard-property-label">Bathrooms</span>
            <span className="wizard-property-value">{propertyData.bathrooms || 'N/A'}</span>
          </div>
          <div className="wizard-property-field">
            <span className="wizard-property-label">Floors</span>
            <span className="wizard-property-value">{propertyData.features?.stories || 'Unknown'}</span>
          </div>
          {propertyData.features?.heatingType && (
            <div className="wizard-property-field">
              <span className="wizard-property-label">Current Heating</span>
              <span className="wizard-property-value">{propertyData.features.heatingType}</span>
            </div>
          )}
        </div>

        {/* Corrections */}
        <div className="wizard-section">
          <h3 className="wizard-section__title">Is the above information correct?</h3>
          <p className="wizard-section__hint">If not, please let us know what needs to be corrected.</p>
          <textarea
            className="wizard-textarea"
            placeholder="e.g., Square footage is actually 2,100 sq ft, we have 3 bedrooms not 4..."
            value={formData.corrections}
            onChange={(e) => updateField('corrections', e.target.value)}
            rows={3}
          />
        </div>

        {/* Attic */}
        <div className="wizard-section">
          <h3 className="wizard-section__title">Do you have an attic?</h3>
          {errors.hasAttic && <span className="wizard-error">{errors.hasAttic}</span>}
          <div className="wizard-option-row">
            {['yes', 'no'].map((opt) => (
              <button
                key={opt}
                type="button"
                className={`wizard-option-btn ${formData.hasAttic === opt ? 'wizard-option-btn--active' : ''}`}
                onClick={() => updateField('hasAttic', opt)}
              >
                {opt === 'yes' ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>

        {/* Basement / Crawlspace */}
        <div className="wizard-section">
          <h3 className="wizard-section__title">Do you have a basement or crawlspace?</h3>
          {errors.basementType && <span className="wizard-error">{errors.basementType}</span>}
          <div className="wizard-option-grid">
            {[
              { value: 'none', label: 'None' },
              { value: 'unfinished', label: 'Unfinished Basement' },
              { value: 'finished', label: 'Finished Basement' },
              { value: 'crawlspace', label: 'Crawlspace' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`wizard-option-btn ${formData.basementType === opt.value ? 'wizard-option-btn--active' : ''}`}
                onClick={() => updateField('basementType', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ductwork */}
        <div className="wizard-section">
          <h3 className="wizard-section__title">Do you have existing ductwork?</h3>
          <p className="wizard-section__hint">This helps us determine whether a ducted or ductless (mini-split) system is best for your home.</p>
          {errors.hasDuctwork && <span className="wizard-error">{errors.hasDuctwork}</span>}
          <div className="wizard-option-row">
            {[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'not-sure', label: "I'm Not Sure" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`wizard-option-btn ${formData.hasDuctwork === opt.value ? 'wizard-option-btn--active' : ''}`}
                onClick={() => updateField('hasDuctwork', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Number of Floors */}
        <div className="wizard-section">
          <h3 className="wizard-section__title">How many floors does your home have?</h3>
          {errors.numberOfFloors && <span className="wizard-error">{errors.numberOfFloors}</span>}
          <div className="wizard-option-row">
            {[
              { value: '1', label: '1' },
              { value: '2', label: '2' },
              { value: '3+', label: '3+' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`wizard-option-btn ${formData.numberOfFloors === opt.value ? 'wizard-option-btn--active' : ''}`}
                onClick={() => updateField('numberOfFloors', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="wizard-step">
      <h2 className="wizard-step__title">Tell Us About Your Home</h2>
      <p className="wizard-step__subtitle">A few more details help us design the right system for you.</p>

      <div className="wizard-section">
        <h3 className="wizard-section__title">Do you own or rent?</h3>
        {errors.ownershipStatus && <span className="wizard-error">{errors.ownershipStatus}</span>}
        <div className="wizard-option-row">
          {['own', 'rent'].map((opt) => (
            <button
              key={opt}
              type="button" className={`wizard-option-btn ${formData.ownershipStatus === opt ? 'wizard-option-btn--active' : ''}`}
              onClick={() => updateField('ownershipStatus', opt)}
            >
              {opt === 'own' ? 'Own' : 'Rent'}
            </button>
          ))}
        </div>
      </div>

      <div className="wizard-section">
        <h3 className="wizard-section__title">What is your current heating source?</h3>
        {errors.currentHeating && <span className="wizard-error">{errors.currentHeating}</span>}
        <div className="wizard-option-grid">
          {[
            { value: 'gas-furnace', label: 'Gas Furnace' },
            { value: 'electric-furnace', label: 'Electric Furnace' },
            { value: 'oil-furnace', label: 'Heating Oil Furnace' },
            { value: 'electric-baseboard', label: 'Electric Baseboard' },
            { value: 'heat-pump', label: 'Heat Pump' },
            { value: 'radiant', label: 'Radiant In-Floor' },
            { value: 'other', label: 'Other' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button" className={`wizard-option-btn ${formData.currentHeating === opt.value ? 'wizard-option-btn--active' : ''}`}
              onClick={() => updateField('currentHeating', opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="wizard-section">
        <h3 className="wizard-section__title">When are you looking to install?</h3>
        {errors.installationTimeline && <span className="wizard-error">{errors.installationTimeline}</span>}
        <div className="wizard-option-grid wizard-option-grid--2x2">
          {[
            { value: 'asap', label: 'ASAP / Urgent' },
            { value: 'this-month', label: 'This Month' },
            { value: 'this-year', label: 'This Year' },
            { value: 'just-curious', label: 'Just Curious' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button" className={`wizard-option-btn ${formData.installationTimeline === opt.value ? 'wizard-option-btn--active' : ''}`}
              onClick={() => updateField('installationTimeline', opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="wizard-step">
      <h2 className="wizard-step__title">Your Utility Providers</h2>
      <p className="wizard-step__subtitle">
        This helps us calculate your available rebates and incentives.
      </p>

      <div className="wizard-section">
        <h3 className="wizard-section__title">Electricity Provider</h3>
        {errors.electricityProvider && <span className="wizard-error">{errors.electricityProvider}</span>}
        <div className="wizard-option-grid">
          {[
            'Cape Light Compact',
            'Eversource',
            'National Grid',
            'Unitil',
            'Other',
            'I generate my own',
          ].map((opt) => (
            <button
              key={opt}
              type="button" className={`wizard-option-btn ${formData.electricityProvider === opt ? 'wizard-option-btn--active' : ''}`}
              onClick={() => updateField('electricityProvider', opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="wizard-section">
        <h3 className="wizard-section__title">Gas Provider</h3>
        {errors.gasProvider && <span className="wizard-error">{errors.gasProvider}</span>}
        <div className="wizard-option-grid">
          {[
            'Berkshire Gas',
            'Eversource',
            'Liberty Utilities',
            'National Grid',
            'Unitil',
            'Other',
            "I don't have natural gas",
          ].map((opt) => (
            <button
              key={opt}
              type="button" className={`wizard-option-btn ${formData.gasProvider === opt ? 'wizard-option-btn--active' : ''}`}
              onClick={() => updateField('gasProvider', opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="wizard-step">
      <h2 className="wizard-step__title">What's Included</h2>
      <p className="wizard-step__subtitle">
        Every Hanson installation comes with everything you need - no hidden fees.
      </p>

      <div className="wizard-included-card">
        <div className="wizard-included-list">
          {[
            'Professional system design and sizing',
            'All equipment and materials',
            'Complete installation by certified technicians',
            'Electrical panel upgrades (if needed)',
            'Permits and inspections',
            'Rebate and incentive application assistance',
            'System commissioning and testing',
            'Homeowner training on your new system',
          ].map((item) => (
            <div key={item} className="wizard-included-item">
              <span className="wizard-included-check">&#10003;</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="wizard-guarantee">
        <h3 className="wizard-guarantee__title">Worry-Free Performance, Guaranteed</h3>
        <p className="wizard-guarantee__text">
          Every installation includes our performance guarantee. If your system doesn't deliver the comfort and savings we promise, we'll make it right.
        </p>
        <div className="wizard-trust-badges">
          <div className="wizard-trust-badge">
            <strong>Mass Save</strong>
            <span>Partner</span>
          </div>
          <div className="wizard-trust-badge">
            <strong>Licensed</strong>
            <span>& Insured</span>
          </div>
          <div className="wizard-trust-badge">
            <strong>5-Star</strong>
            <span>Rated</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemCard = (pred: HVACPrediction, label: string, isDucted: boolean) => {
    const pricing = getPricing(pred);
    return (
      <div className={`quote-option-card ${isDucted ? 'quote-option-card--ducted' : 'quote-option-card--ductless'}`}>
        <div className="quote-option-header">
          <h3>{label}</h3>
          <span className="quote-option-type">{isDucted ? 'Central Air Handler' : 'Mini-Split Heads'}</span>
        </div>
        <div className="quote-system-grid">
          <div className="quote-system-field">
            <span className="quote-system-label">Outdoor Units</span>
            <span className="quote-system-value">
              {pred.numberOfODU}x {pred.typeOfODU} ({pred.oduSize}k BTU)
            </span>
          </div>
          <div className="quote-system-field">
            <span className="quote-system-label">Indoor Units</span>
            <span className="quote-system-value">
              {pred.numberOfIDU}x {pred.typeOfIDU} ({pred.iduSize}k BTU)
            </span>
          </div>
          {pred.confidence && (
            <div className="quote-system-field">
              <span className="quote-system-label">Confidence</span>
              <span className={`quote-confidence quote-confidence--${pred.confidence}`}>
                {pred.confidence}
              </span>
            </div>
          )}
        </div>
        {pred.reasoning && (
          <div className="quote-reasoning">
            <strong>Design Notes:</strong> {pred.reasoning}
          </div>
        )}
        <div className="quote-pricing-rows">
          <div className="quote-pricing-row">
            <span>HVAC Equipment & Installation</span>
            <span>${pricing.hvacWork.toLocaleString()}</span>
          </div>
          <div className="quote-pricing-row">
            <span>Electrical Work</span>
            <span>${pricing.electrical.toLocaleString()}</span>
          </div>
          <div className="quote-pricing-row">
            <span>Permits & Inspections</span>
            <span>${pricing.permits.toLocaleString()}</span>
          </div>
          <div className="quote-pricing-row quote-pricing-row--subtotal">
            <span>Subtotal</span>
            <span>${pricing.subtotal.toLocaleString()}</span>
          </div>
          <div className="quote-pricing-row quote-pricing-row--rebate">
            <span>Estimated Rebates</span>
            <span>-${pricing.rebate.toLocaleString()}</span>
          </div>
          <div className="quote-pricing-row quote-pricing-row--total">
            <span>Estimated Total</span>
            <span>${pricing.total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderStep7 = () => {
    if (loading) {
      return (
        <div className="wizard-step wizard-step--centered">
          <div className="wizard-loading">
            <div className="wizard-loading__house">
              <div className="wizard-loading__house-icon">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <path d="M40 10L8 35V70H30V50H50V70H72V35L40 10Z" fill="var(--color-gray-100)" stroke="var(--color-accent)" strokeWidth="2" />
                  <path className="wizard-loading__fill" d="M40 10L8 35V70H30V50H50V70H72V35L40 10Z" fill="var(--color-accent)" opacity="0.15" />
                  <rect x="34" y="25" width="12" height="12" rx="2" fill="var(--color-accent)" opacity="0.4" />
                </svg>
              </div>
              <div className="wizard-loading__spinner" />
            </div>
            <p className="wizard-loading__text">{loadingMessage}</p>
          </div>
        </div>
      );
    }

    const hasDualOptions = ductlessPrediction !== null && prediction !== null;

    const pricing = getPricing();

    return (
      <div className="wizard-step wizard-step--quote">
        <h2 className="wizard-step__title">Your Hanson Quote</h2>
        <p className="wizard-step__subtitle quote-subtitle">
          This is your personalized price that includes available rebates for even greater savings.
        </p>

        {/* Profile + Expert Card */}
        <div className="quote-summary-grid">
          <div className="quote-profile-card">
            <h3>Your Profile</h3>
            <div className="quote-profile-detail">
              <span className="quote-profile-label">Name</span>
              <span>{formData.firstName} {formData.lastName}</span>
            </div>
            <div className="quote-profile-detail">
              <span className="quote-profile-label">Email</span>
              <span>{formData.email}</span>
            </div>
            <div className="quote-profile-detail">
              <span className="quote-profile-label">Phone</span>
              <span>{formData.phone}</span>
            </div>
            <div className="quote-profile-detail">
              <span className="quote-profile-label">Address</span>
              <span>{formData.address}</span>
            </div>
          </div>

          <div className="quote-expert-card">
            <h3>Talk to Hanson</h3>
            <div className="quote-expert-profile">
              <div className="quote-expert-avatar">
                <img src="/customer_support.png" alt="Jason" width="80" height="80" />
              </div>
              <div className="quote-expert-info">
                <strong>Jason</strong>
                <span className="quote-expert-title">HVAC Consultant</span>
                <span className="quote-expert-email">jason@hansonhome.us</span>
              </div>
            </div>
            <button type="button" className="btn btn--primary btn--block">
              Schedule a Virtual Meeting
            </button>
          </div>
        </div>

        {/* System Details */}
        {hasDualOptions ? (
          <>
            <p className="quote-options-intro">
              Since your home has existing ductwork, we've prepared two options for you to compare:
            </p>
            <div className="quote-options-grid">
              {renderSystemCard(prediction, 'Option A: Ducted System', true)}
              {renderSystemCard(ductlessPrediction, 'Option B: Ductless Mini-Split', false)}
            </div>
            <p className="quote-pricing-note quote-pricing-note--centered">
              Final pricing may vary based on site assessment. Rebate amounts depend on utility provider and eligibility.
            </p>
          </>
        ) : (
          <>
            {prediction && (
              <div className="quote-system-card">
                <h3>Your Recommended System</h3>
                <div className="quote-system-grid">
                  <div className="quote-system-field">
                    <span className="quote-system-label">Outdoor Units</span>
                    <span className="quote-system-value">
                      {prediction.numberOfODU}x {prediction.typeOfODU} ({prediction.oduSize}k BTU)
                    </span>
                  </div>
                  <div className="quote-system-field">
                    <span className="quote-system-label">Indoor Units</span>
                    <span className="quote-system-value">
                      {prediction.numberOfIDU}x {prediction.typeOfIDU} ({prediction.iduSize}k BTU)
                    </span>
                  </div>
                  {prediction.confidence && (
                    <div className="quote-system-field">
                      <span className="quote-system-label">Confidence</span>
                      <span className={`quote-confidence quote-confidence--${prediction.confidence}`}>
                        {prediction.confidence}
                      </span>
                    </div>
                  )}
                </div>
                {prediction.reasoning && (
                  <div className="quote-reasoning">
                    <strong>Design Notes:</strong> {prediction.reasoning}
                  </div>
                )}
              </div>
            )}

            <div className="quote-pricing-card">
              <h3>Pricing Breakdown</h3>
              <div className="quote-pricing-rows">
                <div className="quote-pricing-row">
                  <span>HVAC Equipment & Installation</span>
                  <span>${pricing.hvacWork.toLocaleString()}</span>
                </div>
                <div className="quote-pricing-row">
                  <span>Electrical Work</span>
                  <span>${pricing.electrical.toLocaleString()}</span>
                </div>
                <div className="quote-pricing-row">
                  <span>Permits & Inspections</span>
                  <span>${pricing.permits.toLocaleString()}</span>
                </div>
                <div className="quote-pricing-row quote-pricing-row--subtotal">
                  <span>Subtotal</span>
                  <span>${pricing.subtotal.toLocaleString()}</span>
                </div>
                <div className="quote-pricing-row quote-pricing-row--rebate">
                  <span>Estimated Rebates & Incentives</span>
                  <span>-${pricing.rebate.toLocaleString()}</span>
                </div>
                <div className="quote-pricing-row quote-pricing-row--total">
                  <span>Estimated Total</span>
                  <span>${pricing.total.toLocaleString()}</span>
                </div>
              </div>
              <p className="quote-pricing-note">
                Final pricing may vary based on site assessment. Rebate amounts depend on utility provider and eligibility.
              </p>
            </div>
          </>
        )}

        {/* What Happens Next - Timeline */}
        <div className="quote-timeline">
          <h3>What Happens Next</h3>
          <div className="quote-timeline-steps">
            {[
              { step: '1', title: 'Submit Photos', desc: 'Share photos of your current HVAC setup and home layout for our team to review.' },
              { step: '2', title: 'Review by Hanson', desc: 'Our engineers review your photos and finalize the system design for your home.' },
              { step: '3', title: 'Pay Initial Deposit', desc: 'A $500 deposit locks in your pricing and reserves your installation date.' },
              { step: '4', title: 'Schedule Your Install', desc: 'Pick a date that works for you. We handle permits and coordination.' },
              { step: '5', title: 'Single-Day Installation', desc: 'Our certified team installs your complete system in just one day.' },
            ].map((s, idx) => (
              <div key={s.step} className="quote-timeline-step">
                <div className="quote-timeline-marker">
                  <div className="quote-timeline-dot">{s.step}</div>
                  {idx < 4 && <div className="quote-timeline-line" />}
                </div>
                <div className="quote-timeline-content">
                  <strong>{s.title}</strong>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Price Highlight */}
        <div className="quote-total-highlight">
          <span className="quote-total-highlight__label">Your Estimated Total</span>
          <span className="quote-total-highlight__price">${pricing.total.toLocaleString()}</span>
          <span className="quote-total-highlight__note">After rebates & incentives</span>
        </div>

        {/* Payment Schedule */}
        <div className="quote-payment-schedule">
          <h3>Payment Schedule</h3>
          <div className="quote-payment-steps">
            <div className="quote-payment-step">
              <div className="quote-payment-step__header">
                <span className="quote-payment-step__label">Step 1 &mdash; Reserve</span>
                <span className="quote-payment-step__amount">$500</span>
              </div>
              <p className="quote-payment-step__desc">
                A refundable deposit locks in your pricing and installation date. Fully refundable within 7 days.
              </p>
            </div>
            <div className="quote-payment-step">
              <div className="quote-payment-step__header">
                <span className="quote-payment-step__label">Step 2 &mdash; Installation Day</span>
                <span className="quote-payment-step__amount">${(pricing.total - 500).toLocaleString()}</span>
              </div>
              <p className="quote-payment-step__desc">
                Final payment due on installation day. We'll confirm the exact amount after reviewing your photos.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Photos CTA */}
        <div className="quote-cta-section">
          <h3>Ready to get started?</h3>
          <p>Submit photos of your current setup and we'll finalize your price.</p>
          <Link to={leadId ? `/submit-photos/${leadId}` : '/submit-photos'} className="btn btn--primary btn--lg">Submit Photos for Final Price</Link>
        </div>
      </div>
    );
  };

  // ─── Step renderer ───
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      default: return null;
    }
  };

  // ─── Main render ───
  return (
    <div className="wizard">
      {/* Progress Indicator */}
      <div className="wizard-progress">
        <div className="wizard-progress__inner">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const step = i + 1;
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            return (
              <div
                key={step}
                className={`wizard-progress__step ${isActive ? 'wizard-progress__step--active' : ''} ${isCompleted ? 'wizard-progress__step--completed' : ''}`}
              >
                <div className="wizard-progress__dot">
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span>{step}</span>
                  )}
                </div>
                <span className="wizard-progress__label">{STEP_LABELS[i]}</span>
                {step < TOTAL_STEPS && <div className="wizard-progress__line" />}
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
      {!loading && (
        <div className="wizard-nav">
          <div className="wizard-nav__inner">
            {currentStep > 1 && currentStep < TOTAL_STEPS ? (
              <button type="button" className="btn btn--secondary" onClick={handleBack}>
                Back
              </button>
            ) : (
              <div />
            )}
            {currentStep < TOTAL_STEPS && (
              <button type="button" className="btn btn--primary btn--lg" onClick={handleNext}>
                {currentStep === 6 ? 'View Your Quote' : 'Continue'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GetQuote;
