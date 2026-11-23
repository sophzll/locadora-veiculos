import type { ChangeEvent } from "react";

interface InputProps {
  label: string;
  name: string;
  type?: "text" | "number" | "date" | "datetime-local" | "email" | "tel";
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  min?: number | string;
  step?: number | string;
}

export function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  disabled,
  required,
  min,
  step,
}: InputProps) {
  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className={`form-control${error ? " is-invalid" : ""}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        min={min}
        step={step}
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
