import React, { useRef, useState } from 'react';
import './PhotoUpload.css';

export interface PhotoUploadProps {
  photoKey: string;
  label: string;
  hint?: string;
  required?: boolean;
  onFileSelected: (photoKey: string, file: File) => void;
  onFileClear: (photoKey: string) => void;
  currentFile?: File | null;
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  photoKey,
  label,
  hint,
  required = false,
  onFileSelected,
  onFileClear,
  currentFile,
  uploadStatus = 'idle',
  errorMessage,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(photoKey, file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClear = () => {
    onFileClear(photoKey);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleTriggerInput = () => {
    inputRef.current?.click();
  };

  return (
    <div className="photo-upload">
      <div className="photo-upload__label">
        {label}
        {required && <span className="photo-upload__required">*</span>}
      </div>
      {hint && <p className="photo-upload__hint">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="photo-upload__input"
        aria-label={label}
      />

      {previewUrl || currentFile ? (
        <div className="photo-upload__preview">
          {previewUrl && <img src={previewUrl} alt={`Preview: ${label}`} />}
          <div className="photo-upload__preview-actions">
            {uploadStatus === 'success' && (
              <span className="photo-upload__status photo-upload__status--success">
                &#10003; Uploaded
              </span>
            )}
            {uploadStatus === 'uploading' && (
              <span className="photo-upload__status photo-upload__status--uploading">
                Uploading...
              </span>
            )}
            {uploadStatus === 'error' && (
              <span className="photo-upload__status photo-upload__status--error">
                Upload failed - try again
              </span>
            )}
            {uploadStatus === 'idle' && <span />}
            <button
              type="button"
              className="photo-upload__retake-btn"
              onClick={handleClear}
            >
              Retake
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="photo-upload__drop-zone"
          onClick={handleTriggerInput}
        >
          <div className="photo-upload__drop-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="12" width="40" height="28" rx="4"
                stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="24" cy="26" r="8" stroke="currentColor"
                strokeWidth="2" fill="none" />
              <path d="M16 12l2-4h12l2 4" stroke="currentColor"
                strokeWidth="2" fill="none" />
            </svg>
          </div>
          <span className="photo-upload__drop-text">
            Tap to take a photo or choose from library
          </span>
        </button>
      )}

      {errorMessage && (
        <span className="wizard-error">{errorMessage}</span>
      )}
    </div>
  );
};

export default PhotoUpload;
