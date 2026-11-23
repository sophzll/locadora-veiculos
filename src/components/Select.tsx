import type { ChangeEvent } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  name: string;
  value: string;
  options: SelectOption[];
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export function Select({
  label,
  name,
  value,
  options,
  onChange,
  placeholder = "Selecione...",
  error,
  disabled,
  required,
}: SelectProps) {
  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">
        {label}
      </label>
      <select
        id={name}
        name={name}
        className={`form-select${error ? " is-invalid" : ""}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((opcao) => (
          <option key={opcao.value} value={opcao.value}>
            {opcao.label}
          </option>
        ))}
      </select>
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
