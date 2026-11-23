import type { ChangeEvent } from "react";

interface TextAreaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function TextArea({
  label,
  name,
  value,
  onChange,
  rows = 3,
  placeholder,
  error,
  disabled,
}: TextAreaProps) {
  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        className={`form-control${error ? " is-invalid" : ""}`}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
